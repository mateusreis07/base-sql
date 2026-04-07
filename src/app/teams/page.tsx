import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeamManager } from "./TeamManager";

export const metadata = {
  title: 'Gestão de Equipes - Base SQL',
};

export default async function TeamsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;
  const userRole = user?.role?.toUpperCase();

  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  const [teams, users, globalUsersCount, globalScriptsCount] = await Promise.all([
    prisma.team.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: { 
            users: true, 
            scripts: true 
          }
        }
      },
      orderBy: { nome: 'asc' }
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    }),
    prisma.user.count({ where: { teamId: null } }),
    prisma.script.count({ where: { teamId: null } })
  ]);

  const globalTeam = {
    id: 'global-team',
    nome: 'DIRETORIA GLOBAL (SEM TIME)',
    ownerId: null,
    owner: null,
    _count: {
      users: globalUsersCount,
      scripts: globalScriptsCount
    },
    isGlobal: true // flag for UI customization
  };

  const finalTeams = [globalTeam, ...teams];

  return (
    <div className="flex flex-col w-full relative pb-10 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      
      <TeamManager initialTeams={finalTeams as any} allUsers={users as any} />
    </div>
  );
}
