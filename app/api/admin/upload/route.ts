import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertToMarkdown, parseMetaBlock, detectFormat } from "@/lib/converter";
import { slugify } from "@/lib/slugify";
import { isoToTr, isoToYil } from "@/lib/dates";

export const maxDuration = 300; // 5 dakika (upload uzun sürebilir)

export async function POST(req: NextRequest) {
  // Admin yetkisi kontrolü
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Bu işlem için admin yetkisi gereklidir." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("dosya") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }


    const sonuclar: Array<{
      dosya: string;
      basarili: boolean;
      slug?: string;
      hata?: string;
      uyarilar?: string[];
    }> = [];

    for (const file of files) {
      const format = detectFormat(file.name);
      if (!format) {
        sonuclar.push({
          dosya: file.name,
          basarili: false,
          hata: `Desteklenmeyen dosya formatı. Kabul edilen: PDF, DOCX, DOC, TXT, MD`,
        });
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await convertToMarkdown(buffer, format, file.name);

        // Dosya adından başlık çıkar
        const dosyaAdi = file.name.replace(/\.[^.]+$/, "");
        const tarihMatch = /^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/.exec(dosyaAdi);

        const baslik =
          tarihMatch?.[2]?.trim() || result.meta.baslik || dosyaAdi;
        const slug = slugify(baslik);

        // Slug çakışması kontrolü
        const mevcut = await prisma.sohbetRecord.findUnique({
          where: { slug },
        });
        if (mevcut) {
          sonuclar.push({
            dosya: file.name,
            basarili: false,
            hata: `"${baslik}" (slug: ${slug}) zaten mevcut. Farklı bir başlık kullanın veya mevcut sohbeti silin.`,
          });
          continue;
        }

        // Vurgular, ayetler, bölümler JSON olarak saklanacak
        const vurgular = result.meta.vurgular || [];
        // Ayet bilgilerini rawContent'ten çıkar
        const ayetlerNotu = result.meta.ayetlerNotu || "";
        
        // Bölüm başlıklarını çıkar
        const bolumler = result.sections.map((s) => ({ baslik: s }));

        // Markdown gövde: ## ile başlayan kısım
        const bolumIndex = result.markdown.search(/^##\s+/m);
        const govde =
          bolumIndex === -1 ? result.markdown : result.markdown.slice(bolumIndex).trim();
          
        const { ayetleriAyikla } = require("@/lib/content");
        const ayetler = ayetleriAyikla(ayetlerNotu);

        // DB'ye kaydet
        await prisma.sohbetRecord.create({
          data: {
            slug,
            dosyaAdi: `${baslik}.md`,
            baslik,
            konu: result.meta.konu || "",
            ozet: result.meta.ozet || "",
            kavramlarRaw: result.meta.kavramlarRaw || "",
            vurgularJson: JSON.stringify(vurgular),
            ayetlerNotu,
            ayetlerJson: JSON.stringify(ayetler),
            bolumlerJson: JSON.stringify(bolumler),
            govde,
            rawContent: result.markdown,
          },
        });

        sonuclar.push({
          dosya: file.name,
          basarili: true,
          slug,
          uyarilar: result.warnings,
        });
      } catch (err: any) {
        console.error("Dosya işlenirken hata:", file.name, err);
        sonuclar.push({
          dosya: file.name,
          basarili: false,
          hata: err.message || "Dönüştürme hatası.",
        });
      }
    }

    const basarili = sonuclar.filter((s) => s.basarili).length;
    const hatali = sonuclar.filter((s) => !s.basarili).length;

    return NextResponse.json({
      success: hatali === 0,
      message: `${basarili} dosya başarıyla yüklendi${hatali > 0 ? `, ${hatali} dosyada hata oluştu` : ""}.`,
      sonuclar,
    });
  } catch (error: any) {
    console.error("Upload Hatası:", error);
    return NextResponse.json(
      { error: error.message || "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
