const { google } = require('googleapis');
// ... (omitiendo requires duplicados si ya existen, pero para asegurar:
const fetch = require('node-fetch'); // Probablemente no necesario en node 24 pero porsiaca

async function main() {
    const subjects = ['Matemáticas', 'LecturaCrítica', 'Sociales', 'Naturales', 'Inglés'];
    console.log('\n=== ENLACES DE GOOGLE MEET ===\n');

    for (const subj of subjects) {
        try {
            const res = await fetch(`http://localhost:3000/api/events/instances?subject=${subj}&weeks=12`);
            const data = await res.json();

            if (data.success && data.instances.length > 0) {
                const eventWithMeet = data.instances.find(e => e.hangoutLink);
                if (eventWithMeet) {
                    console.log(`${subj}: ${eventWithMeet.hangoutLink}`);
                } else {
                    console.log(`${subj}: (Sin enlace aun)`);
                }
            } else {
                console.log(`${subj}: (Sin eventos)`);
            }
        } catch (e) {
            console.log(`${subj}: Error (${e.message})`);
        }
    }
    console.log('\n==============================\n');
}
main();
