import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userRole = (session.user as any)?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const { nome, ownerId } = await request.json();
    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { 
        nome,
        ownerId: ownerId || null
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true, scripts: true } }
      }
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar time' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userRole = (session.user as any)?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    // Check dependency
    const count = await prisma.user.count({ where: { teamId: id } });
    if (count > 0) {
      return NextResponse.json({ error: 'Não é possível deletar um time que possui usuários vinculados.' }, { status: 400 });
    }

    await prisma.team.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar time' }, { status: 500 });
  }
}
