/**
 * İçerik katmanı doğrulama + kavramlar.json üretimi.
 * Çalıştır: npm run content:check
 *
 * - Tüm sohbetleri ayrıştırır, özet bir rapor basar.
 * - Eksik/şüpheli alanları uyarır (audio, süre, ayet vb. kaynakta yok).
 * - content/kavramlar.json yoksa, bulunan kavramlardan bir tohum üretir.
 */
import {
  getAyetIndeksi,
  getKavramlar,
  getTumSohbetler,
} from "../lib/content";

function main() {
  const sohbetler = getTumSohbetler();
  console.log(`\n📚 ${sohbetler.length} sohbet ayrıştırıldı\n`);

  for (const s of sohbetler) {
    const uyari: string[] = [];
    if (!s.baslik) uyari.push("başlık yok");
    if (!s.tarih) uyari.push("tarih yok");
    if (!s.konu) uyari.push("konu yok");
    if (!s.ozet) uyari.push("özet yok");
    if (s.kavramlar.length === 0) uyari.push("kavram yok");
    if (s.vurgular.length === 0) uyari.push("vurgu yok");
    if (s.bolumler.length === 0) uyari.push("bölüm yok");

    console.log(`• ${s.tarihTr.padEnd(18)} ${s.baslik}`);
    console.log(`    slug: ${s.slug}`);
    console.log(
      `    kavram(eşleşen): ${s.kavramlar.length} · eşleşmeyen: ${s.eslesmeyenKavramlar.length} · vurgu: ${s.vurgular.length} · bölüm: ${s.bolumler.length} · ayet: ${s.ayetler.length}`,
    );
    if (uyari.length) console.log(`    ⚠️  ${uyari.join(", ")}`);
  }

  const kavramlar = getKavramlar();
  console.log(`\n🏷️  ${kavramlar.length} ana kavram (küratörlü):`);
  for (const k of kavramlar) {
    console.log(`    ${k.ad} (${k.adet})  [${k.slug}]`);
  }

  const ayetIndeksi = getAyetIndeksi();
  console.log(
    `\n📖 Ayet indeksi: ${ayetIndeksi.length} sure, ${ayetIndeksi.reduce(
      (a, g) => a + g.ayetler.length,
      0,
    )} ayet referansı (en iyi çaba, editör tahminleri dahil)`,
  );

  // Eşleşmeyen ham kavramlar (küratörlük denetimi için)
  const eslesmeyen = new Map<string, number>();
  for (const s of sohbetler) {
    for (const e of s.eslesmeyenKavramlar) {
      eslesmeyen.set(e, (eslesmeyen.get(e) ?? 0) + 1);
    }
  }
  console.log(
    `\n🚫 ${eslesmeyen.size} benzersiz eşleşmeyen ham kavram (sitede gösterilmez):`,
  );
  for (const [e, n] of [...eslesmeyen].sort((a, b) => b[1] - a[1])) {
    console.log(`    (${n}) ${e}`);
  }
  console.log();
}

main();
