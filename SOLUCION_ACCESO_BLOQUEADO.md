# 🚫 Solución: Error "Acceso Bloqueado" o "Error de Autorización"

## ❓ ¿Por qué aparece este error?

Cuando una app de Google OAuth está en **modo de prueba** (Testing), solo los usuarios explícitamente agregados como "testers" pueden usar la app.

---

## 🔧 Solución Paso a Paso

### Paso 1: Ir a la Pantalla de Consentimiento OAuth

1. Ve a: **[https://console.cloud.google.com/apis/credentials/consent](https://console.cloud.google.com/apis/credentials/consent)**
2. O navega manualmente:

   - Google Cloud Console → APIs y servicios → **Pantalla de consentimiento OAuth**

---

### Paso 2: Verificar el Estado de Publicación

Verás una sección que dice **"Estado de publicación"** con dos opciones:

| Estado                   | Significado                               |
| ------------------------ | ----------------------------------------- |
| **En pruebas**     | Solo usuarios autorizados pueden acceder  |
| **En producción** | Cualquier usuario de Google puede acceder |

---

### Opción A: Agregar Usuarios de Prueba (Recomendado para desarrollo)

Si la app está **"En pruebas"**:

1. Baja hasta la sección **"Usuarios de prueba"**
2. Haz clic en **"+ ADD USERS"** (o "+ AGREGAR USUARIOS")
3. Agrega los correos de los usuarios que necesitan acceso:

   ```
   tu_correo@gmail.com
   otro_usuario@gmail.com
   ```
4. Haz clic en **"SAVE"** (Guardar)
5. **Intenta iniciar sesión de nuevo**

---

### Opción B: Publicar la App (Para producción)

Si quieres que **cualquier usuario** pueda acceder:

1. En la sección **"Estado de publicación"**, haz clic en **"PUBLICAR APP"**
2. Se te pedirá verificar que la app cumple con las políticas de Google
3. Para apps internas (solo tu organización), esto es rápido
4. Para apps públicas, Google puede pedir verificación adicional

⚠️ **Nota**: Si la app es solo para ti y tu equipo, es mejor usar la Opción A.

---

### Paso 3: Verificar Alcances (Scopes)

En la misma pantalla, verifica que los alcances estén configurados:

1. Haz clic en **"EDIT APP"** (Editar app)
2. Avanza hasta **"Scopes"** (Alcances)
3. Verifica que tengas:

   - `https://www.googleapis.com/auth/calendar` (o similar para Calendar)
   - `https://www.googleapis.com/auth/userinfo.email`
4. Si faltan, agrégalos con **"ADD OR REMOVE SCOPES"**

---

## 🔍 Errores Específicos

### Error: "Access blocked: This app's request is invalid"

- **Causa**: redirect_uri no está en la lista de URIs autorizados
- **Solución**: Agregar `https://admin-eventos-sg.vercel.app/api/auth/callback/google` en Credenciales OAuth

### Error: "Access blocked: Admin Eventos SG has not completed the Google verification process"

- **Causa**: La app necesita verificación de Google
- **Solución**: Publicar la app o agregar usuarios de prueba

### Error: "You don't have access to this app"

- **Causa**: Tu correo no está en la lista de usuarios de prueba
- **Solución**: Agregar tu correo en Pantalla de Consentimiento → Usuarios de prueba

### Error: "Error 400: redirect_uri_mismatch"

- **Causa**: La URL de callback no coincide
- **Solución**: Ver guía GUIA_GOOGLE_CONSOLE.md

---

## 📋 Checklist Completo

- [X] Pantalla de Consentimiento OAuth configurada
- [X] Estado: "En pruebas" con tu correo como usuario de prueba, O "En producción"
- [ ] Scopes de Calendar y Email agregados
- [X] En Credenciales OAuth:
  - [X] Origen JS: `https://admin-eventos-sg.vercel.app`
  - [X] Redirect URI: `https://admin-eventos-sg.vercel.app/api/auth/callback/google`

---

## 🔗 Links Directos

| Configuración             | URL                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Pantalla de Consentimiento | [https://console.cloud.google.com/apis/credentials/consent](https://console.cloud.google.com/apis/credentials/consent) |
| Credenciales OAuth         | [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)                 |
| Estado de APIs             | [https://console.cloud.google.com/apis/dashboard](https://console.cloud.google.com/apis/dashboard)                     |

---

¿Sigue sin funcionar después de estos pasos? Comparte el mensaje de error exacto.
