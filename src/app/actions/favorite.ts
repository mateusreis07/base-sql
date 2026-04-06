'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleFavorite(scriptId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Não autorizado');

  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_scriptId: {
        userId,
        scriptId
      }
    }
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        id: existing.id
      }
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        scriptId
      }
    });
  }

  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/favoritos');
  revalidatePath(`/scripts/${scriptId}`);
  
  return { success: true, isFavorite: !existing };
}
