"use client";

import { useEffect, useState } from "react";

type DryRunResult = { branch: string; files: string[] };
type PublishResult = { sha: string; branch: string; files: string[] };
type PublishError = { error: string; files?: string[]; stdout?: string };

async function fetchDryRun(): Promise<DryRunResult> {
  const res = await fetch("/api/edit/publish");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Dry run failed (${res.status})`);
  return data as DryRunResult;
}

async function publish(message: string): Promise<PublishResult> {
  const res = await fetch("/api/edit/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(
      (data as PublishError)?.error ?? `Publish failed (${res.status})`,
    );
    (err as Error & { detail?: PublishError }).detail = data as PublishError;
    throw err;
  }
  return data as PublishResult;
}

const DEFAULT_MESSAGE = "Update portfolio content";

/**
 * The confirmation dialog behind the top bar's Publish button — dry-runs
 * `git status` on mount so the changed-file list is real before anything
 * is staged, lets the commit message be edited, and on submit shows either
 * the pushed commit's short SHA (success) or the raw git error (failure) —
 * never a paraphrase, since the actual text is what's needed to fix it.
 */
export function PublishDialog({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [dryRunError, setDryRunError] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<PublishError | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDryRun()
      .then((dry) => {
        if (cancelled) return;
        setBranch(dry.branch);
        setFiles(dry.files);
      })
      .catch((err) => {
        if (!cancelled)
          setDryRunError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !publishing) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, publishing]);

  async function handleConfirm() {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await publish(message.trim() || DEFAULT_MESSAGE);
      setResult(res);
    } catch (err) {
      const detail = (err as Error & { detail?: PublishError }).detail;
      setPublishError(
        detail ?? { error: err instanceof Error ? err.message : String(err) },
      );
    } finally {
      setPublishing(false);
    }
  }

  const nothingToPublish = !loading && !dryRunError && files.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={publishing ? undefined : onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-heading"
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border-off-white/10 relative flex max-h-[80vh] w-full max-w-[30rem] flex-col overflow-hidden rounded-lg border shadow-2xl"
      >
        <div className="border-off-white/10 flex items-center justify-between border-b px-4 py-3">
          <h2
            id="publish-dialog-heading"
            className="text-off-white text-[13px] font-medium"
          >
            Publish
          </h2>
          {!publishing && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-off-white/60 hover:text-off-white text-[13px]"
            >
              Esc
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {loading && (
            <p className="text-off-white/60 text-[11px]">
              Checking what&rsquo;s changed…
            </p>
          )}

          {dryRunError && (
            <div className="rounded border border-red-400/30 bg-red-400/10 p-2">
              <p className="text-[11px] font-medium text-red-400">
                Could not check git status
              </p>
              <pre className="mt-1 max-h-32 overflow-auto text-[10px] whitespace-pre-wrap text-red-300">
                {dryRunError}
              </pre>
            </div>
          )}

          {!loading && !dryRunError && !result && (
            <>
              {branch && (
                <p className="text-off-white/60 text-[11px]">
                  Publishing to branch{" "}
                  <span className="text-off-white font-mono">{branch}</span>
                </p>
              )}

              {nothingToPublish ? (
                <p className="text-off-white/60 text-[11px]">
                  Nothing to publish — no changes under{" "}
                  <span className="font-mono">src/content/data/</span> or{" "}
                  <span className="font-mono">public/photos/</span>.
                </p>
              ) : (
                <div>
                  <p className="text-off-white/60 mb-1 text-[11px]">
                    {files.length} file{files.length === 1 ? "" : "s"} will be
                    committed:
                  </p>
                  <ul className="border-off-white/10 max-h-32 overflow-y-auto rounded border p-2 font-mono text-[10px]">
                    {files.map((f) => (
                      <li key={f} className="text-off-white/80 truncate">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!nothingToPublish && (
                <label className="flex flex-col gap-1">
                  <span className="text-off-white/60 text-[11px]">
                    Commit message
                  </span>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={publishing}
                    className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-full rounded border px-2 py-1.5 text-[11px] focus-visible:ring-1 focus-visible:outline-none"
                  />
                </label>
              )}

              {publishError && (
                <div className="rounded border border-red-400/30 bg-red-400/10 p-2">
                  <p className="text-[11px] font-medium text-red-400">
                    Publish failed
                  </p>
                  <pre className="mt-1 max-h-32 overflow-auto text-[10px] whitespace-pre-wrap text-red-300">
                    {publishError.error}
                    {publishError.stdout ? `\n\n${publishError.stdout}` : ""}
                  </pre>
                  {publishError.files && publishError.files.length > 0 && (
                    <ul className="mt-1 font-mono text-[10px] text-red-300">
                      {publishError.files.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          {result && (
            <div className="rounded border border-emerald-400/30 bg-emerald-400/10 p-3">
              <p className="text-[11px] font-medium text-emerald-400">
                Published {result.sha} to {result.branch}
              </p>
              <p className="text-off-white/60 mt-1 text-[11px]">
                Pushed. The deploy takes roughly a minute.
              </p>
            </div>
          )}
        </div>

        <div className="border-off-white/10 flex items-center justify-end gap-2 border-t px-4 py-3">
          {result ? (
            <button
              type="button"
              onClick={onClose}
              className="bg-selection hover:bg-selection/90 rounded px-3 py-1 text-[11px] font-medium"
              style={{ color: "#000" }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={publishing}
                className="text-off-white/70 hover:text-off-white px-3 py-1 text-[11px] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  loading || publishing || nothingToPublish || !!dryRunError
                }
                className="bg-selection hover:bg-selection/90 rounded px-3 py-1 text-[11px] font-medium disabled:opacity-40"
                style={{ color: "#000" }}
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
