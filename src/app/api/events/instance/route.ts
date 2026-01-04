import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendarService';
import { SUBJECTS, Subject } from '@/lib/subjects';

/**
 * DELETE /api/events/instance
 * Cancela una instancia de un evento recurrente (no la elimina permanentemente).
 * La instancia queda marcada como 'cancelled' y puede ser restaurada.
 * 
 * Body:
 * - subject: Nombre de la materia
 * - instanceId: ID de la instancia a cancelar
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { subject, instanceId } = body;

        // Validar inputs
        if (!subject || !SUBJECTS[subject as Subject]) {
            return NextResponse.json(
                { success: false, error: 'Materia inválida' },
                { status: 400 }
            );
        }

        if (!instanceId) {
            return NextResponse.json(
                { success: false, error: 'instanceId es requerido' },
                { status: 400 }
            );
        }

        const selectedSubject = SUBJECTS[subject as Subject];
        const calendarService = new CalendarService();
        await calendarService.authorize();

        // Cancelar la instancia (marcar como cancelled)
        await calendarService.deleteEvent(selectedSubject.calendarId, instanceId);

        return NextResponse.json({
            success: true,
            message: 'Instancia cancelada. Puede ser restaurada si es necesario.'
        });

    } catch (error: any) {
        console.error('API Error (delete instance):', error);

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

/**
 * PUT /api/events/instance
 * Restaura una instancia cancelada de un evento recurrente.
 * 
 * Body:
 * - subject: Nombre de la materia
 * - instanceId: ID de la instancia a restaurar
 * - originalStart: Fecha/hora original de la instancia (para recrearla correctamente)
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { subject, instanceId, originalStart, originalEnd } = body;

        // Validar inputs
        if (!subject || !SUBJECTS[subject as Subject]) {
            return NextResponse.json(
                { success: false, error: 'Materia inválida' },
                { status: 400 }
            );
        }

        if (!instanceId) {
            return NextResponse.json(
                { success: false, error: 'instanceId es requerido' },
                { status: 400 }
            );
        }

        const selectedSubject = SUBJECTS[subject as Subject];
        const calendarService = new CalendarService();
        await calendarService.authorize();

        // Restaurar la instancia actualizando su status a 'confirmed'
        // Esto se hace mediante un PATCH con el status
        const restoredEvent = await calendarService.patchEventSafe(
            selectedSubject.calendarId,
            instanceId,
            {
                start: originalStart ? { dateTime: originalStart, timeZone: 'America/Bogota' } : undefined,
                end: originalEnd ? { dateTime: originalEnd, timeZone: 'America/Bogota' } : undefined,
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Instancia restaurada correctamente.',
            event: {
                id: restoredEvent.id,
                summary: restoredEvent.summary,
                start: restoredEvent.start,
                end: restoredEvent.end,
                hangoutLink: restoredEvent.hangoutLink
            }
        });

    } catch (error: any) {
        console.error('API Error (restore instance):', error);

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
