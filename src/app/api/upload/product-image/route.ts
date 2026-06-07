import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { randomBytes } from "node:crypto";

import { requireRole } from "~/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 800;
const WEBP_QUALITY = 85;

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const isProd = process.env.NODE_ENV === "production";
    const error = isProd
      ? "Vercel Blob is not configured on this deployment. Set BLOB_READ_WRITE_TOKEN in your Vercel project environment variables (Storage → Create Database → Blob) and redeploy. See DEPLOY.md step 3.5."
      : "Vercel Blob is not configured. Set BLOB_READ_WRITE_TOKEN in .env and restart the dev server. See DEPLOY.md step 3.5.";
    return NextResponse.json({ error }, { status: 503 });
  }

  await requireRole("MANAGER");

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type ${file.type}. Use PNG, JPEG, or WebP.` },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.` },
      { status: 400 },
    );
  }

  let optimized: Buffer;
  try {
    const raw = Buffer.from(await file.arrayBuffer());
    optimized = await sharp(raw)
      .rotate() // honor EXIF orientation
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside", // letterbox-fit inside the box, never crop
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Could not process image: ${err.message}`
            : "Could not process image",
      },
      { status: 400 },
    );
  }

  const id = randomBytes(8).toString("hex");
  const pathname = `products/${id}.webp`;

  let blob;
  try {
    blob = await put(pathname, optimized, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Upload failed: ${err.message}`
            : "Upload failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: blob.url,
    size: optimized.byteLength,
  });
}
