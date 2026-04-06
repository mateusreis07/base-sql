import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        name: { label: "Nome (apenas no cadastro)", type: "text" },
        teamId: { label: "Time ID (apenas no cadastro)", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        let user = await (prisma as any).user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user && credentials.name) {
          const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
          user = await (prisma as any).user.create({
            data: {
              email: credentials.email as string,
              name: credentials.name as string,
              password: hashedPassword,
              teamId: credentials.teamId && credentials.teamId !== 'global' ? credentials.teamId as string : null,
              role: 'NIVEL2' // Defaults to ANALISTA to test team content creation easily
            }
          });
          return user;
        }

        // Se o usuário não existe, e ele não passou nome para cadastro, falha de login padrão
        if (!user || !user.password) return null;

        // Se o usuário existe, verifica a senha
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return user;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teamId = user.teamId;
        token.cargo = user.cargo;
      }
      if (trigger === "update" && session?.cargo !== undefined) {
        token.cargo = session.cargo;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.teamId = token.teamId as string | null;
        session.user.cargo = token.cargo as string | null;
      }
      return session;
    }
  }
})
