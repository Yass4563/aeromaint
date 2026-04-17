import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      nom: string;
      prenom: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nom: string;
    prenom: string;
    email?: string;
    role: Role;
  }
}
