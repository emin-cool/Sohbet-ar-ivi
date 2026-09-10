import prisma from "./lib/prisma";

async function main() {
  const latest = await prisma.sohbetRecord.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  if (latest) {
    const text = latest.ozet + latest.vurgularJson;
    console.log("Checking for non-ASCII or strange characters in the text...");
    
    // Find any sequence of strange characters (excluding normal Turkish chars)
    const strangeChars = text.match(/[^\x20-\x7EçğıöşüÇĞİÖŞÜ\n\r\t]/g);
    
    if (strangeChars) {
      const uniqueStrange = [...new Set(strangeChars)];
      console.log("Strange characters found:", uniqueStrange);
      for (const char of (uniqueStrange as string[])) {
        console.log(`Char: ${char} - Hex: ${char.charCodeAt(0).toString(16)}`);
        if (char.length > 1) { // checking surrogate pairs
            console.log(`  Surrogate 1: ${char.charCodeAt(0).toString(16)}, Surrogate 2: ${char.charCodeAt(1).toString(16)}`);
        }
      }
    } else {
      console.log("No strange characters found.");
    }
  } else {
    console.log("Kayit bulunamadi.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
