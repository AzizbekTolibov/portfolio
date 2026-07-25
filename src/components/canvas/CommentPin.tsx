"use client";

import type { CanvasNode, CommentAuthor } from "@/content/canvas";

type CommentNode = Extract<CanvasNode, { type: "comment" }>;

type CommentPinProps = {
  node: CommentNode;
  number: number;
  open: boolean;
  onToggle: (id: string) => void;
};

function Avatar({ author }: { author: CommentAuthor }) {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: author.color }}
    >
      {author.initials}
    </div>
  );
}

function Message({
  author,
  timestamp,
  body,
}: {
  author: CommentAuthor;
  timestamp: string;
  body: string;
}) {
  return (
    <div className="flex gap-2.5 px-3 py-2.5">
      <Avatar author={author} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-off-white truncate text-[12px] font-medium">
            {author.name}
          </span>
          <span className="text-off-white/60 shrink-0 text-[10px]">
            {timestamp}
          </span>
        </div>
        <p className="text-off-white/80 mt-0.5 text-[12px] leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}

/**
 * A design-rationale pin — Figma's comment system repurposed to carry real
 * decisions instead of review feedback. Positioned in canvas space but
 * counter-scaled (via --canvas-scale, same trick as frame labels/handles)
 * so the pin and its popover stay legible at any zoom.
 */
export function CommentPin({ node, number, open, onToggle }: CommentPinProps) {
  const thread = node.content;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="absolute" style={{ left: node.x, top: node.y }}>
      <div
        className="origin-center"
        style={{ transform: "scale(calc(1 / var(--canvas-scale, 1)))" }}
      >
        <button
          type="button"
          // The whole canvas is aria-hidden (its content is duplicated in
          // the semantic layer, which comment rationale isn't) — tabIndex
          // -1 keeps this out of the tab sequence so aria-hidden never
          // hides a reachable focus stop. Still fully clickable.
          tabIndex={-1}
          onClick={(e) => {
            stop(e);
            onToggle(node.id);
          }}
          onPointerDown={stop}
          onPointerUp={stop}
          aria-label={`Comment ${number}: ${thread.body}`}
          aria-expanded={open}
          className={`bg-comment flex h-6 w-6 items-center justify-center rounded-full rounded-bl-sm text-[11px] font-bold text-white shadow-md ring-2 transition-shadow ${
            open ? "ring-off-white" : "hover:ring-off-white/60 ring-transparent"
          }`}
        >
          {number}
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Comment thread"
            onClick={stop}
            onPointerDown={stop}
            onPointerUp={stop}
            className="bg-panel border-off-white/10 absolute top-7 left-0 w-80 divide-y divide-white/10 overflow-hidden rounded-md border shadow-xl"
          >
            <Message
              author={thread}
              timestamp={thread.timestamp}
              body={thread.body}
            />
            {thread.replies?.map((reply, i) => (
              <Message
                key={i}
                author={reply}
                timestamp={reply.timestamp}
                body={reply.body}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
