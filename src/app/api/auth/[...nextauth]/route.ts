import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// LIMPIAR variables de entorno (eliminar espacios, tabs, saltos de línea)
const cleanEnv = (value: string | undefined): string => {
    return value?.trim().replace(/[\r\n\t]/g, '') || '';
};

const GOOGLE_CLIENT_ID = cleanEnv(process.env.GOOGLE_CLIENT_ID);
const GOOGLE_CLIENT_SECRET = cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
const NEXTAUTH_SECRET = cleanEnv(process.env.NEXTAUTH_SECRET);

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Guardar tokens en el JWT cuando el usuario se autentica
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
            }
            return token;
        },
        async session({ session, token }) {
            // Pasar tokens a la sesión
            session.accessToken = token.accessToken as string;
            session.refreshToken = token.refreshToken as string;
            return session;
        },
    },
    pages: {
        signIn: "/",  // Redirigir al home si no está autenticado
    },
    secret: NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
