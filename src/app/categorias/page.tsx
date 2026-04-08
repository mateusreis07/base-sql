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

  if (userTeamId) {
    // Busca qualquer categoria com o nome "Clonados" para o time
    const existingClonados = await prisma.categoria.findFirst({
      where: { nome: 'Clonados', teamId: userTeamId }
    });

    if (!existingClonados) {
      await prisma.categoria.create({
        data: {
          nome: 'Clonados',
          descricao: 'Scripts clonados de outras equipes - compartilhamentos globais.',
          isSystem: true,
          cor: '#475569', // slate-600
          teamId: userTeamId
        }
      });
    } else if (!(existingClonados as any).isSystem) {
      // Se já existe mas não é de sistema, atualiza para ser de sistema
      await prisma.categoria.update({
        where: { id: existingClonados.id },
        data: { isSystem: true }
      });
    }
  }

  const whereAuth = userRole === 'ADMIN' ? {} : { teamId: userTeamId };

  const categorias = await prisma.categoria.findMany({
    where: whereAuth,
    orderBy: { nome: 'asc' },
  });

  return <CategoriaManager initialCategorias={categorias} isNivel1={userRole === 'NIVEL1'} />;
}
