import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = "gmail.com";
      const allowedEmails = (process.env.ALLOWED_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
      const email = user.email ?? "";
      if (allowedEmails.length > 0) {
        return allowedEmails.includes(email);
      }
      return email.endsWith(`@${allowedDomain}`);
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.role = token.role ?? "user";
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
      if (adminEmails.includes(user?.email ?? "")) token.role = "admin";
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export { auth as GET, auth as POST };
