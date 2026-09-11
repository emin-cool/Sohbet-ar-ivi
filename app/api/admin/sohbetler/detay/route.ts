import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { isoToTr, isoToYil } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { ayetleriAyikla, clearContentCache } from "@/lib/content";

/** Admin kontrolü */
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

/** Tek sohbet okuma (ham markdown) */
export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { error: "slug parametresi gerekli" },
      { status: 400 }
    );
  }

  try {
    const sohbet = await prisma.sohbetRecord.findUnique({
      where: { slug },
    });

    if (!sohbet) {
      return NextResponse.json(
        { error: "Sohbet bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug: sohbet.slug,
      baslik: sohbet.baslik,
      content: sohbet.rawContent,
      ayetlerNotu: sohbet.ayetlerNotu || "",
      ayetlerJson: sohbet.ayetlerJson || "[]",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Sohbet güncelleme (ham markdown düzenleme) */
export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { error: "slug parametresi gerekli" },
      { status: 400 }
    );
  }

  try {
    const { content, baslik, ayetlerNotu } = await req.json();

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Geçersiz içerik formatı" },
        { status: 400 }
      );
    }

    // Markdown'dan meta verileri yeniden çıkar
    const bolumIndex = content.search(/^##\s+/m);
    const header = bolumIndex === -1 ? content : content.slice(0, bolumIndex);
    const govde = bolumIndex === -1 ? "" : content.slice(bolumIndex).trim();

    // Etiket değerlerini çıkar
    function etiketDegeri(h: string, etiket: string): string {
      const re = new RegExp(
        `\\*\\*${etiket}:\\*\\*([\\s\\S]*?)(?=\\n\\*\\*[^\\n]+?:\\*\\*|$)`
      );
      const m = re.exec(h);
      return m ? m[1].trim() : "";
    }

    function vurgulariAyikla(h: string): string[] {
      const blok = etiketDegeri(h, "Öne Çıkan Vurgular");
      return blok
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.startsWith("- "))
        .map((s) => s.slice(2).trim())
        .filter(Boolean);
    }

    // Bölümleri çıkar
    const bolumler: Array<{ baslik: string }> = [];
    const reBaslik = /^##\s+(.+?)\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = reBaslik.exec(govde)) !== null) {
      bolumler.push({ baslik: m[1].trim() });
    }

    const existing = await prisma.sohbetRecord.findUnique({
      where: { slug },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Güncellenecek sohbet bulunamadı" },
        { status: 404 }
      );
    }

    const guncellenenBaslik = baslik?.trim() || existing.baslik || etiketDegeri(header, "Konu") || slug;
    const finalAyetlerNotu = ayetlerNotu !== undefined ? ayetlerNotu : etiketDegeri(header, "Geçen Ayetler");
    
    const ayetlerJsonStr = JSON.stringify(ayetleriAyikla(finalAyetlerNotu));

    const updateData: any = {
      rawContent: content,
      govde,
      baslik: guncellenenBaslik,
      dosyaAdi: `${guncellenenBaslik}.md`,
      konu: etiketDegeri(header, "Konu"),
      ozet: etiketDegeri(header, "Kısa Özet"),
      kavramlarRaw: etiketDegeri(header, "Kavramlar"),
      vurgularJson: JSON.stringify(vurgulariAyikla(header)),
      ayetlerNotu: finalAyetlerNotu,
      ayetlerJson: ayetlerJsonStr,
      bolumlerJson: JSON.stringify(bolumler),
      updatedAt: new Date(),
    };

    await prisma.sohbetRecord.update({
      where: { slug },
      data: updateData,
    });

    // Önbellekleri temizle ve statik sayfaları yeniden oluştur
    clearContentCache();
    try {
      revalidatePath(`/sohbet/${slug}`);
      revalidatePath("/sohbetler");
      revalidatePath("/kavramlar");
      revalidatePath("/ayetler");
      revalidatePath("/");
    } catch (e) {
      console.error("Revalidate hatası:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Sohbet başarıyla güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Sohbet silme */
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { error: "slug parametresi gerekli" },
      { status: 400 }
    );
  }

  try {
    const sohbet = await prisma.sohbetRecord.findUnique({
      where: { slug },
    });

    if (!sohbet) {
      return NextResponse.json(
        { error: "Sohbet bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.sohbetRecord.delete({ where: { slug } });

    // Önbellekleri temizle
    clearContentCache();
    try {
      revalidatePath(`/sohbet/${slug}`);
      revalidatePath("/sohbetler");
      revalidatePath("/kavramlar");
      revalidatePath("/ayetler");
      revalidatePath("/");
    } catch (e) {
      console.error("Revalidate hatası:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Sohbet başarıyla silindi.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
