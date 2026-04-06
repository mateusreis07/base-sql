'use client';

import { useState } from 'react';
import { Shield, Key, Search, Users, ChevronRight, Briefcase, Building2, UserCircle } from 'lucide-react';
import { resetUserPassword } from '@/app/actions/user';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  cargo: string | null;
  team: { nome: string } | null;
}

export function UsersClient({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredUsers = initialUsers.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.cargo?.toLowerCase().includes(search.toLowerCase()) ||
    u.team?.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleReset = async (userId: string) => {
    if (userId === currentUserId) {
      return toast.error('Você não pode resetar sua própria senha por aqui. Use as configurações de perfil.');
    }

    if (!confirm('Tem certeza que deseja resetar a senha deste usuário para a senha padrão "123456"?')) {
      return;
    }

    setLoadingId(userId);
    try {
      const result = await resetUserPassword(userId);
      if (result.success) {
        toast.success('Senha resetada com sucesso para "123456"!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao resetar senha');
    } finally {
      setLoadingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'ADMIN': return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Admin</span>;
      case 'NIVEL2': return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Editor N2</span>;
      default: return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Leitor N1</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <div>
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Gestão de Equipe</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Base de Usuários</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium uppercase tracking-wider">Visualize, busque e gerencie as credenciais da equipe.</p>
        </div>

        <div className="relative w-full md:w-96 group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/search:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email, cargo ou time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium placeholder:text-slate-600 shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
          <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative group hover:border-slate-700 transition-all active:scale-[0.99] overflow-hidden">
            {/* User Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-lg group-hover:from-blue-600 group-hover:to-indigo-600 transition-all shrink-0">
                  <UserCircle className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-black text-white leading-tight uppercase text-sm tracking-tight line-clamp-1">
                    {user.name || 'Sem Nome'}
                    {user.id === currentUserId && <span className="ml-2 text-[10px] text-blue-400 lowercase font-medium animate-pulse">(você)</span>}
                  </h3>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-3 mb-6 px-1">
              <div className="flex items-center gap-2.5 text-slate-400 font-medium tracking-tight">
                <Shield className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 font-medium tracking-tight">
                <Briefcase className="w-3.5 h-3.5 text-blue-500/70" />
                <span className="text-xs truncate uppercase font-bold tracking-wider">{user.cargo || 'Cargo não definido'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 font-medium tracking-tight">
                <Building2 className="w-3.5 h-3.5 text-indigo-500/70" />
                <span className="text-xs truncate uppercase font-bold tracking-wider">{user.team?.nome || 'DIRETORIA GLOBAL'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-5 border-t border-slate-800/50 flex items-center gap-3">
              <button 
                onClick={() => handleReset(user.id)}
                disabled={loadingId === user.id || user.id === currentUserId}
                className="flex-1 bg-slate-950 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 border border-slate-800 hover:border-red-500/30 text-slate-500 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 group/reset"
              >
                {loadingId === user.id ? (
                  'Processando...'
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 group-hover/reset:animate-pulse" />
                    Resetar Senha
                  </>
                )}
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4">
             <Search className="w-12 h-12 text-slate-800" />
             <p className="text-slate-600 font-black uppercase tracking-widest text-sm text-center">Nenhum usuário encontrado na sua busca.</p>
          </div>
        )}
      </div>

      <div className="bg-slate-950/30 border border-dashed border-slate-800 rounded-3xl p-8 py-6 flex items-center justify-between opacity-60">
          <p className="text-xs text-slate-500 font-medium">Você possui privilégios de administrador. Ações de reset são registradas em logs de auditoria.</p>
          <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">Administração v1.0</span>
      </div>
    </div>
  );
}
