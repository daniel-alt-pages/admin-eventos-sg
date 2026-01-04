import { NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/googleAuth';
import fs from 'fs';
import path from 'path';

// For simplicity in this demo, we save tokens to a local file.
// In production, use encrypted cookies or a database session.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const oauth2Client = getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        // Save tokens locally for the service to use (simulating a single-user system or easier demo)
        console.log('Saving tokens to:', TOKEN_PATH);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('TOKENS SAVED SUCCESSFULLY');

        return NextResponse.redirect(new URL('/', request.url));
    } catch (error: any) {
        console.error('Error exchanging code for tokens:', error);
        return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 500 });
    }
}
