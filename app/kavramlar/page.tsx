import Link from "next/link";
import type { Metadata } from "next";
import { getKavramlar } from "@/lib/content";

export const metadata: Metadata = {
  title: "Kavramlar",
  description: "Sohbetlerde işlenen ana kavramlar ve her birinin geçtiği sohbet sayısı.",
};

export default function KavramlarSayfasi() {
  const kavramlar = getKavramlar();

  return (
    <main className="mx-auto max-w-site px-6 py-12">
      <header>
        <h1 className="font-serif text-4xl font-bold text-ink sm:text-5xl">
          Kavramlar
        </h1>
        <p className="mt-2 text-muted">{kavramlar.length} ana kavram</p>
      </header>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kavramlar.map((k) => (
          <li key={k.slug}>
            <Link
              href={`/kavram/${k.slug}`}
              className="group flex items-center justify-between rounded-card border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span className="font-serif text-xl font-semibold text-ink transition-colors group-hover:text-accent">
                {k.ad}
              </span>
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
                {k.adet} sohbet
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
