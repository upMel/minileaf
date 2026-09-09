import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadProductImage(
  supabase: Client,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "File must be an image." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { url: null, error: "Image must be smaller than 8MB." };
  }

  const extFromName = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const ext = (extFromName || file.type.split("/")[1] || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `products/${randomId()}.${ext || "jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
