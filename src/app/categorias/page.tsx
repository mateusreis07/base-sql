import { prisma } from '@/lib/prisma';
import { CategoriaManager } from './CategoriaManager';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoriasPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as any;
  const userTeamId = user?.teamId;
  const userRole = user?.role;

  const whereAuth = userRole === 'ADMIN' ? {} : { teamId: userTeamId };
  
  const categorias = await prisma.categoria.findMany({
    where: whereAuth,
    orderBy: { nome: 'asc' },
  });

  return <CategoriaManager initialCategorias={categorias} isNivel1={userRole === 'NIVEL1'} />;
}
