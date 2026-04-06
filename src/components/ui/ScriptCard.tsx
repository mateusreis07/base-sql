'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Globe, Copy, Check, Eye, EyeOff, ShieldAlert, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { toggleFavorite } from '@/app/actions/favorite';
import { useRouter } from 'next/navigation';

interface ScriptCardProps {
  script: {
    id: string;
    titulo: string;
    descricao: string | null;
    codigoSql: string;
    createdAt: Date | string | number;
    visibility?: 'GLOBAL' | 'TIME';
    categoria?: { id: string; nome: string } | null;
    tags: { Tag: { id: string; nome: string } }[];
    autor?: { id?: string; name: string } | null;
    team?: { nome: string } | null;
    isFavorite?: boolean;
  };
  isN1?: boolean;
}

export function ScriptCard({ script, isN1 = false }: ScriptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(script.isFavorite || false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const router = useRouter();

  // Normalize date
  const dateValue = typeof script.createdAt === 'string' || typeof script.createdAt === 'number' 
    ? new Date(script.createdAt) 
    : script.createdAt;

  const handleCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(script.codigoSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavoriting) return;
    
    setIsFavoriting(true);
    // Otimista
    setIsFavorite(!isFavorite);
    
    try {
      await toggleFavorite(script.id);
      router.refresh();
    } catch (error) {
      // Reverte em caso de erro
      setIsFavorite(isFavorite);
      console.error('Erro ao favoritar:', error);
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group shadow-sm relative ${isN1 ? 'border-indigo-900/30 ring-1 ring-indigo-900/10' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          {isN1 ? (
             <div className="flex items-center gap-2 mb-1">
               <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">Acesso Restrito N1</span>
             </div>
          ) : null}
          
          <div className="flex items-center gap-3">
            {isN1 ? (
              <h3 className="text-xl font-bold text-white tracking-wide truncate">{script.titulo}</h3>
            ) : (
              <Link href={`/scripts/${script.id}`} className="text-xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors truncate">
                {script.titulo}
              </Link>
            )}
            
            <button 
              onClick={handleFavorite}
              disabled={isFavoriting}
              className={`p-1.5 rounded-lg border transition-all ${
                isFavorite 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
              title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">

            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-slate-500 font-medium flex items-center gap-1">
              <Link 
                href={script.autor?.id ? `/perfil/${script.autor.id}` : '#'} 
                className={`hover:text-blue-400 transition-colors ${script.autor?.id ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {script.autor?.name || 'Sistema'}
              </Link>
              {script.team?.nome ? `• ${script.team.nome}` : ''}
            </span>
          </div>
          
          {script.descricao && (
            <p className="text-slate-400 text-sm mt-3 leading-relaxed line-clamp-2">{script.descricao}</p>
          )}
        </div>

        {script.categoria && (
          <div className="hidden sm:block px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/50 text-slate-400 border border-slate-700/50 ml-4 shrink-0">
            {script.categoria.nome}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 mt-4">
        <div className="flex flex-wrap gap-2">
          {script.tags.map(t => (
            <span 
              key={t.Tag.id} 
              className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-slate-800 bg-slate-950 text-slate-600"
            >
              #{t.Tag.nome}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 shadow-lg ${
              copied 
                ? 'bg-green-600/20 border-green-500/50 text-green-400' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {copied ? (
              <><Check className="w-4 h-4 text-green-500" /> Copiado!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copiar SQL</>
            )}
          </button>

          <button 
            onClick={toggleExpand}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            {expanded ? (
              <><EyeOff className="w-4 h-4" /> Ocultar Código</>
            ) : (
              <><Eye className="w-4 h-4" /> Ver Código</>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mb-4 h-[350px] animate-in fade-in slide-in-from-top-1 duration-200 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <SqlEditor 
            value={script.codigoSql} 
            onChange={() => {}} 
            readOnly={true} 
            height="100%" 
          />
        </div>
      )}

      <div className="flex justify-end items-center pt-3 border-t border-slate-800/50">
        <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5" />
          Atualizado {formatDistanceToNow(dateValue, { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </div>
  );
}
