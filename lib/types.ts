// Sohbet Arşivi — içerik tipleri
//
// NOT: Kaynak içerik (content/sohbetler/*.md) CLAUDE.md'deki YAML frontmatter
// şemasına birebir uymuyor; dosyalar **Etiket:** biçiminde bir başlık bloğu
// kullanıyor. Ayrıca bazı alanlar kaynakta HENÜZ YOK:
//   - audio (ses URL'i)
//   - bölüm timestamp'leri (bolumler[].ts)
//   - yapılandırılmış ayet listesi (ayet metni prose olarak "Geçen Ayetler"de)
// Bu alanlar opsiyonel bırakıldı; içerik zenginleşince doldurulabilir.

/** Normalize edilmiş bir kavram (etiket). */
export interface Kavram {
  slug: string;
  /** Tam ad (kavram detay sayfası başlığı) — ör. "Ruh (Allah'ın Üflemesi)". */
  ad: string;
  /** Chip / kavram bulutu için kısa etiket — ör. "Ruh". kisa_ad yoksa ad ile aynı. */
  kisaAd: string;
}

/** Bir sohbette geçen ayet referansı (mümkün olduğunca yapılandırılmış). */
export interface AyetRef {
  sure?: string;
  sureNo?: number;
  ayet?: string;
  metin?: string; // kısa meal (varsa)
  not?: string;
}

export interface Bolum {
  baslik: string;
}

/** Arşiv/listeleme için hafif meta (gövde içermez). */
export interface SohbetMeta {
  slug: string;
  dosya: string;
  baslik: string;

  konu: string;
  ozet: string;
  kavramlar: Kavram[];
  kavramSluglari: string[];
  /** Bu sohbette geçen (tahmini) sure numaraları — sure filtresi için. */
  sureNolari: number[];
}

/** Tam sohbet: meta + gövde ve detay alanları. */
export interface Sohbet extends SohbetMeta {
  /** Küratörlü sözlükte eşleşmeyen ham kavram etiketleri. Saklanır ama sitede
   *  gösterilmez (render/filtre/kavram sayfaları yalnızca `kavramlar`'ı kullanır). */
  eslesmeyenKavramlar: string[];
  vurgular: string[];
  ayetlerNotu: string; // "Geçen Ayetler" ham metni
  ayetler: AyetRef[]; // en iyi çaba ile çıkarılmış yapılandırılmış referanslar
  bolumler: Bolum[]; // gövdedeki ## başlıklardan
  govde: string; // markdown gövde (başlık bloğu çıkarılmış)
}
