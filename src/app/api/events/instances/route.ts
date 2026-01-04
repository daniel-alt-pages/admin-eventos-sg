import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendarService';
import { SUBJECTS, Subject } from '@/lib/subjects';

/**
 * GET /api/events/instances
 * Lista TODOS los eventos de un calendario de área.
 * Ya no depende de IDs fijos - lee directamente del calendario.
 * 
 * Query Params:
 * - subject: Nombre de la materia (Matemáticas, LecturaCrítica, etc.)
 * - weeks: Número de semanas a buscar (default: 4)
 * - direction: 'future' (default) o 'past'
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject') as Subject;
        const weeksParam = searchParams.get('weeks');
        const direction = searchParams.get('direction') || 'future';
        const weeks = weeksParam ? parseInt(weeksParam) : 4;

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

        // Calcular rango de fechas
        const now = new Date();
        let timeMin: Date, timeMax: Date;

        if (direction === 'past') {
            timeMin = new Date();
            timeMin.setDate(now.getDate() - (weeks * 7));
            timeMin.setHours(0, 0, 0, 0);
            timeMax = new Date();
            timeMax.setHours(23, 59, 59, 999);
        } else {
            timeMin = new Date();
            timeMin.setHours(0, 0, 0, 0);
            timeMax = new Date();
            timeMax.setDate(now.getDate() + (weeks * 7));
            timeMax.setHours(23, 59, 59, 999);
        }

        // Listar TODOS los eventos del calendario (no solo de un evento específico)
        const events = await calendarService.listEvents(
            selectedSubject.calendarId,
            timeMin.toISOString(),
            timeMax.toISOString()
        );

        // Obtener el Meet link del primer evento recurrente encontrado
        const recurringEvent = events.find(e => e.recurringEventId);
        const meetLink = recurringEvent?.hangoutLink || events[0]?.hangoutLink || null;

        // Formatear respuesta
        const formattedEvents = events.map(event => ({
            id: event.id,
            recurringEventId: event.recurringEventId,
            summary: event.summary || '(Sin título)',
            description: event.description,
            start: event.start,
            end: event.end,
            hangoutLink: event.hangoutLink,
            htmlLink: event.htmlLink,
            status: event.status,
            isRecurring: !!event.recurringEventId
        }));

        // Ordenar por fecha
        formattedEvents.sort((a, b) => {
            const dateA = new Date(a.start?.dateTime || a.start?.date || 0);
            const dateB = new Date(b.start?.dateTime || b.start?.date || 0);
            return dateA.getTime() - dateB.getTime();
        });

        return NextResponse.json({
            success: true,
            subject: selectedSubject.displayName,
            calendarId: selectedSubject.calendarId,
            meetLink,
            weeks,
            direction,
            count: formattedEvents.length,
            instances: formattedEvents  // Mantenemos el nombre para compatibilidad
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
