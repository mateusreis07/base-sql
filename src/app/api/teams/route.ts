import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const userRole = (session.user as any)?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: { users: true, scripts: true }
        }
      },
      orderBy: { nome: 'asc' }
    });
    
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar times' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userRole = (session.user as any)?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { nome, ownerId } = await request.json();
    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const team = await prisma.team.create({
      data: { 
        nome,
        ownerId: ownerId || null
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar time' }, { status: 500 });
  }
}
