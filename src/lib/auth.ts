import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      if (!email) return false;

      const allowedEmails = process.env.ALLOWED_EMAILS;
      const allowedDomain = process.env.ALLOWED_DOMAIN;

      if (allowedEmails) {
        const emails = allowedEmails.split(",").map((e) => e.trim().toLowerCase());
        if (emails.includes(email.toLowerCase())) return true;
      }

      if (allowedDomain) {
        if (email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) return true;
      }

      // If neither is set, allow all (for initial setup)
      if (!allowedEmails && !allowedDomain) return true;

      return false;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
