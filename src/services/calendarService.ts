import { promises as fs } from 'fs';
import * as path from 'path';
import * as process from 'process';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getOAuthClient } from '@/lib/googleAuth';

const TOKEN_PATH = path.join(process.cwd(), 'token.json');

/**
 * =================================================================
 * CALENDAR SERVICE
 * =================================================================
 * Servicio para interactuar con Google Calendar API.
 * Incluye: autorización, crear, listar y editar eventos.
 */
export class CalendarService {
    private auth: OAuth2Client | null = null;
    private calendar: calendar_v3.Calendar | null = null;

    /**
     * Autoriza el cliente OAuth2 con los tokens guardados.
     * En producción: lee de GOOGLE_TOKENS (variable de entorno)
     * En desarrollo: lee de token.json (archivo local)
     */
    async authorize(): Promise<OAuth2Client> {
        try {
            let tokens: any;
            console.log('[CalendarService] Starting authorization...');

            // Primero intentar leer de variable de entorno (producción)
            const envTokens = process.env.GOOGLE_TOKENS;
            if (envTokens) {
                tokens = JSON.parse(envTokens);
                console.log('[CalendarService] Using tokens from GOOGLE_TOKENS env var');
            } else {
                // Fallback: leer de archivo local (desarrollo)
                const content = await fs.readFile(TOKEN_PATH, 'utf-8');
                tokens = JSON.parse(content);
                console.log('[CalendarService] Using tokens from token.json file');
            }

            console.log('[CalendarService] Getting OAuth client...');
            const client = getOAuthClient();
            console.log('[CalendarService] OAuth client created, setting credentials...');
            client.setCredentials(tokens);

            this.auth = client;
            this.calendar = google.calendar({ version: 'v3', auth: client });
            console.log('[CalendarService] Authorization successful');
            return client;
        } catch (e: any) {
            console.error('[CalendarService] Failed to load tokens or authorize');
            console.error('[CalendarService] Error details:', e.message);
            console.error('[CalendarService] Stack:', e.stack);
            throw new Error(`Authorization failed: ${e.message}`);
        }
    }

