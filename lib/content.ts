import fs from "node:fs";
import path from "node:path";
import { isoToTr, isoToYil } from "./dates";
import { slugify } from "./slugify";
import type { AyetRef, Bolum, Kavram, Sohbet, SohbetMeta } from "./types";

const SOHBET_DIR = path.join(process.cwd(), "content", "sohbetler");
const KAVRAM_MAP_PATH = path.join(process.cwd(), "content", "kavramlar.json");


// ---------------------------------------------------------------------------
// Başlık bloğu ayrıştırma (**Etiket:** biçimi)
// ---------------------------------------------------------------------------

/** Header bölgesinden tek bir **Etiket:** değerini çeker (sonraki etikete kadar). */
function etiketDegeri(header: string, etiket: string): string {
  // Bir sonraki **...:** etiketine ya da bölge sonuna kadar yakala.
  const re = new RegExp(
    `\\*\\*${etiket}:\\*\\*([\\s\\S]*?)(?=\\n\\*\\*[^\\n]+?:\\*\\*|$)`,
  );
  const m = re.exec(header);
  return m ? m[1].trim() : "";
}

/** "Öne Çıkan Vurgular" bloğundaki "- " maddelerini toplar. */
function vurgulariAyikla(header: string): string[] {
  const blok = etiketDegeri(header, "Öne Çıkan Vurgular");
  return blok
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("- "))
    .map((s) => s.slice(2).trim())
    .filter(Boolean);
}

/**
 * Türkçe-uyumlu etiket normalizasyonu (alias eşleşmesi için).
 * İ->i, I->ı (Türkçe küçültme), ardından standart toLowerCase (ş,ç,ğ,ö,ü),
 * boşluk sadeleştirme ve sondaki nokta temizliği.
 */
function normalizeTrLabel(s: string): string {
  return s
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "");
}

/**
 * Virgülle ayrılmış serbest kavram listesini küratörlü ana kavramlara çözer.
 * Her ham token normalize edilip alias indeksinde aranır. Eşleşenler ana kavrama
 * bağlanır (slug'a göre tekilleştirilir). Eşleşmeyen token'lar ayrıca döndürülür;
 * saklanır ama sitede gösterilmez.
 */
function kavramlariAyikla(header: string): {
  kavramlar: Kavram[];
  eslesmeyen: string[];
} {
  const ham = etiketDegeri(header, "Kavramlar");
  if (!ham) return { kavramlar: [], eslesmeyen: [] };

  const index = aliasIndex();
  const gorunen = new Set<string>(); // slug (sıra korunur)
  const eslesmeyen: string[] = [];

  for (const parca of ham.split(",")) {
    const token = parca.trim();
    if (!token) continue;
    const slug = index[normalizeTrLabel(token)];
    if (slug) {
      gorunen.add(slug); // Set tekilleştirir
    } else {
      eslesmeyen.push(token);
    }
  }

  return {
    kavramlar: [...gorunen].map(kavramNesne),
    eslesmeyen,
  };
}

/** Gövdedeki ## başlıklarını bölüm listesine çevirir (ts kaynakta yok). */
function bolumleriAyikla(govde: string): Bolum[] {
  const bolumler: Bolum[] = [];
  const re = /^##\s+(.+?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(govde)) !== null) {
    bolumler.push({ baslik: m[1].trim() });
  }
  return bolumler;
}

/**
 * "Geçen Ayetler" ham metninden en iyi çaba ile yapılandırılmış referans çıkarır.
 * Örn. "Zümer 39:29", "Yusuf Suresi 12:86". Kaynakta bunlar çoğunlukla editör
 * tahmini olduğundan sonuç kesin değildir; UI'da temkinli sunulmalıdır.
 */
