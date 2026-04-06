import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Star, Database, Search } from 'lucide-react';
import { ScriptCard } from '@/components/ui/ScriptCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FavoritosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = (session?.user as any)?.id || '';
  const userTeamId = (session?.user as any)?.teamId;

  // Busca todos os favoritos do usuário com detalhes do script
  const favorites = await prisma.favorite.findMany({
    where: {
      userId: userId,
      script: {
         // Garante que o usuário ainda tem acesso ao script (Global ou do seu Time)
         OR: [
            { visibility: 'GLOBAL' },
            ...(userTeamId ? [{ teamId: userTeamId }] : [])
         ]
      }
    },
    include: {
      script: {
        include: {
          categoria: true,
          autor: { select: { id: true, name: true } },
          team: { select: { nome: true } },
          tags: {
            include: { Tag: true }
          },
          favorites: {
            where: { userId: userId }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const scripts = favorites.map(fav => ({
    ...fav.script,
    isFavorite: fav.script.favorites.length > 0
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
             <Star className="w-5 h-5 fill-current" />
             <span className="font-bold uppercase tracking-widest text-xs">Coleção Pessoal</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Seus Favoritos</h1>
          <p className="text-slate-500 mt-1">Scripts que você salvou para acesso rápido.</p>
        </div>
      </div>

      {scripts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center shadow-xl">
           <div className="max-w-md mx-auto">
             <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-slate-600" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Sua lista está vazia</h3>
             <p className="text-slate-500 text-sm mb-8 leading-relaxed">
               Navegue pelo painel principal ou pela aba explorar e clique no ícone de estrela para salvar seus scripts mais utilizados aqui.
             </p>
             <Link 
               href="/explore" 
               className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
             >
               <Search className="w-4 h-4" />
               Explorar Scripts
             </Link>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {scripts.map(script => (
            <ScriptCard 
              key={script.id} 
              script={script as any} 
            />
          ))}
        </div>
      )}

      {scripts.length > 0 && (
         <div className="mt-12 p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Database className="w-6 h-6 text-blue-500" />
               </div>
               <div>
                  <h4 className="text-white font-bold">Dica de Produtividade</h4>
                  <p className="text-sm text-slate-500">Mantenha apenas os scripts essenciais aqui para maior agilidade no atendimento.</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
