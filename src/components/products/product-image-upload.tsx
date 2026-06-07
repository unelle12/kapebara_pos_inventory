"use client";

import * as React from "react";
import {
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Package,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

type Status = "idle" | "uploading" | "done" | "error";

export function ProductImageUpload({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = React.useState<Status>(value ? "done" : "idle");
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  // Sync status with incoming value (e.g., when the form resets).
  React.useEffect(() => {
    if (value) {
      setStatus("done");
      setError(null);
    } else {
      setStatus("idle");
      setError(null);
    }
  }, [value]);

  // Revoke any object URLs we created to avoid memory leaks.
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File) {
    setError(null);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      const msg = "Use PNG, JPEG, or WebP.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = `Too large — ${(file.size / 1024 / 1024).toFixed(1)} MB. Max 5 MB.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const local = URL.createObjectURL(file);
    setPreviewUrl(local);
    setStatus("uploading");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        const msg = json.error ?? `Upload failed (${res.status})`;
        URL.revokeObjectURL(local);
        setPreviewUrl(null);
        setError(msg);
        setStatus("error");
        toast.error(msg);
        return;
      }
      URL.revokeObjectURL(local);
      setPreviewUrl(null);
      setStatus("done");
      onChange(json.url);
      toast.success("Image uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      URL.revokeObjectURL(local);
      setPreviewUrl(null);
      setError(msg);
      setStatus("error");
      toast.error(msg);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset input so the same file can be re-picked.
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    setStatus("idle");
    onChange(null);
  }

  const displayUrl = previewUrl ?? value;

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={
          displayUrl ? "Replace product image" : "Upload product image"
        }
        className={cn(
          "group relative flex min-h-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-cream-50/40 transition-all",
          status === "error"
            ? "border-clay-500 bg-clay-50/40"
            : dragging
              ? "border-caramel-500 bg-caramel-50 ring-4 ring-caramel-200"
              : "border-border hover:border-caramel-400 hover:bg-cream-50",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Product preview"
              className="max-h-56 w-full object-contain p-3"
            />
            {status === "uploading" && (
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm font-medium text-fg shadow-sm">
                  <Loader2 className="size-3.5 animate-spin text-caramel-600" />
                  Uploading…
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-caramel-100 text-caramel-700">
              {status === "uploading" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Upload className="size-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-fg">
                {dragging
                  ? "Drop to upload"
                  : "Drag a photo here, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                PNG, JPEG, or WebP · up to 5 MB · resized to 800×800
              </p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          disabled={disabled ?? status === "uploading"}
          className="sr-only"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {status === "error" ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-clay-300 bg-clay-50 px-2.5 py-1 font-medium text-clay-700">
            <AlertCircle className="size-3" />
            {error ?? "Upload failed"}
          </span>
        ) : value ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-sage-200 bg-sage-50 px-2.5 py-1 font-medium text-sage-700">
            <ImageIcon className="size-3" />
            Image attached
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-cream-50 px-2.5 py-1 font-medium text-fg-muted">
            <Package className="size-3" />
            No image
          </span>
        )}
        {value && status !== "uploading" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={disabled}
            className="text-red-700 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-3.5" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
