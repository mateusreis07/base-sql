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
    <div className={`group relative bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm rounded-[2rem] p-6 hover:bg-slate-900 transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(59,130,246,0.05)] flex flex-col h-full ${isN1 ? 'border-indigo-900/30 ring-1 ring-indigo-900/10' : ''}`}>
      
      {/* Glow Effect on Hover */}
      <div className="absolute -inset-px bg-gradient-to-br from-blue-600/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex-1 space-y-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            {isN1 ? (
               <div className="flex items-center gap-2 mb-2">
                 <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/80">Acesso Restrito N1</span>
               </div>
            ) : null}
            
            <div className="flex items-center gap-3">
              {isN1 ? (
                <h3 className="text-xl font-black text-white tracking-tight uppercase truncate">{script.titulo}</h3>
              ) : (
                <Link href={`/scripts/${script.id}`} className="text-xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate leading-tight block">
                  {script.titulo}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 font-black text-[10px] uppercase tracking-[0.15em]">
              <span className="text-slate-500">
                por {script.autor?.id ? (
                  <Link href={`/perfil/${script.autor.id}`} className="hover:text-blue-400 transition-colors inline-flex items-center gap-1">
                    {script.autor.name}
                  </Link>
                ) : (
                  script.autor?.name || 'Sistema'
                )}
              </span>
              {script.team?.nome && (
                <>
                  <span className="text-slate-700">•</span>
                  <span className="text-blue-500/80">{script.team.nome}</span>
                </>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleFavorite}
            disabled={isFavoriting}
            className={`p-2.5 rounded-2xl border transition-all active:scale-90 ${
              isFavorite 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-slate-950/50 border-slate-800 text-slate-600 hover:text-amber-500 hover:border-amber-500/30 shadow-inner'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        {script.descricao && (
          <p className="text-slate-400 text-sm leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">
            {script.descricao}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {script.categoria && (
            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 border border-blue-500/20">
              {script.categoria.nome}
            </span>
          )}
          {script.tags.slice(0, 3).map(t => (
            <span key={t.Tag.id} className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter bg-slate-950 text-slate-500 border border-slate-900">
              #{t.Tag.nome}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-5 pt-4 border-t border-slate-800/50 space-y-4">
        {/* Buttons and Date */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(dateValue, { addSuffix: true, locale: ptBR })}
          </span>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                copied 
                  ? 'bg-green-600/20 border-green-500/50 text-green-400' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Copiar SQL"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>

            <button 
              onClick={toggleExpand}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                expanded 
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={expanded ? "Ocultar Código" : "Ver Prévia"}
            >
              {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="h-[250px] animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <SqlEditor 
              value={script.codigoSql} 
              onChange={() => {}} 
              readOnly={true} 
              height="100%" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
