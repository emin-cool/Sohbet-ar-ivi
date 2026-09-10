import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Mevcut tüm kullanıcıları listele
  const mevcutKullanicilar = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("Mevcut kullanıcılar:", mevcutKullanicilar);

  // 2. İlişkili verileri temizle (Account, Session, ReadProgress)
  await prisma.readProgress.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Tüm kullanıcılar silindi.");

  // 3. Yeni admin oluştur
  const hashedPassword = await bcrypt.hash("enneagram123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "ismailhoca",
      email: "ismailhoca",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Yeni admin oluşturuldu:", {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
  console.log("\n=== Giriş Bilgileri ===");
  console.log("E-posta / Kullanıcı: ismailhoca");
  console.log("Şifre: enneagram123");
  console.log("========================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
