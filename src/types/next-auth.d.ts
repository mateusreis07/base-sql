import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "NIVEL1" | "NIVEL2" | "ADMIN"
      teamId: string | null
      cargo: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: "NIVEL1" | "NIVEL2" | "ADMIN"
    teamId: string | null
    cargo: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "NIVEL1" | "NIVEL2" | "ADMIN"
    teamId: string | null
    cargo: string | null
  }
}
