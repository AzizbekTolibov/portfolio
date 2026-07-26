import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import * as prettier from "prettier";

// fs/promises needs Node, not the edge runtime.
export const runtime = "nodejs";

const LAYOUT_PATH = path.join(
  process.cwd(),
  "src",
  "content",
  "data",
  "layout.json",
);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The production guard, independently of src/app/edit/page.tsx's — never
// rely on the page alone. A leaked editor route is a filesystem-write
// endpoint on a public URL; this is the one that actually writes.
// verify-edit-guard.mjs asserts this 404s in a real production build,
// same as the page.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const overrides = isPlainObject(body) ? body.overrides : undefined;
  if (!isPlainObject(overrides)) {
    return NextResponse.json(
      { error: "Body must be { overrides: {...} }" },
      { status: 400 },
    );
  }

  const raw = JSON.stringify(overrides, null, 2);
  const config = await prettier.resolveConfig(LAYOUT_PATH);
  const formatted = await prettier.format(raw, {
    ...config,
    filepath: LAYOUT_PATH,
  });

  // Write to a temp file and rename (atomic on the same filesystem) so an
  // interrupted write can't truncate layout.json into invalid JSON.
  const tmpPath = `${LAYOUT_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, formatted, "utf8");
  await fs.rename(tmpPath, LAYOUT_PATH);

  return NextResponse.json({ overrides });
}
