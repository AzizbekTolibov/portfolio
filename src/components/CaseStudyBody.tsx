import Image from "next/image";
import type { ReactNode } from "react";
import { PullQuote } from "@/components/PullQuote";
import { Reveal } from "@/components/Reveal";
import type {
  CaseStudy,
  CaseStudyBlock,
  CaseStudyImage,
} from "@/content/types";

export function CaseStudyBody({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div className="flex flex-col">
      {caseStudy.sections.map((section, index) => (
        <Reveal key={section.id} className="py-lg sm:py-xl">
          <div className="gap-lg flex flex-col">
            <ProseWrap>
              <p className="mb-xs text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(caseStudy.sections.length).padStart(2, "0")}
              </p>
              <h2 className="font-display text-h2">{section.heading}</h2>
            </ProseWrap>

            {section.blocks.map((block, i) => (
              <CaseStudyBlockView key={i} block={block} />
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function ProseWrap({ children }: { children: ReactNode }) {
  return (
    <div className="px-sm sm:px-md mx-auto w-full max-w-prose">{children}</div>
  );
}

function CaseStudyBlockView({ block }: { block: CaseStudyBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <ProseWrap>
          <h3 className="font-display text-h2">{block.text}</h3>
        </ProseWrap>
      );
    case "body":
      return (
        <ProseWrap>
          <p className="text-body font-sans text-gray-700">{block.text}</p>
        </ProseWrap>
      );
    case "pullQuote":
      return (
        <ProseWrap>
          <PullQuote quote={block.quote} attribution={block.attribution} />
        </ProseWrap>
      );
    case "fullBleedImage":
      return <FullBleedImage image={block.image} caption={block.caption} />;
    case "imagePair":
      return <ImagePairView images={block.images} caption={block.caption} />;
    default:
      return null;
  }
}

function FullBleedImage({
  image,
  caption,
}: {
  image: CaseStudyImage;
  caption?: string;
}) {
  return (
    <figure>
      <div className="relative right-1/2 left-1/2 -mx-[50vw] aspect-[16/9] w-screen">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-sm px-sm text-small sm:px-md mx-auto max-w-prose text-center font-mono text-gray-600">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ImagePairView({
  images,
  caption,
}: {
  images: [CaseStudyImage, CaseStudyImage];
  caption?: string;
}) {
  return (
    <div className="max-w-content px-sm sm:px-md mx-auto w-full">
      <div className="gap-md grid grid-cols-1 sm:grid-cols-2">
        {images.map((image) => (
          <div
            key={image.src}
            className="relative aspect-[4/5] overflow-hidden bg-gray-100"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              unoptimized
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {caption && (
        <p className="mt-sm text-small text-center font-mono text-gray-600">
          {caption}
        </p>
      )}
    </div>
  );
}
