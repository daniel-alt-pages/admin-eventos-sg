import { NextResponse } from 'next/server';

// Limpiar variables de entorno
const cleanEnv = (value: string | undefined): string => {
    return value?.trim().replace(/[\r\n\t]/g, '') || '';
};

export async function GET() {
    const clientId = cleanEnv(process.env.GOOGLE_CLIENT_ID);
    const clientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
    const nextAuthSecret = cleanEnv(process.env.NEXTAUTH_SECRET);
    const nextAuthUrl = cleanEnv(process.env.NEXTAUTH_URL);

    // Mostrar solo partes seguras de las credenciales
    const safeClientId = clientId
        ? `${clientId.substring(0, 20)}...${clientId.substring(clientId.length - 25)}`
        : 'NOT SET';

    const safeClientSecret = clientSecret
        ? `${clientSecret.substring(0, 8)}...${clientSecret.substring(clientSecret.length - 4)} (length: ${clientSecret.length})`
        : 'NOT SET';

    return NextResponse.json({
        status: clientId.length === 72 && clientSecret.length === 35 ? '✅ OK' : '❌ ERROR',
        credentials: {
            GOOGLE_CLIENT_ID: safeClientId,
            GOOGLE_CLIENT_ID_length: clientId.length,
            GOOGLE_CLIENT_SECRET: safeClientSecret,
            GOOGLE_CLIENT_SECRET_length: clientSecret.length,
            NEXTAUTH_SECRET_exists: !!nextAuthSecret,
            NEXTAUTH_SECRET_length: nextAuthSecret.length,
            NEXTAUTH_URL: nextAuthUrl || 'NOT SET',
        },
        expected: {
            clientId_length: 72,
            clientSecret_length: 35,
            clientId_should_start: '144551243576-oajtv6qtvm06u8f3b1hf8v01lcmvrset',
        },
        timestamp: new Date().toISOString()
    });
}
