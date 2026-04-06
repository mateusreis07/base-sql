'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Folder, FileCode } from 'lucide-react';

export function CommandMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Escuta Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Busca dados na API ao digitar com debounce
  useEffect(() => {
    if (!isOpen) return;
    
    setSelectedIndex(0);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/scripts?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  // Handle keyboard navigation inside the Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 < 0 ? results.length - 1 : prev - 1));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleModalKeys);
    return () => window.removeEventListener('keydown', handleModalKeys);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (id: string) => {
    router.push(`/scripts/${id}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Botão Gatilho Substituindo a Barra Antiga */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full relative flex items-center justify-between bg-slate-950 border border-slate-800 text-sm text-slate-400 rounded-md pl-10 pr-4 py-2 transition-all hover:bg-slate-800/80 hover:border-slate-700 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
        <span className="truncate pr-4 font-medium">Buscar scripts ou ir com Ctrl+K...</span>
        <kbd className="hidden md:inline-flex items-center justify-center gap-1 rounded bg-slate-800 border border-slate-700 px-1.5 h-5 font-mono text-[10px] font-medium text-slate-400 opacity-100 flex-shrink-0 shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Modal Overlay / Command Palette */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-slate-950/80">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[70vh]">
            
            {/* Cabeçalho do Modal Input */}
            <div className="flex items-center px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-900/50">
              <Search className={`w-5 h-5 mr-3 transition-colors ${loading ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque por título, código SQL oculto, tags..."
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-slate-500 placeholder:font-light focus:ring-0"
              />
              <kbd 
                className="ml-3 hidden sm:inline-flex items-center justify-center rounded bg-slate-800 border border-slate-700 px-2 h-6 font-mono text-xs font-medium text-slate-400 cursor-pointer hover:text-white" 
                onClick={() => setIsOpen(false)}
              >
                ESC
              </kbd>
            </div>

            {/* Corpo dos Resultados */}
            <div className="flex-1 overflow-y-auto p-2 min-h-[100px]">
              {!query ? (
                <div className="p-8 text-center text-slate-500 text-sm font-medium">
                  Pesquise globalmente em todo o banco de dados de Scripts do sistema.
                </div>
              ) : loading && results.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Minerando scripts...
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                   <Folder className="w-8 h-8 mb-2 opacity-50" />
                   Nenhum script esconde algo parecido com "{query}"
                </div>
              ) : (
                <ul className="space-y-1" ref={listRef}>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Scripts e Queries Rápidas Encontradas ({results.length})
                  </div>
                  {results.map((script, index) => (
                    <li key={script.id}>
                      <button
                        onClick={() => handleSelect(script.id)}
                        className={`w-full text-left flex items-start gap-4 px-3 py-3 rounded-lg border focus:outline-none transition-colors ${
                          index === selectedIndex
                            ? 'bg-blue-600/10 border-blue-500/20 text-blue-100 shadow-sm'
                            : 'bg-transparent border-transparent hover:bg-slate-800/50 text-slate-200'
                        }`}
                      >
                        <FileCode className={`w-5 h-5 shrink-0 mt-0.5 ${index === selectedIndex ? 'text-blue-500' : 'text-slate-500'}`} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`font-medium truncate ${index === selectedIndex ? 'text-blue-400' : 'text-white'}`}>
                            {script.titulo}
                          </span>
                          <span className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1.5">
                            {(script as any).autor?.name ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800/80">{(script as any).autor.name}</span>
                            ) : null}
                            {script.categoria ? <span className="font-medium text-slate-400">{script.categoria.nome}</span> : ''} 
                            {script.categoria && script.descricao ? ' · ' : ''} 
                            {script.descricao || 'Sem descrição neste código'}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Rodapé Dicas de Navegação */}
            <div className="border-t border-slate-800 p-2 px-4 flex items-center justify-between text-xs text-slate-500 shrink-0 bg-slate-900/80">
              <div className="flex gap-4">
                <span>Use <kbd className="font-mono bg-slate-800 rounded px-1.5 border border-slate-700">↑</kbd> <kbd className="font-mono bg-slate-800 rounded px-1.5 border border-slate-700">↓</kbd> para navegar</span>
                <span className="hidden sm:inline">Pressione <kbd className="font-mono bg-slate-800 rounded px-1 border border-slate-700">Enter</kbd> para abrir painel integral</span>
              </div>
              <span className="font-medium tracking-wide">BaseSQL Spotlight</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
