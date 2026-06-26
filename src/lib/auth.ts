import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { normalizeEmail, verifyPassword } from "@/lib/auth/password";
import { isDevBypassEnabled } from "@/lib/auth/devBypass";
import { sendWelcomeEmail } from "@/lib/emails/sendWelcomeEmail";
import { seedWelcomeTemplate } from "@/lib/emails/seedWelcomeTemplate";

const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const hasGithub = !!process.env.GITHUB_ID && !!process.env.GITHUB_SECRET;

const DEV_USER = { id: "dev-user", name: "Dev User", email: "dev@local" };

async function ensureDevUser() {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, DEV_USER.id),
  });
  if (!existing) {
    await db.insert(users).values(DEV_USER);
  }
}

/**
 * DrizzleAdapter + libSQL/Turso can fail to resolve linked OAuth accounts on
 * repeat sign-ins. Override getUserByAccount with an explicit async query.
 */
function createAuthAdapter(): Adapter {
  const base = DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });

  return {
    ...base,
    async getUserByAccount(providerAccountId) {
      const result = await db
        .select({ user: users })
        .from(accounts)
        .innerJoin(users, eq(users.id, accounts.userId))
        .where(
          and(
            eq(accounts.provider, providerAccountId.provider),
            eq(accounts.providerAccountId, providerAccountId.providerAccountId)
          )
        )
        .get();

      return (result?.user ?? null) as AdapterUser | null;
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: createAuthAdapter(),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  debug: process.env.NODE_ENV === "development",
  providers: [
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(hasGithub
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? normalizeEmail(credentials.email) : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(isDevBypassEnabled()
      ? [
          CredentialsProvider({
            id: "dev-bypass",
            name: "Continue as Dev User (temporary)",
            credentials: {},
            async authorize() {
              await ensureDevUser();
              return DEV_USER;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "dev-bypass" && !isDevBypassEnabled()) return false;
      if (account?.provider === "google" && !hasGoogle) return false;
      if (account?.provider === "github" && !hasGithub) return false;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      // Profile updates call useSession().update({ name }) — reflect it in the JWT
      // so the new name shows without requiring a fresh sign-in.
      if (trigger === "update" && session && typeof session === "object") {
        const next = session as { name?: string };
        if (typeof next.name === "string" && next.name) token.name = next.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const userId = (token.id ?? token.sub) as string | undefined;
        if (userId) {
          (session.user as { id?: string }).id = userId;
        }
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  ...(isDevBypassEnabled() ? { allowDangerousEmailAccountLinking: true } : {}),
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      try {
        await seedWelcomeTemplate(user.id);
      } catch {
        // OAuth signup should still complete if seeding fails.
      }
      void sendWelcomeEmail({
        to: user.email,
        name: user.name ?? "there",
      }).catch(() => {});
    },
  },
};
