import type { TradeImageFormItem } from "./trade-image";
import { isStoragePath } from "./trade-image";

export interface OCRDetectedData {
  direction?: "LONG" | "SHORT";
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  entryPrice?: number;
  /** Detected Actual R:R magnitude (always positive). No longer exposes plannedRR separately. */
  actualR?: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  detectedText?: string;
  imageUrl?: string;
}

export async function uploadFileToStorage(file: File): Promise<{ path: string; previewUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const json = await res.json();
      const path = json.path || "";
      const previewUrl = json.url || json.path || "";
      if (path && isStoragePath(path)) {
        return { path, previewUrl };
      }
      if (previewUrl.startsWith("data:") || previewUrl.startsWith("http")) {
        return { path: previewUrl, previewUrl };
      }
    }
  } catch (err) {
    console.warn("Upload to storage error:", err);
  }

  const dataUrl = await readFileAsDataUrl(file);
  return { path: dataUrl, previewUrl: dataUrl };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function runOcrOnDataUrl(dataUrl: string): Promise<OCRDetectedData | null> {
  try {
    const ocrRes = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: dataUrl }),
    });
    const json = await ocrRes.json();
    const detected = json.detected || json;
    if (!ocrRes.ok && !json.success) {
      return null;
    }
    return {
      direction: detected.direction ?? json.direction ?? undefined,
      entryPrice: detected.entryPrice ?? json.entryPrice ?? undefined,
      exitPrice: detected.exitPrice ?? json.exitPrice ?? undefined,
      stopLoss: detected.stopLoss ?? json.stopLoss ?? undefined,
      takeProfit: detected.takeProfit ?? json.takeProfit ?? undefined,
      actualR: detected.actualR ?? json.actualR ?? detected.plannedRR ?? json.plannedRR ?? undefined,
      confidence: detected.confidence ?? json.confidence ?? "LOW",
      detectedText: detected.rawText ?? json.detectedText ?? "",
    };
  } catch {
    return null;
  }
}

export async function processScreenshotFile(
  file: File,
  imageType: string = "ENTRY",
  onProgress?: (step: "uploading" | "scanning" | "detecting_entry" | "detecting_sl" | "detecting_tp" | "done") => void
): Promise<{ image: TradeImageFormItem; ocr: OCRDetectedData | null; ocrError: string | null }> {
  const dataUrl = await readFileAsDataUrl(file);
  
  onProgress?.("uploading");
  
  // Start upload and OCR in true parallel — do NOT wait for one before the other
  const uploadPromise = uploadFileToStorage(file);
  
  onProgress?.("scanning");
  const ocrPromise = runOcrOnDataUrl(dataUrl).then((result) => {
    if (result) {
      if (result.entryPrice) onProgress?.("detecting_entry");
      if (result.stopLoss) onProgress?.("detecting_sl");
      if (result.takeProfit) onProgress?.("detecting_tp");
    }
    return result;
  });

  const [uploadResult, ocrResult] = await Promise.all([uploadPromise, ocrPromise]);
  onProgress?.("done");

  const image: TradeImageFormItem = {
    type: imageType,
    url: uploadResult.path,
    previewUrl: uploadResult.previewUrl,
    caption: "TradingView Chart Screenshot",
  };

  const ocr: OCRDetectedData | null = ocrResult
    ? { ...ocrResult, imageUrl: uploadResult.path }
    : null;

  return {
    image,
    ocr,
    ocrError: ocrResult ? null : "OCR could not detect levels — screenshot saved anyway.",
  };
}

export function buildDragDropHandlers(onFile: (file: File) => void) {
  return {
    onDragOver: (e: { preventDefault: () => void; stopPropagation: () => void }) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: { preventDefault: () => void; stopPropagation: () => void; dataTransfer: DataTransfer | null }) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file?.type.startsWith("image/")) onFile(file);
    },
  };
}
