# Guía Rápida de Configuración - Triada

## 🚀 Pasos para Empezar (15 minutos)

### 1️⃣ Configurar Supabase (5 min)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto (espera 2 minutos mientras se inicializa)
3. Ve a **SQL Editor** (icono de base de datos en el sidebar)
4. Copia y pega todo el contenido de `supabase/schema.sql`
5. Click en "Run" para ejecutar el script
6. Ve a **Project Settings > API** y copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2️⃣ Configurar Stripe (5 min)

1. Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. Activa modo "Test" (toggle en el sidebar)
3. Ve a **Developers > API keys** y copia:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
4. **Por ahora deja el webhook vacío** (lo configuraremos después del deploy)

### 3️⃣ Configurar Variables de Entorno (2 min)

Abre `.env.local` y pega tus claves:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tu_clave
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu_clave_servicio

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (déjalo vacío por ahora)

NEXT_PUBLIC_APP_URL=http://localhost:3000

ZELLE_EMAIL=tu-email@ejemplo.com
ZELLE_PHONE=+1234567890
```

### 4️⃣ Ejecutar la Aplicación (1 min)

```powershell
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 5️⃣ Crear tu Usuario Admin (2 min)

1. Ve a la aplicación y regístrate con tu email
2. Abre Supabase Dashboard
3. Ve a **Table Editor > profiles**
4. Busca tu usuario (por email)
5. Cambia `is_admin` de `false` a `true`
6. Recarga la aplicación - ¡ahora verás el botón "Admin"!

---

## 🎬 Próximos Pasos

### Crear tu Primer Curso

1. Click en el botón **Admin** en la navegación
2. Ve a "Gestionar Cursos"
3. Por ahora, inserta un curso directamente en Supabase:

En **SQL Editor** ejecuta:

```sql
INSERT INTO courses (title, description, short_description, price, currency, is_published, duration_minutes)
VALUES (
  'Mi Primer Curso',
  'Descripción completa del curso con todos los detalles...',
  'Curso introductorio sobre el tema',
  49.99,
  'USD',
  true,
  120
);
```

4. Recarga la página de inicio - ¡verás tu curso!

### Subir Videos (Opcional para MVP)

**Opción A: Link Externo (Rápido para pruebas)**
- Sube tu video a YouTube/Vimeo como "No listado"
- Copia el link del iframe embed
- Úsalo como `video_url` en el curso

**Opción B: Supabase Storage (Producción)**
1. Ve a Supabase Dashboard > **Storage**
2. Crea un bucket llamado "course-videos"
3. Hazlo público: Settings > Public bucket = ON
4. Sube tu video (.mp4)
5. Copia la URL pública
6. Actualiza el curso con esa URL

```sql
UPDATE courses 
SET video_url = 'https://tuproyecto.supabase.co/storage/v1/object/public/course-videos/mi-video.mp4'
WHERE title = 'Mi Primer Curso';
```

---

## ✅ Probar el Flujo Completo

1. **Como Usuario Regular**:
   - Cierra sesión (o usa navegador incógnito)
   - Navega por los cursos
   - Regístrate con un nuevo email
   - Intenta comprar un curso

2. **Probar Stripe** (Tarjeta de prueba):
   - Usa el número: `4242 4242 4242 4242`
   - Cualquier fecha futura (Ej: 12/25)
   - Cualquier CVC (Ej: 123)
   - Completa el pago
   - ¡Deberías ver el curso en "Mis Cursos"!

3. **Probar Zelle**:
   - Selecciona "Pagar con Zelle"
   - Ingresa un código de prueba: `ZELLE123TEST`
   - Como Admin, ve a `/admin/payments`
   - Verás el pago pendiente
   - (Implementaremos la aprobación después)

---

## 🐛 Problemas Comunes

### Error: "Failed to fetch" o "Network Error"
✅ **Solución**: Verifica que las URLs de Supabase sean correctas en `.env.local`

### Error: "Invalid API Key"
✅ **Solución**: Asegúrate de copiar las claves completas (son muy largas)

### Los cursos no aparecen
✅ **Solución**: Verifica que `is_published = true` en la tabla `courses`

### No puedo iniciar sesión
✅ **Solución**: 
- Verifica tu email (Supabase envía confirmación)
- En Supabase Dashboard > Authentication > Settings
- Desactiva "Enable email confirmations" para desarrollo

### Video no se reproduce
✅ **Solución**:
- Verifica que la URL del video sea accesible
- Prueba la URL directamente en el navegador
- Asegúrate de que el bucket sea público (si usas Supabase Storage)

---

## 📞 ¿Necesitas Ayuda?

- Revisa el README.md completo para más detalles
- Verifica los logs en la consola del navegador (F12)
- Revisa los logs de Supabase Dashboard > Logs

---

## 🎯 Siguiente Fase (Cuando estés listo)

1. **Deploy a Producción** (Vercel - 10 min)
2. **Configurar Webhook de Stripe** (5 min)
3. **Implementar Panel Admin Completo** (gestión de cursos desde UI)
4. **Añadir más métodos de pago** (PayPal, etc)
5. **Mejorar protección de video** (DRM, streaming adaptativo)

---

¡Todo listo para empezar! 🚀
