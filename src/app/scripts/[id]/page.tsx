import { ScriptForm } from '@/components/forms/ScriptForm';
import { ScriptVersionHistory } from '@/components/ui/ScriptVersionHistory';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  
  const script = await prisma.script.findUnique({
    where: { id },
    include: { 
      tags: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        include: { autor: { select: { name: true } } }
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

  const isReadOnly = userRole === 'NIVEL1' || !canEdit;

  const categorias = await prisma.categoria.findMany({ 
    where: {
      OR: [
        { teamId: userTeamId },
        { id: script.categoriaId || undefined }
      ]
    }, 
    orderBy: { nome: 'asc' } 
  });

  const tags = await prisma.tag.findMany({ 
    where: {
      OR: [
        { teamId: userTeamId },
        { scripts: { some: { scriptId: script.id } } }
      ]
    }, 
    orderBy: { nome: 'asc' } 
  });

  const initialData = {
    id: script.id,
    titulo: script.titulo,
    descricao: script.descricao || '',
    codigoSql: script.codigoSql,
    categoriaId: script.categoriaId || '',
    tagIds: script.tags.map((t) => t.tagId),
    visibility: script.visibility as 'TIME' | 'GLOBAL'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6 px-4">
      {/* Cabeçalho de Contexto */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-500 mb-4">
             <Link href="/" className="hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors">Início</Link>
             <ChevronRight className="w-4 h-4" />
             <span className="text-slate-200 text-[10px] font-black uppercase tracking-widest">Editor de Scripts</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
            {isReadOnly ? 'Visualização de Script' : 'Snapshot do Script'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium max-w-2xl leading-relaxed uppercase tracking-wide">
            {isReadOnly 
              ? 'Este script está em modo leitura por ser de outro departamento ou público.' 
              : `Permissão de ${userRole} concedida para gerenciar este script ${script.visibility === 'GLOBAL' ? 'Público' : 'do Time'}.`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Versões</span>
             <span className="text-xl font-black text-white leading-none">{script.versions.length}</span>
          </div>
        </div>
      </div>

      {/* Editor Principal (inclui o histórico para permitir restauração) */}
      <section className="animate-in fade-in slide-in-from-bottom-3 duration-700">
        <ScriptForm 
          initialData={initialData} 
          categorias={categorias} 
          tags={tags} 
          isReadOnly={isReadOnly} 
          versions={script.versions as any}
        />
      </section>
    </div>
  );
}
