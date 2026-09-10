import prisma from "./lib/prisma";
import { ayetleriAyikla } from "./lib/content";

async function main() {
  const sohbetler = await prisma.sohbetRecord.findMany();
  let updatedCount = 0;
  for (const s of sohbetler) {
      const parsedAyetlerJson = JSON.parse(s.ayetlerJson || "[]");
      if (parsedAyetlerJson.length === 0 && s.ayetlerNotu) {
          const ayets = ayetleriAyikla(s.ayetlerNotu);
          if (ayets.length > 0) {
              await prisma.sohbetRecord.update({
                  where: { id: s.id },
                  data: { ayetlerJson: JSON.stringify(ayets) }
              });
              updatedCount++;
          }
      }
  }
  console.log(`Veritabanında ${updatedCount} sohbetin ayetlerJson alanı güncellendi.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
