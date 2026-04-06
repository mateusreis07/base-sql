import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    const userRole = (session.user as any).role;
    const userTeamId = (session.user as any).teamId;

    // Regra Corporativa: 
    // Pode ver scripts GLOBAIS ou scripts do PRÓPRIO TIME
    const accessFilter = {
      OR: [
        { visibility: 'GLOBAL' },
        ...(userTeamId ? [{ teamId: userTeamId, visibility: 'TIME' }] : [])
      ]
    };
    
    let where: any = accessFilter;

    // Se tiver busca, funde a regra de permissão com o query search
    if (q) {
      where = {
        AND: [
          accessFilter,
          {
            OR: [
              { titulo: { contains: q, mode: 'insensitive' } },
              { codigoSql: { contains: q, mode: 'insensitive' } },
              { descricao: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      };
    }

    const scripts = await prisma.script.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        categoria: true,
        tags: { include: { Tag: true } },
        autor: { select: { name: true } },
        team: { select: { nome: true } }
      }
    });

    return NextResponse.json(scripts);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar scripts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userTeamId = (session.user as any).teamId;
    const userId = (session.user as any).id;

    // N1 não edita, N1 não cria!
    if (userRole === 'NIVEL1') {
      return NextResponse.json({ error: 'Sem permissão (Nível 1 é apenas visualização)' }, { status: 403 });
    }

    const body = await request.json();
    const { titulo, descricao, codigoSql, categoriaId, tagIds, visibility } = body;

    const script = await prisma.script.create({
      data: { 
        titulo, 
        descricao, 
        codigoSql, 
        categoriaId,
        autorId: userId,
        teamId: userTeamId || null,
        visibility: visibility || 'TIME',
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((id: string) => ({
            tagId: id
          }))
        } : undefined,
        versions: {
          create: {
            titulo,
            descricao,
            codigoSql,
            autorId: userId
          }
        }
      },
    });
    
    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar script' }, { status: 500 });
  }
}
