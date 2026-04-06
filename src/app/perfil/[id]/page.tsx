import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Mail, Users, Calendar, Database, Sparkles, Star, Globe, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PublicProfileProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { id } = await params;
  const session = await auth();
  
  // Se for o próprio perfil, redireciona para a página principal de perfil (opcional, mas bom UX)
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
        where: { visibility: 'GLOBAL' }, // Apenas scripts públicos no perfil público
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { categoria: true }
      }
    }
  });

  if (!userData) notFound();

  const teamId = userData.teamId;

  // Busca estatísticas públicas e do time
  const [favoriteCount, globalCount, teamTotalCount, teamSharedCount, teamImpactCount] = await Promise.all([
    prisma.favorite.count({ where: { userId: userData.id, script: { visibility: 'GLOBAL' } } }),
    prisma.script.count({ where: { autorId: userData.id, visibility: 'GLOBAL' } }),
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Link href="/" className="hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-widest">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">Perfil Público</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Perfil de {userData.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Visualização de contribuições e impacto da equipe.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Identidade do Usuário */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600"></div>
            
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 mx-auto flex items-center justify-center text-4xl font-black text-white shadow-[0_0_40px_rgba(16,185,129,0.2)] mb-6 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              {userData.name?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight truncate">{userData.name}</h2>
            <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${roleColors[userData.role]}`}>
              {roleLabels[userData.role]}
            </div>
            
            <div className="mt-10 space-y-4 text-left">
              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:border-emerald-500/30 transition-all">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Time</span>
                  <span className="text-sm text-slate-200 font-black truncate">{userData.team?.nome || 'Diretoria Global'}</span>
                </div>
              </div>

              <div className="group flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:border-blue-500/30 transition-all">
                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Entrou em</span>
                  <span className="text-sm text-slate-200 font-black">{new Date(userData.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Atividade Pública e do Time */}
        <div className="lg:col-span-8 space-y-6">
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
                  <Globe className="w-12 h-12 text-emerald-500" />
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

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-3">
                 <Database className="w-5 h-5 text-emerald-400" />
                 <h3 className="text-lg font-bold text-white tracking-tight">Scripts Públicos de {userData.name?.split(' ')[0]}</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-800/50">
              {userData.scripts.length > 0 ? (
                userData.scripts.map((script) => (
                  <div key={script.id} className="p-4 px-8 hover:bg-slate-800/30 transition-colors group">
                    <Link href={`/scripts/${script.id}`} className="flex items-center justify-between">
                       <div className="flex items-center gap-4 truncate">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                              {script.titulo}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {script.categoria?.nome || 'Sem Categoria'} • Atualizado {new Date(script.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                   <p className="text-sm text-slate-500 italic">Este usuário ainda não publicou scripts globais.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
