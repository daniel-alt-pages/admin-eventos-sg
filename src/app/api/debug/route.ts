import { NextResponse } from 'next/server';

// Función para limpiar variables (igual que en NextAuth)
const cleanEnv = (value: string | undefined): string => {
    return value?.trim().replace(/[\r\n\t]/g, '') || '';
};

export async function GET() {
    const clientIdRaw = process.env.GOOGLE_CLIENT_ID;
    const clientIdClean = cleanEnv(clientIdRaw);
    const nextAuthUrlRaw = process.env.NEXTAUTH_URL;
    const nextAuthUrlClean = cleanEnv(nextAuthUrlRaw);

    return NextResponse.json({
        message: "Diagnóstico de variables de entorno",
        status: clientIdClean.length === 72 ? "✅ OK" : "❌ ERROR",
        raw: {
            GOOGLE_CLIENT_ID_length: clientIdRaw?.length || 0,
            NEXTAUTH_URL: nextAuthUrlRaw,
        },
        cleaned: {
            GOOGLE_CLIENT_ID_length: clientIdClean.length,
            GOOGLE_CLIENT_ID_starts: clientIdClean.substring(0, 15),
            GOOGLE_CLIENT_ID_ends: clientIdClean.substring(clientIdClean.length - 25),
            NEXTAUTH_URL: nextAuthUrlClean,
        },
        expectedLength: 72,
        timestamp: new Date().toISOString()
    });
}
