# 🎯 Guía Completa: Configurar Stripe para Triada

## 📋 Requisitos Previos
- Cuenta de Stripe (gratis en https://stripe.com)
- Claves API de Stripe (las tienes en `.env.local`)

---

## 🔑 Paso 1: Verificar Claves de Stripe

Abre tu `.env.local` y verifica que tengas:

```bash
# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Sco7f...
STRIPE_SECRET_KEY=sk_test_51Sco7f...
```

✅ **Estas claves ya están configuradas en tu proyecto**

---

## 🛠️ Paso 2: Verificar Instalación de Stripe

```bash
npm list stripe
# Debe mostrar: stripe@17.5.0
```

Si no está instalado:
```bash
npm install stripe
```

---

## 🌐 Paso 3: Configurar Webhooks en Stripe Dashboard

### 3.1 Ir a Stripe Dashboard
1. Ve a https://dashboard.stripe.com/test/webhooks
2. Click en **"Add endpoint"**

### 3.2 Configurar el Endpoint
- **Endpoint URL:** `https://tu-dominio.com/api/webhooks/stripe`
- **Para desarrollo local:** Usa Stripe CLI (ver paso 4)

### 3.3 Seleccionar Eventos
Marca estos eventos:
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

### 3.4 Copiar Signing Secret
Después de crear el webhook, copia el **Signing Secret** (empieza con `whsec_...`)

Agrégalo a tu `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

---

## 💻 Paso 4: Configurar Stripe CLI (Para Desarrollo Local)

### 4.1 Instalar Stripe CLI

**Windows:**
```powershell
# Descargar desde: https://github.com/stripe/stripe-cli/releases/latest
# O con Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### 4.2 Autenticar CLI
```bash
stripe login
```
Se abrirá tu navegador para autorizar.

### 4.3 Escuchar Webhooks Localmente
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Esto te dará un **webhook signing secret** temporal. Cópialo a `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📝 Paso 5: Crear el Webhook Handler

Ya tienes el archivo, pero verifica que exista:
**`src/app/api/webhooks/stripe/route.ts`**

```typescript
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        // Actualizar el pago en la base de datos
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            payment_intent_id: session.payment_intent as string,
          })
          .eq('stripe_session_id', session.id)

        // Dar acceso al curso
        const { data: payment } = await supabase
          .from('payments')
          .select('user_id, course_id')
          .eq('stripe_session_id', session.id)
          .single()

        if (payment) {
          await supabase.from('user_courses').insert({
            user_id: payment.user_id,
            course_id: payment.course_id,
            access_granted_at: new Date().toISOString(),
          })
        }
        break

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('payment_intent_id', paymentIntent.id)
        break
    }

    return Response.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

---

## 🧪 Paso 6: Probar el Flujo de Pago

### 6.1 Iniciar el Servidor
```bash
npm run dev
```

### 6.2 Iniciar Stripe CLI (en otra terminal)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 6.3 Crear un Curso de Prueba
1. Ve a `http://localhost:3000/admin/courses/new`
2. Crea un curso con precio (ej: $99)
3. Publica el curso

### 6.4 Probar el Checkout
1. Ve a la página del curso
2. Click en "Comprar Curso"
3. Usa una tarjeta de prueba de Stripe:
   - **Número:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/26)
   - **CVC:** Cualquier 3 dígitos (ej: 123)
   - **ZIP:** Cualquier 5 dígitos (ej: 12345)

### 6.5 Verificar en Terminal
Deberías ver en la terminal de Stripe CLI:
```
✅ Received event checkout.session.completed
```

### 6.6 Verificar en Base de Datos
1. Ve a Supabase → Table Editor → `payments`
2. Verifica que el pago esté con `status: 'completed'`
3. Ve a `user_courses` y verifica que el usuario tenga acceso

---

## 🚀 Paso 7: Modo Producción (Cuando Estés Listo)

### 7.1 Activar tu Cuenta de Stripe
1. Ve a https://dashboard.stripe.com
2. Completa el proceso de activación (info de negocio, banco, etc.)

### 7.2 Cambiar a Claves de Producción
En `.env.local` (o tu hosting):
```bash
# Cambiar de test keys a live keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ❌ Quita el _test_
STRIPE_SECRET_KEY=sk_live_...                   # ❌ Quita el _test_
```

### 7.3 Configurar Webhook de Producción
1. Ve a https://dashboard.stripe.com/webhooks (sin `/test/`)
2. Crea un nuevo webhook con tu URL de producción
3. Actualiza `STRIPE_WEBHOOK_SECRET` con el nuevo valor

---

## 🔍 Paso 8: Monitoreo y Debugging

### Ver Logs de Stripe
```bash
stripe logs tail
```

### Ver Eventos en Dashboard
https://dashboard.stripe.com/test/events

### Ver Pagos en Dashboard
https://dashboard.stripe.com/test/payments

### Debugging Tips
- Los webhooks pueden tardar unos segundos
- Revisa la consola del servidor para errores
- Verifica que `STRIPE_WEBHOOK_SECRET` esté correcto
- Usa `stripe trigger` para simular eventos:
  ```bash
  stripe trigger checkout.session.completed
  ```

---

## 📱 Tarjetas de Prueba Útiles

```bash
# Pago exitoso
4242 4242 4242 4242

# Pago rechazado
4000 0000 0000 0002

# Requiere autenticación 3D Secure
4000 0027 6000 3184

# Tarjeta expirada
4000 0000 0000 0069
```

Más en: https://stripe.com/docs/testing

---

## ✅ Checklist Final

- [ ] Claves de Stripe en `.env.local`
- [ ] Stripe CLI instalado y autenticado
- [ ] Webhook endpoint creado en Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configurado
- [ ] Archivo `route.ts` de webhooks creado
- [ ] Probado checkout con tarjeta de prueba
- [ ] Verificado que el pago se guarda en DB
- [ ] Verificado que el usuario obtiene acceso al curso

---

## 🆘 Problemas Comunes

### Error: "No signature found"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté en `.env.local`
- Reinicia el servidor después de agregar la variable

### Error: "Webhook signature verification failed"
- El secret es incorrecto
- Regenera el webhook en Stripe Dashboard

### El pago se completa pero el usuario no tiene acceso
- Revisa los logs del webhook handler
- Verifica que las tablas `payments` y `user_courses` existan
- Revisa las políticas RLS de Supabase

### Stripe CLI no funciona
```bash
# Verificar instalación
stripe version

# Re-autenticar
stripe login --force
```

---

## 📚 Recursos Adicionales

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)

---

¡Listo! Ahora tienes Stripe completamente configurado 🎉
