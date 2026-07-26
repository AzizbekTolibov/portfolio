import Image from "next/image";
import { PullQuote } from "@/components/PullQuote";
import type { CaseStudyBlock, CaseStudySection } from "@/content/types";
import { blurDataUrl } from "@/lib/canvas/blur";
import { PlaceholderText } from "@/lib/canvas/placeholder-text";

// Case-study placeholder images are all flat off-white fills.
const CASE_STUDY_BLUR = blurDataUrl("#ECE9E2");

function Block({ block }: { block: CaseStudyBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="text-h2 font-display mt-lg mb-sm text-gray-900">
          <PlaceholderText text={block.text} />
        </h3>
      );
    case "body":
      return (
        <p className="text-body mb-md text-gray-700 last:mb-0">
          <PlaceholderText text={block.text} />
        </p>
      );
    case "pullQuote":
      return (
        <div className="my-lg">
          <PullQuote quote={block.quote} attribution={block.attribution} />
        </div>
      );
    case "fullBleedImage":
      return (
        <figure className="my-lg">
          <Image
            src={block.image.src}
            width={block.image.width}
            height={block.image.height}
            alt={block.image.alt}
            unoptimized
            loading="lazy"
            placeholder="blur"
            blurDataURL={CASE_STUDY_BLUR}
            className="w-full"
          />
          {block.caption && (
            <figcaption className="text-mono-caption mt-sm font-mono tracking-[0.08em] text-gray-600 uppercase">
              <PlaceholderText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case "imagePair":
      return (
        <figure className="my-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {block.images.map((image) => (
              <Image
                key={image.src}
                src={image.src}
                width={image.width}
                height={image.height}
                alt={image.alt}
                unoptimized
                loading="lazy"
                placeholder="blur"
                blurDataURL={CASE_STUDY_BLUR}
                className="w-full"
              />
            ))}
          </div>
          {block.caption && (
            <figcaption className="text-mono-caption mt-sm font-mono tracking-[0.08em] text-gray-600 uppercase">
              <PlaceholderText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

export function CaseStudySectionBlock({
  section,
}: {
  section: CaseStudySection;
}) {
  return (
    <section aria-labelledby={`${section.id}-heading`} className="mb-2xl">
      <h2
        id={`${section.id}-heading`}
        className="text-h1 font-display mb-md text-gray-900"
      >
        {section.heading}
      </h2>
      {section.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </section>
  );
}
