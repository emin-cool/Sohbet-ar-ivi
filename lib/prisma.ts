import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Her zaman absolute path kullan — Vercel serverless'ta relative path çalışmaz
  const dbUrl = "file:" + path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  prisma = new PrismaClient({ adapter });
}

export { prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
