import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { UserModel } from '@/lib/models';

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    newUser: '/auth/onboarding',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/auth');
      if (isAuthPage) return !isLoggedIn;
      return isLoggedIn;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await UserModel.findOne({
          email: credentials.email,
          isActive: true,
        }).select('+password');
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;
        await UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId?.toString(),
          image: user.avatar,
        };
      },
    }),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// ---- RBAC Permission Matrix ----

export const PERMISSIONS = {
  super_admin: ['*'],
  tenant_admin: [
    'dashboard:read', 'inventory:*', 'orders:*', 'staff:*',
    'analytics:read', 'accounting:*', 'settings:*', 'prescriptions:*',
  ],
  pharmacist: [
    'dashboard:read', 'inventory:read', 'prescriptions:*',
    'orders:read', 'orders:update', 'drugs:read',
  ],
  cashier: [
    'pos:*', 'orders:create', 'orders:read', 'inventory:read', 'drugs:read',
  ],
  inventory_manager: [
    'inventory:*', 'drugs:read', 'orders:read', 'analytics:read',
  ],
  driver: [
    'delivery:read', 'delivery:update', 'orders:read',
  ],
  consumer: [
    'drugs:read', 'orders:*', 'prescriptions:read', 'health:*', 'cart:*',
  ],
  doctor: [
    'prescriptions:*', 'drugs:read', 'patients:read',
  ],
} as const;

export function hasPermission(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role as keyof typeof PERMISSIONS] || [];
  return perms.includes('*') ||
    perms.includes(permission) ||
    perms.some(p => p.endsWith(':*') && permission.startsWith(p.replace(':*', ':')));
}
