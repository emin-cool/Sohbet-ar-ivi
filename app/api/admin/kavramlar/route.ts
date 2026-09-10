import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Admin kontrolü */
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

/** Tüm kavramları getir */
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    const kavramlar = await prisma.kavramRecord.findMany({
      orderBy: { ad: "asc" },
    });

    // Eski JSON formatına dönüştür (uyumluluk için)
    const result: Record<
      string,
      { ad: string; kisa_ad?: string; aliases: string[] }
    > = {};
    for (const k of kavramlar) {
      result[k.slug] = {
        ad: k.ad,
        kisa_ad: k.kisaAd || undefined,
        aliases: JSON.parse(k.aliases),
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Kavramları toplu güncelle (JSON formatında) */
export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    const data = await req.json();

    if (typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        { error: "Geçersiz format. Beklenen: JSON nesnesi." },
        { status: 400 }
      );
    }

    // Mevcut kavramları sil ve yeniden oluştur (atomic update)
    await prisma.$transaction(async (tx: any) => {
      await tx.kavramRecord.deleteMany({});

      const records = Object.entries(data).map(
        ([slug, val]: [string, any]) => ({
          slug,
          ad: val.ad || slug,
          kisaAd: val.kisa_ad || null,
          aliases: JSON.stringify(val.aliases || []),
        })
      );

      for (const record of records) {
        await tx.kavramRecord.create({ data: record });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Kavramlar başarıyla güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Tek kavram ekleme */
export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    const { slug, ad, kisaAd, aliases } = await req.json();

    if (!slug || !ad) {
      return NextResponse.json(
        { error: "slug ve ad alanları zorunludur." },
        { status: 400 }
      );
    }

    const mevcut = await prisma.kavramRecord.findUnique({ where: { slug } });
    if (mevcut) {
      return NextResponse.json(
        { error: `"${slug}" kavramı zaten mevcut.` },
        { status: 409 }
      );
    }

    await prisma.kavramRecord.create({
      data: {
        slug,
        ad,
        kisaAd: kisaAd || null,
        aliases: JSON.stringify(aliases || []),
      },
    });

    return NextResponse.json({
      success: true,
      message: `"${ad}" kavramı eklendi.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
