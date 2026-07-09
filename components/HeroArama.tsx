import Link from "next/link";

// Hero arama çubuğu + Rastgele Sohbet butonu.
// Arama şimdilik /sohbetler'e GET ile gider; Pagefind entegrasyonu sonra eklenecek.
export default function HeroArama() {
  return (
    <div className="mx-auto max-w-2xl">
      <form action="/sohbetler" method="get" className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          name="q"
          placeholder="Sohbetlerde ara: kavram, ayet, konu..."
          aria-label="Sohbetlerde ara"
          className="w-full rounded-full border border-line bg-surface py-3.5 pl-12 pr-4 text-ink shadow-card outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
      </form>

      <div className="mt-5 flex justify-center">
        <Link
          href="/rastgele"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <span aria-hidden="true">🎲</span> Rastgele Sohbet
        </Link>
      </div>
    </div>
  );
}
