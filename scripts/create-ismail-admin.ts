import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "ismailhoca";
  const passwordRaw = "enneagram123";

  // Check if exists
  const existing = await prisma.user.findUnique({
    where: { email: username },
  });

  if (existing) {
    console.log("Kullanıcı zaten mevcut. Şifresi güncelleniyor...");
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    await prisma.user.update({
      where: { email: username },
      data: { password: hashedPassword },
    });
    console.log("Kullanıcı şifresi başarıyla güncellendi.");
  } else {
    console.log("Kullanıcı oluşturuluyor...");
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    await prisma.user.create({
      data: {
        email: username,
        password: hashedPassword,
        name: "Admin İsmail",
      },
    });
    console.log("✅ Admin kullanıcısı oluşturuldu:");
    console.log(`Kullanıcı/Email: ${username}`);
    console.log(`Şifre: ${passwordRaw}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
