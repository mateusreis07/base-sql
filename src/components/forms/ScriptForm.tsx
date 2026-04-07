'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { Save, X, AlertCircle, Trash2, ChevronDown, Check, Database, Terminal, GitCommit } from 'lucide-react';

import { ScriptVersionHistory } from '@/components/ui/ScriptVersionHistory';

type Categoria = { id: string; nome: string };
type Tag = { id: string; nome: string };
type Version = { id: string; titulo: string; descricao: string | null; motivo: string | null; codigoSql: string; createdAt: string | Date; autor?: { name: string | null } };

import { CustomSelect } from '@/components/ui/CustomSelect';

interface ScriptFormProps {
  initialData?: {
    id?: string;
    titulo: string;
    descricao: string;
    codigoSql: string;
    categoriaId: string;
    tagIds: string[];
    visibility?: 'TIME' | 'GLOBAL';
    tipoBanco?: string;
    sistema?: string;
  };
  categorias: Categoria[];
  tags: Tag[];
  isReadOnly?: boolean;
  versions?: Version[];
  canDelete?: boolean;
}

export function ScriptForm({ initialData, categorias, tags, isReadOnly = false, versions = [], canDelete = false }: ScriptFormProps) {
  const router = useRouter();
  const editorRef = useRef<any>(null);

  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [codigoSql, setCodigoSql] = useState(initialData?.codigoSql || '');
  const [categoriaId, setCategoriaId] = useState(initialData?.categoriaId || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || []);
  const [visibility] = useState<'TIME' | 'GLOBAL'>('GLOBAL');
  const [tipoBanco, setTipoBanco] = useState(initialData?.tipoBanco || 'POSTGRESQL');
  const [sistema, setSistema] = useState(initialData?.sistema || 'SAJ5');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isEditing = !!initialData?.id;

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleRestore = (version: { titulo: string; descricao: string; codigoSql: string }) => {
    try {
      setSuccessMsg(''); // Limpa mensagens anteriores
      setTitulo(version.titulo);
      setDescricao(version.descricao || '');
      setCodigoSql(version.codigoSql);
      setTipoBanco((version as any).tipoBanco || 'POSTGRESQL');
      setSistema((version as any).sistema || 'SAJ5');

      // Atualiza o editor Monaco via ref para forçar a mudança visual imediata
      if (editorRef.current) {
        editorRef.current.setValue(version.codigoSql);
      }

      // Forçar scroll para o topo para que o usuário veja os campos alterados
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Falha ao restaurar:', err);
      alert('Erro ao tentar carregar a versão no editor.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Obter o valor real do editor (bypass React state sync issues)
    const currentCode = editorRef.current?.getValue ? editorRef.current.getValue() : codigoSql;
    const isSqlChanged = isEditing && currentCode !== initialData.codigoSql;

    if (!titulo.trim()) {
      setErrorMsg('O Título é obrigatório.');
      return;
    }

    if (!currentCode || !currentCode.trim()) {
      setErrorMsg('O Código SQL é obrigatório e não pode ficar vazio.');
      return;
    }

    if (isSqlChanged && !motivo.trim()) {
      setErrorMsg('Por favor, descreva o motivo desta alteração para o histórico.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/scripts/${initialData.id}` : '/api/scripts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          codigoSql: currentCode,
          categoriaId: categoriaId || null,
          tagIds: selectedTags,
          visibility,
          tipoBanco,
          sistema,
          motivo: isSqlChanged ? motivo : isEditing ? 'Atualização de metadados' : 'Versão inicial',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar script');
      }

      const savedScript = await res.json();

      if (isEditing) {
        setIsSubmitting(false);
        setSuccessMsg('Alterações salvas com sucesso!');
        setMotivo(''); // Limpar o motivo após salvar
        router.refresh(); // Refresh Server Components data

        // Limpar após 5s
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        // Se for novo, direciona para o editor do script recém-criado
        router.push(`/scripts/${savedScript.id}`);
        router.refresh();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocorreu um erro interno ao salvar o script no banco de dados. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Tem certeza que deseja excluir permanentemente este script? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/scripts/${initialData.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir script');
      }

      router.push('/');
      router.refresh();
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao excluir script');
      setIsSubmitting(false);
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-12 overflow-visible">
      <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto space-y-8 overflow-visible">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800/60 py-4 -mt-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
              {isReadOnly ? 'Visualização de Script' : isEditing ? 'Editar Script' : 'Novo Script SQL'}
            </h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
              Organize e evolua seu repositório de consultas
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => router.back()}
                className="group flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-all text-sm font-bold uppercase tracking-widest"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {isEditing && canDelete && !isReadOnly && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center justify-center bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 w-11 h-11 rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-red-900/10"
                  title="Excluir Script Permanentemente"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-95 group"
                >
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {isSubmitting ? 'Processando...' : 'Salvar Alterações'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {successMsg && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl flex items-center gap-4 text-emerald-100 animate-in fade-in slide-in-from-top-2 duration-500">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
               <p className="text-sm font-bold tracking-tight">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-center gap-4 text-red-100 animate-in shake duration-500">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold tracking-tight">{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-6 backdrop-blur-sm">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] ml-1">Essencial: Título do Script *</label>
                <input
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Ex: Faturamento Consolidado por Regional"
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-slate-700 text-lg font-bold shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Contextualização (Descrição Detalhada)</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Explique detalhadamente o que este script resolve e como utilizá-lo..."
                  rows={4}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-800/30 focus:border-blue-700/30 focus:outline-none transition-all placeholder:text-slate-800 leading-relaxed italic"
                />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-4 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center justify-between pb-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                  <Check className="w-3 h-3" /> Core: Linguagem SQL *
                </label>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Editor Monaco v0.45</span>
              </div>
              <div className="w-full h-[550px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl relative group/editor">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/editor:opacity-100 transition-opacity pointer-events-none z-10" />
                <SqlEditor
                  value={codigoSql}
                  onChange={(val) => setCodigoSql(val || '')}
                  onMount={handleEditorDidMount}
                  height="100%"
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            {isEditing && !isReadOnly && codigoSql !== initialData?.codigoSql && (
              <div className="p-8 bg-blue-600/5 border border-blue-600/20 rounded-[2rem] space-y-4 animate-in slide-in-from-left-4 duration-700">
                <label className="block text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 animate-pulse" /> Motivo desta Versão *
                </label>
                <textarea
                  required
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Por que você alterou o código SQL? (Ex: Otimização de Performance, Correção de Join...)"
                  rows={2}
                  className="w-full bg-slate-950/80 border border-blue-900/30 text-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-600/20 focus:outline-none placeholder:text-blue-900/50 transition-all font-bold text-sm tracking-tight"
                />
                <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest text-right">Registro Permanente de Engenharia</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/60 p-6 rounded-[2rem] space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-500" /> Atributos Técnicos
                </h3>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Categoria</label>
                    <CustomSelect
                      value={categoriaId}
                      onChange={setCategoriaId}
                      disabled={isReadOnly}
                      options={[
                        { value: '', label: 'Nenhuma Selecionada' },
                        ...categorias.map(cat => ({ value: cat.id, label: cat.nome }))
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Banco de Dados *</label>
                    <CustomSelect
                      value={tipoBanco}
                      onChange={setTipoBanco}
                      disabled={isReadOnly}
                      options={[
                        { value: 'POSTGRESQL', label: 'PostgreSQL' },
                        { value: 'ORACLE', label: 'Oracle' }
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Sistema *</label>
                    <CustomSelect
                      value={sistema}
                      onChange={setSistema}
                      disabled={isReadOnly}
                      options={[
                        { value: 'SAJ5', label: 'SAJ 5' },
                        { value: 'SAJ_ONLINE', label: 'SAJ Online' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/50 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Tags de Descoberta
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                     <button
                       key={tag.id}
                       type="button"
                       disabled={isReadOnly}
                       onClick={() => toggleTag(tag.id)}
                       className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all duration-300 ${
                         selectedTags.includes(tag.id)
                           ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                           : 'bg-slate-950/50 border-slate-800/80 text-slate-600 hover:border-slate-600 hover:text-slate-400 opacity-60'
                       }`}
                     >
                       #{tag.nome}
                     </button>
                  ))}
                  {tags.length === 0 && <span className="text-[10px] text-slate-600 uppercase font-bold pr-2">Sem tags disponíveis</span>}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/50">
                <div className="bg-slate-950/60 rounded-[1.5rem] p-5 border border-blue-500/10 shadow-inner group/version transition-all hover:border-blue-500/30">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 group-hover/version:text-blue-400 transition-colors">Matriz de Versões</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover/version:bg-blue-600/20 transition-all">
                      <GitCommit className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-white leading-none block uppercase tracking-tighter">{versions.length || 1} edições</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Registradas no histórico</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {!isReadOnly && isEditing && versions.length > 0 && (
        <section className="w-full max-w-7xl mx-auto pt-12 border-t border-slate-800/50 animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Fim do Editor / Início do Histórico</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
          <ScriptVersionHistory versions={versions} onRestore={handleRestore} />
        </section>
      )}
    </div>
  );
}
