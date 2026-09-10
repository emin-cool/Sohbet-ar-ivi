import prisma from "./lib/prisma";
import { ayetleriAyikla } from "./lib/content";

async function main() {
  const sohbetler = await prisma.sohbetRecord.findMany();
  let totalAyets = 0;
  for (const s of sohbetler) {
      const ayets = ayetleriAyikla(s.ayetlerNotu);
      if (ayets.length > 0) {
          console.log(`[${s.baslik}] => ${ayets.length} ayet buludu.`);
          totalAyets += ayets.length;
      }
  }
  console.log("Total extracted ayets: ", totalAyets);
}
main().catch(console.error).finally(() => prisma.$disconnect());
