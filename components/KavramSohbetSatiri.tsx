import Link from "next/link";
import type { SohbetMeta } from "@/lib/types";
import KavramChip from "./KavramChip";

// Kavram sayfası sohbet satırı.
export default function KavramSohbetSatiri({ sohbet }: { sohbet: SohbetMeta }) {
  return (
    <article className="group flex items-start gap-5 border-b border-line py-7 last:border-0">
      {/* Sol: tarih */}
      <div className="hidden w-28 shrink-0 pt-1 text-sm text-muted sm:block">
        <div>{sohbet.tarihTr}</div>
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
        {/* Mobil tarih */}
        <div className="mt-2 text-sm text-muted sm:hidden">
          {sohbet.tarihTr}
        </div>
      </div>

      {/* Sağ: oku butonu -> detay */}
      <Link
        href={`/sohbet/${sohbet.slug}`}
        aria-label={`${sohbet.baslik} sayfasına git`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-accent transition-colors hover:border-accent hover:bg-accent hover:text-accent-fg"
      >
        <ArrowIcon />
      </Link>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
