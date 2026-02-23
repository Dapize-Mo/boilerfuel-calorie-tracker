import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/fitness.nutrition.write',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Optional: Add custom logic here to store user in database
      // For now, we'll allow all Google users to sign in
      return true
    },
    async jwt({ token, account, profile }) {
      // Add additional user info to the JWT token
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      if (profile) {
        token.email = profile.email
        token.name = profile.name
        token.picture = profile.picture
      }
      return token
    },
    async session({ session, token }) {
      // Add user info to the session object
      session.user.id = token.sub
      session.user.email = token.email
      session.user.name = token.name
      session.user.image = token.picture
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/admin', // Redirect to admin page for sign-in
    error: '/admin', // Error page
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (matching your current JWT expiration)
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
