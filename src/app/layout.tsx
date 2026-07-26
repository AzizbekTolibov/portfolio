import type { Metadata } from "next";
import { Caveat, Fraunces, Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

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
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full overflow-hidden antialiased`}
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
