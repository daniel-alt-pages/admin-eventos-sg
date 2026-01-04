import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendarService';
import { SUBJECTS, Subject } from '@/lib/subjects';

/**
 * GET /api/events/list
 * Lista eventos de un calendario específico en un rango de fechas.
 * 
 * Query Params:
 * - subject: Nombre de la materia (Matemáticas, LecturaCrítica, etc.)
 * - date: Fecha en formato YYYY-MM-DD (opcional, default: hoy)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject') as Subject;
        const dateParam = searchParams.get('date');

        // Validar materia
        if (!subject || !SUBJECTS[subject]) {
            return NextResponse.json(
                { success: false, error: 'Materia inválida o no especificada' },
                { status: 400 }
            );
        }

        const selectedSubject = SUBJECTS[subject];
        const calendarService = new CalendarService();
        await calendarService.authorize();

        // Construir rango de fechas (día completo)
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        const timeMin = new Date(targetDate);
        timeMin.setHours(0, 0, 0, 0);

        const timeMax = new Date(targetDate);
        timeMax.setHours(23, 59, 59, 999);

        const events = await calendarService.listEvents(
            selectedSubject.calendarId,
            timeMin.toISOString(),
            timeMax.toISOString()
        );

        // Formatear respuesta con datos relevantes
        const formattedEvents = events.map(event => ({
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
                responseStatus: a.responseStatus
            }))
        }));

        return NextResponse.json({
            success: true,
            subject: selectedSubject.displayName,
            date: dateParam || targetDate.toISOString().split('T')[0],
            count: formattedEvents.length,
            events: formattedEvents
        });

    } catch (error: any) {
        console.error('API Error (list events):', error);

        if (error.message.includes('No saved tokens') || error.message.includes('invalid_grant')) {
            return NextResponse.json({
                success: false,
                error: 'No estás autenticado. Por favor inicia sesión.',
                needsAuth: true
            }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}
