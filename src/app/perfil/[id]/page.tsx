import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Mail, Users, Calendar, Database, Sparkles, Star, Globe, Clock, ChevronRight, TrendingUp, GitFork } from 'lucide-react';
import Link from 'next/link';

interface PublicProfileProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { id } = await params;
  const session = await auth();
  const sessionTeamId = (session?.user as any)?.teamId;
  
  // Se for o próprio perfil, redireciona para a página principal de perfil
  if (session?.user?.id === id) {
    redirect('/perfil');
  }

  const userData = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
      _count: {
        select: { scripts: true }
      },
      scripts: {
        where: {
          OR: [
            { visibility: 'GLOBAL' },
            { 
              AND: [
                { visibility: 'TIME' },
                { teamId: sessionTeamId }
              ]
            }
          ]
        },
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

  if (!userData) notFound();

  const scriptsOriginais = (userData as any).scripts.filter((s: any) => !s.clonadoDeId);
  const scriptsClonados = (userData as any).scripts.filter((s: any) => !!s.clonadoDeId);

  const teamId = userData.teamId;

  // Busca estatísticas públicas e do time
  const [favoriteCount, teamTotalCount, teamSharedCount, teamImpactCount] = await Promise.all([
    prisma.favorite.count({ where: { userId: userData.id, script: { visibility: 'GLOBAL' } } }),
    prisma.script.count({ 
      where: { 
        OR: [
          { teamId: teamId },
          { autor: { teamId: teamId } }
        ]
      } 
    }),
    prisma.script.count({ 
      where: { 
        visibility: 'GLOBAL',
        OR: [
          { teamId: teamId },
          { autor: { teamId: teamId } }
        ]
      } 
    }),
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

  const roleLabels: Record<string, string> = {
    'ADMIN': 'Administrador do Sistema',
    'NIVEL2': 'Expert / Editor',
    'NIVEL1': 'Consultor / Visualizador'
  };

  const roleColors: Record<string, string> = {
    'ADMIN': 'text-red-400 bg-red-400/10 border-red-400/20',
    'NIVEL2': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'NIVEL1': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="mb-0">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Link href="/" className="hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-widest">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">Perfil Público</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Perfil de {userData.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Visualização de contribuições e impacto na rede.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Identidade do Usuário */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
            
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 mx-auto flex items-center justify-center text-4xl font-black text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              {userData.name?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight truncate">{userData.name}</h2>
            <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${roleColors[userData.role]}`}>
              {roleLabels[userData.role]}
            </div>
            
            <div className="mt-10 space-y-4 text-left font-bold text-slate-100">
              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl transition-all">
                <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500">
                  <Users className="w-5 h-5 font-black" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-slate-500">Equipe Vinculada</span>
                  <span className="text-sm text-slate-200 font-black truncate uppercase tracking-tighter">{userData.team?.nome || 'Diretoria Global'}</span>
                </div>
              </div>

              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl transition-all">
                <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-500 font-black">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-slate-500">Cadastro no Portal</span>
                  <span className="text-sm text-slate-200 font-black uppercase tracking-tighter">{new Date(userData.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Atividade Pública e do Time */}
        <div className="lg:col-span-8 space-y-6 text-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Database className="w-12 h-12 text-emerald-400 font-black" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-slate-500">Acervo da Equipe</span>
                  <p className="text-4xl font-black text-white leading-none mb-2 tracking-tight">{teamTotalCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-widest">Base de scripts da unidade</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <GitFork className="w-12 h-12 text-amber-500 font-black" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-slate-500">Clonagens Feitas</span>
                  <p className="text-4xl font-black text-amber-500 leading-none mb-2 tracking-tight">{scriptsClonados.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-widest">Importados por este perfil</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-400/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="w-12 h-12 text-blue-400 font-black" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-slate-500">Favoritos</span>
                  <p className="text-4xl font-black text-blue-400 leading-none mb-2 tracking-tight">{favoriteCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-widest">Salvos como preferenciais</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Seção de Criações Originais */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                   <Database className="w-5 h-5 text-blue-400 font-black" />
                   <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Criações de {userData.name?.split(' ')[0]}</h3>
                </div>
              </div>

              <div className="divide-y divide-slate-800/50">
                {scriptsOriginais.length > 0 ? scriptsOriginais.map((script: any) => (
                  <Link key={script.id} href={`/scripts/${script.id}`} className="block p-4 px-8 hover:bg-slate-800/30 transition-all group">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4 truncate">
                          <div className={`w-2 h-2 rounded-full ${script.visibility === 'GLOBAL' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-black text-slate-200 group-hover:text-blue-400 transition-colors truncate uppercase tracking-tight">
                              {script.titulo}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {script.categoria?.nome || 'Sem Categoria'} • {new Date(script.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                )) : (
                  <div className="p-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest italic leading-relaxed">
                    Nenhuma criação pública disponível para este perfil.
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Scripts Clonados */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                <div className="flex items-center gap-3">
                   <GitFork className="w-5 h-5 text-amber-500 font-black" />
                   <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Clones Importados</h3>
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
                              ORIGEM: {script.clonadoDe?.autor?.name || 'Sistema'} • {script.clonadoDe?.team?.nome || 'Global'}
                            </span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-800 uppercase bg-slate-950 px-2 py-1 rounded border border-slate-800">FORK</span>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                  </Link>
                )) : (
                  <div className="p-12 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest italic leading-relaxed">
                    Não há clones públicos vinculados a este perfil.
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
