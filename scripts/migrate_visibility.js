const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.script.updateMany({
    where: { visibility: 'TIME' },
    data: { visibility: 'GLOBAL' }
  });
  console.log(`Migrated ${result.count} scripts to GLOBAL visibility.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
