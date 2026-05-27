import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  uploadToImgbb,
  optimizeImage,
  IMGBB_MAX_BYTES,
  type ImgbbUploadResult,
} from "@/lib/imgbb";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange?: (url: string, result: ImgbbUploadResult) => void;
  onError?: (message: string) => void;
  label?: string;
  hint?: string;
  className?: string;
  /** disable client-side downscale */
  raw?: boolean;
  /** auto-delete window in seconds */
  expiration?: number;
};

/**
 * Reusable image uploader. Pushes the file to ImgBB and reports the hosted URL.
 * Use everywhere images are accepted (book covers, profile photos, banners, etc.).
 */
export function ImageUploader({
  value,
  onChange,
  onError,
  label = "Upload image",
  hint = "PNG, JPG, WEBP up to 32MB",
  className,
  raw = false,
  expiration,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setError(null);

      if (!file.type.startsWith("image/")) {
        const msg = "Please select an image file.";
        setError(msg);
        onError?.(msg);
        return;
      }
      if (file.size > IMGBB_MAX_BYTES) {
        const msg = "Image exceeds the 32MB limit.";
        setError(msg);
        onError?.(msg);
        return;
      }

      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      setBusy(true);
      setProgress(0);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const blob = raw ? file : await optimizeImage(file);
        const result = await uploadToImgbb(blob, {
          name: file.name,
          expiration,
          signal: controller.signal,
          onProgress: setProgress,
        });
        setPreview(result.display_url);
        URL.revokeObjectURL(localPreview);
        onChange?.(result.display_url, result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setError(msg);
        onError?.(msg);
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [expiration, onChange, onError, raw],
  );

  const cancel = () => {
    abortRef.current?.abort();
    setBusy(false);
    setProgress(0);
  };

  const clear = () => {
    setPreview(undefined);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
        className="group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface-elevated transition hover:border-primary"
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs">{hint}</p>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="w-3/4">
              <Progress value={progress} />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Uploading… {progress}%
              </p>
            </div>
          </div>
        )}

        {preview && !busy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 text-foreground opacity-0 transition group-hover:opacity-100"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center gap-2">
        {!busy ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full bg-transparent"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {preview ? "Replace" : "Choose image"}
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="rounded-full bg-transparent" onClick={cancel}>
            Cancel
          </Button>
        )}
        {preview && !busy && (
          <span className="truncate text-xs text-muted-foreground">Hosted on ImgBB</span>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
