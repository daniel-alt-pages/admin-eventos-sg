# 📅 Admin Eventos - Seamos Genios

Sistema de gestión de clases con integración de Google Calendar y Google Meet.

## 🎯 Características Principales

- **Calendario Visual**: Vista mensual (todas las áreas) y semanal (por área)
- **Reloj Futurista**: Tiempo real con diseño moderno
- **Meet Link Fijo**: Cada área tiene un link de Meet permanente con configuración privada
- **Preservación de Permisos**: Los coorganizadores y configuración de "oyentes" se mantienen
- **Edición Segura**: Modifica eventos sin perder configuración de Meet
- **Eliminación Recuperable**: Las clases canceladas pueden restaurarse

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ Vista Mensual │  │ Vista Semanal │  │    Editor     │   │
│  │  (5 áreas)    │  │  (por área)   │  │   de Clases   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │ /api/events/ │ │ /api/events/ │ │ /api/events/     │     │
│  │   instances  │ │     edit     │ │    instance      │     │
│  └──────────────┘ └──────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  GOOGLE CALENDAR API                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  5 Calendarios (uno por área académica)               │   │
│  │  - Matemáticas    - Lectura Crítica    - Sociales    │   │
│  │  - Naturales      - Inglés                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
admin-eventos-sg/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Página principal (calendario)
│   │   ├── layout.tsx            # Layout global
│   │   ├── globals.css           # Estilos futuristas
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts        # Inicio de sesión Google
│   │       │   └── callback/google/route.ts  # Callback OAuth
│   │       └── events/
│   │           ├── instances/route.ts    # Listar eventos del calendario
│   │           ├── edit/route.ts         # Editar evento (PATCH seguro)
│   │           ├── instance/route.ts     # Eliminar/Restaurar instancia
│   │           ├── get/route.ts          # Obtener evento específico
│   │           ├── list/route.ts         # Listar por fecha
│   │           └── create/route.ts       # Crear nuevo evento
│   │
│   ├── services/
│   │   └── calendarService.ts    # Servicio de Google Calendar
│   │
│   ├── models/
│   │   └── eventModel.ts         # Modelo de eventos
│   │
│   └── lib/
│       ├── subjects.ts           # Configuración de 5 calendarios
│       ├── fixedEvents.ts        # Eventos de acceso rápido (opcional)
│       └── googleAuth.ts         # Configuración OAuth
│
├── data/
│   └── config.json               # Configuración por defecto
│
├── credentials.json              # Credenciales Google (NO SUBIR)
├── token.json                    # Token de sesión (NO SUBIR)
├── package.json
└── README.md
```

---

## 🔧 Configuración

### 1. Credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**
4. Crea credenciales OAuth 2.0 (Aplicación web)
5. Descarga el archivo y guárdalo como `credentials.json`

### 2. Configurar Calendarios

Edita `src/lib/subjects.ts` con los IDs de tus calendarios:

```typescript
export const SUBJECTS: Record<Subject, SubjectData> = {
    'Matemáticas': {
        name: 'Matemáticas',
        displayName: 'Matemáticas',
        calendarId: 'TU_CALENDAR_ID@group.calendar.google.com',
        professors: ['profesor1@email.com', 'profesor2@email.com'],
        color: '#2196F3',
        icon: '🧮',
        description: 'Álgebra, Geometría, Cálculo'
    },
    // ... más materias
};
```

### 3. Variables de Entorno (Producción)

```env
# .env.local
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/callback/google
```

---

## 📡 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/login` | Redirige a Google OAuth |
| GET | `/api/auth/callback/google` | Callback de autenticación |

### Eventos

| Método | Endpoint | Parámetros | Descripción |
|--------|----------|------------|-------------|
| GET | `/api/events/instances` | `subject`, `weeks` | Lista eventos de un calendario |
| GET | `/api/events/list` | `subject`, `date` | Lista eventos por fecha |
| GET | `/api/events/get` | `subject`, `eventId` | Obtiene un evento |
| POST | `/api/events/create` | Body JSON | Crea nuevo evento con Meet |
| PATCH | `/api/events/edit` | Body JSON | Edita evento (preserva Meet) |
| DELETE | `/api/events/instance` | Body JSON | Cancela una instancia |
| PUT | `/api/events/instance` | Body JSON | Restaura una instancia |

