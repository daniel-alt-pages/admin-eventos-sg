# Informe de Depuración: Manager de Eventos

## 🔴 Problema Actual: Error de Autenticación

El sistema reporta el error: `No saved tokens found. Please log in via the Web UI.`
Esto ocurre cuando intentas crear un evento pero la aplicación no encuentra el archivo `token.json` que demuestra que has iniciado sesión.

## 🔍 Diagnóstico

1. **Causa Probable A**: No se ha completado el proceso de "Iniciar Sesión" desde la página principal.
2. **Causa Probable B**: El proceso de inicio de sesión falla silenciosamente debido a una configuración incorrecta en Google Cloud Console (URI de redirección).
3. **Causa Probable C**: El archivo `token.json` no se está guardando correctamente por problemas de permisos (menos probable en Windows local).

## 🛠️ Soluciones Requeridas

### Paso 1: Verificar Configuración en Google Cloud Console

Para que el inicio de sesión funcione, Google necesita saber exactamente a dónde devolver al usuario.

1. Ve a [Google Cloud Console > Credenciales](https://console.cloud.google.com/apis/credentials).
2. Haz clic en tu cliente OAuth 2.0 (el que descargaste como `credentials.json`).
3. Busca la sección **"URIs de redireccionamiento autorizados"**.
4. **Asegúrate de que esté EXACTAMENTE esta URL:**
    `http://localhost:3000/api/auth/callback/google`
    *(Nota: No debe tener espacios al final, ni ser https si estás en localhost, ni tener puertos diferentes).*
5. Si la cambias, guarda y espera unos minutos.

### Paso 2: Limpieza Local

1. Si existe un archivo `token.json` antiguo o corrupto, bórralo para empezar de cero.
2. Reinicia el servidor de desarrollo (`npm run dev`).

### Paso 3: Re-Autenticación

1. Abre la web `http://localhost:3000`.
2. Haz clic en **"🔄 Refrescar Credenciales Google"**.
3. Sigue el flujo de Google.
4. Si te devuelve a la página de inicio sin errores, intenta "Crear Evento" de nuevo.

## 📝 Logs para Diagnóstico

He añadido mensajes de "log" en el sistema. Si el paso 3 falla, necesito que mires la terminal donde corre `npm run dev`. Deberías ver algo como:

- `Saving tokens to: ...`
- `TOKENS SAVED SUCCESSFULLY`
O un error detallado si falla.
