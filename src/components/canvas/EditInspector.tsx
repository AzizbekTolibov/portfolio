import { useEffect, useRef, useState } from "react";
import type { CanvasNode } from "@/content/canvas";
import type {
  AboutContent,
  HomeContent,
  Project,
  PropertyGroup,
  SiteContent,
} from "@/content/types";
import { estimateCharCapacity } from "@/lib/canvas/text-fit";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type FieldPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

// ---- generic field primitives ----

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-off-white/50 block px-4 pt-2 pb-1 text-[11px]">
      {children}
    </span>
  );
}

/** Local text state that follows the live value except while focused (so
 * an external update — undo, another field's commit — never clobbers a
 * keystroke in progress), committing on blur/Enter, same pattern as
 * Phase 2's PositionField. */
function useCommittableText(value: string, onCommit?: (value: string) => void) {
  const [text, setText] = useState(value);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(value);
  }, [value]);

  function commit() {
    if (text !== value) onCommit?.(text);
  }

  return {
    text,
    setText,
    onFocus: () => {
      focusedRef.current = true;
    },
    onBlur: () => {
      focusedRef.current = false;
      commit();
    },
    revert: () => setText(value),
  };
}

function TextField({
  label,
  value,
  onCommit,
  mono = false,
}: {
  label: string;
  value: string;
  onCommit?: (value: string) => void;
  mono?: boolean;
}) {
  const field = useCommittableText(value, onCommit);
  return (
    <div className="px-4 py-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={field.text}
        onFocus={field.onFocus}
        onChange={(e) => field.setText(e.target.value)}
        onBlur={field.onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          else if (e.key === "Escape") {
            field.revert();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-full rounded border px-2 py-1 text-[11px] focus-visible:ring-1 focus-visible:outline-none ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onCommit,
  rows = 4,
  capacity,
}: {
  label: string;
  value: string;
  onCommit?: (value: string) => void;
  rows?: number;
  /** When set, shows a live character count against this estimated
   * capacity (see estimateCharCapacity) and a warning once over. */
  capacity?: number;
}) {
  const field = useCommittableText(value, onCommit);
  const over = capacity !== undefined && field.text.length > capacity;
  return (
    <div className="px-4 py-1.5">
      <div className="flex items-baseline justify-between">
        <FieldLabel>{label}</FieldLabel>
        {capacity !== undefined && (
          <span
            className={`pt-2 pr-0 text-[10px] ${over ? "text-warning" : "text-off-white/40"}`}
          >
            {field.text.length} / ~{capacity}
          </span>
        )}
      </div>
      <textarea
        value={field.text}
        rows={rows}
        onFocus={field.onFocus}
        onChange={(e) => field.setText(e.target.value)}
        onBlur={field.onBlur}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            field.revert();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-full resize-y rounded border px-2 py-1.5 text-[11px] leading-relaxed focus-visible:ring-1 focus-visible:outline-none"
      />
      {over && (
        <p className="text-warning mt-1 text-[10px]">
          Longer than this frame is tall — it will likely overflow. A note, not
          a constraint.
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="bg-off-white/10 mx-4 my-2 h-px" />;
}

// ---- tools/skills: a list of labeled groups, each a newline-separated
// item list — structured enough to stay valid data, simple enough not to
// need a nested drag-reorder UI for something edited rarely. ----

function PropertyGroupsEditor({
  label,
  groups,
  onCommit,
}: {
  label: string;
  groups: PropertyGroup[];
  onCommit: (groups: PropertyGroup[]) => void;
}) {
  function updateGroup(i: number, patch: Partial<PropertyGroup>) {
    const next = groups.map((g, idx) => (idx === i ? { ...g, ...patch } : g));
    onCommit(next);
  }
  function removeGroup(i: number) {
    onCommit(groups.filter((_, idx) => idx !== i));
  }
  function addGroup() {
    onCommit([...groups, { label: "New group", items: [] }]);
  }

  return (
    <div className="px-4 py-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-3">
        {groups.map((group, i) => (
          <div key={i} className="border-off-white/10 rounded border px-2 py-2">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                defaultValue={group.label}
                onBlur={(e) => updateGroup(i, { label: e.target.value })}
                className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-full rounded border px-2 py-1 text-[11px] font-medium focus-visible:ring-1 focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => removeGroup(i)}
                aria-label={`Remove ${group.label}`}
                className="text-off-white/40 hover:text-off-white shrink-0 px-1 text-[11px]"
              >
                ✕
              </button>
            </div>
            <textarea
              defaultValue={group.items.join("\n")}
              rows={3}
              onBlur={(e) =>
                updateGroup(i, {
                  items: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="One item per line"
              className="bg-surface border-off-white/10 text-off-white/80 focus-visible:ring-selection mt-1.5 w-full resize-y rounded border px-2 py-1 text-[11px] focus-visible:ring-1 focus-visible:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addGroup}
          className="text-off-white/60 hover:text-off-white border-off-white/15 rounded border border-dashed py-1.5 text-[11px]"
        >
          + Add group
        </button>
      </div>
    </div>
  );
}

// ---- position (Phase 2, unchanged) ----

function PositionField({
  label,
  value,
  disabled = false,
  onCommit,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onCommit?: (value: number) => void;
}) {
  const [text, setText] = useState(String(Math.round(value)));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(String(Math.round(value)));
  }, [value]);

  function commit() {
    const parsed = Number(text);
    if (Number.isFinite(parsed) && parsed !== value) {
      onCommit?.(parsed);
    } else {
      setText(String(Math.round(value)));
    }
  }

  return (
    <label className="flex items-center justify-between gap-3 px-4 py-1.5">
      <span className="text-off-white/50 text-[11px]">{label}</span>
      <input
        type="number"
        value={text}
        disabled={disabled}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setText(String(Math.round(value)));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-20 rounded border px-2 py-1 text-right font-mono text-[11px] focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
      />
    </label>
  );
}

function PositionFields({
  selectedNode,
  onCommitField,
  overlapWarning,
}: {
  selectedNode: SpatialNode;
  onCommitField?: (patch: FieldPatch) => void;
  overlapWarning: boolean;
}) {
  const sizeEditable = selectedNode.type === "frame";
  return (
    <>
      <PositionField
        label="X"
        value={selectedNode.x}
        onCommit={(x) => onCommitField?.({ x })}
      />
      <PositionField
        label="Y"
        value={selectedNode.y}
        onCommit={(y) => onCommitField?.({ y })}
      />
      <PositionField
        label="W"
        value={selectedNode.width}
        disabled={!sizeEditable}
        onCommit={(width) => onCommitField?.({ width })}
      />
      <PositionField
        label="H"
        value={selectedNode.height}
        disabled={!sizeEditable}
        onCommit={(height) => onCommitField?.({ height })}
      />
      {overlapWarning && (
        <div className="border-warning/30 bg-warning/10 text-warning mx-4 mt-3 rounded border px-3 py-2 text-[11px]">
          Overlaps another frame on this page — not a problem, just a note.
        </div>
      )}
    </>
  );
}

// ---- content sections, one per frame kind that owns editable text ----

function CoverFields({
  site,
  home,
  onCommitSite,
  onCommitHome,
}: {
  site: SiteContent;
  home: HomeContent;
  onCommitSite: (patch: Partial<SiteContent>) => void;
  onCommitHome: (patch: Partial<HomeContent>) => void;
}) {
  return (
    <>
      <Divider />
      <TextField
        label="Name"
        value={site.name}
        onCommit={(name) => onCommitSite({ name })}
      />
      <TextField
        label="Role"
        value={site.role}
        onCommit={(role) => onCommitSite({ role })}
      />
      <TextField
        label="Location"
        value={site.location.display}
        onCommit={(display) => onCommitSite({ location: { display } })}
      />
      <TextAreaField
        label="Positioning statement"
        value={home.heroHeadline}
        rows={2}
        onCommit={(heroHeadline) => onCommitHome({ heroHeadline })}
      />
    </>
  );
}

function AboutBioField({
  about,
  frameHeight,
  frameWidth,
  onCommitAbout,
}: {
  about: AboutContent;
  frameHeight: number;
  frameWidth: number;
  onCommitAbout: (patch: Partial<AboutContent>) => void;
}) {
  // 18px / 1.6 line-height matches --text-body (globals.css); the frame's
  // own text box insets ~30px on each side (see canvas.ts's about-bio-text
  // offsets) — approximated here since the inspector doesn't have a live
  // render to measure against.
  const capacity = estimateCharCapacity(
    frameWidth - 60,
    frameHeight - 60,
    18,
    1.6,
  );
  return (
    <>
      <Divider />
      <TextAreaField
        label="Bio (canvas — this frame)"
        value={about.bioMedium}
        rows={10}
        capacity={capacity}
        onCommit={(bioMedium) => onCommitAbout({ bioMedium })}
      />
    </>
  );
}

function AboutSkillsFields({
  about,
  onCommitAbout,
}: {
  about: AboutContent;
  onCommitAbout: (patch: Partial<AboutContent>) => void;
}) {
  return (
    <>
      <Divider />
      <PropertyGroupsEditor
        label="Tools"
        groups={about.tools}
        onCommit={(tools) => onCommitAbout({ tools })}
      />
      <PropertyGroupsEditor
        label="Skills"
        groups={about.skills}
        onCommit={(skills) => onCommitAbout({ skills })}
      />
    </>
  );
}

function ProjectFields({
  project,
  isSlugTaken,
  onUpdate,
  showDescription,
}: {
  project: Project;
  isSlugTaken: (slug: string, excluding?: string) => boolean;
  onUpdate: (patch: Partial<Project>) => void;
  showDescription: boolean;
}) {
  const [slugError, setSlugError] = useState<string | null>(null);
  return (
    <>
      <Divider />
      <TextField
        label="Title"
        value={project.title}
        onCommit={(title) => onUpdate({ title })}
      />
      <TextField
        label="Year"
        value={project.year}
        onCommit={(year) => onUpdate({ year })}
      />
      {showDescription && (
        <TextAreaField
          label="Description"
          value={project.description}
          rows={4}
          onCommit={(description) => onUpdate({ description })}
        />
      )}
      <div className="px-4 py-1.5">
        <FieldLabel>Slug (URL — renaming breaks shared links)</FieldLabel>
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
              setSlugError(`"${next}" is already used by another project.`);
              e.target.value = project.slug;
              return;
            }
            onUpdate({ slug: next });
          }}
          className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-full rounded border px-2 py-1 font-mono text-[11px] focus-visible:ring-1 focus-visible:outline-none"
        />
        {slugError && (
          <p className="mt-1 text-[10px] text-red-400">{slugError}</p>
        )}
      </div>
    </>
  );
}

/**
 * The editor's inspector — swapped in for the normal InspectorContent
 * whenever /edit is open (see RightPanel). Shows position (Phase 2) plus,
 * new this phase, the content fields owned by whatever's selected: Cover
 * shows site name/role/location + the positioning statement; a project
 * tile or a project page's Overview shows that project's title/year/
 * description/slug; the About Bio frame shows bioMedium (with a fit
 * estimate against its own frame height); About's Tools & Skills frame
 * shows both property-group lists. Fields with no owning frame at all —
 * bioShort, bioLong, availability, site.tagline — live in the File panel
 * shown when nothing is selected, same as the read-only file info panel
 * they replace.
 *
 * Text editing is inspector-based, deliberately, this phase and the
 * next one after it: contenteditable inside a scaled, translated, LOD-
 * gated canvas fights caret positioning, IME input, and the fact that
 * text only renders above 80% zoom in the first place. This is the
 * boring path built first so adding a project (or fixing a typo) stops
 * being blocked on hand-editing JSON — inline canvas editing is deferred,
 * not forgotten.
 */
export function EditInspector({
  selectedNode,
  onCommitField,
  overlapWarning = false,
  site,
  home,
  about,
  projects,
  currentProject,
  onCommitSite,
  onCommitHome,
  onCommitAbout,
  onUpdateProject,
  isSlugTaken,
}: {
  selectedNode: SpatialNode | null;
  onCommitField?: (patch: FieldPatch) => void;
  overlapWarning?: boolean;
  site: SiteContent;
  home: HomeContent;
  about: AboutContent;
  projects: Project[];
  /** The current PAGE's project, if it's a project page — not derived
   * from selectedNode, since editing "the project" (title/year/
   * description) should work whether Overview or a Photo is selected. */
  currentProject: Project | undefined;
  onCommitSite: (patch: Partial<SiteContent>) => void;
  onCommitHome: (patch: Partial<HomeContent>) => void;
  onCommitAbout: (patch: Partial<AboutContent>) => void;
  onUpdateProject: (slug: string, patch: Partial<Project>) => void;
  isSlugTaken: (slug: string, excluding?: string) => boolean;
}) {
  if (!selectedNode) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
        <div className="px-4 pt-4 pb-2">
          <div className="text-off-white text-[13px] font-medium">File</div>
        </div>
        <Divider />
        <TextField
          label="Tagline (metadata only — not on canvas)"
          value={site.tagline}
          onCommit={(tagline) => onCommitSite({ tagline })}
        />
        <TextAreaField
          label="Short bio (right panel, nothing selected)"
          value={about.bioShort}
          rows={4}
          onCommit={(bioShort) => onCommitAbout({ bioShort })}
        />
        <TextAreaField
          label="Long bio (screen readers & crawlers only)"
          value={about.bioLong}
          rows={8}
          onCommit={(bioLong) => onCommitAbout({ bioLong })}
        />
        <TextField
          label="Availability"
          value={about.availability}
          onCommit={(availability) => onCommitAbout({ availability })}
        />
        <TextField
          label="Portrait image path"
          value={about.photo}
          mono
          onCommit={(photo) => onCommitAbout({ photo })}
        />
        <AboutSkillsFields about={about} onCommitAbout={onCommitAbout} />
      </div>
    );
  }

  const kind =
    selectedNode.type === "frame" ? selectedNode.content?.kind : undefined;
  const tileSlug =
    selectedNode.type === "frame" ? selectedNode.content?.pageLink : undefined;
  const tileProject = tileSlug
    ? projects.find((p) => p.slug === tileSlug)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <div className="px-4 pt-4 pb-2">
        <div className="text-off-white text-[13px] font-medium">
          {selectedNode.name}
        </div>
        <div className="text-off-white/50 text-[11px]">
          {selectedNode.type === "group" ? "Group" : "Frame"}
        </div>
      </div>
      <div className="bg-off-white/10 mx-4 mb-2 h-px" />
      <PositionFields
        selectedNode={selectedNode}
        onCommitField={onCommitField}
        overlapWarning={overlapWarning}
      />

      {kind === "site-cover" && (
        <CoverFields
          site={site}
          home={home}
          onCommitSite={onCommitSite}
          onCommitHome={onCommitHome}
        />
      )}
      {kind === "project-cover" && tileProject && (
        <ProjectFields
          project={tileProject}
          isSlugTaken={isSlugTaken}
          onUpdate={(patch) => onUpdateProject(tileProject.slug, patch)}
          showDescription={false}
        />
      )}
      {kind === "project-overview" && currentProject && (
        <ProjectFields
          project={currentProject}
          isSlugTaken={isSlugTaken}
          onUpdate={(patch) => onUpdateProject(currentProject.slug, patch)}
          showDescription
        />
      )}
      {kind === "about-bio" && (
        <AboutBioField
          about={about}
          frameHeight={selectedNode.height}
          frameWidth={selectedNode.width}
          onCommitAbout={onCommitAbout}
        />
      )}
      {kind === "about-skills" && (
        <AboutSkillsFields about={about} onCommitAbout={onCommitAbout} />
      )}
    </div>
  );
}
