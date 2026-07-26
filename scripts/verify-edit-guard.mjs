// Fails if /edit is reachable in a production build — the guarantee that
// actually matters (a leaked editor route is a filesystem-write endpoint
// on a public URL, see src/app/edit/page.tsx), not just "the source calls
// notFound()". Run this against a real `next build` output:
//   npm run build && node scripts/verify-edit-guard.mjs
import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const PORT = 4173;
const READY_TIMEOUT_MS = 30000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      return await fetch(url);
    } catch {
      await wait(200);
    }
  }
  throw new Error(`Server never became reachable at ${url}`);
}

const nextBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);

// shell:true is required on Windows — next.cmd is a batch file, and
// Node's spawn() can't exec one directly. That means server.pid is the
// shell's pid, not next's own, so a plain child.kill() only signals the
// shell and next's own process can survive it — taskkill /pid ... /T /F
// (kill the whole tree rooted at that pid) is used there instead of
// relying on kill() reaching the grandchild.
const server = spawn(nextBin, ["start", "-p", String(PORT)], {
  cwd: projectRoot,
  shell: true,
  stdio: "pipe",
});

let serverOutput = "";
server.stdout?.on("data", (d) => (serverOutput += d));
server.stderr?.on("data", (d) => (serverOutput += d));

function killServer() {
  if (process.platform === "win32") {
    execFile("taskkill", ["/pid", String(server.pid), "/T", "/F"], () => {});
  } else {
    server.kill();
  }
}

function fail(message) {
  console.error(`verify-edit-guard: FAIL — ${message}`);
  console.error(serverOutput);
  killServer();
  process.exitCode = 1;
}

try {
  await waitForServer(`http://localhost:${PORT}/`, READY_TIMEOUT_MS);
  const res = await fetch(`http://localhost:${PORT}/edit`);
  if (res.status !== 404) {
    fail(
      `GET /edit returned ${res.status}, expected 404 — the editor route is reachable in a production build.`,
    );
  } else {
    console.log("verify-edit-guard: OK — GET /edit returned 404.");
  }
} catch (err) {
  fail(String(err));
} finally {
  killServer();
}
