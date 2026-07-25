type IconProps = {
  className?: string;
};

/** Small line icons for the Figma-chrome UI. Hand-authored rather than an
 * icon library — there are only a handful, and each needs to match Figma's
 * exact silhouettes (never Figma's actual logo, per the brief). All are
 * 16x16, 1.5px stroke, currentColor. */

export function MoveToolIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 2.5L4 12.5L6.8 9.9L8.4 13.3L10 12.5L8.4 9.1L12 8.7L4 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HandToolIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.5 8V3.75a.9.9 0 0 1 1.8 0V7.5" />
      <path d="M7.3 7.5V3a.9.9 0 0 1 1.8 0v4.5" />
      <path d="M9.1 7.5V3.75a.9.9 0 0 1 1.8 0V8" />
      <path d="M10.9 8V5.4a.9.9 0 0 1 1.8 0V9.5c0 2.5-1.4 4.3-4 4.3H7.6c-1.4 0-2-.4-2.8-1.4L3 9.8c-.4-.6-.2-1.2.3-1.5.5-.3 1.1-.2 1.5.3L5.5 9.5" />
    </svg>
  );
}

export function FrameToolIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 1.5V14.5" />
      <path d="M11 1.5V14.5" />
      <path d="M1.5 5H14.5" />
      <path d="M1.5 11H14.5" />
    </svg>
  );
}

export function CommentToolIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 3.5h12v7H8.5L5.5 13v-2.5H2v-7Z" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3.5L10.5 8L6 12.5" />
    </svg>
  );
}

export function PageIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <path d="M5.5 6H10.5" strokeLinecap="round" />
      <path d="M5.5 8.5H10.5" strokeLinecap="round" />
    </svg>
  );
}

export function GroupIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="7" height="7" />
      <rect x="6.5" y="2" width="7" height="7" fillOpacity="0" />
    </svg>
  );
}

export function FrameLayerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 1.5V4.5H2" />
      <path d="M11 1.5V4.5H14" />
      <path d="M5 14.5V11.5H2" />
      <path d="M11 14.5V11.5H14" />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 4H4a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 4 13.5h6.5A1.5 1.5 0 0 0 12 12V9.5" />
      <path d="M9.5 2.5H13.5V6.5" />
      <path d="M7 9L13.3 2.7" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M13.5 13.5L10.3 10.3" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
      <path d="M2.5 4.5L8 9L13.5 4.5" />
    </svg>
  );
}

export function FitIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M1.5 5.5V2.5a1 1 0 0 1 1-1h3" />
      <path d="M14.5 5.5V2.5a1 1 0 0 0-1-1h-3" />
      <path d="M1.5 10.5v3a1 1 0 0 0 1 1h3" />
      <path d="M14.5 10.5v3a1 1 0 0 1-1 1h-3" />
      <rect x="5" y="5" width="6" height="6" rx="0.5" />
    </svg>
  );
}
