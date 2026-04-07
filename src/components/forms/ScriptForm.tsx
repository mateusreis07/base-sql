'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { Save, X, AlertCircle, Trash2, ChevronDown, Check } from 'lucide-react';

import { ScriptVersionHistory } from '@/components/ui/ScriptVersionHistory';

type Categoria = { id: string; nome: string };
type Tag = { id: string; nome: string };
type Version = { id: string; titulo: string; descricao: string | null; codigoSql: string; createdAt: string | Date; autor?: { name: string | null } };

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

    if (!titulo.trim()) {
      setErrorMsg('O Título é obrigatório.');
      return;
    }
    
    if (!currentCode || !currentCode.trim()) {
      setErrorMsg('O Código SQL é obrigatório e não pode ficar vazio.');
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
    <div className="space-y-12">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {isReadOnly ? 'Visualização de Script Público' : isEditing ? 'Editar Script' : 'Novo Script SQL'}
          </h2>
          <div className="flex gap-3">
            {!isReadOnly && (
              <button 
                type="button" 
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
            {isReadOnly ? (
              <button 
                type="button" 
                onClick={() => router.back()}
                className="flex items-center bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div className="flex gap-2">
                {isEditing && canDelete && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-950 px-4 py-2 rounded-md font-medium transition-all disabled:opacity-50"
                    title="Excluir Script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  <Save className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-900 rounded-md flex items-center gap-3 text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-500">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-950/50 border border-red-900 rounded-md flex items-center gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Row 1: Título e Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Título *</label>
            <input 
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              disabled={isReadOnly}
              placeholder="Ex: Pegar faturamento por mês"
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
            <CustomSelect 
              value={categoriaId}
              onChange={setCategoriaId}
              disabled={isReadOnly}
              options={[
                { value: '', label: 'Nenhuma categoria' },
                ...categorias.map(cat => ({ value: cat.id, label: cat.nome }))
              ]}
            />
          </div>
        </div>
        
        {/* Row 1.5: Script Type e Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Banco de Dados *</label>
            <CustomSelect 
              value={tipoBanco}
              onChange={setTipoBanco}
              disabled={isReadOnly}
              options={[
                { value: 'POSTGRESQL', label: 'PostgreSQL' },
                { value: 'MYSQL', label: 'MySQL' }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Sistema *</label>
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

        {/* Row 2: Descrição */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
          <textarea 
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            disabled={isReadOnly}
            placeholder="Explique o propósito deste script..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>

        {/* Row 3: Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
               <button
                 key={tag.id}
                 type="button"
                 disabled={isReadOnly}
                 onClick={() => toggleTag(tag.id)}
                 className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                   selectedTags.includes(tag.id) 
                     ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                     : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                 } ${isReadOnly ? 'opacity-80 cursor-default' : ''}`}
               >
                 #{tag.nome}
               </button>
            ))}
            {tags.length === 0 && <span className="text-sm text-slate-600">Nenhuma tag cadastrada.</span>}
          </div>
        </div>

        {/* Row 4: SqlEditor tomando espaço estendido e isolado na parte de baixo */}
        <div className="flex flex-col space-y-2 pt-4 border-t border-slate-800">
          <label className="block text-sm font-medium text-slate-400">Código SQL *</label>
          <div className="w-full h-[500px]">
            <SqlEditor 
              value={codigoSql}
              onChange={(val) => setCodigoSql(val || '')}
              onMount={handleEditorDidMount}
              height="100%"
              readOnly={isReadOnly}
            />
          </div>
        </div>

        {/* Action Buttons at the bottom for better UX on long scripts */}
        {!isReadOnly && (
          <div className="flex justify-end items-center pt-6 border-t border-slate-800 gap-4 mt-8">
             <button 
                type="button" 
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg active:scale-95"
              >
                <Save className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
          </div>
        )}
      </form>

      {/* Seção de Histórico integrada se houver versões */}
      {!isReadOnly && isEditing && versions.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <ScriptVersionHistory versions={versions} onRestore={handleRestore} />
        </section>
      )}
    </div>
  );
}
