# 🚨 Guía Definitiva: Solución Error "OAuth client not found" (401)

Este error significa que el **ID de Cliente** que tu aplicación envía a Google no coincide con el que Google tiene registrado.

Sigue estos 3 pasos para encontrar dónde está el error.

---

## 🕵️ Paso 1: "La Prueba de la Verdad" (Ver qué envía realmente la app)

Antes de cambiar nada, vamos a ver qué está enviando tu app.

1. Abre tu aplicación: **<https://admin-eventos-sg.vercel.app>**
2. Haz clic derecho en el botón **"🔐 Iniciar Sesión"** y elige **"Inspeccionar"**.
3. Ve a la pestaña **"Red"** (Network) en las herramientas de desarrollador.
4. Haz clic en el botón de iniciar sesión.
5. Verás una solicitud que empieza con `o/oauth2/v2/auth...` o similar. Haz clic en ella.
6. En la pestaña **"Carga útil"** (Payload) o **"Encabezados"** (Headers), busca el parámetro:
   `client_id`

**¿Qué valor ves ahí?**

- Si ves `undefined` o vacío: La variable de entorno no se está leyendo.
- Si ves un valor: Compáralo carácter por carácter con el de la consola de Google.
- Si ves `%20` o símbolos extraños al final: Hay espacios ocultos.

---

## 🔁 Paso 2: Crear una Credencial TOTALMENTE NUEVA

A veces las credenciales se corrompen o se borran sin querer. Lo más seguro es empezar de cero.

1. Ve a **Google Cloud Console** > **Credenciales**.
2. Haz clic en **"Crear Credenciales"** > **"ID de cliente de OAuth"**.
3. Tipo: **Aplicación Web**.
4. Nombre: `Admin Eventos V2`.
5. **Orígenes autorizados**: `https://admin-eventos-sg.vercel.app`
6. **URIs de redirección**: `https://admin-eventos-sg.vercel.app/api/auth/callback/google`
7. **CREAR**.

🔴 **IMPORTANTE:** Copia el nuevo ID y Secreto en un bloc de notas.

---

## 🚀 Paso 3: Actualizar Vercel (Método Seguro)

Vamos a borrar las variables viejas y poner las nuevas.

1. Ve al panel de **Vercel** > Tu Proyecto > **Settings** > **Environment Variables**.
2. **Borra** `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
3. **Agrega las nuevas** (copiando del bloc de notas con cuidado).
4. Ve a la pestaña **Deployments**.
5. Haz clic en los 3 puntos del último deploy (...) y selecciona **"Redeploy"**.
   *(Esto es vital: si no haces redeploy, los cambios no se aplican)*.

---

## ✅ Resumen de URLs para la nueva credencial

| Configuración | Valor |
|---------------|-------|
| Orígenes JS | `https://admin-eventos-sg.vercel.app` |
| Redirect URI | `https://admin-eventos-sg.vercel.app/api/auth/callback/google` |

Si haces esto y sigue fallando, el problema es que la aplicación no está leyendo las variables de entorno correctamente en el código.
