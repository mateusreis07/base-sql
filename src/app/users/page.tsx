import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UsersClient } from './UsersClient';

export default async function UsersListPage() {
  const session = await auth();

  // Apenas N2 ou ADMIN podem ver a lista de usuários para resetar senhas
  if (!session || (session.user as any).role === 'NIVEL1') {
    redirect('/');
  }

  const users = await (prisma as any).user.findMany({
    include: {
      team: {
        select: {
          nome: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className="max-w-7xl mx-auto py-4">
      <UsersClient initialUsers={users} currentUserId={session.user?.id || ''} />
    </div>
  );
}
