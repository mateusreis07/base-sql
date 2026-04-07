import { RegisterForm } from "./form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: 'Cadastro - Base SQL',
};

export default async function RegisterPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;
  const userRole = user?.role?.toUpperCase();

  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  // Fetch all available teams for selection on registration
  const teams = await prisma.team.findMany({
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-slate-950 p-4 relative pb-20 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      
      <RegisterForm teams={teams} />
    </div>
  );
}
