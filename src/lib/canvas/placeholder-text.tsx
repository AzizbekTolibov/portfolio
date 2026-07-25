// A `[BRACKETED]` run inside any content string is a fact not supplied yet
// — rendered in Figma's own "missing" red (#F24822) so it can't ship by
// accident. One helper, used everywhere user-authored copy renders, so a
// future placeholder anywhere in content/* is automatically caught.
const SPLIT_RE = /(\[[^\]]+\])/g;
const MATCH_RE = /^\[[^\]]+\]$/;

export function PlaceholderText({ text }: { text: string }) {
  const parts = text.split(SPLIT_RE);
  return (
    <>
      {parts.map((part, i) =>
        MATCH_RE.test(part) ? (
          <span key={i} style={{ color: "#F24822" }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
