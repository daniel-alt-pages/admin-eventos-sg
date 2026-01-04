import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

export const getOAuthClient = () => {
    // Read credentials file
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.web || keys.installed;

    const clientId = key.client_id;
    const clientSecret = key.client_secret;
    // Force the correct callback URI that matches our Next.js route
    const redirectUri = 'http://localhost:3000/api/auth/callback/google';

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
};