function ayetleriAyikla(notu: string): AyetRef[] {
  const refler: AyetRef[] = [];
  const gorulen = new Set<string>();
  const re =
    /([A-ZÂÎÛÇĞİÖŞÜ][\wÂÎÛçğıöşüâîû'’.-]*(?:\s+[A-Za-zÂÎÛÇĞİÖŞÜçğıöşüâîû'’.-]+){0,2}?)\s*(?:Suresi\s*)?(\d{1,3}):(\d{1,3})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notu)) !== null) {
    const sure = m[1].replace(/\s+Suresi$/i, "").trim();
    const sureNo = Number(m[2]);
    const ayet = m[3];
    const key = `${sureNo}:${ayet}`;
    if (gorulen.has(key)) continue;
    gorulen.add(key);
    refler.push({ sure, sureNo, ayet });
  }
  return refler;
}

// ---------------------------------------------------------------------------
// Kavram görünen-ad eşlemesi (opsiyonel override: content/kavramlar.json)
// ---------------------------------------------------------------------------

interface KavramTanim {
  ad: string;
  kisa_ad?: string;
  aliases: string[];
}

let _kavramTanimlar: Record<string, KavramTanim> | null = null;
function kavramTanimlar(): Record<string, KavramTanim> {
  if (_kavramTanimlar) return _kavramTanimlar;
  try {
    const raw = fs.readFileSync(KAVRAM_MAP_PATH, "utf8");
    _kavramTanimlar = JSON.parse(raw) as Record<string, KavramTanim>;
  } catch {
    _kavramTanimlar = {};
  }
  return _kavramTanimlar;
}

let _kavramAdMap: Record<string, string> | null = null;
/** slug -> görünen ad */
function kavramAdMap(): Record<string, string> {
  if (_kavramAdMap) return _kavramAdMap;
  _kavramAdMap = Object.fromEntries(
    Object.entries(kavramTanimlar()).map(([slug, t]) => [slug, t.ad]),
  );
  return _kavramAdMap;
}

/** slug -> Kavram nesnesi (ad + kisaAd). */
function kavramNesne(slug: string): Kavram {
  const t = kavramTanimlar()[slug];
  const ad = t?.ad ?? slug;
  return { slug, ad, kisaAd: t?.kisa_ad ?? ad };
}

let _aliasIndex: Record<string, string> | null = null;
/** normalize edilmiş alias -> ana kavram slug'ı */
function aliasIndex(): Record<string, string> {
  if (_aliasIndex) return _aliasIndex;
  const idx: Record<string, string> = {};
  for (const [slug, t] of Object.entries(kavramTanimlar())) {
    for (const alias of t.aliases) {
      idx[normalizeTrLabel(alias)] = slug;
    }
  }
  _aliasIndex = idx;
  return _aliasIndex;
}

// ---------------------------------------------------------------------------
// Tek dosya ayrıştırma
// ---------------------------------------------------------------------------

function dosyaAdiCoz(dosya: string): { tarih: string; baslik: string; slug: string } {
  const ad = dosya.replace(/\.md$/i, "");
  const m = /^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/.exec(ad);
  if (m) {
    const baslik = m[2].trim();
    return { tarih: m[1], baslik, slug: slugify(baslik) };
  }
  // Dosya adı beklenen biçimde değilse geri düş.
  return { tarih: "", baslik: ad, slug: slugify(ad) };
}

