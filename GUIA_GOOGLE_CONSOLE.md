# 🔐 Guía de Configuración - Google Cloud Console

Esta guía te llevará paso a paso para configurar la autenticación de Google en **Admin Eventos SG** para que funcione en producción (Vercel).

---

## 📋 Resumen Rápido

Necesitas hacer **2 cosas**:

1. Agregar la URL de producción en Google Cloud Console
2. (Opcional) Verificar que las variables de entorno estén en Vercel

---

## 🔧 Paso 1: Abrir Google Cloud Console

1. Ve a: **<https://console.cloud.google.com/>**

2. Inicia sesión con tu cuenta de Google (la misma que usaste para crear las credenciales)

3. En la esquina superior izquierda, verifica que esté seleccionado el proyecto correcto:
   - Busca el proyecto que creaste para esta aplicación
   - Si no es ese, haz clic en el selector y elige el correcto

---

## 🔑 Paso 2: Ir a Credenciales

1. En el menú de la izquierda, haz clic en **"APIs y servicios"**

2. Luego haz clic en **"Credenciales"**

   O ve directamente a:
   **<https://console.cloud.google.com/apis/credentials>**

---

## ✏️ Paso 3: Editar las Credenciales OAuth

1. En la sección **"ID de cliente OAuth 2.0"**, verás tu credencial
   (es un ID largo que termina en `.apps.googleusercontent.com`)

2. Haz clic en el **nombre** o en el **ícono de lápiz** (✏️) para editarlo

---

## ➕ Paso 4: Agregar URIs de Producción

### 4.1 - Orígenes de JavaScript autorizados

1. Busca la sección **"Orígenes de JavaScript autorizados"**

2. Haz clic en **"+ AGREGAR URI"**

3. Agrega esta URL:

   ```
   https://admin-eventos-sg.vercel.app
   ```

4. Ya debería tener esta (déjala):

   ```
   http://localhost:3000
   ```

### 4.2 - URIs de redirección autorizados

1. Busca la sección **"URIs de redirección autorizados"**

2. Haz clic en **"+ AGREGAR URI"**

3. Agrega esta URL exacta (IMPORTANTE: incluye la ruta completa):

   ```
   https://admin-eventos-sg.vercel.app/api/auth/callback/google
   ```

4. Ya debería tener esta (déjala):

   ```
   http://localhost:3000/api/auth/callback/google
   ```

---

## 💾 Paso 5: Guardar

1. Haz clic en el botón **"GUARDAR"** en la parte inferior

2. Espera a que se guarde (aparecerá un mensaje de confirmación)

---

## ✅ Verificación Final

Tu configuración debería verse así:

### Orígenes de JavaScript autorizados

```
http://localhost:3000
https://admin-eventos-sg.vercel.app
```

### URIs de redirección autorizados

```
http://localhost:3000/api/auth/callback/google
https://admin-eventos-sg.vercel.app/api/auth/callback/google
```

---

## 🧪 Paso 6: Probar

1. Ve a: **<https://admin-eventos-sg.vercel.app>**

2. Haz clic en **"🔐 Conectar"**

3. Deberías ver la pantalla de inicio de sesión de Google

4. Inicia sesión con tu cuenta

5. Si todo está bien, serás redirigido de vuelta a la app con estado "Conectado"

---

## ❌ Errores Comunes

### Error: "redirect_uri_mismatch"

- **Causa**: La URL de redirección no coincide exactamente
- **Solución**: Verifica que la URI sea exactamente:

  ```
  https://admin-eventos-sg.vercel.app/api/auth/callback/google
  ```

  (sin espacios, sin barra final, todo en minúsculas)

### Error: "invalid_client"

- **Causa**: Las credenciales no son correctas
- **Solución**: Verifica en Vercel que las variables de entorno estén bien configuradas:
  - `GOOGLE_CLIENT_ID` = (tu Client ID de Google Cloud Console)
  - `GOOGLE_CLIENT_SECRET` = (tu Client Secret de Google Cloud Console)

### Error: "This app isn't verified"

- **Causa**: La app no está verificada por Google (normal en desarrollo)
- **Solución**: Haz clic en "Advanced" → "Go to admin-eventos-sg.vercel.app (unsafe)"

---

## 📝 Resumen de URLs Importantes

| Tipo | URL |
|------|-----|
| **App en Producción** | <https://admin-eventos-sg.vercel.app> |
| **Callback OAuth** | <https://admin-eventos-sg.vercel.app/api/auth/callback/google> |
| **Google Cloud Console** | <https://console.cloud.google.com/apis/credentials> |
| **Vercel Dashboard** | <https://vercel.com/seamosgenios/admin-eventos-sg> |

---

## 🔄 Si Cambias de Dominio

Si en el futuro cambias el dominio de la app (por ejemplo a `eventos.seamosgenios.com`), repite los pasos 4 y 5 con el nuevo dominio:

1. Agregar nuevo origen de JavaScript:

   ```
   https://tu-nuevo-dominio.com
   ```

2. Agregar nueva URI de redirección:

   ```
   https://tu-nuevo-dominio.com/api/auth/callback/google
   ```

---

¡Listo! Una vez completados estos pasos, la autenticación de Google funcionará en producción.
