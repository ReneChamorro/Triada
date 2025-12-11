# Triada - Plataforma de Venta de Cursos Online

Una plataforma moderna de cursos online construida con Next.js 14, Supabase, y Stripe, con protección avanzada de contenido y soporte para múltiples métodos de pago.

## 🚀 Características

### Funcionalidades Principales

- **Navegación Pública**: Los usuarios pueden explorar cursos sin iniciar sesión
- **Autenticación Segura**: Sistema de registro/login con email usando Supabase Auth
- **Pasarelas de Pago Múltiples**:
  - Stripe para tarjetas de crédito/débito (pago automático)
  - Zelle con verificación manual por admin
- **Protección de Contenido**:
  - URLs firmadas con expiración
  - Watermarking dinámico con datos del usuario
  - Deshabilitación de captura de pantalla
  - Bloqueo de teclas de screenshot
  - Detección de DevTools
- **Dashboard de Usuario**: Seguimiento de progreso y acceso a cursos comprados
- **Panel de Administración**: Gestión completa de cursos, usuarios y pagos

### Tecnologías Utilizadas

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Pagos**: Stripe, Zelle (manual)
- **Almacenamiento**: Supabase Storage (para videos/imágenes)

## 📋 Requisitos Previos

- Node.js 18.x o superior
- Cuenta de Supabase
- Cuenta de Stripe
- Email/teléfono para Zelle

## 🛠️ Instalación

### 1. Instalar dependencias

### 1. Instalar dependencias

```powershell
npm install
```

### 2. Configurar Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta el script `supabase/schema.sql` para crear las tablas
4. Obtén tus credenciales en **Project Settings > API**

### 3. Configurar Stripe

1. Crea una cuenta en [stripe.com](https://stripe.com)
2. Obtén tus claves API en **Developers > API keys**
3. Configura un webhook endpoint apuntando a: `https://tu-dominio.com/api/payments/webhook`
4. Selecciona los eventos: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`

### 4. Configurar Variables de Entorno

Copia `.env.example` a `.env.local` y completa los valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Zelle
ZELLE_EMAIL=tu-email@ejemplo.com
ZELLE_PHONE=+1234567890
```

### 5. Ejecutar en Desarrollo

```powershell
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🗄️ Estructura de Base de Datos

### Tablas Principales

- **profiles**: Información extendida de usuarios
- **courses**: Cursos disponibles
- **purchases**: Registro de compras
- **user_courses**: Control de acceso a cursos

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS habilitadas para seguridad a nivel de base de datos.

## 👨‍💼 Crear Usuario Administrador

Para crear tu primer usuario admin:

1. Regístrate normalmente en la aplicación
2. En Supabase, ve a **Table Editor > profiles**
3. Encuentra tu usuario y cambia `is_admin` a `true`
4. Recarga la página y verás el botón "Admin" en la navegación

## 🎯 Próximos Pasos

1. **Configurar Supabase**: Ejecutar schema.sql y configurar Storage
2. **Configurar Stripe**: Crear cuenta y obtener claves API
3. **Subir primer curso**: Crear curso de prueba con video
4. **Crear admin**: Marcar tu usuario como administrador
5. **Probar flujo completo**: Registro → Compra → Acceso al curso

## 📚 Más Información

## 📚 Más Información

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

¡Listo para vender cursos! 🚀

