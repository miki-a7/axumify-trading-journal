import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { extractTradeLevelsFromImage } from "@/lib/ocr/tradingview";

export const dynamic = "force-dynamic";

function bufferFromBase64(raw: string): Buffer | null {
  if (!raw) return null;
  const match = raw.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  const base64Data = match ? match[2] : raw.replace(/^data:image\/\w+;base64,/, "");
  try {
    return Buffer.from(base64Data, "base64");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let imageBuffer: Buffer | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        imageBuffer = Buffer.from(bytes);
      }
    } else {
      const body = await req.json().catch(() => ({}));
      const raw = body.imageBase64 || body.image || body.dataUrl;
      if (raw) {
        imageBuffer = bufferFromBase64(raw);
      }
    }

    if (!imageBuffer) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const detected = await extractTradeLevelsFromImage(imageBuffer);

    // Flat response shape for client compatibility
    return NextResponse.json({
      success: true,
      direction: detected.direction,
      entryPrice: detected.entryPrice,
      exitPrice: detected.exitPrice,
      stopLoss: detected.stopLoss,
      takeProfit: detected.takeProfit,
      actualR: detected.actualR,
      confidence: detected.confidence,
      detectedText: detected.rawText,
      detected,
    });
  } catch (error: any) {
    console.error("OCR recognition error:", error);
    return NextResponse.json({
      success: false,
      direction: null,
      entryPrice: null,
      stopLoss: null,
      takeProfit: null,
      confidence: "LOW" as const,
      detectedText: "",
      error: error.message || "OCR failed",
    });
  }
}
