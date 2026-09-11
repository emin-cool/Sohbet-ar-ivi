import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { convertToMarkdown, detectFormat } from "@/lib/converter";
import AdmZip from "adm-zip";
import { revalidatePath } from "next/cache";
import { ayetleriAyikla, clearContentCache } from "@/lib/content";

export const maxDuration = 300; // Vercel için 5 dk izin

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir .zip dosyası yükleyin" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    const sonuclar: any[] = [];
    let basariliCount = 0;
    let basarisizCount = 0;

    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory) continue;

      const dosyaAdi = zipEntry.entryName.split('/').pop() || zipEntry.entryName;
      
      // Mac OS X gizli klasörlerini atla
      if (dosyaAdi.startsWith('.') || zipEntry.entryName.includes('__MACOSX')) continue;

      const format = detectFormat(dosyaAdi);
      if (!format) {
        // Desteklenmeyen formattaki dosyaları sadece atlıyoruz, hata basmaya gerek yok
        continue;
      }

      try {
        const fileBuffer = zipEntry.getData();
        const conversion = await convertToMarkdown(fileBuffer, format, dosyaAdi);

        // Zorunlu alanları al, meta'da boşsa varsayılan ata
        let baslik = conversion.meta.baslik || dosyaAdi.replace(/\.[^/.]+$/, "");
        
        // Aynı başlıktan/slug'dan var mı diye unique yapmaya gerek kalmayabilir, ancak slug generate edelim.
        let slug = baslik
          .toLowerCase()
          .replace(/ğ/g, "g")
          .replace(/ü/g, "u")
          .replace(/ş/g, "s")
          .replace(/ı/g, "i")
          .replace(/ö/g, "o")
          .replace(/ç/g, "c")
          .replace(/[^a-z0-9 -]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
        
        if (!slug) slug = `sohbet-${Date.now()}`;

        const ayetlerNotu = conversion.meta.ayetlerNotu || "";
        const ayetler = ayetleriAyikla(ayetlerNotu);
        const bolumler = (conversion.sections || []).map((s: string) => ({ baslik: s }));

        // DB'ye kaydet
        await prisma.sohbetRecord.create({
          data: {
            slug,
            dosyaAdi: `${baslik}.md`,
            baslik,
            konu: conversion.meta.konu || "Genel",
            ozet: conversion.meta.ozet || "",
            kavramlarRaw: conversion.meta.kavramlarRaw || "",
            vurgularJson: JSON.stringify(conversion.meta.vurgular || []),
            ayetlerNotu,
            ayetlerJson: JSON.stringify(ayetler),
            bolumlerJson: JSON.stringify(bolumler),
            govde: conversion.markdown,
            rawContent: conversion.markdown,
          },
        });

        basariliCount++;
        sonuclar.push({
          dosyaAdi,
          durum: "basarili",
          baslik,
        });
      } catch (err: any) {
        basarisizCount++;
        sonuclar.push({
          dosyaAdi,
          durum: "hata",
          hata: err.message || "Bilinmeyen Hata",
        });
      }
    }

    if (basariliCount > 0) {
      clearContentCache();
      try {
        revalidatePath("/sohbetler");
        revalidatePath("/ayetler");
        revalidatePath("/kavramlar");
        revalidatePath("/");
      } catch (e) {
        console.error("Revalidate hatası:", e);
      }
    }

    return NextResponse.json({
      mesaj: `ZIP işleme tamamlandı. ${basariliCount} başarılı, ${basarisizCount} hatalı.`,
      basariliCount,
      basarisizCount,
      sonuclar,
    });
  } catch (error: any) {
    console.error("ZIP Yükleme Hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası: " + (error.message || "Bilinmeyen") },
      { status: 500 }
    );
  }
}
