import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

export const getOAuthClient = () => {
    let clientId: string;
    let clientSecret: string;
    let redirectUri: string;

    // Primero intentar variables de entorno (Vercel/producción)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        clientId = process.env.GOOGLE_CLIENT_ID.trim();
        clientSecret = process.env.GOOGLE_CLIENT_SECRET.trim();

        const envRedirect = process.env.GOOGLE_REDIRECT_URI ? process.env.GOOGLE_REDIRECT_URI.trim() : undefined;
        redirectUri = envRedirect ||
            (process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}/api/auth/callback/google`
                : 'http://localhost:3000/api/auth/callback/google');
    }
    // Fallback a credentials.json (desarrollo local)
    else if (fs.existsSync(CREDENTIALS_PATH)) {
        const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
        const keys = JSON.parse(content);
        const key = keys.web || keys.installed;

        clientId = key.client_id;
        clientSecret = key.client_secret;
        redirectUri = 'http://localhost:3000/api/auth/callback/google';
    } else {
        throw new Error('No Google credentials found. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables or provide credentials.json');
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
};
