export function isoToTr(iso: string): string {
  if (!iso || iso.length !== 10) return iso;
  const aylar = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const parcalar = iso.split("-");
  const yil = parcalar[0];
  const ay = aylar[parseInt(parcalar[1], 10) - 1];
  const gun = parseInt(parcalar[2], 10).toString();
  return `${gun} ${ay} ${yil}`;
}

export function isoToYil(iso: string): number {
  if (!iso || iso.length < 4) return new Date().getFullYear();
  return parseInt(iso.substring(0, 4), 10);
}
