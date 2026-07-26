import type { Metadata } from "next";
import {
  Caveat,
  Fraunces,
  Geist_Mono,
  Instrument_Sans,
  Inter_Tight,
  Space_Grotesk,
} from "next/font/google";
import { contact } from "@/content/about";
import { site } from "@/content/site";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

// next/font self-hosts and preloads these automatically (preload: true is
// the default) — display: "swap" is set explicitly so text using them
// never blocks on a lagging font fetch.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export type UISans = "inter-tight" | "instrument" | "space";

// UI sans, replacing Geist — three candidates, compared live at
// /type-test. Swap this one value to try a different one; delete the two
// losers (and their next/font declarations below) once a choice is made.
export const UI_SANS: UISans = "inter-tight";

// All three self-host and preload regardless of UI_SANS, so /type-test can
// render them side by side. Each gets its own fixed variable name — a
// next/font call's arguments must be statically-analyzable literals (the
// compiler transforms this call at build time), so which one is "active"
// can't be decided with a UI_SANS-dependent ternary *inside* the call the
// way `content/canvas.ts`'s data-driven values can. Instead, --font-sans
// itself is aliased to whichever one's variable matches UI_SANS, via a
// plain inline style below (see UI_SANS_VARIABLE + <html style=...>) — the
// selected face is still the only one anything in the app actually picks
// up; the other two are just self-hosted and reachable for the
// comparison page.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

// The CSS variable each candidate is reachable under, regardless of which
// is currently selected — /type-test imports this to render "the
// inter-tight candidate" by its own name.
export const UI_SANS_VARIABLE: Record<UISans, string> = {
  "inter-tight": "--font-inter-tight",
  instrument: "--font-instrument",
  space: "--font-space",
};

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Handwritten-feel face for the canvas's sticky notes only.
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const defaultTitle = `${site.name} — ${site.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s — ${site.name}`,
  },
  description: site.tagline,
  openGraph: {
    title: defaultTitle,
    description: site.tagline,
    url: "/",
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.tagline,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: site.role,
  url: siteUrl,
  email: contact.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Navoiy",
    addressCountry: "Uzbekistan",
  },
  // Omitted rather than emitted as [] — no real profile URLs yet.
  ...(contact.socials.length > 0
    ? { sameAs: contact.socials.map((social) => social.url) }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} ${instrumentSans.variable} ${spaceGrotesk.variable} ${geistMono.variable} ${caveat.variable} h-full overflow-hidden antialiased`}
      style={
        {
          // The one line that actually picks the UI sans: alias
          // --font-sans to whichever candidate's own variable UI_SANS
          // names. Swapping UI_SANS above is what this line responds to.
          "--font-sans": `var(${UI_SANS_VARIABLE[UI_SANS]})`,
        } as React.CSSProperties
      }
    >
      <body className="h-full overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <a
          href="#main-content"
          className="focus:bg-off-black focus:text-off-white focus:top-sm focus:left-sm focus:px-md focus:py-sm focus:text-mono-caption sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:font-mono focus:tracking-[0.08em] focus:uppercase"
        >
          Skip to content
        </a>
        <div id="main-content" tabIndex={-1} className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
