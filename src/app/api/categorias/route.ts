import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userTeamId = (session.user as any)?.teamId;
    const userRole = (session.user as any)?.role;

    const categorias = await prisma.categoria.findMany({
      where: userRole === 'ADMIN' ? {} : { teamId: userTeamId },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userTeamId = (session.user as any)?.teamId;
    const userRole = (session.user as any)?.role;

    if (userRole === 'NIVEL1') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, descricao, cor, parentId } = body;

    // Verificar unicidade dentro do mesmo time
    const existing = await prisma.categoria.findFirst({
      where: { nome, teamId: userTeamId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Categoria já existe neste time' }, { status: 400 });
    }

    const categoria = await prisma.categoria.create({
      data: { 
        nome, 
        descricao, 
        cor, 
        parentId,
        teamId: userTeamId 
      },
    });
    
    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
