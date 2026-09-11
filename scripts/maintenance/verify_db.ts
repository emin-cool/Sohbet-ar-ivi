import prisma from "./lib/prisma";

async function main() {
  const latest = await prisma.sohbetRecord.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (latest) {
    console.log("Bulunan son kayit:", latest.baslik);
    console.log("Ozet ilk 100 karakter:", latest.ozet.substring(0, 100));
  } else {
    console.log("Kayit bulunamadi.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
