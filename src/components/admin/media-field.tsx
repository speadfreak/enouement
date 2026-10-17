"use client";

import * as React from "react";
import { Upload, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MediaUploader,
  type MediaAccept,
  type MediaType,
} from "@/components/admin/media-uploader";

export interface MediaFieldProps {
  value?: string;
  onChange: (url: string, type?: MediaType) => void;
  folder?: string;
  accept?: MediaAccept;
  label?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Wraps MediaUploader with a small "Upload / Paste URL" toggle so the user
 * can either drag-and-drop a file from their device or paste an existing URL.
 *
 * The field value is always a single URL string. When in Paste-URL mode the
 * URL is echoed straight back through `onChange`.
 */
export function MediaField({
  value,
  onChange,
  folder = "misc",
  accept = "image",
  label,
  className,
  placeholder,
}: MediaFieldProps) {
  const [mode, setMode] = React.useState<"upload" | "paste">(
    value && value.trim() ? "paste" : "upload"
  );

  // Keep mode sensible when value changes externally.
  React.useEffect(() => {
    if (value && value.trim() && mode === "upload") {
      // No-op: leave user on Upload tab if they are uploading.
    }
  }, [value, mode]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        <ModeButton
          active={mode === "upload"}
          onClick={() => setMode("upload")}
          icon={<Upload className="size-3" />}
          label="Upload"
        />
        <ModeButton
          active={mode === "paste"}
          onClick={() => setMode("paste")}
          icon={<Link2 className="size-3" />}
          label="Paste URL"
        />
        {label ? (
          <span className="ml-auto text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        ) : null}
      </div>

      {mode === "upload" ? (
        <MediaUploader
          value={value}
          accept={accept}
          folder={folder}
          hideLabel
          onChange={(url, type) => onChange(url, type)}
        />
      ) : (
        <Input
          type="url"
          placeholder={placeholder ?? "https://…"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
