import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

/** Product photos. */
export const PRODUCT_IMAGES_BUCKET = "product-images";
/** Banners, Canva flyer pages, category and offer-group pictures. */
export const SITE_IMAGES_BUCKET = "site-images";

const MAX_INPUT_BYTES = 8 * 1024 * 1024; // what we accept from the device

export type UploadErrorKind = "not-image" | "too-large" | "failed";
export class UploadError extends Error {
  constructor(public kind: UploadErrorKind, message: string = kind) {
    super(message);
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Shrinks a photo in the browser before upload: longest side ≤ `maxSide`,
 * re-encoded as WebP (JPEG where WebP encoding isn't supported). A 6 MB phone
 * photo becomes a few hundred KB. Small images and GIFs are left as they are.
 */
export async function resizeImage(file: File, maxSide: number, quality = 0.86): Promise<Blob> {
  if (file.type === "image/gif" || typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UploadError("not-image");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 500 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const blob = (await encode("image/webp")) ?? (await encode("image/jpeg"));
  return blob && blob.size < file.size ? blob : file;
}

/**
 * Validates, shrinks and uploads an image; returns its public URL.
 * Throws `UploadError` with a kind the caller turns into a message.
 */
export async function uploadImage(
  supabase: Client,
  file: File,
  { bucket, folder, maxSide = 1600 }: { bucket: string; folder: string; maxSide?: number },
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new UploadError("not-image");
  if (file.size > MAX_INPUT_BYTES) throw new UploadError("too-large");

  const body = await resizeImage(file, maxSide);
  const type = body.type || file.type;
  const ext = type === "image/webp" ? "webp" : type === "image/png" ? "png" : type === "image/gif" ? "gif" : "jpg";
  const path = `${folder}/${randomId()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, body, { upsert: false, contentType: type });
  if (error) throw new UploadError("failed", error.message);

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function uploadProductImage(supabase: Client, file: File): Promise<string> {
  return uploadImage(supabase, file, { bucket: PRODUCT_IMAGES_BUCKET, folder: "products", maxSide: 1200 });
}
