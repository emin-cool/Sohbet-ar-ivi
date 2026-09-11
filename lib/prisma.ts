import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  let dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  
  // Vercel'de Serverless function'ın dosyayı bulabilmesi için absolute path kullan
  if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
    dbUrl = `file:${path.join(process.cwd(), "dev.db")}`;
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
}

export { prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
