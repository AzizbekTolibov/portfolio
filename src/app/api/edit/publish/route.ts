import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

// child_process needs Node, not the edge runtime.
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.cwd();

// The only two paths this route will ever stage or commit — never
// `git add -A`, never `git add .`. Everything the editor can possibly
// write lives under one of these two; anything else in the tree (your
// own uncommitted source edits, most realistically, since you develop in
// the same tree you publish from) must never end up in a publish commit.
const ALLOWED_PREFIXES = ["src/content/data/", "public/photos/"];

type GitError = Error & { stdout?: string; stderr?: string };

function isAllowedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

async function git(args: string[]) {
  // execFile with an argument array, never a shell — args (the commit
  // message, in particular) are user input and must never be interpolated
  // into a string a shell would re-parse.
  return execFileAsync("git", args, { cwd: REPO_ROOT });
}

// `git status --porcelain`'s two-character status prefix, then the path —
// a rename ("R  old -> new") is reduced to just the new path, which is the
// only half either the dry-run listing or the staged-outside-allowed-paths
// check cares about.
function parsePorcelain(
  output: string,
): { indexStatus: string; path: string }[] {
  return output
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const indexStatus = line[0];
      let filePath = line.slice(3);
      const arrow = filePath.indexOf(" -> ");
      if (arrow !== -1) filePath = filePath.slice(arrow + 4);
      return { indexStatus, path: filePath };
    });
}

async function getBranch(): Promise<string> {
  const { stdout } = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout.trim();
}

async function dryRun() {
  const branch = await getBranch();
  const { stdout } = await git(["status", "--porcelain"]);
  const files = parsePorcelain(stdout)
    .map((e) => e.path)
    .filter(isAllowedPath);
  return { branch, files };
}

function gitErrorResponse(err: unknown, status = 500) {
  const gitErr = err as GitError;
  return NextResponse.json(
    { error: gitErr.stderr?.trim() || gitErr.message, stdout: gitErr.stdout },
    { status },
  );
}

// The production guard, independently of every other /api/edit/* route —
// this one runs `git commit` and `git push`, so it's the most consequential
// of the four to never accidentally leave reachable.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    return NextResponse.json(await dryRun());
  } catch (err) {
    return gitErrorResponse(err);
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "true";
  if (dry) {
    try {
      return NextResponse.json(await dryRun());
    } catch (err) {
      return gitErrorResponse(err);
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const message = (body as { message?: unknown })?.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Commit message is required." },
      { status: 400 },
    );
  }

  try {
    const branch = await getBranch();
    // A detached HEAD has no branch to push to — "confirm a clean
    // rev-parse first" (see the spec this route implements) means don't
    // silently push to whatever HEAD happens to point at.
    if (branch === "HEAD") {
      return NextResponse.json(
        {
          error:
            "Not on a branch (detached HEAD) — refusing to publish. Check out a branch first.",
        },
        { status: 409 },
      );
    }

    // Refuse if anything is ALREADY staged outside the allowed paths —
    // checked before this route stages anything of its own, so it can
    // never launder someone else's staged work-in-progress into this
    // commit alongside the content changes.
    const { stdout: statusOut } = await git(["status", "--porcelain"]);
    const disallowedStaged = parsePorcelain(statusOut)
      .filter((e) => e.indexStatus !== " " && e.indexStatus !== "?")
      .filter((e) => !isAllowedPath(e.path));
    if (disallowedStaged.length > 0) {
      return NextResponse.json(
        {
          error:
            "Refusing to publish: files outside src/content/data/ and public/photos/ are already staged. Unstage them yourself, then try again.",
          files: disallowedStaged.map((e) => e.path),
        },
        { status: 409 },
      );
    }

    // The only staging this route ever does. `git add <pathspec>` (unlike
    // `git add -A`) is still scoped to these two paths, but still covers
    // modifications, new files, AND deletions within them.
    await git(["add", "--", ...ALLOWED_PREFIXES]);

    const { stdout: stagedOut } = await git([
      "diff",
      "--cached",
      "--name-only",
    ]);
    const stagedFiles = stagedOut.split("\n").filter((l) => l.length > 0);
    if (stagedFiles.length === 0) {
      return NextResponse.json(
        { error: "Nothing to publish." },
        { status: 400 },
      );
    }

    await git(["commit", "-m", message]);

    const { stdout: shaOut } = await git(["rev-parse", "--short", "HEAD"]);
    const sha = shaOut.trim();

    try {
      // Never --force, never rebase first, never amend — a rejected push
      // (remote ahead) surfaces the real git error and stops here;
      // resolving a diverged branch is a job for a human, not this route.
      await git(["push", "origin", branch]);
    } catch (err) {
      return gitErrorResponse(
        Object.assign(err as GitError, {
          message: `Commit ${sha} succeeded locally but push failed: ${(err as GitError).message}`,
        }),
        502,
      );
    }

    return NextResponse.json({ sha, branch, files: stagedFiles });
  } catch (err) {
    return gitErrorResponse(err);
  }
}