### Ejemplos de Uso

**Listar eventos de Matemáticas (próximas 8 semanas):**

```bash
GET /api/events/instances?subject=Matemáticas&weeks=8
```

**Editar un evento (preservando Meet):**

```bash
PATCH /api/events/edit
Content-Type: application/json

{
    "subject": "Matemáticas",
    "eventId": "abc123xyz",
    "summary": "Nuevo título",
    "start": "2026-01-15T10:00:00",
    "end": "2026-01-15T11:00:00"
}
```

---

## 🔒 Preservación de Permisos

### ¿Por qué es importante?

Las configuraciones de Google Meet como:

- **Coorganizadores** (quién puede admitir participantes)
- **"Todos son oyentes"** (control de quién puede hablar)
- **Grabación automática**
- **Transcripciones**

**NO pueden configurarse vía API**. Solo se pueden establecer manualmente en Google Meet/Calendar.

### Solución Implementada

1. **Eventos Recurrentes**: Crea UN evento recurrente por área con la configuración correcta
2. **Edición Segura**: La API usa `PATCH` que solo modifica campos específicos
3. **Meet Link Fijo**: Todas las instancias comparten el mismo link (y configuración)

```typescript
// La función patchEventSafe NUNCA toca conferenceData
async patchEventSafe(calendarId, eventId, updates) {
    const resource = {};
    if (updates.summary) resource.summary = updates.summary;
    if (updates.start) resource.start = updates.start;
    if (updates.end) resource.end = updates.end;
    // conferenceData NO se incluye = se preserva
    
    return calendar.events.patch({
        calendarId,
        eventId,
        requestBody: resource,
        conferenceDataVersion: 1  // Indica que hay Meet pero no lo modifica
    });
}
```

---

## 🚀 Despliegue

### Desarrollo Local

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

### Producción (Vercel)

1. Sube el repositorio a GitHub
2. Conecta con Vercel
3. Configura variables de entorno
4. Deploy automático

### GitHub Pages (Solo Frontend Estático)

⚠️ **Nota**: GitHub Pages solo soporta sitios estáticos. Para una app Next.js con API routes, necesitas usar Vercel, Railway, o similar.

---

## 🎨 Diseño UI

### Paleta de Colores

| Variable | Valor | Uso |
|----------|-------|-----|
| `--accent-primary` | `#3b82f6` | Botones, links |
| `--accent-secondary` | `#8b5cf6` | Gradientes |
| `--accent-success` | `#10b981` | Confirmaciones |
| `--accent-danger` | `#ef4444` | Alertas, eliminar |

### Tipografías

- **Space Grotesk**: Títulos y textos principales
- **JetBrains Mono**: Horas, códigos, Meet links

### Componentes Principales

- **Futuristic Clock**: Reloj con animación shimmer
- **Calendar Grid**: Vista mensual/semanal
- **Editor Panel**: Panel lateral de edición
- **Toast Notifications**: Mensajes temporales

---

## 📋 Materias Configuradas

| Área | Color | Icono | Profesores |
|------|-------|-------|------------|
| Matemáticas | `#2196F3` | 🧮 | 3 profesores |
| Lectura Crítica | `#F44336` | 📖 | Pendiente |
| Ciencias Sociales | `#FF9800` | 🌍 | 3 profesores |
| Ciencias Naturales | `#4CAF50` | 🌳 | 3 profesores |
| Inglés | `#9C27B0` | 🌐 | 3 profesores |

---

## 🛠️ Tecnologías

- **Framework**: Next.js 16.1 (App Router)
- **TypeScript**: Tipado estático
- **Google APIs**: Calendar API v3
- **Estilos**: CSS puro con variables
- **Fuentes**: Google Fonts

---

## ⚠️ Archivos Sensibles (NO SUBIR)

Estos archivos contienen credenciales y NO deben subirse a GitHub:

```gitignore
credentials.json
token.json
.env.local
```

---

## 📞 Soporte

Desarrollado para **Seamos Genios** - Plataforma de Gestión Educativa

© 2026 - Todos los derechos reservados
