import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicates() {
  const categorias = await prisma.categoria.findMany();
  
  const seen = new Set();
  const toDelete = [];

  for (const cat of categorias) {
    const key = `${cat.nome.trim().toLowerCase()}-${cat.teamId}`;
    if (seen.has(key)) {
      toDelete.push(cat.id);
    } else {
      seen.add(key);
      
      // Update the name to be trimmed, just in case
      if (cat.nome !== cat.nome.trim()) {
        await prisma.categoria.update({
          where: { id: cat.id },
          data: { nome: cat.nome.trim() }
        });
      }
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicate categories...`);
    await prisma.categoria.deleteMany({
      where: { id: { in: toDelete } }
    });
  } else {
    console.log('No duplicate categories found.');
  }

  console.log('Cleanup complete!');
}

cleanDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
