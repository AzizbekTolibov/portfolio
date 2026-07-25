type PullQuoteProps = {
  quote: string;
  attribution?: string;
};

export function PullQuote({ quote, attribution }: PullQuoteProps) {
  return (
    <blockquote className="border-accent pl-md border-l-2">
      <p className="font-display text-h2 italic">“{quote}”</p>
      {attribution && (
        <cite className="mt-sm text-mono-caption block font-mono tracking-[0.08em] text-gray-600 uppercase not-italic">
          — {attribution}
        </cite>
      )}
    </blockquote>
  );
}
