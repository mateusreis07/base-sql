import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        categoria: true,
        tags: {
          include: { Tag: true }
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { autor: { select: { name: true } } }
        }
      }
    });
    
    if (!script) {
      return NextResponse.json({ error: 'Script não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(script);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar script' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { titulo, descricao, codigoSql, categoriaId, tagIds, visibility } = body;

    // Busca o estado completo atual para salvar no histórico se houver mudanças
    const currentScript = await prisma.script.findUnique({
        where: { id },
        select: { 
          visibility: true, 
          autorId: true,
          titulo: true,
          descricao: true,
          codigoSql: true
        }
    });

    if (!currentScript) {
        return NextResponse.json({ error: 'Script não encontrado' }, { status: 404 });
    }

    // REGRA: Se o script era GLOBAL e o usuário quer mudar para TIME
    if (currentScript.visibility === 'GLOBAL' && visibility === 'TIME') {
        const otherFavoritesCount = await prisma.favorite.count({
            where: {
                scriptId: id,
                userId: { not: session.user.id } // Favoritados por outros usuários
            }
        });

        if (otherFavoritesCount > 0) {
            return NextResponse.json({ 
                error: `Bloqueio de Conformidade: Este script não pode mais ser tornado privado pois já foi salvo como favorito por ${otherFavoritesCount} outro(s) usuário(s).` 
            }, { status: 400 });
        }
    }

    // Verifica se houve mudança real para poupar versões duplicadas
    const hasChanged = 
        titulo !== currentScript.titulo || 
        descricao !== currentScript.descricao || 
        codigoSql !== currentScript.codigoSql;

    if (tagIds && Array.isArray(tagIds)) {
      await prisma.scriptTag.deleteMany({
        where: { scriptId: id }
      });
    }

    const script = await prisma.script.update({
      where: { id },
      data: { 
        titulo, 
        descricao, 
        codigoSql, 
        categoriaId,
        visibility: visibility,
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tid: string) => ({
            tagId: tid
          }))
        } : undefined,
        // Cria versão se houver mudança relevante
        versions: hasChanged ? {
          create: {
            titulo,
            descricao,
            codigoSql,
            autorId: (session?.user as any)?.id
          }
        } : undefined
      },
      include: {
        categoria: true,
        tags: { include: { Tag: true } },
        autor: { select: { id: true, name: true } },
        team: { select: { nome: true } }
      }
    });
    
    return NextResponse.json(script);
  } catch (error) {
    console.error('API Error Update Script:', error);
    return NextResponse.json({ error: 'Erro ao atualizar script' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    }

    const { id } = await context.params;

    // Busca o estado atual do script para validar a regra de favoritos
    const script = await prisma.script.findUnique({
        where: { id },
        select: { visibility: true, autorId: true }
    });

    if (!script) {
        return NextResponse.json({ error: 'Script não encontrado' }, { status: 404 });
    }

    // REGRA: Se o script é GLOBAL
    if (script.visibility === 'GLOBAL') {
        const otherFavoritesCount = await prisma.favorite.count({
            where: {
                scriptId: id,
                userId: { not: (session?.user as any)?.id }
            }
        });

        if (otherFavoritesCount > 0) {
            return NextResponse.json({ 
                error: `Bloqueio de Conformidade: Este script não pode ser deletado pois já foi salvo como favorito por ${otherFavoritesCount} outro(s) usuário(s).` 
            }, { status: 400 });
        }
    }
    
    await prisma.script.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error Delete Script:', error);
    return NextResponse.json({ error: 'Erro ao deletar script' }, { status: 500 });
  }
}
