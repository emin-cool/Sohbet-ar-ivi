import prisma from "./lib/prisma";

async function main() {
  const sohbetler = await prisma.sohbetRecord.findMany({
    select: { id: true, baslik: true }
  });
  console.log("Mevcut Başlıklar:");
  for (const s of sohbetler) {
    console.log(`- [${s.id}] ${s.baslik}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
