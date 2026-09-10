import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Şifre değiştirme
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  try {
    const { mevcutSifre, yeniSifre } = await req.json();

    if (!mevcutSifre || !yeniSifre) {
      return NextResponse.json(
        { error: "Mevcut şifre ve yeni şifre gereklidir." },
        { status: 400 }
      );
    }

    if (yeniSifre.length < 6) {
      return NextResponse.json(
        { error: "Yeni şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    // Mevcut şifreyi doğrula
    const isValid = await bcrypt.compare(mevcutSifre, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mevcut şifre yanlış." },
        { status: 403 }
      );
    }

    // Yeni şifreyi hashle ve kaydet
    const hashedPassword = await bcrypt.hash(yeniSifre, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Şifre başarıyla değiştirildi." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
