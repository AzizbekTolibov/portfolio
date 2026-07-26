"use client";

import { useEffect, useRef, useState } from "react";
import type { Project, ProjectImage } from "@/content/types";

async function uploadPhoto(
  slug: string,
  file: File,
  alt: string,
): Promise<ProjectImage> {
  const form = new FormData();
  form.append("file", file);
  form.append("slug", slug);
  form.append("alt", alt);
  const res = await fetch("/api/edit/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Upload failed (${res.status})`);
  return data as ProjectImage;
}

async function deletePhotoFile(src: string): Promise<void> {
  await fetch("/api/edit/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ src }),
  }).catch(() => {});
}

function UploadRow({
  slug,
  onUploaded,
}: {
  slug: string;
  onUploaded: (image: ProjectImage) => void;
}) {
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    if (!alt.trim()) {
      setError("Alt text is required before uploading.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const image = await uploadPhoto(slug, file, alt.trim());
      onUploaded(image);
      setAlt("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-off-white/15 flex flex-col gap-1.5 rounded border border-dashed p-2">
      <input
        type="text"
        value={alt}
        onChange={(e) => {
          setAlt(e.target.value);
          setError(null);
        }}
        placeholder="Alt text (required)"
        className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-full rounded border px-2 py-1 text-[11px] focus-visible:ring-1 focus-visible:outline-none"
      />
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
        disabled={busy || !alt.trim()}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-off-white/70 text-[11px] disabled:opacity-40"
      />
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

function PhotoRow({
  image,
  index,
  total,
  isCover,
  onSetCover,
  onReorder,
  onRemove,
}: {
  image: ProjectImage;
  index: number;
  total: number;
  isCover: boolean;
  onSetCover: () => void;
  onReorder: (direction: -1 | 1) => void;
  onRemove: (deleteFile: boolean) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="border-off-white/10 flex items-center gap-2 rounded border p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt=""
        className="h-10 w-14 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="text-off-white/80 truncate text-[11px]">
          {image.alt}
        </div>
        {isCover && (
          <div className="text-selection text-[10px]">Cover image</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onReorder(-1)}
          disabled={index === 0}
          aria-label="Move up"
          className="text-off-white/60 hover:text-off-white px-1 text-[11px] disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onReorder(1)}
          disabled={index === total - 1}
          aria-label="Move down"
          className="text-off-white/60 hover:text-off-white px-1 text-[11px] disabled:opacity-30"
        >
          ↓
        </button>
        {!isCover && (
          <button
            type="button"
            onClick={onSetCover}
            className="text-off-white/60 hover:text-off-white px-1 text-[10px]"
          >
            Set cover
          </button>
        )}
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => onRemove(true)}
              className="px-1 text-[10px] text-red-400"
            >
              Delete file
            </button>
            <button
              type="button"
              onClick={() => onRemove(false)}
              className="text-off-white/60 px-1 text-[10px]"
            >
              Keep file
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-off-white/40 px-1 text-[10px]"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Remove ${image.alt}`}
            className="text-off-white/40 px-1 text-[11px] hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  index,
  total,
  isSlugTaken,
  onUpdate,
  onDuplicate,
  onDelete,
  onReorder,
  onAddPhoto,
  onRemovePhoto,
  onReorderPhoto,
  onSetCoverPhoto,
}: {
  project: Project;
  index: number;
  total: number;
  isSlugTaken: (slug: string, excluding?: string) => boolean;
  onUpdate: (patch: Partial<Project>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (direction: -1 | 1) => void;
  onAddPhoto: (image: ProjectImage) => void;
  onRemovePhoto: (index: number) => void;
  onReorderPhoto: (index: number, direction: -1 | 1) => void;
  onSetCoverPhoto: (image: ProjectImage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  return (
    <div className="border-off-white/10 rounded border p-2.5">
      <div className="flex items-start gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.cover.src}
          alt=""
          className="h-14 w-11 shrink-0 rounded object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex gap-1.5">
            <input
              type="text"
              defaultValue={project.title}
              onBlur={(e) => onUpdate({ title: e.target.value })}
              className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection min-w-0 flex-1 rounded border px-2 py-1 text-[11px] font-medium focus-visible:ring-1 focus-visible:outline-none"
            />
            <input
              type="text"
              defaultValue={project.year}
              onBlur={(e) => onUpdate({ year: e.target.value })}
              className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-16 shrink-0 rounded border px-2 py-1 text-[11px] focus-visible:ring-1 focus-visible:outline-none"
            />
          </div>
          <input
            type="text"
            defaultValue={project.slug}
            onChange={() => setSlugError(null)}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (!next || next === project.slug) {
                e.target.value = project.slug;
                return;
              }
              if (isSlugTaken(next, project.slug)) {
                setSlugError(`"${next}" is already used.`);
                e.target.value = project.slug;
                return;
              }
              onUpdate({ slug: next });
            }}
            className="bg-surface border-off-white/10 text-off-white/60 focus-visible:ring-selection w-full rounded border px-2 py-1 font-mono text-[10px] focus-visible:ring-1 focus-visible:outline-none"
          />
          {slugError && <p className="text-[10px] text-red-400">{slugError}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReorder(-1)}
              disabled={index === 0}
              aria-label="Move up in grid order"
              className="text-off-white/60 hover:text-off-white px-1 text-[11px] disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onReorder(1)}
              disabled={index === total - 1}
              aria-label="Move down in grid order"
              className="text-off-white/60 hover:text-off-white px-1 text-[11px] disabled:opacity-30"
            >
              ↓
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <button
              type="button"
              onClick={onDuplicate}
              className="text-off-white/60 hover:text-off-white"
            >
              Duplicate
            </button>
            {confirmingDelete ? (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-red-400"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-off-white/40"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-off-white/60 hover:text-red-400"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-off-white/50 hover:text-off-white mt-2 text-[10px]"
      >
        {expanded ? "▾" : "▸"} {project.images.length} photo
        {project.images.length === 1 ? "" : "s"}
      </button>
      {expanded && (
        <div className="border-off-white/10 mt-2 flex flex-col gap-1.5 border-t pt-2">
          {project.images.map((image, i) => (
            <PhotoRow
              key={`${image.src}-${i}`}
              image={image}
              index={i}
              total={project.images.length}
              isCover={image.src === project.cover.src}
              onSetCover={() => onSetCoverPhoto(image)}
              onReorder={(direction) => onReorderPhoto(i, direction)}
              onRemove={(deleteFile) => {
                if (deleteFile) deletePhotoFile(image.src);
                onRemovePhoto(i);
              }}
            />
          ))}
          <UploadRow slug={project.slug} onUploaded={onAddPhoto} />
        </div>
      )}
    </div>
  );
}

export function ProjectManager({
  projects,
  isSlugTaken,
  onClose,
  onAddProject,
  onDuplicateProject,
  onDeleteProject,
  onReorderProject,
  onUpdateProject,
  onAddPhoto,
  onRemovePhoto,
  onReorderPhoto,
  onSetCoverPhoto,
}: {
  projects: Project[];
  isSlugTaken: (slug: string, excluding?: string) => boolean;
  onClose: () => void;
  onAddProject: () => void;
  onDuplicateProject: (slug: string) => void;
  onDeleteProject: (slug: string) => void;
  onReorderProject: (slug: string, direction: -1 | 1) => void;
  onUpdateProject: (slug: string, patch: Partial<Project>) => void;
  onAddPhoto: (slug: string, image: ProjectImage) => void;
  onRemovePhoto: (slug: string, index: number) => void;
  onReorderPhoto: (slug: string, index: number, direction: -1 | 1) => void;
  onSetCoverPhoto: (slug: string, image: ProjectImage) => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-manager-heading"
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border-off-white/10 relative flex max-h-[80vh] w-full max-w-[36rem] flex-col overflow-hidden rounded-lg border shadow-2xl"
      >
        <div className="border-off-white/10 flex items-center justify-between border-b px-4 py-3">
          <h2
            id="project-manager-heading"
            className="text-off-white text-[13px] font-medium"
          >
            Projects
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-off-white/60 hover:text-off-white text-[13px]"
          >
            Esc
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          {projects.map((project, i) => (
            <ProjectRow
              key={project.slug}
              project={project}
              index={i}
              total={projects.length}
              isSlugTaken={isSlugTaken}
              onUpdate={(patch) => onUpdateProject(project.slug, patch)}
              onDuplicate={() => onDuplicateProject(project.slug)}
              onDelete={() => onDeleteProject(project.slug)}
              onReorder={(direction) =>
                onReorderProject(project.slug, direction)
              }
              onAddPhoto={(image) => onAddPhoto(project.slug, image)}
              onRemovePhoto={(index) => onRemovePhoto(project.slug, index)}
              onReorderPhoto={(index, direction) =>
                onReorderPhoto(project.slug, index, direction)
              }
              onSetCoverPhoto={(image) => onSetCoverPhoto(project.slug, image)}
            />
          ))}
        </div>
        <div className="border-off-white/10 border-t p-3">
          <button
            type="button"
            onClick={onAddProject}
            className="text-off-white/70 hover:text-off-white border-off-white/15 w-full rounded border border-dashed py-2 text-[11px]"
          >
            + Add project
          </button>
        </div>
      </div>
    </div>
  );
}
