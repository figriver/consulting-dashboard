import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Create or update user in database
      if (!user.email) {
        return false;
      }

      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) {
        // Create new user (default to CLIENT role, can be promoted by admin)
        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || undefined,
            authProvider: 'google',
            role: 'CLIENT', // Default role
          },
        });
      }

      return true;
    },

    async jwt({ token, user }: any) {
      if (user && user.email) {
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.clientId = dbUser.clientId || undefined;
          session.user.id = dbUser.id;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
