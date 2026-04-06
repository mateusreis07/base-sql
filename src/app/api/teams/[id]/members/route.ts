import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    if ((session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const isGlobal = id === 'global-team';

    const members = await prisma.user.findMany({
      where: { teamId: isGlobal ? null : id },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    if ((session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const isGlobal = id === 'global-team';
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'UserId e Action são obrigatórios' }, { status: 400 });
    }

    if (action === 'add') {
      // In global context, "adding" means removing from any specific team (making them global)
      await prisma.user.update({
        where: { id: userId },
        data: { teamId: isGlobal ? null : id }
      });
    } else if (action === 'remove') {
      // Removing from global usually means they must go somewhere else. 
      // For now, let's just allow clearing if they were somehow still attached or if it's a specific team.
      if (!isGlobal) {
        await prisma.user.update({
          where: { id: userId },
          data: { teamId: null }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerenciar membro' }, { status: 500 });
  }
}
