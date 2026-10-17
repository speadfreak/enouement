"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadCloud, X, FileVideo, Plus } from "lucide-react";
import imageCompression from "browser-image-compression";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaAccept = "image" | "video" | "both";
export type MediaType = "image" | "video";

export interface MediaUploaderProps {
  value?: string;
  onChange: (url: string, type: MediaType) => void;
  folder?: string;
  accept?: MediaAccept;
  label?: string;
  className?: string;
  /** Hide the inner label row (used when an external label is already rendered). */
  hideLabel?: boolean;
}

const ACCEPT_MAP: Record<MediaAccept, string> = {
  image: "image/*",
  video: "video/*",
  both: "image/*,video/*",
};

function fileTypeKind(file: File): MediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:video")) return true;
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadResult {
  url: string;
  type: MediaType;
}

/** Upload a File to /api/upload with XHR so we can report progress. */
function uploadFile(
  file: File,
  folder: string,
  onProgress: (p: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload cancelled"));
      });
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && json.url) {
          resolve({
            url: json.url as string,
            type: json.type === "video" ? "video" : "image",
          });
        } else {
          reject(new Error(json.error || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Invalid server response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    xhr.send(fd);
  });
}

/**
 * Single-file drag-and-drop uploader. Compresses images client-side via
 * browser-image-compression before POSTing to /api/upload.
 */
