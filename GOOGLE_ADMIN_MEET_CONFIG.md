# Guía de Configuración: Google Workspace Admin para Meet

Esta guía te ayudará a configurar los valores predeterminados de Google Meet para toda tu organización desde Google Admin Console.

---

## 🔑 Acceso a Google Admin Console

1. Ve a [admin.google.com](https://admin.google.com)
2. Inicia sesión con tu cuenta de administrador
3. En el menú lateral, navega a: **Aplicaciones** → **Google Workspace** → **Google Meet**

---

## 📋 Configuraciones Recomendadas

### 1. Controles del Organizador (Host Controls)

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Controles del organizador`

| Configuración | Valor Recomendado | Descripción |
|--------------|-------------------|-------------|
| Administración del organizador | ✅ Activado | Permite a los organizadores gestionar la reunión |
| Controles del organizador activos por defecto | ✅ Activado | Las reuniones inician con controles activos |

---

### 2. Sala de Espera (Lobby/Waiting Room)

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Acceso a la reunión`

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Quién puede unirse directamente | Solo personas de tu organización |
| Otros usuarios | Deben solicitar acceso (sala de espera) |

**Nota:** Esto hace que cualquier persona externa a `seamosgenios.com` (o tu dominio) tenga que esperar aprobación.

---

### 3. Compartir Pantalla

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Compartir pantalla`

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Quién puede compartir pantalla | Solo el organizador y co-organizadores |

**Alternativa:** Si necesitas que los tutores puedan compartir, selecciona "Organizadores y participantes de la organización".

---

### 4. Grabación de Reuniones

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Grabación`

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Permitir grabación | ✅ Activado |
| Quién puede grabar | Organizadores y co-organizadores |
| Guardar grabaciones en | Google Drive del organizador |

**Nota:** La grabación automática NO está disponible via configuración de admin. El organizador debe iniciarla manualmente o puedes usar Google Workspace Add-ons.

---

### 5. Transcripción y Notas de Gemini

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Funciones avanzadas`

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Transcripciones automáticas | ✅ Activado |
| Idioma de transcripción | Español |
| Gemini en Meet | ✅ Activado (si está disponible en tu plan) |
| Tomar notas con IA | ✅ Activado |

**Requisitos:** Estas funciones pueden requerir Google Workspace Business Plus, Enterprise, o Education Plus.

---

### 6. Seguimiento de Asistencia

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Informes de asistencia`

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Informes de asistencia | ✅ Activado |
| Enviar informe a | Organizador de la reunión |
| Mínimo de participantes para generar informe | 2 |

---

### 7. Invitados y Artefactos

**Ruta:** `Aplicaciones > Google Workspace > Google Meet > Configuración de Meet > Permisos de invitados`

| Configuración | Valor Recomendado |
|--------------|-------------------|
| Artefactos compartidos con | Organizador y co-organizadores |
| Invitados pueden ver lista de asistentes | Según preferencia |

---

## ⚙️ Aplicar Configuración a Unidades Organizativas

Si tienes diferentes configuraciones para diferentes grupos (ej: Profesores vs Estudiantes):

1. En Admin Console, ve a **Directorio** → **Unidades organizativas**
2. Crea unidades como:
   - `/Profesores`
   - `/Estudiantes`
3. En la configuración de Meet, selecciona la unidad organizativa específica antes de cambiar valores
4. Los cambios se aplicarán solo a esa unidad

---

## 🔄 Tiempo de Propagación

Los cambios en Admin Console pueden tardar:

- **Hasta 24 horas** en propagarse a todos los usuarios
- Para pruebas inmediatas, cierra sesión y vuelve a iniciar

---

## ✅ Lista de Verificación Final

- [ ] Controles del organizador activos por defecto
- [ ] Sala de espera para usuarios externos
- [ ] Compartir pantalla restringido
- [ ] Grabación habilitada para organizadores
- [ ] Transcripción en español activada
- [ ] Informes de asistencia activados
- [ ] Artefactos compartidos solo con organizadores

---

## 📞 Soporte

Si alguna opción no aparece en tu Admin Console, puede ser debido a:

1. Tu plan de Google Workspace no incluye esa función
2. La función está en beta y requiere activación manual
3. Tu cuenta no tiene permisos de super-administrador

Consulta: [Ayuda de Google Workspace Admin](https://support.google.com/a/answer/9783962)

---

*Guía creada para Seamos Genios - Manager de Eventos*
