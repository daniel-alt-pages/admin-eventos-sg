import { NextResponse } from 'next/server';

// TEMPORAL: Endpoint de diagnóstico para verificar variables de entorno
// ELIMINAR DESPUÉS DE RESOLVER EL PROBLEMA

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    return NextResponse.json({
        message: "Diagnóstico de variables de entorno",
        variables: {
            GOOGLE_CLIENT_ID: {
                exists: !!clientId,
                length: clientId?.length || 0,
                starts: clientId?.substring(0, 15) || "undefined",
                ends: clientId?.substring(clientId.length - 20) || "undefined",
                hasSpaces: clientId?.includes(' ') || false,
                hasNewlines: clientId?.includes('\n') || clientId?.includes('\r') || false,
            },
            GOOGLE_CLIENT_SECRET: {
                exists: !!clientSecret,
                length: clientSecret?.length || 0,
                starts: clientSecret?.substring(0, 8) || "undefined",
            },
            NEXTAUTH_SECRET: {
                exists: !!nextAuthSecret,
                length: nextAuthSecret?.length || 0,
            },
            NEXTAUTH_URL: {
                exists: !!nextAuthUrl,
                value: nextAuthUrl || "undefined",
            }
        },
        expectedClientIdLength: 72, // El client ID correcto tiene 72 caracteres
        timestamp: new Date().toISOString()
    });
}
