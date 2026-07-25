import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
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
  sameAs: contact.socials.map((social) => social.url),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="bg-off-white text-off-black flex min-h-full flex-col overflow-x-hidden">
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
        <SmoothScrollProvider>
          <Nav />
          <div id="main-content" className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
