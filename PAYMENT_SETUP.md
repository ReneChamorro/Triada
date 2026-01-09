# 💳 Guía de Configuración de Métodos de Pago - Triada

## 1️⃣ Stripe (Tarjeta de Crédito/Débito)

Ya configurado. Ver `STRIPE_SETUP.md` para más detalles.

---

## 2️⃣ PayPal

### Crear cuenta de PayPal Business
1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una cuenta de desarrollador
3. Ve a **Dashboard** → **My Apps & Credentials**

### Obtener credenciales
1. En **REST API apps**, click **Create App**
2. Nombre: "Triada"
3. Copia:
   - **Client ID**
   - **Secret**

### Variables de entorno
Agrega a `.env.local`:

```bash
# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_CLIENT_SECRET=tu_secret_aqui
PAYPAL_MODE=sandbox  # cambiar a 'live' en producción
```

### En Vercel
Agrega las mismas variables en:
- Settings → Environment Variables

---

## 3️⃣ Zelle (Pago Manual)

### Configuración de datos de Zelle

Agrega a `.env.local`:

```bash
# Zelle
ZELLE_EMAIL=tu-email-zelle@email.com
ZELLE_PHONE=+1234567890
ZELLE_RECIPIENT_NAME="Tu Nombre o Empresa"
```

### Flujo de Zelle:
1. Usuario selecciona Zelle
2. Se muestra página con:
   - Datos de Zelle (email/teléfono)
   - Monto a pagar
   - Formulario para código de referencia
3. Usuario envía código
4. Email automático a `renebehrens90@gmail.com`
5. Verificación manual y activación de curso

---

## 4️⃣ Resend (Envío de Emails)

### Crear cuenta y obtener API Key
1. Ve a [Resend](https://resend.com/)
2. Crea una cuenta
3. Ve a **API Keys**
4. Click **Create API Key**
5. Copia la key

### Variables de entorno
Agrega a `.env.local`:

```bash
# Resend
RESEND_API_KEY=re_123456789
RESEND_FROM_EMAIL="Triada <noreply@tu-dominio.com>"  # Debe ser tu dominio verificado
RESEND_ADMIN_EMAIL="renebehrens90@gmail.com"
```

### Verificar dominio en Resend
1. Ve a **Domains** en Resend
2. Click **Add Domain**
3. Agrega `triadave.com`
4. Copia los registros DNS (MX, TXT, CNAME)
5. Agrégalos en Hostinger → DNS
6. Espera verificación

### En Vercel
Agrega las variables de Resend en Environment Variables

---

## 5️⃣ Instalación de Dependencias

```bash
npm install @paypal/react-paypal-js resend
```

---

## 6️⃣ Checklist de Configuración

- [ ] Stripe configurado (ver STRIPE_SETUP.md)
- [ ] PayPal Client ID y Secret obtenidos
- [ ] Resend API Key obtenida
- [ ] Dominio verificado en Resend
- [ ] Variables de entorno agregadas localmente
- [ ] Variables de entorno agregadas en Vercel
- [ ] Datos de Zelle configurados
- [ ] Email admin configurado

---

## 🔒 Seguridad

- ✅ Nunca expongas API Keys en el cliente
- ✅ Usa variables de entorno para credenciales
- ✅ PayPal Secret solo en servidor
- ✅ Resend API Key solo en servidor
- ✅ Validación de pagos en servidor

---

## 📧 Template de Email para Zelle

El sistema enviará emails automáticos con:
- Nombre del curso
- Monto pagado
- Email del usuario
- Código de referencia de Zelle
- Timestamp de la solicitud

---

¡Todo listo para procesar pagos! 💰
