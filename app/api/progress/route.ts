import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const { slug, progress, sectionId, sectionTitle } = await req.json();

    if (!slug || typeof progress !== "number") {
      return NextResponse.json({ error: "Geçersiz veriler." }, { status: 400 });
    }

    const userId = session.user.id;

    // Upsert (varsa güncelle, yoksa oluştur)
    const readProgress = await prisma.readProgress.upsert({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
      update: {
        progress,
        ...(sectionId !== undefined && { sectionId }),
        ...(sectionTitle !== undefined && { sectionTitle }),
      },
      create: {
        userId,
        slug,
        progress,
        sectionId,
        sectionTitle,
      },
    });

    return NextResponse.json(readProgress);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