function ayristir(dosya: string): Sohbet {
  const tamYol = path.join(SOHBET_DIR, dosya);
  const icerik = fs.readFileSync(tamYol, "utf8");
  const { tarih, baslik, slug } = dosyaAdiCoz(dosya);

  // Gövde: ilk "## " başlığından itibaren. Öncesi başlık bloğudur.
  const bolumIndex = icerik.search(/^##\s+/m);
  const header = bolumIndex === -1 ? icerik : icerik.slice(0, bolumIndex);
  const govde = bolumIndex === -1 ? "" : icerik.slice(bolumIndex).trim();

  const { kavramlar, eslesmeyen: eslesmeyenKavramlar } =
    kavramlariAyikla(header);
  const ayetler = ayetleriAyikla(etiketDegeri(header, "Geçen Ayetler"));

  const bolumler = bolumleriAyikla(govde);

  return {
    slug,
    dosya,
    baslik,
    tarih,
    tarihTr: tarih ? isoToTr(tarih) : "",
    yil: tarih ? isoToYil(tarih) : 0,
    konu: etiketDegeri(header, "Konu"),
    ozet: etiketDegeri(header, "Kısa Özet"),
    kavramlar,
    kavramSluglari: kavramlar.map((k) => k.slug),
    sureNolari: [
      ...new Set(
        ayetler
          .map((a) => a.sureNo)
          .filter((n): n is number => n != null),
      ),
    ],
    eslesmeyenKavramlar,
    vurgular: vurgulariAyikla(header),
    ayetlerNotu: etiketDegeri(header, "Geçen Ayetler"),
    ayetler,
    bolumler,
    govde,
  };
}

// ---------------------------------------------------------------------------
// Genel erişim (build sırasında çağrılır; basit bellek-içi cache)
// ---------------------------------------------------------------------------

let _hepsi: Sohbet[] | null = null;

/** Tüm sohbetler, tarihe göre yeniden eskiye sıralı. */
export function getTumSohbetler(): Sohbet[] {
  if (_hepsi) return _hepsi;
  const dosyalar = fs
    .readdirSync(SOHBET_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md"));
  _hepsi = dosyalar
    .map(ayristir)
    .sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0));
  return _hepsi;
}

/** Listeleme için hafif meta (gövde içermez). */
export function getSohbetMetalar(): SohbetMeta[] {
  return getTumSohbetler().map(
    ({ vurgular, ayetler, ayetlerNotu, bolumler, govde, eslesmeyenKavramlar, ...meta }) => meta,
  );
}

export function getSohbet(slug: string): Sohbet | undefined {
  return getTumSohbetler().find((s) => s.slug === slug);
}

export function getSohbetSluglari(): string[] {
  return getTumSohbetler().map((s) => s.slug);
}

/** Tüm kavramlar, sohbet adediyle, çoktan aza sıralı. */
export function getKavramlar(): Array<Kavram & { adet: number }> {
  const say = new Map<string, number>();
  for (const s of getTumSohbetler()) {
    for (const k of s.kavramlar) {
      say.set(k.slug, (say.get(k.slug) ?? 0) + 1);
    }
  }
  return [...say]
    .map(([slug, adet]) => ({ ...kavramNesne(slug), adet }))
    .sort((a, b) => b.adet - a.adet || a.ad.localeCompare(b.ad, "tr"));
}

/** Tek kavram sayfası verisi: birlikte geçme sıklığına göre ilgili kavramlar + sohbetler. */
export function getKavram(slug: string):
  | (Kavram & {
      adet: number;
      ilgili: Array<Kavram & { adet: number }>;
      sohbetler: SohbetMeta[];
    })
  | undefined {
  const sohbetler = getTumSohbetler().filter((s) =>
    s.kavramSluglari.includes(slug),
  );
  if (sohbetler.length === 0) return undefined;

  // Birlikte geçme sayımı
  const birlikte = new Map<string, number>();
  for (const s of sohbetler) {
    for (const k of s.kavramlar) {
      if (k.slug === slug) continue;
      birlikte.set(k.slug, (birlikte.get(k.slug) ?? 0) + 1);
    }
  }
  const ilgili = [...birlikte]
    .map(([s, adet]) => ({ ...kavramNesne(s), adet }))
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 5);

  const metalar: SohbetMeta[] = sohbetler.map(
    ({ vurgular, ayetler, ayetlerNotu, bolumler, govde, eslesmeyenKavramlar, ...meta }) => meta,
  );

  return { ...kavramNesne(slug), adet: sohbetler.length, ilgili, sohbetler: metalar };
}

