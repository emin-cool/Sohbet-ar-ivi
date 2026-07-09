// Türkçe-uyumlu slugify.
//
// JS'in toLowerCase()'i "İ" -> "i̇" (birleşik noktalı) gibi hatalar üretebildiği
// için Türkçe harfleri lower-case'ten ÖNCE açıkça eşliyoruz.

const TR_MAP: Record<string, string> = {
  "ç": "c", "Ç": "c",
  "ğ": "g", "Ğ": "g",
  "ı": "i", "I": "i", "İ": "i", "i": "i",
  "ö": "o", "Ö": "o",
  "ş": "s", "Ş": "s",
  "ü": "u", "Ü": "u",
};

export function slugify(input: string): string {
  const mapped = input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");

  return mapped
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // kalan aksanları at
    .replace(/['’"]/g, "") // kesme/tırnak
    .replace(/[^a-z0-9]+/g, "-") // harf/rakam dışını tire yap
    .replace(/^-+|-+$/g, "") // baş/son tireleri kırp
    .replace(/-{2,}/g, "-"); // ardışık tireleri tekle
}
