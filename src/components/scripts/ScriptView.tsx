'use client';

import { useState } from 'react';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { CopyButton } from '@/components/ui/CopyButton';
import { 
  Star, 
  User, 
  Clock, 
  Database, 
  Layers, 
  ClipboardList, 
  ChevronLeft,
  Calendar,
  Users,
  Terminal,
  Globe,
  History,
  GitCommit
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloneScript } from '@/app/actions/script-actions';
import { GitFork } from 'lucide-react';

interface ScriptViewProps {
  script: {
    id: string;
    titulo: string;
    descricao: string | null;
    codigoSql: string;
    tipoBanco: string;
    sistema: string;
    createdAt: Date | string;
    categoria?: { nome: string } | null;
    autor?: { id: string; name: string | null; team?: { nome: string } | null } | null;
    tags?: { Tag: { nome: string } }[];
    versions: {
      id: string;
      titulo: string;
      descricao: string | null;
      motivo: string | null;
      createdAt: Date | string;
      autor?: { id: string; name: string | null } | null;
    }[];
    clonadoDe?: {
      autor?: { id: string; name: string | null } | null;
      team?: { nome: string } | null;
    } | null;
  };
  isFavoriteInitial: boolean;
}

export function ScriptView({ script, isFavoriteInitial }: ScriptViewProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [isToggling, setIsToggling] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const toggleFavorite = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}/favorite`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao favoritar');
      const data = await res.json();
      setIsFavorite(data.isFavorite);
      toast.success(data.isFavorite ? 'Adicionado aos favoritos!' : 'Removido dos favoritos');
    } catch (error) {
      toast.error('Erro ao processar favorito');
    } finally {
      setIsToggling(false);
    }
  };

  const handleClone = async () => {
    if (!window.confirm('Deseja clonar este script para a estrutura do seu time? Ele será salvo na categoria "Clonados" com visibilidade restrita à sua equipe.')) {
      return;
    }

    setIsCloning(true);
    const loadingToast = toast.loading('Clonando script...');

    try {
      const result = await cloneScript(script.id);
      if (result.success) {
        toast.success('Script clonado com sucesso!', { id: loadingToast });
        router.push(`/scripts/${result.scriptId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao clonar script', { id: loadingToast });
    } finally {
      setIsCloning(false);
    }
  };

  const formattedDate = format(new Date(script.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-8 flex gap-3">
          <button
            onClick={toggleFavorite}
            disabled={isToggling}
            className={`p-3 rounded-2xl transition-all border ${
              isFavorite 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-400/30'
            }`}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <CopyButton text={script.codigoSql} isN1 />
        </div>

        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500/60 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
              <Database className="w-3 h-3" />
              <span>Engine {script.tipoBanco}</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none max-w-[70%]">
              {script.titulo}
            </h1>
          </div>

          <div className="flex flex-wrap gap-y-4 gap-x-8 text-slate-400 text-sm border-t border-slate-800/50 pt-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <Link 
                href={script.autor?.id ? `/perfil/${script.autor.id}` : '#'} 
                className="font-medium text-slate-300 hover:text-blue-400 transition-colors"
              >
                {script.autor?.name || 'Autor Desconhecido'}
              </Link>
            </div>
            {script.autor?.team?.nome && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-300">{script.autor?.team?.nome}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-300">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Metadados e Descrição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Descrição do Script
            </h3>
            <p className="text-slate-300 leading-relaxed text-lg font-light">
              {script.descricao || 'Nenhuma descrição detalhada disponível para este script.'}
            </p>
          </div>

          {/* Bloco SQL de Destaque */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Consulta SQL
              </h3>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <SqlEditor 
                value={script.codigoSql} 
                onChange={() => {}} 
                readOnly={true} 
                height="600px" 
              />
            </div>
          </div>

          {/* Timeline de Evolução (Read-only) */}
          {script.versions && script.versions.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-slate-800/50">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico de Alterações
              </h3>
              
              <div className="relative space-y-8 pl-4 border-l-2 border-slate-800 ml-2">
                {script.versions.map((v, idx) => (
                  <div key={v.id} className="relative group/time">
                    {/* Indicador de nó na timeline */}
                    <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 transition-all ${
                      idx === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-800'
                    }`} />
                    
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                          v{script.versions.length - idx}
                        </span>
                        <span className="text-sm font-bold text-white group-hover/time:text-blue-400 transition-colors">
                          {v.titulo}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          • {format(new Date(v.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <GitCommit className="w-3 h-3 text-slate-600" />
                        <span>por <Link href={v.autor?.id ? `/perfil/${v.autor.id}` : '#'} className="text-slate-300 font-medium hover:text-blue-400 transition-colors">{v.autor?.name || 'Autor Desconhecido'}</Link></span>
                        {v.motivo ? (
                          <div className="ml-2 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-blue-300 font-medium max-w-[400px] truncate">
                            “{v.motivo}”
                          </div>
                        ) : idx === script.versions.length - 1 ? (
                          <div className="ml-2 bg-slate-900/50 border border-slate-800/50 px-2 py-0.5 rounded text-[11px] text-slate-500 font-medium">
                            Publicação Inicial
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar de Contexto */}
        <div className="space-y-6">
          {script.clonadoDe && (
            <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-2xl space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <GitFork className="w-12 h-12" />
              </div>
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <GitFork className="w-3.5 h-3.5" /> Origem do Script
              </h3>
              <div className="space-y-2 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Autor Original</span>
                  <Link 
                    href={script.clonadoDe.autor?.id ? `/perfil/${script.clonadoDe.autor.id}` : '#'} 
                    className="text-sm font-black text-white hover:text-blue-400 transition-colors"
                  >
                    {script.clonadoDe.autor?.name || 'Autor Desconhecido'}
                  </Link>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Time de Origem</span>
                  <span className="text-sm font-black text-blue-400">{script.clonadoDe.team?.nome || 'Time Desconhecido'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl space-y-6">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-3">
              Ficha Técnica
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Categoria</span>
                <div className="flex items-center gap-2 text-white font-bold bg-blue-600/10 border border-blue-500/20 px-3 py-2 rounded-xl">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  {script.categoria?.nome || 'Geral'}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Banco de Dados</span>
                <div className="flex items-center gap-2 text-white font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                  <Database className="w-4 h-4 text-slate-400" />
                  {script.tipoBanco}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Sistema Relacionado</span>
                <div className="flex items-center gap-2 text-white font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                  <Globe className="w-4 h-4 text-slate-400" />
                  {script.sistema}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Versão Atual</span>
                <div className="flex items-center gap-2 text-white font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                  <GitCommit className="w-4 h-4 text-blue-500" />
                  {script.versions.length}ª Edição
                </div>
              </div>
            </div>

            {script.tags && script.tags.length > 0 && (
              <div className="pt-4 space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {script.tags.map((st, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-full">
                      #{st.Tag.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ação de Clonagem Premium */}
            <div className="pt-4 mt-6 border-t border-slate-800/80">
              <button
                onClick={handleClone}
                disabled={isCloning}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 font-black uppercase text-[10px] tracking-widest active:scale-95 group"
              >
                <GitFork className={`w-4 h-4 transition-transform ${isCloning ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
                {isCloning ? 'Clonando...' : 'Clonar para o Time'}
              </button>
              <p className="text-[9px] text-slate-500 text-center mt-3 font-medium uppercase tracking-tighter">
                Cria uma cópia privada na categoria <span className="text-blue-400">Clonados</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white py-4 rounded-2xl transition-all border border-slate-800 font-bold uppercase text-[10px] tracking-widest active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Listagem
          </button>
        </div>
      </div>
    </div>
  );
}
