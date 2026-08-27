import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "trade-screenshots";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique path in private bucket
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = `screenshots/${filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      // Fallback: Return data URL / local path if storage bucket not yet initialized
      return NextResponse.json({
        url: filePath,
        filename,
        fallback: true,
      });
    }

    // Generate a short-lived signed URL (1 hour) for private access
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    return NextResponse.json({
      path: filePath,
      url: signedData?.signedUrl || filePath,
      filename,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
