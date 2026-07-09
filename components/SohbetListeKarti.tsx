import Link from "next/link";
import type { SohbetMeta } from "@/lib/types";
import KavramChip from "./KavramChip";

interface Props {
  sohbet: SohbetMeta;
}

// Liste varyantı (arşiv sayfası)
export default function SohbetListeKarti({ sohbet }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <h3 className="order-1 font-serif text-2xl font-semibold leading-snug text-ink">
          <Link
            href={`/sohbet/${sohbet.slug}`}
            className="transition-colors group-hover:text-accent"
          >
            {sohbet.baslik}
          </Link>
        </h3>
        <span className="order-2 shrink-0 rounded-full bg-badge px-3 py-1 text-right text-sm font-medium leading-tight text-badge-fg">
          {sohbet.tarihTr}
        </span>
      </div>

      {sohbet.kavramlar.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sohbet.kavramlar.slice(0, 4).map((k) => (
            <KavramChip key={k.slug} kavram={k} kucukHarf />
          ))}
        </div>
      )}

      <p className="mt-3 line-clamp-2 leading-relaxed text-muted">
        {sohbet.ozet}
      </p>
    </article>
  );
}
