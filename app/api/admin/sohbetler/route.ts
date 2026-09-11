import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clearContentCache } from "@/lib/content";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    const sohbetler = await prisma.sohbetRecord.findMany({
      select: {
        id: true,
        slug: true,
        dosyaAdi: true,
        baslik: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sohbetler);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Tüm sohbetleri sil
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    const result = await prisma.sohbetRecord.deleteMany({});
    
    clearContentCache();
    try {
      revalidatePath("/sohbetler");
      revalidatePath("/ayetler");
      revalidatePath("/kavramlar");
      revalidatePath("/");
    } catch (e) {
      console.error("Revalidate hatası:", e);
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} sohbet silindi.`,
      count: result.count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
