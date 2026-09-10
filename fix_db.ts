import prisma from "./lib/prisma";

async function main() {
  const records = await prisma.sohbetRecord.findMany();
  let updatedCount = 0;

  for (const record of records) {
    let hasGarbled = false;
    const fixText = (text: string) => {
        if (text && text.includes("\u0D88")) {
            hasGarbled = true;
            return text.replace(/\u0D88/g, 'i');
        }
        return text;
    };

    const newBaslik = fixText(record.baslik);
    const newOzet = fixText(record.ozet);
    const newKonu = fixText(record.konu);
    const newKavramlar = fixText(record.kavramlarRaw);
    const newVurgular = fixText(record.vurgularJson);
    const newAyetler = fixText(record.ayetlerNotu);
    const newGovde = fixText(record.govde);

    if (hasGarbled) {
      await prisma.sohbetRecord.update({
        where: { id: record.id },
        data: {
          baslik: newBaslik,
          ozet: newOzet,
          konu: newKonu,
          kavramlarRaw: newKavramlar,
          vurgularJson: newVurgular,
          ayetlerNotu: newAyetler,
          govde: newGovde
        }
      });
      updatedCount++;
    }
  }
  console.log(`Tamamlandi. ${updatedCount} adet kayit duzeltildi.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