/** Ortak kavram sayısına göre en yakın N benzer sohbet. */
export function getBenzerSohbetler(slug: string, n = 3): SohbetMeta[] {
  const hedef = getSohbet(slug);
  if (!hedef) return [];
  const hedefSet = new Set(hedef.kavramSluglari);
  return getTumSohbetler()
    .filter((s) => s.slug !== slug)
    .map((s) => ({
      s,
      ortak: s.kavramSluglari.filter((k) => hedefSet.has(k)).length,
    }))
    .filter((x) => x.ortak > 0)
    .sort((a, b) => b.ortak - a.ortak || (a.s.tarih < b.s.tarih ? 1 : -1))
    .slice(0, n)
    .map(({ s }) => {
      const { vurgular, ayetler, ayetlerNotu, bolumler, govde, eslesmeyenKavramlar, ...meta } = s;
      return meta;
    });
}

/** Yıl facet'i: yıl + sohbet adedi, yeniden eskiye. */
export function getYilFacet(): Array<{ yil: number; adet: number }> {
  const say = new Map<number, number>();
  for (const s of getTumSohbetler()) {
    if (s.yil) say.set(s.yil, (say.get(s.yil) ?? 0) + 1);
  }
  return [...say]
    .map(([yil, adet]) => ({ yil, adet }))
    .sort((a, b) => b.yil - a.yil);
}

/** Sure facet'i: sure + sohbet adedi, Kur'an sırasına göre (tahmini ayet verisi). */
export function getSureFacet(): Array<{
  sureNo: number;
  sure: string;
  adet: number;
}> {
  const bilgi = new Map<number, { sure: string; sohbetler: Set<string> }>();
  for (const s of getTumSohbetler()) {
    for (const ref of s.ayetler) {
      if (ref.sureNo == null) continue;
      let b = bilgi.get(ref.sureNo);
      if (!b) {
        b = { sure: ref.sure ?? String(ref.sureNo), sohbetler: new Set() };
        bilgi.set(ref.sureNo, b);
      }
      b.sohbetler.add(s.slug);
    }
  }
  return [...bilgi]
    .map(([sureNo, b]) => ({ sureNo, sure: b.sure, adet: b.sohbetler.size }))
    .sort((a, b) => a.sureNo - b.sureNo);
}

/** Ayet indeksi: sure numarasına göre gruplanmış (Kur'an sırası). */
export function getAyetIndeksi(): Array<{
  sure: string;
  sureNo: number;
  ayetler: Array<AyetRef & { sohbetler: Array<{ slug: string; baslik: string }> }>;
  sohbetSayisi: number;
}> {
  // sureNo -> { ad, ayet(key) -> ref + sohbetler }
  const gruplar = new Map<
    number,
    {
      sure: string;
      ayetler: Map<string, AyetRef & { sohbetler: Array<{ slug: string; baslik: string }> }>;
      sohbetler: Set<string>;
    }
  >();

  for (const s of getTumSohbetler()) {
    for (const ref of s.ayetler) {
      if (ref.sureNo == null) continue;
      let grup = gruplar.get(ref.sureNo);
      if (!grup) {
        grup = { sure: ref.sure ?? String(ref.sureNo), ayetler: new Map(), sohbetler: new Set() };
        gruplar.set(ref.sureNo, grup);
      }
      grup.sohbetler.add(s.slug);
      const key = `${ref.sureNo}:${ref.ayet}`;
      let ayet = grup.ayetler.get(key);
      if (!ayet) {
        ayet = { ...ref, sohbetler: [] };
        grup.ayetler.set(key, ayet);
      }
      ayet.sohbetler.push({ slug: s.slug, baslik: s.baslik });
    }
  }

  return [...gruplar]
    .sort((a, b) => a[0] - b[0])
    .map(([sureNo, grup]) => ({
      sure: grup.sure,
      sureNo,
      ayetler: [...grup.ayetler.values()].sort((a, b) =>
        Number(a.ayet) - Number(b.ayet),
      ),
      sohbetSayisi: grup.sohbetler.size,
    }));
}
