import { prisma } from '@/lib/prisma';
import { ExploreClient } from './ExploreClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; tag?: string; tipoBanco?: string; sistema?: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  
  const { q, categoria, tag, tipoBanco, sistema } = await searchParams;
  const currentUserId = (session?.user as any)?.id || '';
  const userTeamId = (session?.user as any)?.teamId;

  // Filtro base para busca de scripts respeitando visibilidade
  let where: any = {
    OR: [
      { visibility: 'GLOBAL' },
      { teamId: userTeamId || 'no-team' }
    ]
  };

  if (q) {
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { titulo: { contains: q, mode: 'insensitive' } },
        { codigoSql: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } }
      ]
    });
  }

  if (categoria) {
    where.categoriaId = categoria;
  }

  if (tag) {
    where.tags = { some: { tagId: tag } };
  }

  if (tipoBanco) {
    where.tipoBanco = tipoBanco;
  }

  if (sistema) {
    where.sistema = sistema;
  }

  // Carrega categorias com filtro de privacidade
  const [categorias, tags, scripts, teams] = await Promise.all([
    prisma.categoria.findMany({ 
      where: {
        OR: [
          { teamId: userTeamId }, // Minhas pastas (todas)
          { 
            AND: [
              { isSystem: false }, // Pastas públicas/normais
              { OR: [{ teamId: null }, { teamId: { not: userTeamId } }] }
            ] 
          }
        ]
      },
      include: { 
        team: { select: { id: true, nome: true } },
        _count: { select: { scripts: true } }
      },
      orderBy: { nome: 'asc' } 
    }),
    prisma.tag.findMany({ 
      where: { scripts: { some: {} } },
      orderBy: { nome: 'asc' } 
    }),
    prisma.script.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        categoria: true,
        autor: { select: { id: true, name: true } },
        team: { select: { nome: true } },
        tags: { include: { Tag: true } },
        favorites: { where: { userId: currentUserId } }
      }
    }),
    prisma.team.findMany({
      include: {
        _count: { select: { scripts: true } }
      },
      orderBy: [
        { scripts: { _count: 'desc' } },
        { nome: 'asc' }
      ]
    })
  ]);

  const scriptsWithFavorite = scripts.map(s => ({
    ...s,
    isFavorite: (s as any).favorites?.length > 0
  }));

  return (
    <ExploreClient 
      initialScripts={scriptsWithFavorite as any} 
      categorias={categorias} 
      tags={tags as any} 
      teams={teams}
      currentFilters={{ q, categoria, tag, tipoBanco, sistema }} 
    />
  );
}
