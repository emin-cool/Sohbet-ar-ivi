import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KAVRAMLAR_PATH = path.join(process.cwd(), "content", "kavramlar.json");

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    if (!fs.existsSync(KAVRAMLAR_PATH)) {
      return NextResponse.json({});
    }

    const content = fs.readFileSync(KAVRAMLAR_PATH, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    const data = await req.json();
    
    // Basit bir validasyon
    if (typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ error: "Geçersiz format. Beklenen: JSON nesnesi." }, { status: 400 });
    }

    fs.writeFileSync(KAVRAMLAR_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true, message: "Kavramlar başarıyla güncellendi." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
