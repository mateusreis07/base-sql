'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderOpen, Tags, Search, Database, UserPlus, Users, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  
  // Debug para garantir que o papel está chegando corretamente
  // console.log('Sidebar user role:', user?.role);
  
  const isAdmin = user?.role === 'ADMIN';

  // Expande quando o mouse estiver em cima
  const isExpanded = isHovered;

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        className={`flex items-center gap-4 px-3 py-3 rounded-md transition-colors ${
          isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
        title={!isExpanded ? label : undefined}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span 
          className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'opacity-100 w-44 ml-1' : 'opacity-0 w-0'
          }`}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* 
        Espaçador Base: 
        Fica no fundo de forma fixa na árvore do DOM ocupando exatamente w-16 (64px).
        Isso impede que o site inteiro fique pulando/tremendo (Reflow Layout) quando a nav real crescer. 
      */}
      <div className="w-16 shrink-0 h-full bg-slate-950 border-r border-slate-800 hidden md:block" />

      {/* A Sidebar Real Flutuante */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 bottom-0 transition-all duration-300 ease-in-out bg-slate-900 flex flex-col h-full z-[50] overflow-hidden ${
          isExpanded ? 'w-64 shadow-[10px_0_30px_rgba(0,0,0,0.5)]' : 'w-16'
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden text-blue-500">
             <Database className="w-[22px] h-[22px] shrink-0" />
             {/* O texto agora vive no Header */}
          </div>
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-y-auto overflow-x-hidden border-r border-slate-800">
          <NavItem href="/" icon={Home} label="Início" />
          <NavItem href="/explore" icon={Search} label="Explorar" />
          <NavItem href="/favoritos" icon={Star} label="Favoritos" />
          <NavItem href="/categorias" icon={FolderOpen} label="Categorias" />
          <NavItem href="/tags" icon={Tags} label="Tags" />
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
              {isExpanded && (
                <div className="px-4 mb-1">
                  <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.25em] animate-in fade-in duration-500">Administração</span>
                </div>
              )}
              <NavItem href="/teams" icon={Users} label="Gestão Equipes" />
              <NavItem href="/register" icon={UserPlus} label="Gestão Usuários" />
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
