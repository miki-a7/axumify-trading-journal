export interface TradeImageFormItem {
  type: string;
  /** Storage path or external/data URL persisted in TradeImage.url */
  url: string;
  /** Viewable URL for UI preview (signed URL, blob, or external) */
  previewUrl?: string;
  caption?: string;
}

/** True when value is a Supabase storage object path (not a full URL). */
export function isStoragePath(value: string): boolean {
  return Boolean(value && value.startsWith("screenshots/"));
}

/** Pick the persisted url field for API payloads. */
export function getPersistedImageUrl(item: TradeImageFormItem): string {
  if (isStoragePath(item.url)) return item.url;
  if (item.previewUrl && isStoragePath(item.previewUrl)) return item.previewUrl;
  return item.url;
}

/** Map API image records to form state (keeps storage path separate from preview). */
export function apiImageToFormItem(img: {
  type: string;
  url: string;
  storagePath?: string;
  previewUrl?: string;
  caption?: string;
}): TradeImageFormItem {
  const storagePath = img.storagePath || (isStoragePath(img.url) ? img.url : "");
  const preview = img.previewUrl || img.url;
  return {
    type: img.type,
    url: storagePath || img.url,
    previewUrl: preview,
    caption: img.caption,
  };
}

/** Serialize form images for trade create/update API. */
export function formImagesForApi(images: TradeImageFormItem[]) {
  return images
    .map((img) => ({
      type: img.type,
      url: getPersistedImageUrl(img),
      caption: img.caption || "",
    }))
    .filter((img) => img.url && img.url.trim() !== "");
}

export function getImagePreviewSrc(item: TradeImageFormItem): string {
  return item.previewUrl || item.url;
}

/** Resolve DB image rows for API responses (storagePath + signed preview url). */
export async function resolveTradeImagesForApi(
  images: { id: string; type: string; url: string; caption?: string | null }[],
  resolveUrl: (path: string) => Promise<string>
) {
  return Promise.all(
    images.map(async (img) => {
      const storagePath = img.url;
      const previewUrl = await resolveUrl(storagePath);
      return {
        id: img.id,
        type: img.type,
        storagePath,
        url: previewUrl,
        previewUrl,
        caption: img.caption || "",
      };
    })
  );
}
