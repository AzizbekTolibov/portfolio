"use client";

import { useEffect, useState } from "react";
import { about, contact } from "@/content/about";
import { site } from "@/content/site";

function useLocalTime(timeZone: string) {
  // Starts null so the server-rendered and first client-rendered markup
  // match exactly; the real time fills in after mount (client-only clock).
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });

    const update = () => setTime(formatter.format(new Date()));
    update();
    const id = setInterval(update, 1000);

    return () => clearInterval(id);
  }, [timeZone]);

  return time;
}

const linkClassName =
  "text-mono-caption text-off-black duration-fast -my-sm inline-block py-sm font-mono tracking-[0.08em] uppercase underline decoration-transparent underline-offset-4 transition-colors hover:decoration-accent";

export function Footer() {
  const time = useLocalTime(site.location.timeZone);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setYear(new Date().getFullYear());
    update();
  }, []);

  return (
    <footer className="px-sm py-lg sm:px-md w-full">
      <div className="max-w-content gap-md pt-md mx-auto flex flex-col border-t border-gray-200 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
          {site.location.city} {time ? `— ${time}` : null}
        </p>
        <div className="gap-md flex flex-wrap items-center">
          <a href={`mailto:${contact.email}`} className={linkClassName}>
            {contact.email}
          </a>
          {contact.socials.map((social) => (
            <a
              key={social.url}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
      <p className="mt-md text-mono-caption font-mono text-gray-600">
        © {year ?? ""} {about.name}
      </p>
    </footer>
  );
}
