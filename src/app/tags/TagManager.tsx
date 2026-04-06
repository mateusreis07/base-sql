'use client';

import { useState } from 'react';
import { Plus, Tags as TagsIcon, Edit2, Trash2, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tag = { id: string; nome: string };

export function TagManager({ initialTags, isNivel1 = false }: { initialTags: Tag[], isNivel1?: boolean }) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');

  const openForm = (tag?: Tag) => {
    if (tag) {
      setEditingId(tag.id);
      setNome(tag.nome);
    } else {
      setEditingId(null);
      setNome('');
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    try {
      const url = editingId ? `/api/tags/${editingId}` : '/api/tags';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      
      const savedTag = await res.json();
      
      if (editingId) {
        setTags(tags.map(t => t.id === editingId ? savedTag : t));
      } else {
        setTags([...tags, savedTag].sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      
      closeForm();
      router.refresh();
    } catch (err) {
      alert('Erro ao salvar tag');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a tag "${name}"? Os links com os scripts serão removidos.`)) return;

    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao deletar');
      
      setTags(tags.filter(t => t.id !== id));
      router.refresh();
    } catch (err) {
      alert('Erro ao deletar tag');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tags</h1>
          <p className="text-slate-500 mt-1">Gerencie as tags para classificar seus scripts.</p>
        </div>
        {!isFormOpen && !isNivel1 && (
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Tag
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-4 w-full max-w-md">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold text-white">{editingId ? 'Editar Tag' : 'Nova Tag'}</h2>
            <button type="button" onClick={closeForm} className="text-slate-500 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Tag *</label>
            <input 
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: performance"
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeForm} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
              <Save className="w-4 h-4" /> Salvar
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {tags.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <TagsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-400">Nenhuma tag encontrada</p>
            <p className="text-sm mt-1">Crie sua primeira tag para começar a organizar.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {tags.map(tag => (
              <li key={tag.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-r border-slate-800">
                <div className="flex items-center gap-3">
                  <TagsIcon className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-white">{tag.nome}</span>
                </div>
                {!isNivel1 && (
                <div className="flex items-center gap-3">
                  <button onClick={() => openForm(tag)} className="text-slate-400 hover:text-blue-400 transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tag.id, tag.nome)} className="text-slate-400 hover:text-red-400 transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
