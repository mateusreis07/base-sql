'use client';

import { useState } from 'react';
import { History, Clock, ChevronDown, ChevronUp, User, Database, ArrowRight, Code } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Version {
  id: string;
  titulo: string;
  descricao: string | null;
  motivo: string | null;
  codigoSql: string;
  createdAt: string | Date;
  autor?: { name: string | null } | null;
}

interface ScriptVersionHistoryProps {
  versions: Version[];
  onRestore?: (version: { titulo: string, descricao: string, codigoSql: string }) => void;
}

export function ScriptVersionHistory({ versions, onRestore }: ScriptVersionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!versions || versions.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
        <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-500 font-medium italic">Nenhum histórico de versões disponível para este script.</p>
      </div>
    );
  }

  // Função para gerar um diff real usando LCS (Longest Common Subsequence) em caracteres para sub-linha
  const renderCharDiff = (oldLine: string, newLine: string) => {
    const m = oldLine.length;
    const n = newLine.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLine[i - 1] === newLine[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const chars: { type: 'add' | 'rem' | 'eq', char: string }[] = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLine[i - 1] === newLine[j - 1]) {
        chars.unshift({ type: 'eq', char: oldLine[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        chars.unshift({ type: 'add', char: newLine[j - 1] });
        j--;
      } else {
        chars.unshift({ type: 'rem', char: oldLine[i - 1] });
        i--;
      }
    }
    return chars;
  };

  // Função para gerar um diff real usando LCS (Longest Common Subsequence)
  const renderDiff = (oldText: string, newText: string) => {
    // Tratamento para caso de versão inicial (sem anterior)
    if (!oldText) {
      const lines = newText.split(/\r?\n/);
      return (
        <div className="space-y-[1px] font-mono text-[11px] leading-relaxed overflow-x-auto p-0 bg-slate-950/50 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
          <div className="flex bg-slate-900/90 border-b border-slate-800 p-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] gap-4">
             <div className="flex gap-2 min-w-[80px] justify-center border-r border-slate-800 pr-4">Linha</div>
             <div>Snapshot Inicial do Código</div>
          </div>
          <div className="p-2 py-4">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-4 px-3 py-1 bg-emerald-500/5 text-emerald-400/80 border-l-[3px] border-emerald-500/30">
                <div className="flex gap-2 min-w-[80px] select-none opacity-40 text-[10px] font-bold text-right pr-4 border-r border-white/10 italic">
                  <span className="w-7"></span>
                  <span className="w-7">{idx + 1}</span>
                </div>
                <span className="whitespace-pre flex-1 pl-2 font-mono">
                  <span className="inline-block w-4 font-black text-emerald-500">+</span>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const oldLines = oldText.split(/\r?\n/);
    const newLines = newText.split(/\r?\n/);
    
    // Matriz de programação dinâmica para LCS
    const m = oldLines.length;
    const n = newLines.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const unmerged: { type: 'add' | 'rem' | 'eq', text: string, oldIdx?: number, newIdx?: number }[] = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        unmerged.unshift({ type: 'eq', text: oldLines[i - 1], oldIdx: i, newIdx: j });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        unmerged.unshift({ type: 'add', text: newLines[j - 1], newIdx: j });
        j--;
      } else {
        unmerged.unshift({ type: 'rem', text: oldLines[i - 1], oldIdx: i });
        i--;
      }
    }

    // Processar para agrupar rem/add adjacentes em pares de "modificação"
    const diffRows: any[] = [];
    for (let k = 0; k < unmerged.length; k++) {
      const current = unmerged[k];
      const next = unmerged[k + 1];

      if (current.type === 'rem' && next && next.type === 'add') {
        diffRows.push({ 
          type: 'mod', 
          oldText: current.text, 
          newText: next.text, 
          oldIdx: current.oldIdx, 
          newIdx: next.newIdx 
        });
        k++;
      } else {
        diffRows.push(current);
      }
    }

    return (
      <div className="space-y-[1px] font-mono text-[11px] leading-relaxed overflow-x-auto p-0 bg-slate-950/50 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="flex bg-slate-900/90 border-b border-slate-800 p-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] gap-4">
          <div className="flex gap-2 min-w-[80px] justify-center border-r border-slate-800 pr-4">Linhas (A/N)</div>
          <div>Diferencial de Código (Alterações Pontuais)</div>
        </div>
        <div className="p-2 py-4">
          {diffRows.map((row, idx) => {
            if (row.type === 'mod') {
              const charDiffs = renderCharDiff(row.oldText, row.newText);
              return (
                <div key={idx} className="space-y-[1px]">
                  {/* Linha Removida com destaque interno */}
                  <div className="flex gap-4 px-3 py-1 bg-rose-500/10 text-rose-300 border-l-[3px] border-rose-500/60">
                    <div className="flex gap-2 min-w-[80px] select-none opacity-40 text-[10px] font-bold text-right pr-4 border-r border-white/10 italic">
                      <span className="w-7">{row.oldIdx}</span>
                      <span className="w-7 opacity-20">.</span>
                    </div>
                    <span className="whitespace-pre flex-1 pl-2">
                       <span className="inline-block w-4 font-black text-rose-500">-</span>
                       {charDiffs.map((c, cidx) => (
                         <span key={cidx} className={c.type === 'rem' ? 'bg-rose-500/40 text-rose-100 rounded-[2px]' : ''}>
                           {c.type !== 'add' ? c.char : ''}
                         </span>
                       ))}
                    </span>
                  </div>
                  {/* Linha Adicionada com destaque interno */}
                  <div className="flex gap-4 px-3 py-1 bg-emerald-500/10 text-emerald-300 border-l-[3px] border-emerald-500/60">
                    <div className="flex gap-2 min-w-[80px] select-none opacity-40 text-[10px] font-bold text-right pr-4 border-r border-white/10 italic">
                      <span className="w-7 opacity-20">.</span>
                      <span className="w-7">{row.newIdx}</span>
                    </div>
                    <span className="whitespace-pre flex-1 pl-2">
                       <span className="inline-block w-4 font-black text-emerald-500">+</span>
                       {charDiffs.map((c, cidx) => (
                         <span key={cidx} className={c.type === 'add' ? 'bg-emerald-500/40 text-emerald-100 rounded-[2px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}>
                           {c.type !== 'rem' ? c.char : ''}
                         </span>
                       ))}
                    </span>
                  </div>
                </div>
              );
            }

            const isAdd = row.type === 'add';
            const isRem = row.type === 'rem';
            const rowClass = isAdd 
              ? 'bg-emerald-500/10 text-emerald-300 border-l-[3px] border-emerald-500/60' 
              : isRem 
              ? 'bg-rose-500/10 text-rose-300 border-l-[3px] border-rose-500/60' 
              : 'text-slate-500 border-l-[3px] border-transparent hover:bg-white/5 opacity-50';
            
            const prefix = isAdd ? '+' : isRem ? '-' : ' ';
            
            return (
              <div key={idx} className={`flex gap-4 group transition-all px-3 py-1 ${rowClass}`}>
                <div className="flex gap-2 min-w-[80px] select-none opacity-40 text-[10px] font-bold text-right pr-4 border-r border-white/10 italic">
                  <span className="w-7">{row.oldIdx || ''}</span>
                  <span className="w-7">{row.newIdx || ''}</span>
                </div>
                <span className="whitespace-pre flex-1 pl-2">
                  <span className={`inline-block w-4 font-black ${isAdd ? 'text-emerald-500' : isRem ? 'text-rose-500' : 'text-slate-800'}`}>{prefix}</span>
                  {row.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-600/20">
            <History className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Linha do Tempo de Alterações</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{versions.length} Instâncias Salvas</span>
        </div>
      </div>

      <div className="space-y-4">
        {versions.map((version, index) => {
          const isLatest = index === 0;
          const isExpanded = expandedId === version.id;
          const prevVersion = versions[index + 1];

          return (
            <div 
              key={version.id} 
              className={`bg-slate-900 border transition-all duration-500 rounded-3xl overflow-hidden ${
                isExpanded ? 'border-blue-500/40 shadow-[0_30px_60px_-15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' : 'border-slate-800/60 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/20'
              }`}
            >
              <button 
                onClick={() => setExpandedId(isExpanded ? null : version.id)}
                className="w-full text-left p-6 flex items-center justify-between group relative"
              >
                {/* Linha indicadora de progresso na esquerda */}
                {!isLatest && <div className="absolute top-0 bottom-0 left-[2.5rem] w-[1px] bg-slate-800 -z-0" />}
                
                <div className="flex items-center gap-5 min-w-0 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isLatest 
                      ? 'bg-blue-600 text-white shadow-[0_4px_20px_-5px_rgba(37,99,235,0.5)] scale-110' 
                      : 'bg-slate-800/80 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'
                  }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-white tracking-widest truncate uppercase">
                        Versão {versions.length - index}
                        {!prevVersion && <span className="ml-2 text-[9px] text-slate-500">(Snapshot Inicial)</span>}
                      </span>
                      {isLatest && <span className="text-[9px] font-black bg-blue-500/30 text-blue-300 px-2 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">Estado Atual</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-200 transition-colors">
                        <User className="w-3.5 h-3.5 text-blue-500/60" /> {version.autor?.name || 'Sistema'}
                      </span>
                      <span className="opacity-30">•</span>
                      <span className="italic">{format(new Date(version.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {!isExpanded && (
                    <div className="hidden lg:flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Snapshot SQL</span>
                       <span className="text-[11px] text-slate-400 font-mono italic max-w-[250px] truncate">
                         {version.codigoSql.substring(0, 45).replace(/\n/g, ' ')}...
                       </span>
                    </div>
                  )}
                  <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-blue-600/10 text-blue-400 rotate-180' : 'bg-slate-800 text-slate-600 group-hover:text-white'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-8 pt-2 space-y-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                    {/* Motivo (Protagonista da Versão) */}
                    <div className="md:col-span-3 p-6 bg-blue-600/5 rounded-3xl border border-blue-500/20 hover:border-blue-500/40 transition-all group/card shadow-sm shadow-blue-500/5">
                       <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mb-4 block">Mensagem da Alteração</span>
                       <p className="text-base font-bold text-white leading-relaxed uppercase tracking-tight">
                         {version.motivo || (index === versions.length - 1 ? 'Publicação Inicial' : 'Sem motivo registrado')}
                       </p>
                    </div>

                    {/* Metadados Unificados (Discretos) */}
                    <div className="md:col-span-2 p-6 bg-slate-950/30 rounded-3xl border border-slate-800/40 hover:border-slate-700/60 transition-all flex flex-col justify-center space-y-4">
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Metadata do Snapshot</span>
                          <p className="text-xs font-bold text-slate-300 uppercase truncate" title={version.titulo}>
                             {version.titulo}
                          </p>
                       </div>
                       <div className="pt-2 border-t border-slate-800/50">
                          <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2" title={version.descricao || ''}>
                             {version.descricao || 'Nenhuma descrição técnica informada.'}
                          </p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Visualizador de Alterações SQL</span>
                        </div>
                        {prevVersion ? (
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-lg">
                            Diferencial: <span className="text-white">v{versions.length - index - 1}</span> <ArrowRight className="inline w-3 h-3 mx-1" /> <span className="text-blue-400 font-black">v{versions.length - index}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-lg">
                             Ponto de Partida (Versão Original)
                          </div>
                        )}
                     </div>
                     
                     <div className="relative group/diff">
                       {prevVersion ? (
                          renderDiff(prevVersion.codigoSql, version.codigoSql)
                       ) : (
                          // Versão original mostra tudo como "Added"
                          renderDiff('', version.codigoSql)
                       )}
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Deseja descartar as alterações atuais e retornar para este estado?</p>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja restaurar a Versão ${versions.length - index}? As alterações atuais no editor serão perdidas.`)) {
                          onRestore?.({ 
                            titulo: version.titulo, 
                            descricao: version.descricao || '', 
                            codigoSql: version.codigoSql 
                          });
                        }
                      }}
                      className="px-8 py-3 bg-white hover:bg-blue-600 text-slate-950 hover:text-white text-[11px] font-black rounded-2xl transition-all uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-black/40 hover:shadow-blue-600/20 active:scale-95"
                    >
                      <ArrowRight className="w-4 h-4" /> Restaurar Snapshot no Editor
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
