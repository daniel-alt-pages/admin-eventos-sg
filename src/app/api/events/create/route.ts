import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { CalendarService } from '@/services/calendarService';
import { EventModel, EventConfig } from '@/models/eventModel';
import { SUBJECTS, Subject } from '@/lib/subjects';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subject, title, date, time, duration } = body;

        // 1. Validate Input
        if (!subject || !SUBJECTS[subject as Subject]) {
            return NextResponse.json({ success: false, error: 'Asignatura inválida' }, { status: 400 });
        }
        const selectedSubject = SUBJECTS[subject as Subject];

        // 2. Load Base Config
        const configPath = path.join(process.cwd(), 'data/config.json');
        const configRaw = fs.readFileSync(configPath, 'utf8');
        const config: EventConfig = JSON.parse(configRaw);

        // 3. Initialize Logic
        const eventModel = new EventModel(config);
        const calendarService = new CalendarService();

        // 4. Authorize
        await calendarService.authorize();

        // 5. Construct Date Objects
        // date: "2025-12-27", time: "14:00"
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + (duration || 1)); // Default 1 hour duration

        // 6. Config Tutors as Attendees
        const tutorAttendees = selectedSubject.professors.map(email => ({ email }));

        // 7. Create Event Data
        const eventDescription = `
      <b>Clase de ${selectedSubject.displayName}</b><br/>
      <b>Configuración:</b><br/>
      - Grabación: Activada<br/>
      - Asistencia: Activada<br/>
      - Notas AI: Activadas (Español)<br/>
      - Tutores: ${selectedSubject.professors.join(', ')}
    `;

        const eventData = eventModel.createEventObject(
            title || `Clase de ${selectedSubject.displayName}`,
            startDateTime.toISOString(),
            endDateTime.toISOString(),
            tutorAttendees,
            eventDescription
        );

        // 8. Insert into Specific Calendar ID
        console.log(`Inserting event into calendar: ${selectedSubject.calendarId}`);
        const createdEvent = await calendarService.insertEvent(selectedSubject.calendarId, eventData);

        return NextResponse.json({
            success: true,
            link: createdEvent.htmlLink,
            meetLink: createdEvent.hangoutLink,
            eventId: createdEvent.id,
            message: 'Evento creado exitosamente'
        });

    } catch (error: any) {
        console.error('API Error:', error);

        if (error.message.includes('No saved tokens') || error.message.includes('invalid_grant')) {
            return NextResponse.json({
                success: false,
                error: 'No estás autenticado. Por favor inicia sesión.',
                needsAuth: true
            }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
