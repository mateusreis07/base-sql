'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Folder, Tags as TagsIcon, Clock, Database, X, ChevronDown, ChevronRight, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScriptCard } from '@/components/ui/ScriptCard';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
  teams: { id: string, nome: string; _count?: { scripts: number } }[];
  currentFilters: { q?: string; categoria?: string; tag?: string; tipoBanco?: string; sistema?: string };
}

export function ExploreClient({ initialScripts, categorias, tags, teams, currentFilters }: ExploreClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scripts = initialScripts;
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

  // Agrupa categorias por time
  const categoriasByTeam: Record<string, Categoria[]> = {};

  // Ordena os times já no servidor, mas vamos reforçar aqui para incluir o Global se necessário
  const sortedTeams = [...teams].sort((a, b) => {
    const countA = a._count?.scripts || 0;
    const countB = b._count?.scripts || 0;
    if (countB !== countA) return countB - countA;
    return a.nome.localeCompare(b.nome);
  });

  sortedTeams.forEach(team => {
    categoriasByTeam[team.nome] = categorias.filter(c => c.team?.id === team.id);
  });

  // Categorias Globais (sem time)
  const globalCats = categorias.filter(c => !c.team);
  if (globalCats.length > 0) {
     // Onde colocar o Global? Geralmente no topo ou no fim. 
     // Usuário quer "times que tiverem mais scripts na frente".
     // Vou inserir no objeto e deixar a renderização seguir a ordem de inserção.
     // Mas se Global tiver muitos scripts, ele deve ir pra frente?
     // Vamos considerar Global como um "time" para o cálculo.
     categoriasByTeam['Global'] = globalCats;
  }

  // Se o usuário quer a regra de "mais scripts na frente" aplicada a TUDO (incluindo Global), 
  // precisamos reordenar as chaves do objeto final.
  const sortedTeamNames = Object.keys(categoriasByTeam).sort((a, b) => {
    if (a === 'Global' || b === 'Global') {
       // Cálculo manual para Global
       const getCount = (name: string) => {
         if (name === 'Global') {
           // Aproximação: categorias globais costumam ter scripts
           return globalCats.reduce((acc, cat) => acc + (cat._count?.scripts || 0), 0);
         }
         return teams.find(t => t.nome === name)?._count?.scripts || 0;
       };
       const countA = getCount(a);
       const countB = getCount(b);
       if (countB !== countA) return countB - countA;
    } else {
       const countA = teams.find(t => t.nome === a)?._count?.scripts || 0;
       const countB = teams.find(t => t.nome === b)?._count?.scripts || 0;
       if (countB !== countA) return countB - countA;
    }
    return a.localeCompare(b);
  });

  const updateFilters = (newFilters: { categoria?: string | null; tag?: string | null; q?: string | null; tipoBanco?: string | null; sistema?: string | null }) => {
    const params = new URLSearchParams();
    
    // Preserve existing, apply new overrides
    const finalQ = newFilters.q !== undefined ? newFilters.q : currentFilters.q;
    const finalCategoria = newFilters.categoria !== undefined ? newFilters.categoria : currentFilters.categoria;
    const finalTag = newFilters.tag !== undefined ? newFilters.tag : currentFilters.tag;
    const finalTipoBanco = newFilters.tipoBanco !== undefined ? newFilters.tipoBanco : currentFilters.tipoBanco;
    const finalSistema = newFilters.sistema !== undefined ? newFilters.sistema : currentFilters.sistema;

    if (finalQ) params.set('q', finalQ);
    if (finalCategoria) params.set('categoria', finalCategoria);
    if (finalTag) params.set('tag', finalTag);
    if (finalTipoBanco) params.set('tipoBanco', finalTipoBanco);
    if (finalSistema) params.set('sistema', finalSistema);

    startTransition(() => {
      router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push('/explore');
    });
  };

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

        {/* New Filters: Banco de Dados e Sistema */}
        <div className="space-y-4 pt-1 mb-2">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 opacity-80">
              <Database className="w-3.5 h-3.5" /> Banco de Dados
            </h3>
            <CustomSelect 
              value={currentFilters.tipoBanco || ''}
              onChange={(val) => updateFilters({ tipoBanco: val || null })}
              size="sm"
              options={[
                { value: '', label: 'Todos os Bancos' },
                { value: 'POSTGRESQL', label: 'PostgreSQL' },
                { value: 'MYSQL', label: 'MySQL' }
              ]}
            />
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 opacity-80">
              <Clock className="w-3.5 h-3.5" /> Sistema
            </h3>
            <CustomSelect 
              value={currentFilters.sistema || ''}
              onChange={(val) => updateFilters({ sistema: val || null })}
              size="sm"
              options={[
                { value: '', label: 'Todos os Sistemas' },
                { value: 'SAJ5', label: 'SAJ 5' },
                { value: 'SAJ_ONLINE', label: 'SAJ Online' }
              ]}
            />
          </div>
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
            
            {sortedTeamNames.map(teamName => {
              const cats = categoriasByTeam[teamName];
              return (
              <div key={teamName}>
                <button 
                  onClick={() => setOpenTeams(prev => ({ ...prev, [teamName]: prev[teamName] === false ? true : false }))}
                  className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white w-full uppercase tracking-wider mb-1 pr-1 group"
                >
                  <div className="flex items-center gap-1.5 ">
                    {openTeams[teamName] === false ? <ChevronRight className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                    {teamName}
                  </div>
                  {/* Total script count for the team */}
                  {(() => {
                    if (teamName === 'Global') {
                      const totalScripts = globalCats.reduce((acc, cat) => acc + (cat._count?.scripts || 0), 0);
                      return totalScripts > 0 && (
                        <span className="text-[9px] px-1 bg-slate-800/40 text-slate-600 rounded group-hover:bg-slate-700/60 group-hover:text-slate-500 transition-colors font-black">
                          {totalScripts}
                        </span>
                      );
                    }
                    const team = teams.find(t => t.nome === teamName);
                    const totalScripts = (team as any)?._count?.scripts || 0;
                    return totalScripts > 0 && (
                      <span className="text-[9px] px-1 bg-slate-800/40 text-slate-600 rounded group-hover:bg-slate-700/60 group-hover:text-slate-500 transition-colors font-black">
                        {totalScripts}
                      </span>
                    );
                  })()}
                </button>
                {openTeams[teamName] !== false && (
                  <ul className="space-y-1 pl-2 border-l border-slate-800 ml-[7px] mt-1.5">
                    {cats.length === 0 && (
                      <li className="px-2 py-1 text-[10px] text-slate-600 italic">Nenhuma categoria</li>
                    )}
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
              );
            })}
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
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
        {/* Top Loading Bar */}
        {isPending && (
          <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-blue-500/10">
            <div className="h-full bg-blue-500 animate-[loading-bar_1.5s_infinite_ease-in-out] w-1/3" />
          </div>
        )}

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
          {(currentFilters.categoria || currentFilters.tag || currentFilters.q || currentFilters.tipoBanco || currentFilters.sistema) && (
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
              {currentFilters.tipoBanco && (
                <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 rounded text-sm flex items-center gap-1">
                  DB: {currentFilters.tipoBanco}
                  <button onClick={() => updateFilters({ tipoBanco: null })}><X className="w-3 h-3 hover:text-white"/></button>
                </span>
              )}
              {currentFilters.sistema && (
                <span className="px-2 py-0.5 bg-orange-900/40 text-orange-300 border border-orange-800/50 rounded text-sm flex items-center gap-1">
                  Sistema: {currentFilters.sistema.replace('_', ' ')}
                  <button onClick={() => updateFilters({ sistema: null })}><X className="w-3 h-3 hover:text-white"/></button>
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
