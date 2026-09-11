import prisma from "./lib/prisma";

async function main() {
  const sohbetler = await prisma.sohbetRecord.findMany({
    select: { id: true, baslik: true }
  });
  
  let updatedCount = 0;
  
  for (const s of sohbetler) {
    let cleanBaslik = s.baslik;
    
    // Baştaki tarih formatlarını temizle: "2024 04 22 ", "[2025 06 23] ", "2025 09 1 " vs.
    cleanBaslik = cleanBaslik.replace(/^\[?\d{4}[ \-_\.]\d{1,2}[ \-_\.]\d{1,2}\]?\s*/, '');
    
    // Sondaki " · MD", " ·", "· MD" vs. temizle
    cleanBaslik = cleanBaslik.replace(/\s*·\s*(?:MD|md)?\s*$/i, '');
    
    // Trim
    cleanBaslik = cleanBaslik.trim();
    
    // Sadece ilk harfi büyük yapmak (opsiyonel) - "özdeşleşme, beklenti..." -> "Özdeşleşme, beklenti..."
    if (cleanBaslik.length > 0) {
        cleanBaslik = cleanBaslik.charAt(0).toLocaleUpperCase('tr-TR') + cleanBaslik.slice(1);
    }
    
    if (cleanBaslik !== s.baslik) {
      console.log(`Eski: "${s.baslik}"\nYeni: "${cleanBaslik}"\n`);
      await prisma.sohbetRecord.update({
        where: { id: s.id },
        data: { baslik: cleanBaslik }
      });
      updatedCount++;
    }
  }
  
  console.log(`\nToplam ${updatedCount} başlık güncellendi.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
