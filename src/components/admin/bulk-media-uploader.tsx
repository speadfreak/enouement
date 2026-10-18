"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  X,
  FileVideo,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  uploadFile,
  fileTypeKind,
  formatBytes,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type MediaType,
} from "@/components/admin/media-uploader";

const MAX_FILES = 50;

type ItemStatus = "queued" | "uploading" | "done" | "failed";

interface QueueItem {
  id: string;
  file: File;
  kind: MediaType;
  previewUrl?: string;
  progress: number; // 0-100 (cloud upload progress)
  status: ItemStatus;
  error?: string;
  resultUrl?: string;
  resultType?: MediaType;
}

export interface BulkMediaUploaderProps {
  albumId: string;
  onDone?: () => void;
  /** Cloudinary folder name (must be in the server's ALLOWED_FOLDERS list). */
  folder?: string;
  className?: string;
}

let _seq = 0;
function uid() {
  _seq += 1;
  return `bmu-${_seq}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Multi-file drag-and-drop uploader for an album's media. Compresses images
 * client-side, uploads each file DIRECTLY to Cloudinary (signed by /api/upload),
 * then POSTs the resulting URLs to the album's bulk-create endpoint in one
 * batch.
 *
 * Files are uploaded sequentially so the user sees clear "Uploading 3 of 12…"
 * progress. Per-file errors don't stop the rest of the batch.
 */
export function BulkMediaUploader({
  albumId,
  onDone,
  folder = "albums",
  className,
}: BulkMediaUploaderProps) {
  const [items, setItems] = React.useState<QueueItem[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemsRef = React.useRef<QueueItem[]>([]);
  itemsRef.current = items;

  // Revoke object URLs on unmount.
  React.useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      });
    };
  }, []);

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const room = MAX_FILES - items.length;
    if (room <= 0) {
      toast.error(`Max ${MAX_FILES} files per batch.`);
      return;
    }

    const accepted: QueueItem[] = [];
    let rejectedType = 0;
    let rejectedSize = 0;

    for (const f of incoming) {
      if (accepted.length >= room) {
        toast.error(`Max ${MAX_FILES} files per batch — extra files ignored.`);
        break;
      }
      const kind = fileTypeKind(f);
      if (!kind) {
        rejectedType++;
        continue;
      }
      const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (f.size > maxBytes) {
        rejectedSize++;
        toast.error(
          `${f.name}: too large (max ${kind === "image" ? "8MB" : "500MB"}).`
        );
        continue;
      }
      accepted.push({
        id: uid(),
        file: f,
        kind,
        previewUrl:
          kind === "image" ? URL.createObjectURL(f) : undefined,
        progress: 0,
        status: "queued",
      });
    }

    if (rejectedType > 0) {
      toast.error(`${rejectedType} file(s) skipped (unsupported type).`);
    }
    if (accepted.length > 0) {
      setItems((prev) => [...prev, ...accepted]);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const t = prev.find((p) => p.id === id);
      if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    itemsRef.current.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    });
    setItems([]);
    setRunning(false);
    setFinalizing(false);
    abortRef.current = null;
  };

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  };

  const uploadOne = async (
    item: QueueItem,
    signal: AbortSignal
  ): Promise<{ url: string; type: MediaType }> => {
    let fileToUpload: File = item.file;
    if (item.kind === "image") {
      const isCompressible =
        item.file.type !== "image/svg+xml" && item.file.size > 50 * 1024;
      if (isCompressible) {
        try {
          fileToUpload = await imageCompression(item.file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            initialQuality: 0.8,
          });
        } catch {
          fileToUpload = item.file;
        }
      }
    }
    const result = await uploadFile(
      fileToUpload,
      folder,
      (p) => updateItem(item.id, { progress: p }),
      signal
    );
    return { url: result.url, type: result.type };
  };

  const startUpload = async () => {
    if (items.length === 0 || running) return;
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    const collected: { url: string; type: string; title: string }[] = [];

    try {
      for (const item of items) {
        if (signal.aborted) break;
        if (item.status === "done") continue; // skip already-done (retry case)
        updateItem(item.id, {
          status: "uploading",
          progress: 0,
          error: undefined,
        });
        try {
          const r = await uploadOne(item, signal);
          collected.push({
            url: r.url,
            type: r.type,
            title: item.file.name,
          });
          updateItem(item.id, {
            status: "done",
            progress: 100,
            resultUrl: r.url,
            resultType: r.type,
          });
        } catch (e: any) {
          if (signal.aborted) break;
          updateItem(item.id, {
            status: "failed",
            error: e?.message || "Upload failed",
          });
        }
      }
      if (signal.aborted) return;

      if (collected.length === 0) {
        toast.error("No files uploaded successfully.");
        return;
      }

      // Bulk DB insert.
      setFinalizing(true);
      try {
        const res = await fetch(`/api/admin/albums/${albumId}/media/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: collected }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => null);
          throw new Error(e?.error || "Failed to save media to album");
        }
        const data = await res.json();
        const created: number =
          typeof data?.created === "number" ? data.created : collected.length;
        toast.success(`Added ${created} media item${created === 1 ? "" : "s"}.`);
        onDone?.();
        // Clear queue.
        itemsRef.current.forEach((it) => {
          if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
        });
        setItems([]);
      } catch (e: any) {
        toast.error(e?.message || "Failed to save media.");
        // Mark done items as failed (they were uploaded to Cloudinary but
        // not saved in the DB; user can retry to push them again).
        setItems((prev) =>
          prev.map((it) =>
            it.status === "done"
              ? {
                  ...it,
                  status: "failed",
                  error: "Uploaded but DB save failed — retry",
                }
              : it
          )
        );
      } finally {
        setFinalizing(false);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const cancelAll = () => {
    abortRef.current?.abort();
    setRunning(false);
    setItems((prev) =>
      prev.map((it) =>
        it.status === "uploading" ? { ...it, status: "queued", progress: 0 } : it
      )
    );
  };

  const completedCount = items.filter((it) => it.status === "done").length;
  const failedCount = items.filter((it) => it.status === "failed").length;
  const totalProgress =
    items.length > 0
      ? Math.round(
          items.reduce((sum, it) => sum + it.progress, 0) / items.length
        )
      : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => {
          if (!running) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!running) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!running && e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        disabled={running}
        className={cn(
          "group flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition",
          "hover:border-primary hover:bg-primary/5",
          dragging && "border-primary bg-primary/10 ring-2 ring-primary/30",
          running && "pointer-events-none opacity-60"
        )}
      >
        <UploadCloud
          className={cn(
            "size-9 transition",
            dragging
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          )}
        />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {running
              ? "Uploading…"
              : "Drag & drop up to 50 images or click to browse"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Images (8MB) or videos (500MB) · auto-compressed
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Queue */}
      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {running
                ? `Uploading ${completedCount} of ${items.length}… ${totalProgress}%`
                : `${items.length} file(s) queued`}
              {failedCount > 0 ? ` · ${failedCount} failed` : ""}
            </span>
            <div className="flex gap-2">
              {running ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={cancelAll}
                  disabled={finalizing}
                >
                  Cancel
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={clearAll}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={startUpload}
                    disabled={finalizing}
                  >
                    {finalizing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="size-3.5" />
                    )}
                    Upload all ({items.length})
                  </Button>
                </>
              )}
            </div>
          </div>

          {running || finalizing ? (
            <Progress value={totalProgress} className="h-1.5" />
          ) : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it) => (
              <div
                key={it.id}
                className="group relative overflow-hidden rounded-md border border-border/60 bg-muted"
              >
                <div className="aspect-square">
                  {it.kind === "image" && it.previewUrl ? (
                    <img
                      src={it.previewUrl}
                      alt={it.file.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center bg-black/60 text-muted-foreground">
                      {it.kind === "video" ? (
                        <FileVideo className="size-7" />
                      ) : (
                        <ImageIcon className="size-7" />
                      )}
                    </div>
                  )}
                </div>

                {/* Progress overlay while uploading */}
                {it.status === "uploading" ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/60 p-2">
                    <div className="w-full space-y-1">
                      <Progress
                        value={it.progress}
                        className="h-1.5 bg-black/40"
                      />
                      <div className="text-center text-[10px] text-white">
                        {it.progress}%
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Status badge */}
                <div
                  className={cn(
                    "absolute right-1 top-1 grid size-6 place-items-center rounded-md text-white",
                    it.status === "queued" && "bg-foreground/60",
                    it.status === "uploading" && "bg-yellow-500/90",
                    it.status === "done" && "bg-green-600/90",
                    it.status === "failed" && "bg-destructive/90"
                  )}
                  title={it.error || it.status}
                >
                  {it.status === "queued" ? (
                    <span className="text-[10px]">·</span>
                  ) : null}
                  {it.status === "uploading" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : null}
                  {it.status === "done" ? (
                    <Check className="size-3.5" />
                  ) : null}
                  {it.status === "failed" ? (
                    <AlertCircle className="size-3.5" />
                  ) : null}
                </div>

                {/* Remove button (when not running) */}
                {!running ? (
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    aria-label="Remove from queue"
                    className="bg-destructive/90 text-destructive-foreground absolute left-1 top-1 grid size-6 place-items-center rounded-md transition hover:bg-destructive"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}

                {/* Filename / size footer */}
                <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white">
                  {it.status === "failed" && it.error ? (
                    <span className="text-red-300" title={it.error}>
                      {it.error}
                    </span>
                  ) : (
                    <span className="truncate" title={it.file.name}>
                      {it.file.name} · {formatBytes(it.file.size)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
