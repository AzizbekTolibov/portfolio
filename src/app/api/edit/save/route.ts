import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import * as prettier from "prettier";

// fs/promises needs Node, not the edge runtime.
export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "src", "content", "data");

// One shared save endpoint for every editable data file, rather than one
// route per file — a single guard surface to keep correct, not five
// (see claude-code-prompt-phase3.md). The client only ever sends the
// files that actually changed since the last save (see
// use-edit-content.ts's save()).
const FILE_PATHS: Record<string, string> = {
  layout: path.join(DATA_DIR, "layout.json"),
  site: path.join(DATA_DIR, "site.json"),
  home: path.join(DATA_DIR, "home.json"),
  about: path.join(DATA_DIR, "about.json"),
  projects: path.join(DATA_DIR, "projects.json"),
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// On Windows, fs.rename onto an existing file can fail transiently with
// EPERM/EBUSY if something else (Turbopack's own file watcher, reading
// the file to hot-reload it) has it open at that exact instant — observed
// live while testing this route: a save 500'd once, and a leftover
// "*.tmp" file next to the real one was the tell. POSIX rename() doesn't
// have this problem, but a short retry is cheap insurance either way and
// never masks a real failure — it still throws (and the client still
// sees the 500) if every attempt fails.
async function renameWithRetry(tmpPath: string, filePath: string) {
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      await fs.rename(tmpPath, filePath);
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await wait(50 * (i + 1));
    }
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  const raw = JSON.stringify(value, null, 2);
  const config = await prettier.resolveConfig(filePath);
  const formatted = await prettier.format(raw, {
    ...config,
    filepath: filePath,
  });
  // Write to a temp file and rename (atomic on the same filesystem) so an
  // interrupted write can't truncate the real file into invalid JSON.
  // Date.now() alone isn't unique enough — two saves landing in the same
  // millisecond (a double-click, or two files saved in the same request)
  // would race on the same temp path; the random suffix rules that out.
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmpPath, formatted, "utf8");
  try {
    await renameWithRetry(tmpPath, filePath);
  } catch (err) {
    // The write itself succeeded; only the rename didn't. Don't leave the
    // orphaned temp file behind on top of the original failure.
    await fs.unlink(tmpPath).catch(() => {});
    throw err;
  }
}

// The production guard, independently of every other /api/edit/* route —
// never rely on the page's guard, or any other route's. A leaked editor
// route is a filesystem-write endpoint on a public URL; this is the one
// that writes the most of them. verify-edit-guard.mjs asserts this 404s
// in a real production build, same as every other editor route.
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

  const files = isPlainObject(body) ? body.files : undefined;
  if (!isPlainObject(files) || Object.keys(files).length === 0) {
    return NextResponse.json(
      { error: "Body must be { files: { <name>: <data>, ... } }" },
      { status: 400 },
    );
  }

  const unknownKeys = Object.keys(files).filter((k) => !(k in FILE_PATHS));
  if (unknownKeys.length > 0) {
    return NextResponse.json(
      { error: `Unknown data file(s): ${unknownKeys.join(", ")}` },
      { status: 400 },
    );
  }

  for (const [name, value] of Object.entries(files)) {
    await writeJsonFile(FILE_PATHS[name], value);
  }

  return NextResponse.json({ files });
}
