import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userRole = (session.user as any)?.role;
    const userTeamId = (session.user as any)?.teamId;
    const { id } = await context.params;

    const existing = await prisma.categoria.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

    // Proteção de categoria de sistema
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Categorias de sistema não podem ser editadas' }, { status: 403 });
    }

    if (userRole !== 'ADMIN' && existing.teamId !== userTeamId) {
      return NextResponse.json({ error: 'Recurso nao pertence ao seu time' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, descricao, cor, parentId } = body;

    if (nome && nome !== existing.nome) {
      const alreadyExists = await prisma.categoria.findFirst({
        where: { nome, teamId: userTeamId }
      });
      if (alreadyExists) {
        return NextResponse.json({ error: 'Categoria com este nome já existe' }, { status: 400 });
      }
    }

    const categoria = await prisma.categoria.update({
      where: { id },
      data: { nome, descricao, cor, parentId },
    });
    
    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userRole = (session.user as any)?.role;
    const userTeamId = (session.user as any)?.teamId;
    const { id } = await context.params;

    const existing = await prisma.categoria.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

    // Proteção de categoria de sistema
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Categorias de sistema não podem ser deletadas' }, { status: 403 });
    }

    if (userRole !== 'ADMIN' && existing.teamId !== userTeamId) {
      return NextResponse.json({ error: 'Recurso nao pertence ao seu time' }, { status: 403 });
    }
    
    await prisma.categoria.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 });
  }
}
