import Link from "next/link";
import { site } from "@/content/site";

export function Nav() {
  return (
    <header className="px-sm py-sm sm:px-md w-full">
      <div className="max-w-content gap-sm mx-auto flex flex-wrap items-center justify-between">
        <Link
          href="/"
          className="text-mono-caption -my-sm py-sm inline-block font-mono tracking-[0.08em] uppercase"
        >
          {site.name}
        </Link>
        <nav aria-label="Primary">
          <ul className="gap-md flex flex-wrap items-center">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-mono-caption text-off-black/70 duration-fast hover:text-off-black -my-sm py-sm inline-block font-mono tracking-[0.08em] uppercase transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
