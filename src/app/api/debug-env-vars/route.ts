import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        GOOGLE_TOKENS: {
            exists: !!process.env.GOOGLE_TOKENS,
            length: process.env.GOOGLE_TOKENS?.length || 0,
            preview: process.env.GOOGLE_TOKENS ? process.env.GOOGLE_TOKENS.substring(0, 10) + '...' : 'N/A'
        },
        GOOGLE_CLIENT_ID: {
            exists: !!process.env.GOOGLE_CLIENT_ID,
            length: process.env.GOOGLE_CLIENT_ID?.length || 0
        },
        GOOGLE_CLIENT_SECRET: {
            exists: !!process.env.GOOGLE_CLIENT_SECRET,
            length: process.env.GOOGLE_CLIENT_SECRET?.length || 0
        },
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'N/A'
    });
}
