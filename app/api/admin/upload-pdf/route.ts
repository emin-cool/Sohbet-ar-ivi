import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  // Sadece yerel geliştirme ortamında çalışmasına izin ver
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Bu endpoint sadece yerel geliştirme ortamında çalışır." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("pdf") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "PDF dosyası bulunamadı." }, { status: 400 });
    }
    
    if (files.length > 10) {
      return NextResponse.json({ error: "Aynı anda en fazla 10 dosya yükleyebilirsiniz." }, { status: 400 });
    }

    // pdfler dizini yoksa oluştur
    const pdflerDir = path.join(process.cwd(), "pdfler");
    if (!fs.existsSync(pdflerDir)) {
      fs.mkdirSync(pdflerDir, { recursive: true });
    }

    // Dosyaları kaydet
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(pdflerDir, file.name);
      await writeFile(filePath, buffer);
    }

    // Python scriptini çalıştır (klasördeki tüm pdfleri tarar)
    const { stdout, stderr } = await execAsync("python scripts/ic-aktar.py");

    return NextResponse.json({ 
      success: true, 
      message: `${files.length} PDF yüklendi ve Markdown'a dönüştürülme işlemi tamamlandı.`,
      logs: stdout,
      errors: stderr 
    });
  } catch (error: any) {
    console.error("PDF Yükleme Hatası:", error);
    return NextResponse.json(
      { error: error.message || "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
