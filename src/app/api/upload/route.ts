import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadScreenshotToStorage, resolveImageUrl } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer;
    let filename = `screenshot_${Date.now()}.png`;
    let mimeType = "image/png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      filename = file.name || filename;
      mimeType = file.type || "image/png";
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (!body.base64 && !body.dataUrl) {
        return NextResponse.json({ error: "No image data provided" }, { status: 400 });
      }

      const raw = body.base64 || body.dataUrl;
      const match = raw.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], "base64");
      } else {
        buffer = Buffer.from(raw, "base64");
      }

      if (body.filename) {
        filename = body.filename;
      }
    } else {
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });
    }

    // Upload to private Supabase bucket trade-screenshots
    try {
      const result = await uploadScreenshotToStorage(user.id, buffer, filename, mimeType);
      return NextResponse.json({
        success: true,
        path: result.path,
        url: result.signedUrl,
        filename: result.filename,
      });
    } catch (storageError: any) {
      console.error("Storage upload failed, falling back to data URI or error:", storageError);
      // If Supabase Storage is not reachable, we return a fallback response with status 200 so the user isn't completely blocked
      const base64Data = buffer.toString("base64");
      const fallbackDataUrl = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json({
        success: true,
        path: fallbackDataUrl,
        url: fallbackDataUrl,
        filename,
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
