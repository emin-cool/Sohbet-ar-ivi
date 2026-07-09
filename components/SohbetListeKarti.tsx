import Link from "next/link";
import { dakikaMMSS } from "@/lib/dates";
import type { SohbetMeta } from "@/lib/types";
import KavramChip from "./KavramChip";

interface Props {
  sohbet: SohbetMeta;
  /** Dinleme ilerleme oranı 0..1 (varsa kartın altında teal çizgi). */
  oran?: number;
}

// Liste varyantı (arşiv sayfası · design/archive.png)
export default function SohbetListeKarti({ sohbet, oran }: Props) {
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

      {sohbet.sureDk != null && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <HeadphoneIcon />
          <span>{dakikaMMSS(sohbet.sureDk)}</span>
        </div>
      )}

      {/* Dinleme ilerleme çizgisi (localStorage) */}
      {oran != null && oran > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-line/60">
          <div
            className="h-full bg-accent"
            style={{ width: `${Math.min(100, oran * 100)}%` }}
          />
        </div>
      )}
    </article>
  );
}

function HeadphoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
