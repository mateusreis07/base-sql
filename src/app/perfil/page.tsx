import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { User, Mail, Users, Calendar, Database, Sparkles, Star, Globe, Clock, ChevronRight, TrendingUp, Settings, GitFork } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userData = await prisma.user.findUnique({
    where: { id: (session?.user as any)?.id || '' },
    include: {
      team: true,
      _count: {
        select: { scripts: true }
      },
      scripts: {
        orderBy: { updatedAt: 'desc' },
        include: { 
          categoria: true,
          clonadoDe: {
            include: {
              autor: { select: { name: true } },
              team: { select: { nome: true } }
            }
          }
        }
      }
    }
  });

  if (!userData) redirect('/login');

  const scriptsOriginais = (userData as any).scripts.filter((s: any) => !s.clonadoDeId);
  const scriptsClonados = (userData as any).scripts.filter((s: any) => !!s.clonadoDeId);

  const teamId = userData.teamId;

  // Busca totais para os cards (estilo dashboard)
  const [totalScriptsSistema, totalScriptsTime, favoriteCount, teamImpactCount] = await Promise.all([
    prisma.script.count(),
    teamId ? prisma.script.count({ where: { teamId } }) : Promise.resolve(0),
    prisma.favorite.count({ where: { userId: userData.id } }),
    prisma.favorite.count({ 
      where: { 
        script: {
          OR: [
            { teamId: teamId },
            { autor: { teamId: teamId } }
          ]
        },
        user: {
          teamId: { not: teamId }
        }
      } 
    })
  ]);

  const roleColors: Record<string, string> = {
    'ADMIN': 'text-red-400 bg-red-400/10 border-red-400/20',
    'NIVEL2': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'NIVEL1': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-2 text-slate-500">
          <Link href="/" className="hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-widest">Início</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">Seu Perfil</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Identidade do Usuário */}
        <div className="lg:col-span-4 space-y-6 text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
            
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 mx-auto flex items-center justify-center text-4xl font-black text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              {userData.name?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight truncate">{userData.name}</h2>
            <Link 
              href="/settings"
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all group/cargo ${userData.cargo ? roleColors[userData.role] : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              {userData.cargo || 'Cargo'}
              <Settings className={`w-3 h-3 transition-all group-hover/cargo:rotate-90 ${userData.cargo ? 'opacity-70' : 'text-slate-500 group-hover/cargo:text-blue-400'}`} />
            </Link>
            
            <div className="mt-10 space-y-4 text-left">
              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl transition-all">
                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500 font-black">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Email Corporativo</span>
                  <span className="text-sm text-slate-200 font-black truncate">{userData.email}</span>
                </div>
              </div>

              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl transition-all">
                <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Lotação Atual</span>
                  <span className="text-sm text-slate-200 font-black truncate">{(userData as any).team?.nome || 'Diretoria Global'}</span>
                </div>
              </div>

              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl transition-all">
                <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Membro desde</span>
                  <span className="text-sm text-slate-200 font-black">{new Date(userData.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
             <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/10 group-hover:rotate-12 transition-transform duration-700" />
             <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-tighter">Suporte e Segurança</h4>
             <p className="text-xs text-slate-500 leading-relaxed font-bold">
               Para alterações de permissão ou recuperação de acesso, entre em contato com o administrador da sua unidade.
             </p>
          </div>
        </div>

        {/* Lado Direito: Dashboard de Conteúdo */}
        <div className="lg:col-span-8 space-y-6 text-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Database className="w-12 h-12 text-emerald-400" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Scripts do Time</span>
                  <p className="text-4xl font-black text-white leading-none mb-2">{totalScriptsTime}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-wider">Acervo do time {(userData as any).team?.nome}</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <GitFork className="w-12 h-12 text-amber-500" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Suas Clonagens</span>
                  <p className="text-4xl font-black text-amber-500 leading-none mb-2">{scriptsClonados.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-wider">Forks importados por você</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-400/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="w-12 h-12 text-blue-400" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Favoritos</span>
                  <p className="text-4xl font-black text-blue-400 leading-none mb-2">{favoriteCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-wider">Acesso rápido configurado</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Seção de Criações Originais */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                   <Database className="w-5 h-5 text-blue-400 font-black" />
                   <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Suas Consultas Originais</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-800/50">
                {scriptsOriginais.length > 0 ? scriptsOriginais.map((script: any) => (
                  <Link key={script.id} href={`/scripts/${script.id}`} className="block p-4 px-8 hover:bg-slate-800/30 transition-all group">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4 truncate">
                          <div className={`w-2 h-2 rounded-full ${script.visibility === 'GLOBAL' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500'}`} />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-black text-slate-200 group-hover:text-blue-400 transition-colors truncate uppercase tracking-tight">
                              {script.titulo}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {script.categoria?.nome || 'Sem Categoria'} • Atualizado {new Date(script.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                )) : (
                  <div className="p-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest italic">
                    Nenhum script original criado por seu perfil.
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Clones */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                <div className="flex items-center gap-3">
                   <GitFork className="w-5 h-5 text-amber-500 font-black" />
                   <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Seu Repositório de Clones</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-800/50">
                {scriptsClonados.length > 0 ? scriptsClonados.map((script: any) => (
                  <Link key={script.id} href={`/scripts/${script.id}`} className="block p-4 px-8 hover:bg-slate-800/30 transition-all group">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4 truncate">
                          <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-black text-slate-200 group-hover:text-amber-500 transition-colors truncate uppercase tracking-tight">
                              {script.titulo}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              Origem: {script.clonadoDe?.autor?.name || 'Sistema'} • {script.clonadoDe?.team?.nome || 'Global'}
                            </span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-600 uppercase bg-slate-950 px-2 py-1 rounded border border-slate-800">REPOSITORY</span>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                  </Link>
                )) : (
                  <div className="p-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest italic">
                    Nenhuma clonagem realizada para seu perfil.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
