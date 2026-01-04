import { NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/googleAuth';

export async function GET() {
    const oauth2Client = getOAuthClient();

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email' // To know who logged in
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important to get refresh token
        scope: scopes,
    });

    return NextResponse.redirect(url);
}
