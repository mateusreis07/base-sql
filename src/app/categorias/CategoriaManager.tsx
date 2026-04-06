'use client';

import { useState } from 'react';
import { Plus, Folder, Edit2, Trash2, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Categoria = { id: string; nome: string; descricao: string | null; cor: string | null; parentId: string | null };

export function CategoriaManager({ initialCategorias, isNivel1 = false }: { initialCategorias: Categoria[], isNivel1?: boolean }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('#3b82f6');

  const openForm = (cat?: Categoria) => {
    if (cat) {
      setEditingId(cat.id);
      setNome(cat.nome);
      setDescricao(cat.descricao || '');
      setCor(cat.cor || '#3b82f6');
    } else {
      setEditingId(null);
      setNome('');
      setDescricao('');
      setCor('#3b82f6');
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
      const url = editingId ? `/api/categorias/${editingId}` : '/api/categorias';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descricao, cor }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      
      const categorySaved = await res.json();
      
      if (editingId) {
        setCategorias(categorias.map(c => c.id === editingId ? categorySaved : c));
      } else {
        setCategorias([...categorias, categorySaved].sort((a, b) => a.nome.localeCompare(b.nome)));
      }
      
      closeForm();
      router.refresh();
    } catch (err) {
      alert('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"? Todos os scripts vinculados ficarão sem categoria.`)) return;

    try {
      const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao deletar');
      
      setCategorias(categorias.filter(c => c.id !== id));
      router.refresh();
    } catch (err) {
      alert('Erro ao deletar categoria');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Categorias</h1>
          <p className="text-slate-500 mt-1">Gerencie a organização dos seus scripts.</p>
        </div>
        {!isFormOpen && !isNivel1 && (
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Categoria
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-4">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold text-white">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <button type="button" onClick={closeForm} className="text-slate-500 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome *</label>
              <input 
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Cor</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color"
                  value={cor}
                  onChange={e => setCor(e.target.value)}
                  className="h-[38px] w-16 bg-slate-950 border border-slate-800 rounded-md p-1 cursor-pointer"
                />
                <span className="text-sm text-slate-500 uppercase">{cor}</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
              <input 
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Exemplo: Queries sobre faturamento"
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
        {categorias.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-400">Nenhuma categoria</p>
            <p className="text-sm mt-1">Crie sua primeira categoria para organizar os scripts.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {categorias.map(cat => (
              <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-slate-700" 
                    style={{ backgroundColor: cat.cor || '#3b82f6' }} 
                  />
                  <Link 
                    href={`/explore?categoria=${cat.id}`} 
                    className="group"
                  >
                    <h3 className="font-bold text-white uppercase tracking-wide group-hover:text-blue-400 group-hover:underline underline-offset-4 transition-all">
                      {cat.nome}
                    </h3>
                    {cat.descricao && <p className="text-sm text-slate-500">{cat.descricao}</p>}
                  </Link>
                </div>
                {!isNivel1 && (
                <div className="flex items-center gap-4">
                  <button onClick={() => openForm(cat)} className="text-slate-400 hover:text-blue-400 transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.nome)} className="text-slate-400 hover:text-red-400 transition-colors" title="Excluir">
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
