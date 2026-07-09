import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let quranTrCache: any = null;
let quranArCache: any = null;

function loadQuranData() {
  if (!quranTrCache) {
    const trPath = path.join(process.cwd(), "public", "data", "quran.json");
    quranTrCache = JSON.parse(fs.readFileSync(trPath, "utf-8")).quran;
  }
  if (!quranArCache) {
    const arPath = path.join(process.cwd(), "public", "data", "quran_ar.json");
    quranArCache = JSON.parse(fs.readFileSync(arPath, "utf-8")).quran;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const c = searchParams.get("c");
  const v = searchParams.get("v");

  if (!c || !v) {
    return NextResponse.json({ error: "c (chapter) and v (verse) required" }, { status: 400 });
  }

  const chapter = parseInt(c);
  const verse = parseInt(v);

  try {
    loadQuranData();

    // quran dizisi sırayla gidiyor, find kullanabiliriz veya direkt binary search yapılabilir ama 6236 ayet küçük bir dizi
    const trVerse = quranTrCache.find((q: any) => q.chapter === chapter && q.verse === verse);
    const arVerse = quranArCache.find((q: any) => q.chapter === chapter && q.verse === verse);

    if (!trVerse || !arVerse) {
      return NextResponse.json({ error: "Verse not found" }, { status: 404 });
    }

    return NextResponse.json({
      chapter,
      verse,
      text_tr: trVerse.text,
      text_ar: arVerse.text
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Data could not be loaded" }, { status: 500 });
  }
}
