const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Tokens y Credenciales
const KEY_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token-prod.json'); // Usamos el token prod si existe, sino variable.
// Nota: en local "token.json" es lo comun. Pero si ya bajamos .env.local quiza deberiamos leer token de ahí o generar uno con token.json.

// Simplificación: Vamos a usar el token que ya tenemos en variable de entorno en este chat o token.json si existe.
// Si no, pediremos auth. Pero acabamos de hacer auth.

const CALENDARS = {
    'Matemáticas': 'c_889b9a5030efdc76613f923fb10949162241a9b0aa67d5faa106a33e6ccc0f91@group.calendar.google.com',
    'Lectura Crítica': 'c_c750f24d23b5577d8d98431fec3650fb54321aa59ab92599d144f97ed8ed4375@group.calendar.google.com',
    'Sociales': 'c_dfc2f04bbfa771681bda44a5130e026dcc60f02ab58ff6a2631bbfabbcb9fc0d@group.calendar.google.com',
    'Ciencias Naturales': 'c_10dd3d184353bef3e9468d6441910ae42a9eeba0bda6d36ada5350e3c54cda0c@group.calendar.google.com',
    'Inglés': 'c_18cc46270ff32c851d2b731c3a74162d0ee0fb8e60d071608a6cce354cd41c3c@group.calendar.google.com'
};

async function main() {
    // 1. Auth
    const content = fs.readFileSync(KEY_PATH);
    const keys = JSON.parse(content);
    const key = keys.web || keys.installed;

    // Intentar leer token.json
    let tokens;
    // Buscamos GOOGLE_TOKENS en .env.local
    try {
        const envLocal = fs.readFileSync('.env.local', 'utf-8');
        const tokenLine = envLocal.split('\n').find(l => l.startsWith('GOOGLE_TOKENS='));
        if (tokenLine) {
            const tokenStr = tokenLine.replace('GOOGLE_TOKENS=', '').replace(/"/g, ''); // Cuidado con comillas
            // O mejor, busquemos token-prod.json si aun existe o usemos el que generamos
            // Voy a usar el token que recien subí a vercel.
        }
    } catch (e) { }

    // Fallback: leer tokens de un archivo local 'token.json' que suele crear el script de auth
    // Como no estoy seguro si 'token.json' está actualizado, usaré el client_secret para todo,
    // Pero espera, sin token válido no puedo leer calendarios privados.

    // TRUCO: Voy a invocar el endpoint de la API local que YA TIENE la auth configurada.
    // Es más fácil hacer fetch a localhost:3000/api/events/instances?subject=...
    console.log("Fetching links via Local API...");

    const subjects = ['Matemáticas', 'LecturaCrítica', 'Sociales', 'Naturales', 'Inglés'];

    for (const subj of subjects) {
        try {
            const res = await fetch(`http://localhost:3000/api/events/instances?subject=${subj}&weeks=4`);
            const data = await res.json();

            if (data.success && data.instances.length > 0) {
                // Buscar el primer evento con hangoutLink
                const eventWithMeet = data.instances.find(e => e.hangoutLink);
                if (eventWithMeet) {
                    console.log(`✅ ${subj}: ${eventWithMeet.hangoutLink}`);
                } else {
                    console.log(`⚠️ ${subj}: No meet link found in upcoming events`);
                }
            } else {
                console.log(`❌ ${subj}: No events found or error`);
            }
        } catch (e) {
            console.error(`Error fetching ${subj}:`, e.message);
        }
    }
}

main();
