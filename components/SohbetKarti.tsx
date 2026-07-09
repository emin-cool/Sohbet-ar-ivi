import Link from "next/link";
import type { SohbetMeta } from "@/lib/types";
import KavramChip from "./KavramChip";

interface Props {
  sohbet: SohbetMeta;
}

// Grid varyantı (ana sayfa / "Son Eklenen Sohbetler" · design/home.png)
export default function SohbetKarti({ sohbet }: Props) {
  return (
    <article className="group flex flex-col rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="mb-3 flex items-center justify-between">
        <time className="text-sm text-muted">{sohbet.tarihTr}</time>
      </div>

      <h3 className="font-serif text-xl font-semibold leading-snug text-ink">
        <Link
          href={`/sohbet/${sohbet.slug}`}
          className="transition-colors group-hover:text-accent"
        >
          {sohbet.baslik}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
        {sohbet.ozet}
      </p>

      {sohbet.kavramlar.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {sohbet.kavramlar.slice(0, 3).map((k) => (
            <KavramChip key={k.slug} kavram={k} kucukHarf />
          ))}
        </div>
      )}
    </article>
  );
}
