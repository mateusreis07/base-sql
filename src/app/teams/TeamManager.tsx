'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, X, Save, ShieldAlert, User as UserIcon, LogOut, Check, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Team = { 
  id: string; 
  nome: string; 
  ownerId: string | null;
  owner?: { id: string, name: string | null, email: string | null } | null;
  _count?: { users: number; scripts: number };
  isGlobal?: boolean;
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
};

export function TeamManager({ initialTeams = [], allUsers = [] }: { initialTeams: Team[], allUsers: User[] }) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'members'>('basic');
  
  // Basic Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [ownerId, setOwnerId] = useState('');
  
  // Members State
  const [currentMembers, setCurrentMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMembers = async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (res.ok) {
        const data = await res.json();
        setCurrentMembers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openForm = (team?: Team) => {
    setError('');
    if (team?.isGlobal) {
      setActiveTab('members');
    } else {
      setActiveTab('basic');
    }

    if (team) {
      setEditingId(team.id);
      setNome(team.nome);
      setOwnerId(team.ownerId || '');
      fetchMembers(team.id);
    } else {
      setEditingId(null);
      setNome('');
      setOwnerId('');
      setCurrentMembers([]);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setNome('');
    setOwnerId('');
    setCurrentMembers([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    setLoading(true);
    setError('');

    try {
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, ownerId: ownerId || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar');
      }
      
      const teamSaved = await res.json();
      
      if (editingId) {
        setTeams(teams.map(t => t.id === editingId ? { ...teamSaved, _count: t._count } : t));
      } else {
        setTeams([...teams, { ...teamSaved, _count: { users: 0, scripts: 0 } }].sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      
      // If we are in "Basic" tab for a new team, maybe stay or close. For consistency, let's close.
      if (!editingId) {
        closeForm();
      } else if (activeTab === 'basic') {
        // Just show success if needed, or close
        closeForm();
      }
      
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = async (userId: string, isMember: boolean) => {
    if (!editingId) return;
    
    try {
      const res = await fetch(`/api/teams/${editingId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: isMember ? 'remove' : 'add' })
      });

      if (res.ok) {
        if (isMember) {
          setCurrentMembers(currentMembers.filter(m => m.id !== userId));
        } else {
          const user = allUsers.find(u => u.id === userId);
          if (user) setCurrentMembers([...currentMembers, user]);
        }
        router.refresh(); // Update the main list counts
      }
    } catch (err) {
      alert('Erro ao gerenciar membro');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o time "${name}"?`)) return;

    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao deletar');
      
      setTeams(teams.filter(t => t.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Gestão de Equipes
          </h1>
          <p className="text-slate-500 mt-1">Organize os times, defina gestores e controle membros vinculados.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Criar Equipe
          </button>
        )}
      </div>

      <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-5 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-indigo-400 shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-indigo-300">Nível Governança</p>
          <p className="text-indigo-400/80">O Gestor do time tem autonomia sobre os scripts da equipe. Membros vinculados visualizam apenas o conteúdo permitido pelo seu nível de acesso e o conteúdo do time.</p>
        </div>
      </div>

      {/* Modal Overlay para Criar/Editar */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeForm} />
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {teams.find(t => t.id === editingId)?.isGlobal ? <Briefcase className="w-6 h-6 text-amber-500" /> : <Users className="w-6 h-6 text-blue-500" />}
                  {editingId ? (teams.find(t => t.id === editingId)?.isGlobal ? 'Membros da Diretoria Global' : `Gerenciar: ${nome}`) : 'Configurar Nova Equipe'}
                </h2>
              </div>
              <button onClick={closeForm} className="text-slate-500 hover:text-white bg-slate-800/20 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Selector (Only show if editing and NOT global) */}
            {editingId && !teams.find(t => t.id === editingId)?.isGlobal && (
              <div className="flex bg-slate-950/50 border-b border-slate-800">
                <button 
                  onClick={() => setActiveTab('basic')}
                  className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'basic' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  DADOS DA EQUIPE
                </button>
                <button 
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'members' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  MEMBROS DA EQUIPE ({currentMembers.length})
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'basic' ? (
                <form id="team-form" onSubmit={handleSave} className="space-y-6">
                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-xs rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-400 ml-1">Nome da Equipe</label>
                    <input 
                      required
                      autoFocus
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Ex: Engenharia de Dados, Vendas, RH..."
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-400 ml-1">Gestor Responsável</label>
                    <select 
                      value={ownerId}
                      onChange={e => setOwnerId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">👤 Selecione um Gestor (Opcional)</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name || u.email}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 ml-1">O gestor aparece como referência no card da equipe.</p>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                   <div className="relative">
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            toggleMember(e.target.value, false);
                            e.target.value = "";
                          }
                        }}
                        className="w-full bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">➕ Vincular Novo Membro...</option>
                        {allUsers.filter(u => !currentMembers.find(m => m.id === u.id)).map(u => (
                          <option key={u.id} value={u.id} className="bg-slate-900 text-white">{u.name || u.email}</option>
                        ))}
                      </select>
                   </div>

                   <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Membros Atuais</p>
                      {loadingMembers ? (
                        <p className="text-sm text-slate-500 p-4">Carregando...</p>
                      ) : currentMembers.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl text-center">
                          <p className="text-slate-600 text-sm">Nenhum membro vinculado a esta equipe.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                           {currentMembers.map(member => (
                             <div key={member.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-500">
                                      {member.name?.[0] || 'U'}
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-white leading-none">{member.name || 'Sem Nome'}</p>
                                      <p className="text-[10px] text-slate-500 mt-1">{member.email}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => toggleMember(member.id, true)}
                                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                  title="Remover do Time"
                                >
                                   <LogOut className="w-4 h-4" />
                                </button>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'basic' && (
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
                <button 
                  form="team-form"
                  type="submit" 
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
                >
                  {loading ? 'Processando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                </button>
                {!editingId && (
                   <button 
                    type="button" 
                    onClick={closeForm} 
                    className="flex-1 py-3 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-400">Nenhum time configurado</p>
            <p className="text-sm mt-1">Clique no botão acima para adicionar a primeira equipe.</p>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className={`bg-slate-900 border ${team.isGlobal ? 'border-amber-500/30' : 'border-slate-800'} rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden flex flex-col h-full shadow-xl`}>
               <div className={`absolute top-0 right-0 w-32 h-32 ${team.isGlobal ? 'bg-amber-500/10' : 'bg-blue-500/5'} rounded-full -mr-16 -mt-16`} />
               
               <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-xl border ${team.isGlobal ? 'bg-amber-500/10 border-amber-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                    {team.isGlobal ? (
                      <Briefcase className="w-6 h-6 text-amber-500" />
                    ) : (
                      <Users className="w-6 h-6 text-blue-500" />
                    )}
                 </div>
                 
                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openForm(team)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-blue-400" title={team.isGlobal ? 'Ver Usuários Globais' : 'Gerenciar Equipe'}>
                      <Settings className="w-4 h-4" />
                    </button>
                    {!team.isGlobal && (
                      <button onClick={() => handleDelete(team.id, team.nome)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                 </div>
                 
                 {team.isGlobal && (
                    <span className="text-[10px] font-bold text-amber-500/60 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">SISTEMA</span>
                 )}
               </div>

               <div className="flex-1">
                 <h3 className={`text-xl font-bold ${team.isGlobal ? 'text-amber-100' : 'text-white'} mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight`}>
                   {team.nome}
                 </h3>
                 
                 {team.isGlobal ? (
                    <div className="flex items-center gap-2 text-slate-400 mb-6">
                       <ShieldAlert className="w-3 h-3 text-amber-500/50" />
                       <span className="text-xs font-medium">Nível: <span className="text-amber-500/70">Acesso Total Irrestrito</span></span>
                    </div>
                 ) : team.owner ? (
                    <div className="flex items-center gap-2 text-slate-400 mb-6">
                       <UserIcon className="w-3 h-3" />
                       <span className="text-xs font-medium">Gestor: <span className="text-slate-300">{team.owner.name || team.owner.email}</span></span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 text-slate-500 mb-6">
                       <div className="w-3 h-3 rounded-full border border-slate-700" />
                       <span className="text-xs">Sem gestor definido</span>
                    </div>
                 )}
               </div>

               <div className={`grid grid-cols-2 gap-4 mt-auto border-t ${team.isGlobal ? 'border-amber-500/10' : 'border-slate-800/50'} pt-6`}>
                  <div className={`text-center p-3 rounded-xl bg-slate-950/50 border ${team.isGlobal ? 'border-amber-500/10' : 'border-slate-800'}`}>
                    <p className={`text-[10px] ${team.isGlobal ? 'text-amber-500/50' : 'text-slate-500'} font-bold uppercase tracking-widest leading-none mb-2`}>Usuários</p>
                    <p className="text-xl font-bold text-white">{team._count?.users || 0}</p>
                  </div>
                  <div className={`text-center p-3 rounded-xl bg-slate-950/50 border ${team.isGlobal ? 'border-amber-500/10' : 'border-slate-800'}`}>
                    <p className={`text-[10px] ${team.isGlobal ? 'text-amber-500/50' : 'text-slate-500'} font-bold uppercase tracking-widest leading-none mb-2`}>Scripts</p>
                    <p className="text-xl font-bold text-white">{team._count?.scripts || 0}</p>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Pequeno helper para o ícone de configurações que faltou no import inicial
function Settings({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
