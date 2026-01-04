import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendarService';
import { SUBJECTS, Subject } from '@/lib/subjects';

/**
 * PATCH /api/events/edit
 * Edita un evento de forma segura (sin eliminar el Meet link).
 * 
 * Body:
 * - subject: Nombre de la materia
 * - eventId: ID del evento a editar
 * - summary: Nuevo título (opcional)
 * - start: Nueva fecha/hora de inicio ISO (opcional)
 * - end: Nueva fecha/hora de fin ISO (opcional)
 * - description: Nueva descripción (opcional)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { subject, eventId, summary, start, end, description } = body;

        // Validar inputs requeridos
        if (!subject || !SUBJECTS[subject as Subject]) {
            return NextResponse.json(
                { success: false, error: 'Materia inválida' },
                { status: 400 }
            );
        }

        if (!eventId) {
            return NextResponse.json(
                { success: false, error: 'eventId es requerido' },
                { status: 400 }
            );
        }

        const selectedSubject = SUBJECTS[subject as Subject];
        const calendarService = new CalendarService();
        await calendarService.authorize();

        // Construir objeto de actualizaciones
        const updates: {
            summary?: string;
            description?: string;
            start?: { dateTime: string; timeZone?: string };
            end?: { dateTime: string; timeZone?: string };
        } = {};

        if (summary !== undefined) {
            updates.summary = summary;
        }
        if (description !== undefined) {
            updates.description = description;
        }
        if (start !== undefined) {
            updates.start = {
                dateTime: new Date(start).toISOString(),
                timeZone: 'America/Bogota'
            };
        }
        if (end !== undefined) {
            updates.end = {
                dateTime: new Date(end).toISOString(),
                timeZone: 'America/Bogota'
            };
        }

        // Realizar PATCH seguro
        const updatedEvent = await calendarService.patchEventSafe(
            selectedSubject.calendarId,
            eventId,
            updates
        );

        return NextResponse.json({
            success: true,
            message: 'Evento actualizado correctamente. Meet y configuración intactos.',
            event: {
                id: updatedEvent.id,
                summary: updatedEvent.summary,
                start: updatedEvent.start,
                end: updatedEvent.end,
                hangoutLink: updatedEvent.hangoutLink,
                htmlLink: updatedEvent.htmlLink
            }
        });

    } catch (error: any) {
        console.error('API Error (edit event):', error);

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
