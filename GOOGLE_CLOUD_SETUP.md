# Guía de Configuración: Google Calendar API (Modo Web)

Para que la plataforma web funcione, necesitamos credenciales de tipo **Web Application**.

## 1. Crear Credenciales Web

1. Ve a [Google Cloud Console > Credenciales](https://console.cloud.google.com/apis/credentials).
2. Si ya creaste las de "Desktop", puedes borrarlas o ignorarlas.
3. Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente de OAuth**.
4. **Tipo de aplicación**: Selecciona **Aplicación web**.
5. **Nombre**: "Plataforma Eventos Web".

## 2. Configurar URIs (¡CRUCIAL!)

En la sección de "Orígenes autorizados de JavaScript" y "URI de redireccionamiento autorizados":

1. **Orígenes autorizados de JavaScript**:
   - Agrega: `http://localhost:3000`

2. **URI de redireccionamiento autorizados**:
   - Agrega: `http://localhost:3000/api/auth/callback/google`

   > *Nota: Esta es la ruta donde Google enviará el código de autorización después de que inicies sesión.*

3. Haz clic en **Crear**.

## 3. Descargar `credentials.json`

1. Descarga el archivo JSON.
2. Renómbralo a **`credentials.json`**.
3. Muévelo a la carpeta raíz del proyecto: `c:\Users\Daniel\Downloads\Manager de eventos\credentials.json`.

## 4. Usuarios de Prueba

Si tu aplicación está en modo "Externo" y "Prueba" (Publishing status: Testing), asegúrate de que tu correo esté añadido en la pantalla de consentimiento OAuth en la sección **Test Users**.
