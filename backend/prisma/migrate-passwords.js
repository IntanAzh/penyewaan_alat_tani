const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("./password");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, password: true } });
  let migrated = 0;
  for (const user of users) {
    if (user.password.startsWith("scrypt-v1$")) continue;
    await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(user.password) } });
    migrated += 1;
  }
  console.log(`Migrated ${migrated} existing account password(s) to scrypt hashes.`);
}

main().catch((error) => {
  console.error("Password migration failed.", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
