import { Subject } from './subjects';

/**
 * =================================================================
 * EVENTOS DE ACCESO RÁPIDO (OPCIONAL)
 * =================================================================
 * 
 * Este archivo es OPCIONAL. La aplicación ahora lee todos los eventos
 * directamente de los calendarios de cada área sin necesidad de IDs fijos.
 * 
 * Si deseas agregar accesos directos a eventos específicos, puedes
 * configurarlos aquí. De lo contrario, puedes dejar este archivo vacío.
 * 
 * Para obtener el ID de un evento:
 * 1. Abre el evento en Google Calendar
 * 2. En la URL verás algo como: .../eventedit/XXXXXX
 * 3. El XXXXXX es el ID del evento
 */

export interface QuickAccessEvent {
    id: string;           // ID del evento en Google Calendar
    subject: Subject;     // Materia a la que pertenece
    displayName: string;  // Nombre para mostrar
    description: string;  // Descripción corta
    icon: string;         // Emoji
    color: string;        // Color del botón
}

/**
 * Lista de eventos para acceso rápido (opcional).
 * Estos aparecerán como botones de acceso directo.
 * 
 * Puedes dejar este array vacío si no necesitas accesos rápidos.
 */
export const QUICK_ACCESS_EVENTS: QuickAccessEvent[] = [
    // Ejemplo de configuración (comentado):
    // {
    //     id: 'abc123xyz',
    //     subject: 'Matemáticas',
    //     displayName: 'Clase Principal',
    //     description: 'Clase semanal',
    //     icon: '🧮',
    //     color: '#2196F3'
    // },
];

// Alias para compatibilidad hacia atrás
export const FIXED_EVENTS = QUICK_ACCESS_EVENTS;

// Helper para obtener eventos por materia
export const getQuickAccessBySubject = (subject: Subject): QuickAccessEvent[] => {
    return QUICK_ACCESS_EVENTS.filter(event => event.subject === subject);
};
