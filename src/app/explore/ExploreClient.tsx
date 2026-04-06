'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Folder, Tags as TagsIcon, Clock, Database, X, ChevronDown, ChevronRight, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScriptCard } from '@/components/ui/ScriptCard';

type Categoria = { id: string; nome: string; cor?: string | null; team?: { id: string; nome: string } | null; _count?: { scripts: number } };
type Tag = { id: string; nome: string };
type Script = {
  id: string;
  titulo: string;
  descricao: string | null;
  codigoSql: string;
  createdAt: Date;
  categoria: Categoria | null;
  tags: { Tag: Tag }[];
  autor?: { name: string } | null;
  team?: { nome: string } | null;
  visibility?: 'GLOBAL' | 'TIME';
};

interface ExploreClientProps {
  initialScripts: Script[];
  categorias: Categoria[];
  tags: Tag[];
  currentFilters: { q?: string; categoria?: string; tag?: string };
}

export function ExploreClient({ initialScripts, categorias, tags, currentFilters }: ExploreClientProps) {
  const router = useRouter();
  const scripts = initialScripts;
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

  // Agrupa categorias por time
  const categoriasByTeam = categorias.reduce((acc, cat) => {
    const teamName = cat.team?.nome || 'Global';
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(cat);
    return acc;
  }, {} as Record<string, Categoria[]>);

  const updateFilters = (newFilters: { categoria?: string | null; tag?: string | null; q?: string | null }) => {
    const params = new URLSearchParams();
    
    // Preserve existing, apply new overrides
    const finalQ = newFilters.q !== undefined ? newFilters.q : currentFilters.q;
    const finalCategoria = newFilters.categoria !== undefined ? newFilters.categoria : currentFilters.categoria;
    const finalTag = newFilters.tag !== undefined ? newFilters.tag : currentFilters.tag;

    if (finalQ) params.set('q', finalQ);
    if (finalCategoria) params.set('categoria', finalCategoria);
    if (finalTag) params.set('tag', finalTag);

    router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const clearAll = () => router.push('/explore');

  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)] -m-6 bg-slate-950 overflow-hidden">
      {/* Left Sidebar Filters */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 overflow-y-auto flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 text-white">
            <Filter className="w-4 h-4" /> Filtros
          </h2>
          {(currentFilters.categoria || currentFilters.tag || currentFilters.q) && (
            <button 
              onClick={clearAll}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              Limpar
            </button>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Categorias</h3>
          <div className="space-y-4">
            <button 
              onClick={() => updateFilters({ categoria: null })}
              className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${!currentFilters.categoria ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              Exibir Tudo
            </button>
            
            {Object.entries(categoriasByTeam).map(([teamName, cats]) => (
              <div key={teamName}>
                <button 
                  onClick={() => setOpenTeams(prev => ({ ...prev, [teamName]: prev[teamName] === false ? true : false }))}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white w-full uppercase tracking-wider mb-1"
                >
                  {openTeams[teamName] === false ? <ChevronRight className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                  {teamName}
                </button>
                {openTeams[teamName] !== false && (
                  <ul className="space-y-1 pl-2 border-l border-slate-800 ml-[7px] mt-1.5">
                    {cats.map(cat => (
                      <li key={cat.id}>
                        <button 
                          onClick={() => updateFilters({ categoria: currentFilters.categoria === cat.id ? null : cat.id })}
                          className={`w-full text-left px-2 py-1 flex items-center gap-2 transition-colors ${currentFilters.categoria === cat.id ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          <Folder className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate text-xs flex-1">{cat.nome}</span>
                          {cat._count && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold group-hover:bg-slate-700 transition-colors">
                              {cat._count.scripts}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button 
                key={tag.id}
                onClick={() => updateFilters({ tag: currentFilters.tag === tag.id ? null : tag.id })}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${currentFilters.tag === tag.id ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
              >
                #{tag.nome}
              </button>
            ))}
            {tags.length === 0 && <span className="text-sm text-slate-600">Nenhuma tag inserida.</span>}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Search className="w-6 h-6 text-slate-400" />
              Explorador de Scripts
            </h1>
            <p className="text-sm font-medium bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
              {scripts.length} script{scripts.length !== 1 && 's'} listado{scripts.length !== 1 && 's'}
            </p>
          </div>

          {/* Search Input Custom inside Explorer */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar por texto ou código neste filtro..." 
              defaultValue={currentFilters.q || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFilters({ q: e.currentTarget.value || null });
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 shadow-sm"
            />
          </div>

          {/* Active filter badges */}
          {(currentFilters.categoria || currentFilters.tag || currentFilters.q) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500">Filtros ativos:</span>
              {currentFilters.q && (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-sm flex items-center gap-1">
                  Busca: "{currentFilters.q}" 
                  <button onClick={() => updateFilters({ q: null })}><X className="w-3 h-3 hover:text-white"/></button>
                </span>
              )}
              {currentFilters.categoria && (
                <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded text-sm flex items-center gap-1">
                  Categoria: {categorias.find(c => c.id === currentFilters.categoria)?.nome}
                  <button onClick={() => updateFilters({ categoria: null })}><X className="w-3 h-3 hover:text-white"/></button>
                </span>
              )}
              {currentFilters.tag && (
                <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded text-sm flex items-center gap-1">
                  Tag: #{tags.find(t => t.id === currentFilters.tag)?.nome}
                  <button onClick={() => updateFilters({ tag: null })}><X className="w-3 h-3 hover:text-white"/></button>
                </span>
              )}
            </div>
          )}

          {/* Results List */}
          {scripts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center mt-6">
              <Database className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-medium text-white mb-2">Nenhum script encontrado</h3>
              <p className="text-slate-400">Tente remover alguns filtros para ver mais resultados.</p>
              <button 
                onClick={clearAll}
                className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mt-6">
              {scripts.map(script => (
                <ScriptCard key={script.id} script={script} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
