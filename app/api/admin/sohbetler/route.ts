import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SOHBET_DIR = path.join(process.cwd(), "content", "sohbetler");

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Erişim engellendi" }, { status: 403 });
  }

  try {
    if (!fs.existsSync(SOHBET_DIR)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(SOHBET_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((filename) => {
        const stats = fs.statSync(path.join(SOHBET_DIR, filename));
        return {
          filename,
          size: stats.size,
          mtime: stats.mtime,
        };
      })
      .sort((a, b) => b.filename.localeCompare(a.filename)); // Tarihe göre tersten sıralar

    return NextResponse.json(files);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
