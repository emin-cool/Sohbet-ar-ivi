import Link from "next/link";

const YILLAR = [2024, 2025, 2026];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-site flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-base font-semibold text-accent">
          Sohbet Arşivi
        </p>
        <nav className="flex items-center gap-4" aria-label="Yıllara göre">
          {YILLAR.map((y) => (
            <Link
              key={y}
              href={`/sohbetler?yil=${y}`}
              className="transition-colors hover:text-accent"
            >
              {y}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
