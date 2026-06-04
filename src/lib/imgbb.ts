// ImgBB upload helper — every image upload across the site funnels through here.
// Files are sent to ImgBB; we only persist the returned hosted URL.

const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";
const IMGBB_API_KEY = "14376b44b969a10569f4e9819d5cae4e";
export const IMGBB_MAX_BYTES = 32 * 1024 * 1024; // 32 MB

export type ImgbbUploadResult = {
  id: string;
  url: string;          // direct image url
  display_url: string;  // ImgBB display url (preferred for <img src>)
  thumb_url?: string;
  delete_url: string;
  width: number;
  height: number;
  size: number;
};

export type UploadOptions = {
  name?: string;
  expiration?: number;          // seconds — auto-delete window
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
};

export class ImgbbUploadError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ImgbbUploadError";
  }
}

/** Lightweight client-side downscale to keep payloads small. Falls back to original on failure. */
export async function optimizeImage(file: File, maxDim = 2000, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/**
 * Upload an image (File / Blob / base64 string / remote URL) to ImgBB.
 * Uses XHR so we can report real progress.
 */
export function uploadToImgbb(
  input: File | Blob | string,
  opts: UploadOptions = {},
): Promise<ImgbbUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("key", IMGBB_API_KEY);

    if (typeof input === "string") {
      form.append("image", input);
    } else {
      if (input.size > IMGBB_MAX_BYTES) {
        reject(new ImgbbUploadError("Image exceeds 32MB limit"));
        return;
      }
      const filename = opts.name ?? (input instanceof File ? input.name : "upload.jpg");
      form.append("image", input, filename);
    }
    if (opts.name) form.append("name", opts.name);
    if (opts.expiration) form.append("expiration", String(opts.expiration));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", IMGBB_ENDPOINT);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = () => reject(new ImgbbUploadError("Network error during upload"));
    xhr.onabort = () => reject(new ImgbbUploadError("Upload cancelled"));
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json?.success && json.data) {
          const d = json.data;
          resolve({
            id: d.id,
            url: d.url,
            display_url: d.display_url ?? d.url,
            thumb_url: d.thumb?.url,
            delete_url: d.delete_url,
            width: Number(d.width),
            height: Number(d.height),
            size: Number(d.size),
          });
        } else {
          reject(new ImgbbUploadError(json?.error?.message ?? "Upload failed", xhr.status));
        }
      } catch {
        reject(new ImgbbUploadError("Invalid response from ImgBB", xhr.status));
      }
    };

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort();
        return;
      }
      opts.signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(form);
  });
}
