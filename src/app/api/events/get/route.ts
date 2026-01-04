import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendarService';
import { SUBJECTS, Subject } from '@/lib/subjects';

/**
 * GET /api/events/get
 * Obtiene un evento específico por su ID.
 * 
 * Query Params:
 * - subject: Nombre de la materia
 * - eventId: ID del evento
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject') as Subject;
        const eventId = searchParams.get('eventId');

        // Validar inputs
        if (!subject || !SUBJECTS[subject]) {
            return NextResponse.json(
                { success: false, error: 'Materia inválida o no especificada' },
                { status: 400 }
            );
        }

        if (!eventId) {
            return NextResponse.json(
                { success: false, error: 'eventId es requerido' },
                { status: 400 }
            );
        }

        const selectedSubject = SUBJECTS[subject];
        const calendarService = new CalendarService();
        await calendarService.authorize();

        const event = await calendarService.getEvent(selectedSubject.calendarId, eventId);

        return NextResponse.json({
            success: true,
            event: {
                id: event.id,
                summary: event.summary || '(Sin título)',
                description: event.description,
                start: event.start,
                end: event.end,
                hangoutLink: event.hangoutLink,
                htmlLink: event.htmlLink,
                location: event.location,
                attendees: event.attendees?.map(a => ({
                    email: a.email,
                    displayName: a.displayName,
                    responseStatus: a.responseStatus
                })),
                conferenceData: event.conferenceData
            }
        });

    } catch (error: any) {
        console.error('API Error (get event):', error);

        if (error.message.includes('No saved tokens') || error.message.includes('invalid_grant')) {
            return NextResponse.json({
                success: false,
                error: 'No estás autenticado. Por favor inicia sesión.',
                needsAuth: true
            }, { status: 401 });
        }

        if (error.code === 404) {
            return NextResponse.json({
                success: false,
                error: 'Evento no encontrado'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: false,
            error: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}