export function MediaUploader({
  value,
  onChange,
  folder = "misc",
  accept = "image",
  label,
  className,
  hideLabel = false,
}: MediaUploaderProps) {
  const [dragging, setDragging] = React.useState(false);
  const [selected, setSelected] = React.useState<{ name: string; size: number } | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [previewType, setPreviewType] = React.useState<MediaType>(
    accept === "video" ? "video" : "image"
  );
  const abortRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (file: File | null | undefined) => {
    if (!file) return;
    const kind = fileTypeKind(file);
    if (!kind) {
      toast.error("Unsupported file type.");
      return;
    }
    if (accept !== "both" && accept !== kind) {
      toast.error(`This field expects ${accept} files.`);
      return;
    }
    setSelected({ name: file.name, size: file.size });
    setProgress(0);
    setUploading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let fileToUpload: File = file;
    try {
      if (kind === "image") {
        // SVGs and tiny images cannot be compressed — skip in those cases.
        const isCompressible = file.type !== "image/svg+xml" && file.size > 50 * 1024;
        if (isCompressible) {
          try {
            fileToUpload = await imageCompression(file, {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1600,
              useWebWorker: true,
              initialQuality: 0.8,
            });
          } catch {
            // Fall back to original if compression fails for any reason.
            fileToUpload = file;
          }
        }
      }

      const result = await uploadFile(fileToUpload, folder, setProgress, controller.signal);
      setPreviewType(result.type);
      onChange(result.url, result.type);
      toast.success("Upload complete.");
    } catch (e: any) {
      if (e?.message !== "Upload cancelled") {
        toast.error(e?.message || "Upload failed");
      }
    } finally {
      setUploading(false);
      setSelected(null);
      abortRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
  };

  const previewValue = value && value.trim() ? value.trim() : null;
  const showVideoPreview = previewValue && (previewType === "video" || isVideoUrl(previewValue));

  return (
    <div className={cn("space-y-2", className)}>
      {!hideLabel && label ? (
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      ) : null}

      {previewValue ? (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted">
          {showVideoPreview ? (
            <div className="relative grid aspect-video place-items-center bg-black/60">
              {previewValue.startsWith("data:video") || /\.(mp4|webm|ogg|mov|m4v)$/i.test(previewValue) ? (
                <video src={previewValue} className="size-full object-contain" controls />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileVideo className="size-8" />
                  <span className="text-xs">Video URL set</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange("", "video")}
                disabled={uploading}
                aria-label="Remove media"
                className="bg-destructive/90 text-destructive-foreground absolute right-2 top-2 grid size-7 place-items-center rounded-md transition hover:bg-destructive"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewValue}
                alt="preview"
                className="aspect-video w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange("", "image")}
                disabled={uploading}
                aria-label="Remove media"
                className="bg-destructive/90 text-destructive-foreground absolute right-2 top-2 grid size-7 place-items-center rounded-md transition hover:bg-destructive"
              >
                <X className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="bg-background/80 text-foreground absolute bottom-2 left-2 rounded-md border border-border/60 px-2 py-1 text-[11px] backdrop-blur transition hover:bg-background"
              >
                Replace
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            handleFiles(f);
          }}
          disabled={uploading}
          className={cn(
            "group flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition",
            "hover:border-primary hover:bg-primary/5",
            dragging && "border-primary bg-primary/10 ring-2 ring-primary/30",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <UploadCloud
            className={cn("size-7 transition", dragging ? "text-primary" : "text-muted-foreground group-hover:text-primary")}
          />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drag & drop or click to browse"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {accept === "image"
                ? "PNG, JPG, WebP, GIF · up to 8MB · auto-compressed"
                : accept === "video"
                  ? "MP4, WebM · up to 60MB"
                  : "Images (8MB) or videos (60MB)"}
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files?.[0])}
      />

      {uploading || selected ? (
        <div className="space-y-1.5 rounded-md border border-border/40 bg-muted/40 p-2">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate font-mono">
              {selected?.name ?? "Processing…"}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {selected ? formatBytes(selected.size) : ""}
              {uploading ? ` · ${progress}%` : ""}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
          {uploading ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-muted-foreground"
                onClick={cancelUpload}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---- Multi uploader (image / video URLs list) ------------------------------

export interface MediaMultiUploaderProps {
  /** Either an array of URLs or a comma-separated string (for backward compat). */
  value: string[] | string;
  onChange: (urls: string[]) => void;
  folder?: string;
  accept?: MediaAccept;
  label?: string;
  className?: string;
}

function toArray(v: string[] | string | undefined | null): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Multi-file uploader used for `image-list` form fields. Each uploaded file
 * (or pasted URL) is appended to the list.
 */
export function MediaMultiUploader({
  value,
  onChange,
  folder = "misc",
  accept = "image",
  label,
  className,
}: MediaMultiUploaderProps) {
  const urls = toArray(value);
  const [addingUrl, setAddingUrl] = React.useState("");

  const addUrl = (raw: string) => {
    const u = raw.trim();
    if (!u) return;
    if (urls.includes(u)) {
      toast.error("Already added.");
      return;
    }
    onChange([...urls, u]);
    setAddingUrl("");
  };

  const removeAt = (i: number) => {
    const next = urls.slice();
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label ? (
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      ) : null}

      <MediaUploader
        accept={accept}
        folder={folder}
        hideLabel
        onChange={(url, _type) => {
          if (url) addUrl(url);
        }}
      />

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Or paste a URL and press Add…"
          value={addingUrl}
          onChange={(e) => setAddingUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl(addingUrl);
            }
          }}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addUrl(addingUrl)}
          disabled={!addingUrl.trim()}
          className="shrink-0"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {urls.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((u, i) => {
            const isVid = isVideoUrl(u);
            return (
              <div
                key={u + i}
                className="group relative overflow-hidden rounded-md border border-border/60 bg-muted"
              >
                {isVid ? (
                  <div className="grid aspect-square size-full place-items-center bg-black/60 text-muted-foreground">
                    <FileVideo className="size-6" />
                  </div>
                ) : (
                  <img src={u} alt="" className="aspect-square size-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="bg-destructive/90 text-destructive-foreground absolute right-1 top-1 grid size-7 place-items-center rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove media"
                >
                  <X className="size-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-[10px] text-white">
                  {isVid ? "video" : "image"}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No media added yet.</p>
      )}
    </div>
  );
}
