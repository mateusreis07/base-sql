import { ScriptForm } from '@/components/forms/ScriptForm';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewScriptPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userRole = (session.user as any)?.role;
  const userTeamId = (session.user as any)?.teamId;
  const whereAuth = userRole === 'ADMIN' ? {} : { teamId: userTeamId };

  // Filtra categorias apenas do time (ou todas se Admin) e QUE NÃO SEJAM de sistema
  const categorias = await prisma.categoria.findMany({ 
    where: { 
      ...whereAuth,
      isSystem: false 
    }, 
    orderBy: { nome: 'asc' } 
  });
  
  const tags = await prisma.tag.findMany({ 
    where: whereAuth, 
    orderBy: { nome: 'asc' } 
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ScriptForm categorias={categorias} tags={tags} />
    </div>
  );
}
