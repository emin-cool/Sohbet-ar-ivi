import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

async function main() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const prisma = new PrismaClient({ adapter });

  const email = "admin@example.com";
  const password = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: "ADMIN"
    },
    create: {
      email,
      name: "Admin",
      password,
      role: "ADMIN"
    }
  });

  console.log("✅ Admin kullanıcısı oluşturuldu:");
  console.log("E-posta: admin@example.com");
  console.log("Şifre: admin123");
}

main().catch(console.error);
