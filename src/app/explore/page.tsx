import { prisma } from '@/lib/prisma';
import { ExploreClient } from './ExploreClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; tag?: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  
  const { q, categoria, tag } = await searchParams;
  const userTeamId = (session.user as any)?.teamId;

  // Busca categorias que contêm algum script GLOBAL OU que pertençam ao PRÓPRIO TIME
  const categorias = await prisma.categoria.findMany({ 
    where: { 
      OR: [
        { scripts: { some: { visibility: 'GLOBAL' } } },
        ...(userTeamId ? [{ teamId: userTeamId }] : [])
      ]
    },
    include: { 
      team: { select: { id: true, nome: true } },
      _count: {
        select: {
          scripts: {
            where: {
              OR: [
                { visibility: 'GLOBAL' },
                ...(userTeamId ? [{ teamId: userTeamId }] : [])
              ]
            }
          }
        }
      }
    },
    orderBy: { nome: 'asc' } 
  });
  
  // Busca APENAS tags que estão atreladas a algum script GLOBAL OU que pertençam ao PRÓPRIO TIME
  const tags = await prisma.tag.findMany({ 
    where: { 
      OR: [
        { scripts: { some: { Script: { visibility: 'GLOBAL' } } } },
        ...(userTeamId ? [{ teamId: userTeamId }] : [])
      ]
    },
    orderBy: { nome: 'asc' } 
  });

  // Monta os filtros dinamicamente garantindo públicos OU do próprio time
  const accessFilter = {
    OR: [
      { visibility: 'GLOBAL' },
      ...(userTeamId ? [{ teamId: userTeamId }] : [])
    ]
  };

  let where: any = accessFilter;

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

  if (categoria) {
    where.categoriaId = categoria;
  }

  if (tag) {
    where.tags = {
      some: {
        tagId: tag
      }
    };
  }

  // Busca os scripts com os filtros aplicados e força o check relacional p/ autor
  const scripts = await prisma.script.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      categoria: true,
      autor: { select: { id: true, name: true } },
      team: { select: { nome: true } },
      tags: {
        include: { Tag: true }
      },
      favorites: {
        where: { userId: session.user.id }
      }
    }
  });

  const scriptsWithFavorite = scripts.map(s => ({
    ...s,
    isFavorite: (s as any).favorites?.length > 0
  }));

  return (
    <ExploreClient 
      initialScripts={scriptsWithFavorite as any} 
      categorias={categorias} 
      tags={tags} 
      currentFilters={{ q, categoria, tag }} 
    />
  );
}
