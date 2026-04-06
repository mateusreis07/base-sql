'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Database } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciais inválidas. Verifique seu email e senha e tente novamente.');
      } else {
        router.push('/');
        router.refresh();
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
        <h1 className="text-4xl font-black text-white mb-1 mt-12 uppercase tracking-tighter leading-none">
          Base <span className="text-blue-500">SQL</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
          Centralize, versione e compartilhe o conhecimento SQL da sua equipe
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-900 text-red-300 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">E-mail</label>
          <input 
            required 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600" 
            placeholder="contato@mateus.dev"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Senha Mestra</label>
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
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-500 text-white font-medium py-3 rounded-lg mt-3 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
        >
          {loading ? 'Aguarde validando...' : 'Entrar na Base de Conhecimento'}
        </button>
      </form>
    </div>
  );
}