    /**
     * Inserta un nuevo evento en el calendario especificado.
     */
    async insertEvent(calendarId: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            const res = await this.calendar.events.insert({
                calendarId: calendarId,
                requestBody: event,
                conferenceDataVersion: 1, // Required for creating Meet links
                sendUpdates: 'all',
            });
            return res.data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    /**
     * Lista eventos de un calendario en un rango de fechas.
     * @param calendarId - ID del calendario
     * @param timeMin - Fecha/hora mínima (ISO string)
     * @param timeMax - Fecha/hora máxima (ISO string)
     * @param maxResults - Máximo número de resultados (default 50)
     */
    async listEvents(
        calendarId: string,
        timeMin: string,
        timeMax: string,
        maxResults: number = 50
    ): Promise<calendar_v3.Schema$Event[]> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            const res = await this.calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return res.data.items || [];
        } catch (error) {
            console.error('Error listing events:', error);
            throw error;
        }
    }

    /**
     * Obtiene un evento específico por su ID.
     * @param calendarId - ID del calendario
     * @param eventId - ID del evento
     */
    async getEvent(calendarId: string, eventId: string): Promise<calendar_v3.Schema$Event> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            const res = await this.calendar.events.get({
                calendarId,
                eventId,
            });
            return res.data;
        } catch (error) {
            console.error('Error getting event:', error);
            throw error;
        }
    }

    /**
     * EDICIÓN SEGURA de un evento (PATCH).
     * Solo modifica los campos especificados, preservando:
     * - conferenceData (Google Meet link)
     * - attendees (invitados)
     * - otros campos no especificados
     * 
     * @param calendarId - ID del calendario
     * @param eventId - ID del evento a editar
     * @param updates - Objeto con los campos a actualizar
     */
    async patchEventSafe(
        calendarId: string,
        eventId: string,
        updates: {
            summary?: string;
            description?: string;
            start?: { dateTime: string; timeZone?: string };
            end?: { dateTime: string; timeZone?: string };
        }
    ): Promise<calendar_v3.Schema$Event> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            // Construir el payload solo con los campos que se quieren actualizar
            const resource: calendar_v3.Schema$Event = {};

            if (updates.summary !== undefined) {
                resource.summary = updates.summary;
            }
            if (updates.description !== undefined) {
                resource.description = updates.description;
            }
            if (updates.start !== undefined) {
                resource.start = {
                    dateTime: updates.start.dateTime,
                    timeZone: updates.start.timeZone || 'America/Bogota'
                };
            }
            if (updates.end !== undefined) {
                resource.end = {
                    dateTime: updates.end.dateTime,
                    timeZone: updates.end.timeZone || 'America/Bogota'
                };
            }

            const res = await this.calendar.events.patch({
                calendarId,
                eventId,
                requestBody: resource,
                conferenceDataVersion: 1, // CRÍTICO: Preserva el Meet existente
                sendUpdates: 'all', // Notifica a los invitados
            });

            return res.data;
        } catch (error) {
            console.error('Error patching event:', error);
            throw error;
        }
    }

    /**
     * Elimina un evento del calendario.
     * @param calendarId - ID del calendario
     * @param eventId - ID del evento a eliminar
     */
    async deleteEvent(calendarId: string, eventId: string): Promise<void> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            await this.calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: 'all',
            });
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    /**
     * Lista las instancias de un evento recurrente.
     * @param calendarId - ID del calendario
     * @param eventId - ID del evento recurrente base
     * @param timeMin - Fecha/hora mínima (ISO string)
     * @param timeMax - Fecha/hora máxima (ISO string)
     * @param maxResults - Máximo número de resultados (default 50)
     */
    async listEventInstances(
        calendarId: string,
        eventId: string,
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 50
    ): Promise<calendar_v3.Schema$Event[]> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            const params: any = {
                calendarId,
                eventId,
                maxResults,
            };

            if (timeMin) params.timeMin = timeMin;
            if (timeMax) params.timeMax = timeMax;

            const res = await this.calendar.events.instances(params);
            return res.data.items || [];
        } catch (error) {
            console.error('Error listing event instances:', error);
            throw error;
        }
    }

    /**
     * Edita una instancia específica de un evento recurrente.
     * Solo modifica los campos especificados, preservando el Meet link.
     * 
     * @param calendarId - ID del calendario
     * @param instanceId - ID de la instancia específica (incluye el sufijo de fecha)
     * @param updates - Objeto con los campos a actualizar
     */
    async patchEventInstance(
        calendarId: string,
        instanceId: string,
        updates: {
            summary?: string;
            description?: string;
            start?: { dateTime: string; timeZone?: string };
            end?: { dateTime: string; timeZone?: string };
        }
    ): Promise<calendar_v3.Schema$Event> {
        if (!this.calendar) {
            await this.authorize();
        }
        if (!this.calendar) throw new Error('Calendar service not authorized');

        try {
            const resource: calendar_v3.Schema$Event = {};

            if (updates.summary !== undefined) {
                resource.summary = updates.summary;
            }
            if (updates.description !== undefined) {
                resource.description = updates.description;
            }
            if (updates.start !== undefined) {
                resource.start = {
                    dateTime: updates.start.dateTime,
                    timeZone: updates.start.timeZone || 'America/Bogota'
                };
            }
            if (updates.end !== undefined) {
                resource.end = {
                    dateTime: updates.end.dateTime,
                    timeZone: updates.end.timeZone || 'America/Bogota'
                };
            }

            const res = await this.calendar.events.patch({
                calendarId,
                eventId: instanceId,
                requestBody: resource,
                conferenceDataVersion: 1, // Preserva el Meet existente
                sendUpdates: 'all',
            });

            return res.data;
        } catch (error) {
            console.error('Error patching event instance:', error);
            throw error;
        }
    }
}
