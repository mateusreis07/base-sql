import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    }

    const { id: scriptId } = await params;
    const userId = session.user.id;

    // Verificar se já é favorito
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_scriptId: {
          userId,
          scriptId,
        },
      },
    });

    if (existingFavorite) {
      // Remover favorito
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      // Adicionar favorito
      await prisma.favorite.create({
        data: {
          userId,
          scriptId,
        },
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error('API Error Favorite Toggle:', error);
    return NextResponse.json({ error: 'Erro ao processar favorito' }, { status: 500 });
  }
}
