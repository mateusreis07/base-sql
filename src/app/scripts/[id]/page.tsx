import { ScriptForm } from '@/components/forms/ScriptForm';
import { ScriptView } from '@/components/scripts/ScriptView';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  
  const script = await prisma.script.findUnique({
    where: { id },
    include: { 
      categoria: { select: { nome: true } },
      tags: { include: { Tag: true } },
      autor: { 
        select: { id: true, name: true, image: true, team: true } 
      },
      team: true,
      favorites: { where: { userId: session.user.id } },
      versions: {
        orderBy: { createdAt: 'desc' },
        include: { autor: { select: { id: true, name: true } } }
      },
      clonadoDe: {
        include: {
          autor: { select: { id: true, name: true } },
          team: { select: { nome: true } }
        }
      }
    }
  });

  if (!script) {
    notFound();
  }

  const userRole = (session.user as any)?.role;
  const userTeamId = (session.user as any)?.teamId;

  // Determinar se o usuário pode EDITAR ou apenas VISUALIZAR
  const canEdit = userRole === 'ADMIN' || (userRole === 'NIVEL2' && script.teamId === userTeamId);
  
  // Visualização: Se for Global, qualquer um vê. Se for Time, só membros veem.
  const canView = script.visibility === 'GLOBAL' || script.teamId === userTeamId;

  if (!canView) {
    redirect('/');
  }

  const userId = (session.user as any)?.id;
  const isReadOnly = userRole === 'NIVEL1' || !canEdit;
  const canDelete = userRole === 'ADMIN' || script.autorId === userId;
  const isFavorite = script.favorites.length > 0;

  // Carregar dados extras apenas para o modo de edição
  let categorias: any[] = [];
  let tags: any[] = [];

  if (!isReadOnly) {
    categorias = await prisma.categoria.findMany({ 
      where: {
        AND: [
          {
            OR: [
              { teamId: userTeamId },
              { id: script.categoriaId || undefined }
            ]
          },
          {
            OR: [
              { isSystem: false },
              { id: script.categoriaId || undefined }
            ]
          }
        ]
      }, 
      orderBy: { nome: 'asc' } 
    });

    tags = await prisma.tag.findMany({ 
      where: {
        OR: [
          { teamId: userTeamId },
          { scripts: { some: { scriptId: script.id } } }
        ]
      }, 
      orderBy: { nome: 'asc' } 
    });
  }

  const initialData = {
    id: script.id,
    titulo: script.titulo,
    descricao: script.descricao || '',
    codigoSql: script.codigoSql,
    categoriaId: script.categoriaId || '',
    tagIds: script.tags.map((t) => t.tagId),
    visibility: script.visibility as 'TIME' | 'GLOBAL',
    tipoBanco: script.tipoBanco || 'POSTGRESQL',
    sistema: script.sistema || 'SAJ5'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6 px-4">
      {/* Cabeçalho de Contexto - Apenas se não for ReadOnly (pois ScriptView já tem o dele) */}
      {/* O cabeçalho detalhado foi removido para evitar poluição visual, já que os componentes internos já possuem seus próprios headers premium */}

      {/* Exibição condicional baseada na permissão */}
      <section className="animate-in fade-in slide-in-from-bottom-3 duration-700">
        {isReadOnly ? (
          <ScriptView 
            script={script as any} 
            isFavoriteInitial={isFavorite} 
          />
        ) : (
          <ScriptForm 
            initialData={initialData} 
            categorias={categorias} 
            tags={tags} 
            isReadOnly={isReadOnly} 
            versions={script.versions as any}
            canDelete={canDelete}
            clonadoDe={script.clonadoDe as any}
          />
        )}
      </section>
    </div>
  );
}
