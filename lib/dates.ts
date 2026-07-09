// Türkçe tarih yardımcıları.
//
// Kaynak dosyalardaki "**Tarih:**" alanı tutarsız ("7 Temmuz 2025" veya
// "2025-01-13" olabilir). En güvenilir kaynak dosya adı önekidir (YYYY-MM-DD),
// bu yüzden ISO tarihi oradan alıyoruz; bu yardımcılar biçimlendirme içindir.

const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/** "2025-07-07" -> "7 Temmuz 2025" */
export function isoToTr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const ay = AYLAR[Number(mo) - 1] ?? mo;
  return `${Number(d)} ${ay} ${y}`;
}

/** "2025-07-07" -> 2025 */
export function isoToYil(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Dakikayı "52 dk" biçimine getirir. */
export function dakikaEtiket(dk?: number): string | undefined {
  if (dk == null) return undefined;
  return `${dk} dk`;
}

/** Saniyeyi "mm:ss" biçimine getirir (ör. 1420 -> "23:40"). */
export function saniyeMMSS(saniye: number): string {
  const sn = Math.max(0, Math.floor(saniye));
  const dk = Math.floor(sn / 60);
  const kalan = sn % 60;
  return `${dk}:${String(kalan).padStart(2, "0")}`;
}

/** Dakikayı toplam süre gösterimi "mm:ss" olarak verir (ör. 52 -> "52:00"). */
export function dakikaMMSS(dk: number): string {
  return saniyeMMSS(dk * 60);
}
