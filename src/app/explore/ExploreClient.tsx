'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Folder, Tags as TagsIcon, Clock, Database, X, ChevronDown, ChevronRight, Copy, Check, Eye, EyeOff, Globe } from 'lucide-react';
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
      {/* Left Sidebar Filters - Refined Premium */}
      <div className="w-72 border-r border-slate-900 bg-slate-950 p-6 overflow-y-auto flex flex-col gap-8 custom-scrollbar">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-[0.3em]">
            <Filter className="w-3.5 h-3.5 text-blue-500" /> Filtros
          </h2>
          {(currentFilters.categoria || currentFilters.tag || currentFilters.q || currentFilters.tipoBanco || currentFilters.sistema) && (
            <button
              onClick={clearAll}
              className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
            >
              Resetar
            </button>
          )}
        </div>

        {/* Banco de dados e Sistema Filter Group */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <Database className="w-3 h-3" /> Banco de Dados
            </h3>
            <CustomSelect
              value={currentFilters.tipoBanco || ''}
              onChange={(val) => updateFilters({ tipoBanco: val || null })}
              size="sm"
              options={[
                { value: '', label: 'Qualquer Banco' },
                { value: 'POSTGRESQL', label: 'PostgreSQL' },
                { value: 'MYSQL', label: 'MySQL' }
              ]}
            />
          </div>

          <div>
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Sistema
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

        {/* Categorias Accordion-style */}
        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
            <Folder className="w-3 h-3" /> Equipes / Categorias
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => updateFilters({ categoria: null })}
              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-tight transition-all border ${!currentFilters.categoria ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900/50'}`}
            >
              Explorar Todas
            </button>

            {sortedTeamNames.map(teamName => {
              const cats = categoriasByTeam[teamName];
              const isOpen = openTeams[teamName] !== false;
              return (
                <div key={teamName} className="space-y-1">
                  <button
                    onClick={() => setOpenTeams(prev => ({ ...prev, [teamName]: !isOpen }))}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black w-full uppercase tracking-widest transition-all ${isOpen ? 'text-slate-300 bg-slate-900/30' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3" />}
                      {teamName}
                    </div>
                  </button>

                  {isOpen && (
                    <ul className="pl-6 space-y-0.5 border-l border-slate-900 ml-4.5 mt-1 animate-in fade-in slide-in-from-left-1 duration-200">
                      {cats.length === 0 && (
                        <li className="px-3 py-1.5 text-[9px] text-slate-700 uppercase font-bold italic tracking-tighter">Vazio</li>
                      )}
                      {cats.map(cat => (
                        <li key={cat.id}>
                          <button
                            onClick={() => updateFilters({ categoria: currentFilters.categoria === cat.id ? null : cat.id })}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-all rounded-lg group ${currentFilters.categoria === cat.id ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'}`}
                          >
                            <span className="truncate text-[11px] font-bold tracking-tight">{cat.nome}</span>
                            {cat._count && cat._count.scripts > 0 && (
                              <span className="text-[9px] font-black opacity-40 group-hover:opacity-100 transition-opacity">
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

        {/* Tags Cloud */}
        <div className="pt-4 border-t border-slate-900">
          <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5">
            <TagsIcon className="w-3 h-3" /> Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => updateFilters({ tag: currentFilters.tag === tag.id ? null : tag.id })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border transition-all ${currentFilters.tag === tag.id ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-slate-950 border-slate-900 text-slate-600 hover:border-slate-800 hover:text-slate-400'}`}
              >
                #{tag.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area - Premium Grid */}
      <div className="flex-1 overflow-y-auto bg-slate-950 relative custom-scrollbar">
        {isPending && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-50 overflow-hidden bg-blue-500/5">
            <div className="h-full bg-blue-500/50 animate-[loading-bar_1.5s_infinite_ease-in-out] w-1/3" />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-8 py-12 space-y-12">
          {/* Hero Section - Compact Full Width */}
          <div className="relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
                <Globe className="w-4 h-4" />
                <span>Explorador de Scripts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Catalogados:</span>
                <span className="text-xl font-black text-white leading-none whitespace-nowrap">{scripts.length}</span>
              </div>
            </div>

            {/* Hero Search - Ultra Slim Full Width */}
            <div className="w-full">
              <div className="relative flex items-center bg-slate-950/40 border border-blue-500/30 focus-within:border-blue-500/60 rounded-full overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.05)] group">
                <Search className="w-4 h-4 ml-5 text-blue-500" />
                <input
                  type="text"
                  placeholder="Pesquise por títulos, comandos ou palavras-chave..."
                  defaultValue={currentFilters.q || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateFilters({ q: e.currentTarget.value || null });
                    }
                  }}
                  className="w-full bg-transparent text-white px-4 py-2.5 focus:outline-none placeholder-slate-600 text-sm font-medium"
                />
                {currentFilters.q && (
                  <button
                    onClick={() => updateFilters({ q: null })}
                    className="mr-5 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Active filter badges */}
            {(currentFilters.categoria || currentFilters.tag || currentFilters.tipoBanco || currentFilters.sistema) && (
              <div className="flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-left-2 transition-all">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-2">Filtros ativos:</span>
                {currentFilters.categoria && (
                  <button
                    onClick={() => updateFilters({ categoria: null })}
                    className="group px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 hover:bg-blue-600/20 transition-all"
                  >
                    Matriz: {categorias.find(c => c.id === currentFilters.categoria)?.nome}
                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                )}
                {currentFilters.tag && (
                  <button
                    onClick={() => updateFilters({ tag: null })}
                    className="group px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 hover:bg-purple-600/20 transition-all"
                  >
                    Tag: #{tags.find(t => t.id === currentFilters.tag)?.nome}
                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                )}
                {currentFilters.tipoBanco && (
                  <button
                    onClick={() => updateFilters({ tipoBanco: null })}
                    className="group px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    Engine: {currentFilters.tipoBanco}
                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                )}
                {currentFilters.sistema && (
                  <button
                    onClick={() => updateFilters({ sistema: null })}
                    className="group px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    Ecos: {currentFilters.sistema.replace('_', ' ')}
                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Grid */}
          {scripts.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-[3rem] p-24 text-center mt-12 backdrop-blur-sm">
              <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
                <Database className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Vácuo de Conhecimento</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">Nenhum script corresponde aos critérios selecionados. Expanda seus horizontes limpando os filtros.</p>
              <button
                onClick={clearAll}
                className="mt-8 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-blue-600/10 active:scale-95"
              >
                Resetar Sistema
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 mt-12 pb-24">
              {scripts.map(script => (
                <div key={script.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${Math.random() * 200}ms` }}>
                  <ScriptCard script={script} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
