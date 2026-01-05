import { NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendarService';
import { SUBJECTS } from '@/lib/subjects';

export async function GET() {
    try {
        const calendarService = new CalendarService();
        // Intentar con Sociales
        const calendarId = SUBJECTS.Sociales.calendarId;

        // Rango amplio: +/- 1 mes desde hoy
        const now = new Date();
        const start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        const end = new Date(now);
        end.setMonth(now.getMonth() + 1);

        console.log(`Testing calendar access for: ${calendarId}`);
        console.log(`Range: ${start.toISOString()} to ${end.toISOString()}`);

        const events = await calendarService.listEvents(
            calendarId,
            start.toISOString(),
            end.toISOString(),
            10
        );

        return NextResponse.json({
            success: true,
            calendarId,
            count: events.length,
            range: { start: start.toISOString(), end: end.toISOString() },
            events: events.map(e => ({
                summary: e.summary,
                start: e.start,
                id: e.id
            }))
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
