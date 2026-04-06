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

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (userRole !== 'ADMIN' && existing.teamId !== userTeamId) {
      return NextResponse.json({ error: 'Recurso nao pertence ao seu time' }, { status: 403 });
    }

    const body = await request.json();
    const { nome } = body;

    if (nome && nome !== existing.nome) {
      const alreadyExists = await prisma.tag.findFirst({
        where: { nome, teamId: userTeamId }
      });
      if (alreadyExists) {
        return NextResponse.json({ error: 'Tag com este nome já existe' }, { status: 400 });
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { nome },
    });
    
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar tag' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userRole = (session.user as any)?.role;
    const userTeamId = (session.user as any)?.teamId;

    const { id } = await context.params;
    
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (userRole !== 'ADMIN' && existing.teamId !== userTeamId) {
      return NextResponse.json({ error: 'Recurso nao pertence ao seu time' }, { status: 403 });
    }

    await prisma.tag.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar tag' }, { status: 500 });
  }
}
