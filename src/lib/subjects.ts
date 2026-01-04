/**
 * =================================================================
 * CONFIGURACIÓN DE MATERIAS Y CALENDARIOS
 * =================================================================
 * Cada materia tiene su propio calendario de Google y lista de profesores.
 * Los colores corresponden a la UI de tarjetas de materias.
 */

export type Subject = 'Matemáticas' | 'LecturaCrítica' | 'Sociales' | 'Naturales' | 'Inglés';

export interface SubjectData {
    name: Subject;
    displayName: string;
    calendarId: string;
    professors: string[];
    color: string;
    icon: string;
    description: string;
}

export const SUBJECTS: Record<Subject, SubjectData> = {
    Matemáticas: {
        name: 'Matemáticas',
        displayName: 'Matemáticas',
        calendarId: 'c_889b9a5030efdc76613f923fb10949162241a9b0aa67d5faa106a33e6ccc0f91@group.calendar.google.com',
        professors: [
            'luisdavidgutierres3110@gmail.com',
            'vivianarincon.seamosgenios@gmail.com',
            'sara.seamosgenios@gmail.com'
        ],
        color: '#2196F3',
        icon: '🧮',
        description: 'Álgebra, geometría, cálculo y más'
    },
    LecturaCrítica: {
        name: 'LecturaCrítica',
        displayName: 'Lectura Crítica',
        calendarId: 'c_c750f24d23b5577d8d98431fec3650fb54321aa59ab92599d144f97ed8ed4375@group.calendar.google.com',
        professors: [
            // TODO: Agregar profesores de Lectura Crítica
        ],
        color: '#F44336',
        icon: '📖',
        description: 'Comprensión lectora y análisis de textos'
    },
    Sociales: {
        name: 'Sociales',
        displayName: 'Ciencias Sociales',
        calendarId: 'c_dfc2f04bbfa771681bda44a5130e026dcc60f02ab58ff6a2631bbfabbcb9fc0d@group.calendar.google.com',
        professors: [
            'carlosmurillo.seamosgenios@gmail.com',
            'davidleandrocard60@gmail.com'
        ],
        color: '#FF9800',
        icon: '🌍',
        description: 'Historia, geografía y ciudadanía'
    },
    Naturales: {
        name: 'Naturales',
        displayName: 'Ciencias Naturales',
        calendarId: 'c_10dd3d184353bef3e9468d6441910ae42a9eeba0bda6d36ada5350e3c54cda0c@group.calendar.google.com',
        professors: [
            'joselondono.edu.seamosgenios@gmail.com',
            'danielcuspoca.edu.seamosgenios@gmail.com',
            'jesus.seamosgenios@gmail.com'
        ],
        color: '#4CAF50',
        icon: '🌳',
        description: 'Biología, química y física'
    },
    Inglés: {
        name: 'Inglés',
        displayName: 'Inglés',
        calendarId: 'c_18cc46270ff32c851d2b731c3a74162d0ee0fb8e60d071608a6cce354cd41c3c@group.calendar.google.com',
        professors: [
            'vivianarincon.seamosgenios@gmail.com',
            'sara.seamosgenios@gmail.com'
        ],
        color: '#9C27B0',
        icon: '🌐',
        description: 'Gramática, vocabulario y comprensión'
    }
};

// Helper para obtener todas las materias como array
export const getSubjectsArray = (): SubjectData[] => Object.values(SUBJECTS);

// Helper para obtener una materia por nombre
export const getSubjectByName = (name: Subject): SubjectData | undefined => SUBJECTS[name];
