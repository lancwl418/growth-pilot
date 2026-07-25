import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { getSsoCookieConfig, isAllowedGoogleProfile } from "@/lib/auth-kit";

const ssoCookie = getSsoCookieConfig(
  process.env.SSO_COOKIE_DOMAIN,
  process.env.NODE_ENV === "production",
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Fallbacks keep the pre-v5 env names working until Render is updated.
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "growth-pilot-local-development-secret-only"
      : undefined),
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...(ssoCookie ? { cookies: { sessionToken: ssoCookie } } : {}),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
      // Link Google sign-ins to pre-existing users by email so history stays.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      return isAllowedGoogleProfile({
        email: profile?.email,
        hd: typeof profile?.hd === "string" ? profile.hd : null,
        email_verified:
          typeof profile?.email_verified === "boolean"
            ? profile.email_verified
            : null,
      });
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
