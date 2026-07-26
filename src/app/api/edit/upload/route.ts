import { promises as fs } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { NextResponse } from "next/server";

// fs/promises needs Node, not the edge runtime.
export const runtime = "nodejs";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function sanitizeBaseName(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "");
  const safe = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "photo";
}

// The production guard, independently of every other /api/edit/* route —
// never rely on the page's guard, or any other route's. A leaked editor
// route is a filesystem-write endpoint on a public URL; this one writes
// arbitrary uploaded files, which makes it the most important of the
// three to never skip this check on.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const slug = form.get("slug");
  const alt = form.get("alt");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Missing or invalid slug" },
      {
        status: 400,
      },
    );
  }
  // Non-negotiable #3 is only as good as the content behind it — an
  // editor that lets alt text be skipped will produce a portfolio with
  // no alt text. This is a validation error, not a placeholder.
  if (typeof alt !== "string" || alt.trim().length === 0) {
    return NextResponse.json(
      { error: "Alt text is required and cannot be empty." },
      { status: 400 },
    );
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large — max ${MAX_BYTES / 1024 / 1024}MB.` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let width: number | undefined;
  let height: number | undefined;
  try {
    const dimensions = imageSize(buffer);
    width = dimensions.width;
    height = dimensions.height;
  } catch {
    return NextResponse.json(
      { error: "Could not read image dimensions — the file may be corrupt." },
      { status: 400 },
    );
  }
  if (!width || !height) {
    return NextResponse.json(
      { error: "Could not read image dimensions." },
      { status: 400 },
    );
  }

  const dir = path.join(PUBLIC_DIR, "photos", slug);
  await fs.mkdir(dir, { recursive: true });

  const base = sanitizeBaseName(file.name);
  let filename = `${base}.${ext}`;
  let counter = 2;
  // Never silently overwrite an existing upload with the same name.
  while (
    await fs
      .access(path.join(dir, filename))
      .then(() => true)
      .catch(() => false)
  ) {
    filename = `${base}-${counter}.${ext}`;
    counter++;
  }

  const tmpSuffix = `${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  const tmpPath = path.join(dir, `${filename}.${tmpSuffix}.tmp`);
  await fs.writeFile(tmpPath, buffer);
  await fs.rename(tmpPath, path.join(dir, filename));

  return NextResponse.json({
    src: `/photos/${slug}/${filename}`,
    width,
    height,
    alt: alt.trim(),
  });
}

/** Deletes an uploaded file from disk — the client removes the photo
 * *reference* on its own (see use-edit-content.ts's removePhoto); this is
 * the "also delete the file" half the spec asks for, called only when
 * the user opts into it, not automatically on every reference removal
 * (a photo might still be referenced by an unsaved edit elsewhere). */
export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const src = (body as { src?: unknown })?.src;
  // Only ever a path this route itself could have produced — never trust
  // a client-supplied path enough to unlink it otherwise.
  if (typeof src !== "string" || !/^\/photos\/[a-z0-9-]+\/[^/]+$/.test(src)) {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  const filePath = path.join(PUBLIC_DIR, src);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 },
      );
    }
  }
  return NextResponse.json({ deleted: src });
}
