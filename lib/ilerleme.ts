// Dinleme ilerlemesi — localStorage (client-only).
// Player her ~5 sn'de bir yazar; "Kaldığın yerden devam et" en son kaydı okur.

const ANAHTAR = "sohbet-arsivi:ilerleme";

export interface IlerlemeKaydi {
  saniye: number;
  toplam: number; // saniye
  guncelleme: number; // epoch ms
}

type IlerlemeHaritasi = Record<string, IlerlemeKaydi>;

function guvenli(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function ilerlemeHaritasi(): IlerlemeHaritasi {
  if (!guvenli()) return {};
  try {
    return JSON.parse(localStorage.getItem(ANAHTAR) ?? "{}") as IlerlemeHaritasi;
  } catch {
    return {};
  }
}

export function ilerlemeOku(slug: string): IlerlemeKaydi | undefined {
  return ilerlemeHaritasi()[slug];
}

export function ilerlemeYaz(slug: string, saniye: number, toplam: number): void {
  if (!guvenli()) return;
  const harita = ilerlemeHaritasi();
  harita[slug] = { saniye, toplam, guncelleme: Date.now() };
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(harita));
  } catch {
    /* kota/gizli mod — sessizce geç */
  }
}

/** En son güncellenen, tamamlanmamış (%98 altı) kayıt. */
export function sonKaldiginYer():
  | ({ slug: string } & IlerlemeKaydi)
  | undefined {
  const harita = ilerlemeHaritasi();
  let en: ({ slug: string } & IlerlemeKaydi) | undefined;
  for (const [slug, k] of Object.entries(harita)) {
    if (k.toplam > 0 && k.saniye / k.toplam >= 0.98) continue; // bitmiş sayılır
    if (!en || k.guncelleme > en.guncelleme) en = { slug, ...k };
  }
  return en;
}
