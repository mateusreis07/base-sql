import { prisma } from '@/lib/prisma';
import { TagManager } from './TagManager';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  
  const user = session.user as any;
  const userTeamId = user?.teamId;
  const userRole = user?.role;

  const whereAuth = userRole === 'ADMIN' ? {} : { teamId: userTeamId };

  const tags = await prisma.tag.findMany({
    where: whereAuth,
    orderBy: { nome: 'asc' },
  });

  return <TagManager initialTags={tags} isNivel1={userRole === 'NIVEL1'} />;
}
