import { Database, TrendingUp, Clock, Plus, Search, ShieldAlert, Globe, Trophy, Award, Users, GitFork } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ScriptCard } from '@/components/ui/ScriptCard';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as any;
  const currentUserId = user.id || '';
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

  // Busca dados para o Hall da Fama e listagem principal
  const [scripts, scriptsMaisClonados, timesTopSharers] = await Promise.all([
    prisma.script.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        categoria: true,
        tags: { include: { Tag: true } },
        autor: { select: { id: true, name: true } },
        team: { select: { nome: true } },
        favorites: { where: { userId: currentUserId } },
      }
    }),
    prisma.script.findMany({
      where: { 
        visibility: 'GLOBAL',
        clones: { some: {} } // Apenas scripts que já foram clonados pelo menos uma vez
      } as any,
      take: 3,
      orderBy: { clones: { _count: 'desc' } },
      include: {
        _count: { select: { clones: true } },
        team: { select: { nome: true } },
        autor: { select: { id: true, name: true } }
      }
    }),
    prisma.team.findMany({
      take: 3,
      where: { scripts: { some: { visibility: 'GLOBAL' } } },
      include: {
        _count: {
          select: { scripts: { where: { visibility: 'GLOBAL' } } }
        }
      },
      orderBy: { scripts: { _count: 'desc' } }
    })
  ]);

  const scriptsWithFavorite = scripts.map(s => ({
    ...s,
    isFavorite: (s as any).favorites?.length > 0
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase transition-all">
            {isN1 ? 'Buscador de Soluções' : 'Dashboard de Operações'}
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">
            {isN1 ? 'Acesso rápido à base de inteligência' : 'Métricas e Engenharia de Consultas'}
          </p>
        </div>
      </div>

      {!q && !isN1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-8 hover:border-blue-500/30 transition-all group backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="bg-blue-600/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                <Database className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Scripts Acessíveis</p>
                <p className="text-3xl font-black text-white mt-1">{totalScriptsSistema}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-8 hover:border-emerald-500/30 transition-all group backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="bg-emerald-600/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scripts Seu Time</p>
                <p className="text-3xl font-black text-white mt-1">{totalScriptsTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-8 hover:border-purple-500/30 transition-all group backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="bg-purple-600/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Última Atualização</p>
                <p className="text-sm font-black text-slate-300 mt-2 uppercase tracking-tight leading-none">
                  {scripts.length > 0 ? formatDistanceToNow(new Date((scripts[0] as any).createdAt), { addSuffix: true, locale: ptBR }) : 'Nenhum registro'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!q && !isN1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950 border border-slate-800/60 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2.5 rounded-xl">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Top Clones (Mais Úteis)</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 py-1 bg-slate-950 rounded-full border border-slate-800">Ranking Popularidade</span>
            </div>

            <div className="space-y-4">
              {scriptsMaisClonados.length > 0 ? scriptsMaisClonados.map((s, i) => (
                <Link key={s.id} href={`/scripts/${s.id}`} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl group hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black ${i === 0 ? 'text-amber-500' : 'text-slate-600'}`}>0{i + 1}</span>
                    <div>
                      <p className="text-sm font-black text-slate-200 group-hover:text-amber-400 transition-colors">{s.titulo}</p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">por {(s as any).autor?.name} • {(s as any).team?.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                    <GitFork className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-black text-amber-500">{(s as any)._count.clones}</span>
                  </div>
                </Link>
              )) : (
                <p className="text-xs text-slate-600 font-bold uppercase italic text-center py-8">Nenhum script clonado ainda.</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950 border border-slate-800/60 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2.5 rounded-xl">
                  <Award className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Líderes de Compartilhamento</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 py-1 bg-slate-950 rounded-full border border-slate-800">Ranking Colaboração</span>
            </div>

            <div className="space-y-4">
              {timesTopSharers.length > 0 ? timesTopSharers.map((team, i) => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black ${i === 0 ? 'text-blue-500' : 'text-slate-600'}`}>0{i + 1}</span>
                    <div>
                      <p className="text-sm font-black text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{team.nome}</p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Contribuições Ativas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-blue-500">{(team as any)._count.scripts}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-600 font-bold uppercase italic text-center py-8">Aguardando as primeiras contribuições globais.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isN1 && (
         <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-[2rem] p-10 flex items-start gap-6 backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert className="w-32 h-32 text-emerald-500" />
           </div>
           <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
              <ShieldAlert className="w-10 h-10 text-emerald-500 shrink-0" />
           </div>
           <div className="relative z-10">
             <h3 className="font-black text-emerald-400 text-2xl uppercase tracking-tighter">Modo Liderança Segura</h3>
             <p className="text-emerald-200/60 text-sm mt-2 leading-relaxed max-w-2xl font-medium">
               Acesso otimizado para auxílio em atendimentos. Busque a solução via <kbd className="px-2 py-1 bg-emerald-900/50 rounded-md font-black text-[10px] border border-emerald-800/50 ml-1">CTRL + K</kbd>, valide a consulta e aplique no ambiente controlado. Edições e modificações sensíveis estão bloqueadas para seu perfil.
             </p>
           </div>
         </div>
      )}

      <div className="pt-8 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {q ? `Resultado: "${q}"` : 'Atividade Recente'}
          </h2>
          {!q && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibindo os últimos 20 scripts</span>}
        </div>

        {scripts.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/40 rounded-[3rem] p-24 text-center backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center text-slate-700">
              <Search className="w-16 h-16 mb-6 opacity-20" />
              <p className="text-xl font-black mb-3 text-slate-500 uppercase tracking-tight">Vazio e Silencioso</p>
              <p className="mb-10 max-w-sm text-sm font-bold opacity-60">
                {q ? 'Nenhum script corresponde aos critérios da sua busca.' : 'Ainda não existem scripts compartilhados ou clonados para sua equipe.'}
              </p>
              {!q && !isN1 && (
                <Link
                  href="/scripts/new"
                  className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95"
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
