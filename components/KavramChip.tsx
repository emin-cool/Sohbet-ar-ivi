import Link from "next/link";
import type { Kavram } from "@/lib/types";

type Ton = "bej" | "teal";

interface Props {
  kavram: Kavram;
  ton?: Ton;
  /** Tasarımda kart etiketleri küçük harf; lang="tr" ile Türkçe küçültme. */
  kucukHarf?: boolean;
}

// Kavram etiketi. bej = kart/detay etiketleri, teal = "ilgili kavramlar".
export default function KavramChip({ kavram, ton = "bej", kucukHarf }: Props) {
  const stil =
    ton === "teal"
      ? "bg-accent-soft text-accent hover:bg-accent hover:text-accent-fg"
      : "bg-chip text-chip-fg hover:bg-chip/70";

  return (
    <Link
      href={`/kavram/${kavram.slug}`}
      data-pagefind-filter={`Kavram:${kavram.kisaAd}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${stil} ${
        kucukHarf ? "lowercase" : ""
      }`}
    >
      {kavram.kisaAd}
    </Link>
  );
}
