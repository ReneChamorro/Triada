# 🔒 Guía de Configuración de Seguridad - Triada

## 1️⃣ Configuración de Tokens JWT y Expiración de Sesiones

### En Supabase Dashboard

1. Ve a tu proyecto en Supabase → **Settings** → **Auth**

2. **JWT Expiry**: Configura el tiempo de expiración de los tokens
   - Por defecto: 3600 segundos (1 hora)
   - Recomendado para mayor seguridad: **1800** segundos (30 minutos)
   - Para alta seguridad: **900** segundos (15 minutos)

3. **Refresh Token Rotation**: Activa esta opción
   - Esto invalida el refresh token anterior cuando se usa
   - Previene ataques de replay

4. **Reuse Interval**: Configura en **10** segundos
   - Permite un pequeño margen para problemas de red

### Variables de Entorno

Agrega a tu `.env.local`:

```bash
# Tiempo de expiración de sesión (en segundos)
NEXT_PUBLIC_SESSION_TIMEOUT=1800  # 30 minutos

# Tiempo antes de refrescar el token (en segundos)
NEXT_PUBLIC_REFRESH_THRESHOLD=300  # 5 minutos antes
```

---

## 2️⃣ Rate Limiting

### Implementación Actual

El middleware incluye rate limiting básico:
- **60 requests por minuto** por IP
- Se aplica a todas las rutas `/api/*`
- Headers de respuesta con información del límite

### Configuración Personalizada

Edita `src/middleware.ts` para ajustar los límites:

```typescript
const RATE_LIMIT_WINDOW = 60 * 1000 // Ventana de tiempo (ms)
const MAX_REQUESTS = 60 // Requests máximos en la ventana
```

### Rate Limiting por Ruta (Opcional)

Puedes agregar límites específicos por ruta:

```typescript
const routeLimits: Record<string, { window: number; max: number }> = {
  '/api/auth': { window: 60000, max: 10 },      // Login: 10/min
  '/api/register': { window: 60000, max: 5 },   // Registro: 5/min
  '/api/courses': { window: 60000, max: 100 },  // Cursos: 100/min
}
```

---

## 3️⃣ Rate Limiting Avanzado con Upstash Redis (Producción)

Para producción, usa Upstash Redis:

### Instalación

```bash
npm install @upstash/redis @upstash/ratelimit
```

### Configuración

1. Crea una cuenta en [Upstash](https://upstash.com/)
2. Crea una base de datos Redis
3. Copia las credenciales a `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Implementación

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests por minuto
  analytics: true,
})
```

---

## 4️⃣ Seguridad Adicional

### CORS y Headers de Seguridad

Agrega a `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### Protección CSRF

Supabase ya incluye protección CSRF en sus cookies. Asegúrate de:
- Usar `createServerClient` en el servidor
- Usar `createBrowserClient` en el cliente
- No compartir tokens entre dominios

### Validación de Input

Siempre valida y sanitiza inputs:

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

---

## 5️⃣ Monitoreo y Logs

### Supabase Dashboard

Monitorea:
- **Auth** → **Users**: Sesiones activas
- **Logs**: Intentos de login fallidos
- **API**: Uso de endpoints

### Alertas Recomendadas

Configura alertas para:
- Múltiples intentos de login fallidos
- Rate limit excedido frecuentemente
- Sesiones inusualmente largas
- Acceso desde ubicaciones inusuales

---

## 6️⃣ Checklist de Seguridad

- [ ] JWT expiry configurado (30 minutos o menos)
- [ ] Refresh token rotation activado
- [ ] Rate limiting implementado
- [ ] Middleware de autenticación activo
- [ ] Headers de seguridad configurados
- [ ] Variables de entorno protegidas (no en repo)
- [ ] HTTPS en producción (Vercel lo hace automáticamente)
- [ ] Row Level Security (RLS) activo en Supabase
- [ ] Validación de inputs en todas las rutas API
- [ ] Logs y monitoreo configurados

---

## 🆘 Problemas Comunes

### Sesiones que expiran muy rápido
- Aumenta `JWT Expiry` en Supabase
- Verifica que el refresh automático funcione

### Rate limiting bloqueando usuarios legítimos
- Aumenta `MAX_REQUESTS`
- Implementa whitelist para IPs confiables

### Tokens no se refrescan automáticamente
- Verifica el middleware
- Revisa que `createServerClient` esté configurado correctamente

---

## 📚 Referencias

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)

---

¡Tu aplicación ahora tiene capas adicionales de seguridad! 🔐
