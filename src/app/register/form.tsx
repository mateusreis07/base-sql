'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm({ teams }: { teams: { id: string, nome: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamSelection, setTeamSelection] = useState('global');
  const [role, setRole] = useState('NIVEL1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          teamId: teamSelection,
          role: role
        })
      });

      if (!res.ok) {
        const payload = await res.json();
        setError(payload.error || 'Erro no cadastro: Este email já pode estar em uso na plataforma.');
      } else {
        setSuccess('Usuário corporativo criado com sucesso!');
        setEmail('');
        setPassword('');
        setName('');
        router.refresh(); // atualiza a contagem/dados em background se necessário
      }
    } catch (err) {
      setError('Ocorreu um erro interno de comunicação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative">
      <div className="text-center mb-8">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-500/10 p-3 rounded-full border border-blue-500/20">
          <Database className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 mt-12">Painel de Acesso</h1>
        <p className="text-slate-400 text-sm">Painel do Administrador: Criação de usuários.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-900 text-red-300 rounded-md text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-950/50 border border-green-900 text-green-300 rounded-md text-sm text-center">
            {success}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Nome Completo</label>
          <input
            required
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            placeholder="Ex: Mateus Reis"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">E-mail corporativo</label>
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            placeholder="nome@empresa.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Equipe Vinculada</label>
          <select
            required
            value={teamSelection}
            onChange={e => setTeamSelection(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          >
            <option value="global">💼 Diretoria Global (Sem Time Específico)</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>🏢 {t.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Perfil (Role)</label>
          <select
            required
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          >
            <option value="NIVEL1">Nível 1 (Acesso em Leitura Focada)</option>
            <option value="NIVEL2">Nível 2 (Criador de Queries para o Time)</option>
            <option value="ADMIN">Admin (Acesso Total / Diretoria)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Senha Padrão Provisória</label>
          <input
            required
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            placeholder="********"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-500 text-white font-bold py-3 rounded-lg mt-3 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Adicionar Usuário ao Sistema'}
        </button>

        <div className="flex flex-col gap-4 mt-2 border-t border-slate-800 pt-6">
          <Link 
            href="/users" 
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg text-center transition-colors shadow-lg border border-slate-700 active:scale-[0.98] text-sm"
          >
            Gerenciar Usuários Existentes
          </Link>
          
          <Link href="/" className="text-center text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase font-black tracking-widest">
            Voltar ao Início
          </Link>
        </div>
      </form>
    </div>
  );
}
