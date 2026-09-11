const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latest = await prisma.sohbetRecord.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (latest) {
    console.log("Bulunan son kayit:", latest.baslik);
    console.log("Ozet ilk 100 karakter:", latest.ozet.substring(0, 100));
    
    // Find "b???r" before "arkadaşın"
    const match = latest.ozet.match(/b(.+?)r arkadaşın/);
    if (match) {
        const garbled = match[1];
        console.log("Bulunan garbled dizisi:", garbled);
        console.log("Karakter kodlari:");
        for(let i=0; i<garbled.length; i++) {
            console.log(garbled.charCodeAt(i).toString(16));
        }
    } else {
        const str = latest.ozet;
        for(let i=0; i<str.length && i<100; i++) {
            console.log(str[i] + ": " + str.charCodeAt(i).toString(16));
        }
    }
  } else {
    console.log("Kayit bulunamadi.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
