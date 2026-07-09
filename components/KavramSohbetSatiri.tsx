import Link from "next/link";
import { dakikaEtiket } from "@/lib/dates";
import type { SohbetMeta } from "@/lib/types";
import KavramChip from "./KavramChip";

// Kavram sayfası sohbet satırı (design/concept.png).
// Play butonu detay sayfasına götürür (gerçek oynatma değil).
export default function KavramSohbetSatiri({ sohbet }: { sohbet: SohbetMeta }) {
  return (
    <article className="group flex items-start gap-5 border-b border-line py-7 last:border-0">
      {/* Sol: tarih + süre */}
      <div className="hidden w-28 shrink-0 pt-1 text-sm text-muted sm:block">
        <div>{sohbet.tarihTr}</div>
        {sohbet.sureDk != null && (
          <div className="mt-1 inline-flex items-center gap-1">
            <ClockIcon /> {dakikaEtiket(sohbet.sureDk)}
          </div>
        )}
      </div>

      {/* Orta: etiketler + başlık + özet */}
      <div className="min-w-0 flex-1">
        {sohbet.kavramlar.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {sohbet.kavramlar.slice(0, 3).map((k) => (
              <KavramChip key={k.slug} kavram={k} kucukHarf />
            ))}
          </div>
        )}
        <h3 className="font-serif text-2xl font-semibold leading-snug text-ink">
          <Link
            href={`/sohbet/${sohbet.slug}`}
            className="transition-colors group-hover:text-accent"
          >
            {sohbet.baslik}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 leading-relaxed text-muted">
          {sohbet.ozet}
        </p>
        {/* Mobil tarih/süre */}
        <div className="mt-2 text-sm text-muted sm:hidden">
          {sohbet.tarihTr}
          {sohbet.sureDk != null && ` · ${dakikaEtiket(sohbet.sureDk)}`}
        </div>
      </div>

      {/* Sağ: play butonu -> detay */}
      <Link
        href={`/sohbet/${sohbet.slug}`}
        aria-label={`${sohbet.baslik} sayfasına git`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-accent transition-colors hover:border-accent hover:bg-accent hover:text-accent-fg"
      >
        <PlayIcon />
      </Link>
    </article>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}
