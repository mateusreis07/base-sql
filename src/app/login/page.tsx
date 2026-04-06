import { LoginForm } from "./form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Login - Base SQL',
};

export default async function LoginPage() {
  const session = await auth();
  
  // Se o usuário já está logado e trombou com a tela de login, o joga pro Início
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[100px]" />
      
      <LoginForm />
    </div>
  );
}
