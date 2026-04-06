'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { CommandMenu } from './CommandMenu';
import { logoutUser } from '@/app/actions/auth';

export function Header({ user }: { user?: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logoutUser();
  };
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isN1 = user?.role === 'NIVEL1';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-[100] shrink-0 sticky top-0 gap-4">
      {/* Esquerda: Identidade Visual constante */}
      <div className="flex-1 flex items-center gap-2 pr-4">
        <Link href="/" className="text-xl font-bold text-white tracking-tight whitespace-nowrap translate-x-[-10px] hover:text-blue-400 transition-colors">
          Base SQL
        </Link>
      </div>

      {/* Centro: Pesquisa Centralizada */}
      <div className="flex-[2] max-w-xl w-full mx-6 md:mx-10">
        <CommandMenu />
      </div>
      
      {/* Direita: Ações de Usuário */}
      <div className="flex-1 flex items-center justify-end gap-3 md:gap-4">
        {!isN1 && (
          <Link 
            href="/scripts/new" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Novo Script</span>
          </Link>
        )}

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-3 p-1.5 pr-4 rounded-full transition-all ${isMenuOpen ? 'bg-slate-800 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800'} border`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-slate-900">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Perfil</span>
              <span className="text-sm font-bold text-slate-200">
                {user?.name?.split(' ')[0] || 'Usuário'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-blue-400' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col z-[110]">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">{user?.email}</p>
              </div>
              
              <div className="p-1">
                <Link 
                  href="/perfil" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  <UserIcon className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                  Perfil
                </Link>
              </div>

              <div className="p-1 border-t border-slate-800">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-red-400/70 group-hover:text-red-400" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
