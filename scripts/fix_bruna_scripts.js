const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRUNA_EMAIL = 'bruna.silva@softplan.com.br';
const SCRIPT_IDS = [
  'c17cff32-430a-4c47-9866-a239ee8b9b82',
  '7421262e-fa87-4343-81d8-1ef7b9683dc3',
  '87f40c43-893f-49d6-a724-acd3f0d94bc0'
];

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: BRUNA_EMAIL },
    select: { teamId: true }
  });

  if (!user || !user.teamId) {
    console.error(`User ${BRUNA_EMAIL} not found or they have no team.`);
    return;
  }

  const result = await prisma.script.updateMany({
    where: { id: { in: SCRIPT_IDS } },
    data: { teamId: user.teamId }
  });

  console.log(`Updated ${result.count} scripts for ${BRUNA_EMAIL} to team ${user.teamId}.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
