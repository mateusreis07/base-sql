'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function cloneScript(scriptId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Você precisa estar logado para clonar um script.');
  }

  // Busca o usuário completo para pegar o time
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { team: true }
  });

  if (!user?.teamId) {
    throw new Error('Você precisa pertencer a um time para clonar scripts corporativos.');
  }

  // Busca o script original
  const originalScript = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { tags: true }
  });

  if (!originalScript) {
    throw new Error('Script original não encontrado.');
  }

  // 1. Garantir que a categoria "Clonados" exista no TIME do usuário
  let clonadosCategory = await prisma.categoria.findFirst({
    where: {
      nome: 'Clonados',
      teamId: user.teamId,
      isSystem: true
    }
  });

  if (!clonadosCategory) {
    clonadosCategory = await prisma.categoria.create({
      data: {
        nome: 'Clonados',
        descricao: 'Scripts clonados de outras equipes - compartilhamentos globais.',
        isSystem: true,
        cor: 'slate',
        teamId: user.teamId // Vincula ao time do usuário
      }
    });
  }

  // 2. Criar o novo script (Clonagem)
  const newScript = await prisma.script.create({
    data: {
      titulo: `${originalScript.titulo} (Clonado)`,
      descricao: originalScript.descricao || 'Script clonado sem descrição original.',
      codigoSql: originalScript.codigoSql,
      tipoBanco: originalScript.tipoBanco,
      sistema: originalScript.sistema,
      autorId: user.id,
      teamId: user.teamId,
      categoriaId: clonadosCategory.id,
      visibility: 'TIME', // SEMPRE privado para o time por padrão ao clonar
      clonadoDeId: originalScript.id,
      // Copiar tags se houver
      tags: {
        create: originalScript.tags.map(tag => ({
          tagId: tag.tagId
        }))
      }
    }
  });

  // 3. Criar a primeira versão do clone
  await prisma.scriptVersion.create({
    data: {
      scriptId: newScript.id,
      titulo: newScript.titulo,
      descricao: newScript.descricao,
      codigoSql: newScript.codigoSql,
      motivo: `Clonado originalmente de: ${originalScript.titulo}`,
      autorId: user.id,
      tipoBanco: newScript.tipoBanco,
      sistema: newScript.sistema,
    }
  });

  revalidatePath('/explore');
  revalidatePath('/perfil');

  return { success: true, scriptId: newScript.id };
}
