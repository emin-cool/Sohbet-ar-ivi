"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AramaOverlay from "./AramaOverlay";

// CLAUDE.md tutarlılık kuralı: tüm sayfalarda standart marka + menü.
const MENU = [
  { href: "/sohbetler", etiket: "Sohbetler" },
  { href: "/kavramlar", etiket: "Kavramlar" },
  { href: "/ayetler", etiket: "Ayetler" },
  { href: "/hakkinda", etiket: "Hakkında" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [aramaAcik, setAramaAcik] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-site items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="font-serif text-xl font-bold text-accent"
          aria-label="Sohbet Arşivi ana sayfa"
        >
          Sohbet Arşivi
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {MENU.map((m) => {
            const aktif =
              pathname === m.href || pathname.startsWith(m.href + "/");
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className={
                    aktif
                      ? "border-b-2 border-accent pb-0.5 font-semibold text-accent"
                      : "text-ink/80 transition-colors hover:text-accent"
                  }
                >
                  {m.etiket}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAramaAcik(true)}
            aria-label="Ara"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-surface hover:text-accent"
          >
            <SearchIcon />
          </button>
          {/* Mobil menü ikonu */}
          <Link
            href="/sohbetler"
            aria-label="Menü"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-surface hover:text-accent md:hidden"
          >
            <MenuIcon />
          </Link>
        </div>
      </nav>

      <AramaOverlay acik={aramaAcik} kapat={() => setAramaAcik(false)} />
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-3.2-3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
