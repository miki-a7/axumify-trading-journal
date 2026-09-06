import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const BUCKET_NAME = "trade-screenshots";

let bucketChecked = false;

/**
 * Ensures the trade-screenshots private storage bucket exists.
 */
export async function ensureStorageBucket(bucketName: string = BUCKET_NAME): Promise<void> {
  if (bucketChecked) return;
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.warn("Could not list storage buckets:", error.message);
      return;
    }
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 15 * 1024 * 1024, // 15MB limit
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
      });
      if (createError) {
        console.warn(`Could not create bucket ${bucketName}:`, createError.message);
      } else {
        console.log(`Created private bucket ${bucketName}`);
      }
    }
    bucketChecked = true;
  } catch (err: any) {
    console.warn("ensureStorageBucket error:", err?.message || err);
  }
}

/**
 * Uploads a screenshot buffer to the trade-screenshots bucket under screenshots/{userId}/{filename}.
 */
export async function uploadScreenshotToStorage(
  userId: string,
  buffer: Buffer,
  originalFilename: string,
  mimeType: string = "image/png"
): Promise<{ path: string; signedUrl: string; filename: string }> {
  await ensureStorageBucket();

  const cleanName = (originalFilename || "screenshot.png").replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `screenshots/${userId}/${uniquePrefix}_${cleanName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError);
    throw new Error(`Failed to upload to storage: ${uploadError.message}`);
  }

  // Create signed URL for immediate preview (valid for 2 hours)
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 7200);

  const signedUrl = signedData?.signedUrl || filePath;

  return {
    path: filePath,
    signedUrl,
    filename: `${uniquePrefix}_${cleanName}`,
  };
}

/**
 * Resolves a stored image path or URL into a viewable URL.
 * If it's a storage path (e.g. "screenshots/..."), creates a signed URL.
 * If already a data URL or external URL, returns it directly.
 */
export async function resolveImageUrl(pathOrUrl: string, expiresIn: number = 7200): Promise<string> {
  if (!pathOrUrl) return "";
  
  // If it's a base64 data URL or external HTTP/HTTPS URL, return directly
  if (pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(pathOrUrl, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn(`Failed to create signed URL for path ${pathOrUrl}:`, error?.message);
      return pathOrUrl;
    }

    return data.signedUrl;
  } catch (err: any) {
    console.warn(`resolveImageUrl exception for ${pathOrUrl}:`, err?.message || err);
    return pathOrUrl;
  }
}
