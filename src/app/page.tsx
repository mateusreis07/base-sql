import { Database, TrendingUp, Clock, Plus, Search, ShieldAlert, Globe } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ScriptCard } from '@/components/ui/ScriptCard';
import { CopyButton } from '@/components/ui/CopyButton';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  
  const user = session.user as any;
  const isN1 = user.role === 'NIVEL1';
  const { q } = await searchParams;
  
  // Busca totais para o dashboard respeitando visibilidade
  const totalScriptsSistema = await prisma.script.count({
    where: {
      OR: [
        { visibility: 'GLOBAL' },
        { teamId: user.teamId || 'no-team' }
      ]
    }
  });

  const totalScriptsTime = user.teamId 
    ? await prisma.script.count({ where: { teamId: user.teamId } })
    : 0;

  // Filtro de visibilidade: GLOBAL ou do próprio TIME
  let where: any = {
    OR: [
      { visibility: 'GLOBAL' },
      { teamId: user.teamId || 'no-team' }
    ]
  };

  if (q) {
    where = {
      AND: [
        where,
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
    take: 20,
    include: {
      categoria: true,
      tags: { include: { Tag: true } },
      autor: { select: { id: true, name: true } },
      team: { select: { nome: true } },
      favorites: {
        where: { userId: (session?.user as any)?.id || '' }
      }
    }
  });

  const scriptsWithFavorite = scripts.map(s => ({
    ...s,
    isFavorite: (s as any).favorites?.length > 0
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {isN1 ? 'Buscador de Soluções' : 'Dashboard'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isN1 ? 'Navegue pelo banco de scripts para auxiliar nos seus atendimentos.' : 'Bem-vindo à sua base de conhecimento SQL.'}
          </p>
        </div>
      </div>

      {!q && !isN1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total de Scripts</p>
                <p className="text-2xl font-bold text-white mt-1">{totalScriptsSistema}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-green-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Scripts do Time</p>
                <p className="text-2xl font-bold text-white mt-1">{totalScriptsTime}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Mais Recentes</p>
                <p className="text-sm font-medium text-slate-300 mt-1">
                  {scripts.length > 0 ? formatDistanceToNow(scripts[0].createdAt, { addSuffix: true, locale: ptBR }) : 'Nenhum'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isN1 && (
         <div className="bg-emerald-950 border border-emerald-900 rounded-lg p-6 flex items-start gap-4">
           <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
           <div>
             <h3 className="font-bold text-emerald-400 text-lg">Modo Liderança Segura</h3>
             <p className="text-emerald-200/70 text-sm mt-1">
               Como Assistente <b>N1</b>, seu acesso foca na praticidade e velocidade. Use a barra de pesquisa acima (Ctrl+K) para buscar. Ache o script, copie e feche. Edições sensíveis estão desativadas.
             </p>
           </div>
         </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-6">
          {q ? `Resultados da busca por "${q}"` : 'Scripts adicionados Recentemente.'}
        </h2>
        
        {scripts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2 text-slate-400">Nenhuma query encontrada ou autorizada</p>
              <p className="mb-6 max-w-md text-sm">
                {q ? 'Tente usar outros termos de busca.' : 'Ainda não adicionaram scripts no seu Time ou na nuvem Global.'}
              </p>
              {!q && !isN1 && (
                <Link 
                  href="/scripts/new" 
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Redigir Primeiro Script
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {scriptsWithFavorite.map(script => (
              <ScriptCard 
                key={script.id} 
                script={script as any} 
                isN1={isN1} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
