import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { User, Mail, Users, Calendar, Database, Sparkles, Star, Globe, Clock, ChevronRight } from 'lucide-react';
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
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { categoria: true }
      }
    }
  });

  if (!userData) redirect('/login');

  const teamId = userData.teamId;

  // Busca scripts favoritos, globais e estatísticas do time para o resumo
  const [favoriteCount, globalCount, teamTotalCount, teamSharedCount, teamImpactCount] = await Promise.all([
    prisma.favorite.count({ where: { userId: userData.id } }),
    prisma.script.count({ where: { autorId: userData.id, visibility: 'GLOBAL' } }),
    prisma.script.count({ where: { teamId: teamId } }),
    prisma.script.count({ where: { teamId: teamId, visibility: 'GLOBAL' } }),
    prisma.script.count({ 
      where: { 
        teamId: teamId, 
        visibility: 'GLOBAL', 
        favorites: { some: { user: { teamId: { not: teamId } } } } 
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Link href="/" className="hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-widest">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">Seu Perfil</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Seu Centro de Comando</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium uppercase tracking-wider">Visão geral das suas atividades e impacto da equipe na plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Identidade do Usuário (4 colunas) */}
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
            
            <div className="mt-10 space-y-4 text-left">
              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl transition-all">
                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
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
                  <span className="text-sm text-slate-200 font-black truncate">{userData.team?.nome || 'Diretoria Global'}</span>
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

        {/* Lado Direito: Dashboard de Conteúdo (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats em Grid de 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Database className="w-12 h-12 text-blue-500" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Scripts da Equipe</span>
                  <p className="text-4xl font-black text-white leading-none mb-2">{teamTotalCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-wider">Total produzidos pelo time</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="w-12 h-12 text-emerald-400" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Compartilhados (Time)</span>
                  <p className="text-4xl font-black text-emerald-400 leading-none mb-2">{teamSharedCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-wider">Scripts públicos da equipe</p>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="w-12 h-12 text-amber-500" />
               </div>
               <div className="flex flex-col h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Impacto Cross-Time</span>
                  <p className="text-4xl font-black text-amber-500 leading-none mb-2">{teamImpactCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-auto uppercase tracking-wider">Salvos por outros times</p>
               </div>
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-blue-400" />
                 <h3 className="text-lg font-bold text-white tracking-tight">Atividade Recente</h3>
              </div>
              <Link href="/explore" className="text-xs font-bold text-slate-500 hover:text-white transition-colors">
                Ver todos
              </Link>
            </div>

            <div className="divide-y divide-slate-800/50">
              {userData.scripts.length > 0 ? (
                userData.scripts.map((script) => (
                  <div key={script.id} className="p-4 px-8 hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4 truncate">
                          <div className={`w-2 h-2 rounded-full ${script.visibility === 'GLOBAL' ? 'bg-amber-500' : 'bg-blue-500 theme-pulse'}`} />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                              {script.titulo}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {script.categoria?.nome || 'Sem Categoria'} • Atualizado há {new Date(script.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                   <p className="text-sm text-slate-500 italic">Nenhum script criado recentemente.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-950/30 text-center">
               <button className="text-xs font-bold text-blue-500 hover:text-blue-400 hover:underline underline-offset-8 transition-all">
                 SOLICITAR RELATÓRIO DE ATIVIDADES COMPLETO
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
