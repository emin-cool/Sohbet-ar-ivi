import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SOHBET_DIR = path.join(process.cwd(), "content", "sohbetler");

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  const { filename } = params;
  if (!filename.endsWith(".md")) {
    return NextResponse.json({ error: "Sadece .md dosyaları okunabilir" }, { status: 400 });
  }

  const filePath = path.join(SOHBET_DIR, filename);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { filename: string } }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  const { filename } = params;
  if (!filename.endsWith(".md")) {
    return NextResponse.json({ error: "Sadece .md dosyaları güncellenebilir" }, { status: 400 });
  }

  const filePath = path.join(SOHBET_DIR, filename);

  try {
    const { content } = await req.json();
    
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Geçersiz içerik formatı" }, { status: 400 });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ success: true, message: "Dosya başarıyla kaydedildi." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { filename: string } }) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  const { filename } = params;
  if (!filename.endsWith(".md")) {
    return NextResponse.json({ error: "Geçersiz dosya formatı" }, { status: 400 });
  }

  const filePath = path.join(SOHBET_DIR, filename);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true, message: "Dosya başarıyla silindi." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
