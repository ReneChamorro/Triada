# 🚀 Guía: Deploy de Triada en Vercel con Dominio Propio y Git

## 1️⃣ Requisitos Previos
- Cuenta en [Vercel](https://vercel.com/) (gratis)
- Repositorio en GitHub, GitLab o Bitbucket con tu proyecto
- Acceso a tu proveedor de dominio (ej: Namecheap, GoDaddy, Google Domains)

---

## 2️⃣ Paso 1: Subir tu Proyecto a Git

Si aún no tienes tu proyecto en GitHub:

```bash
# Inicializa git si no lo has hecho
cd ruta/a/tu/proyecto

# Inicializa git
git init
# Agrega todos los archivos
git add .
# Primer commit
git commit -m "Initial commit"
# Crea el repo en GitHub y sigue las instrucciones para push
# Ejemplo:
git remote add origin https://github.com/tuusuario/triada.git
git branch -M main
git push -u origin main
```

---

## 3️⃣ Paso 2: Conectar el Proyecto a Vercel

1. Ve a [https://vercel.com/import/git](https://vercel.com/import/git)
2. Elige tu proveedor (GitHub, GitLab, Bitbucket)
3. Autoriza a Vercel a acceder a tu cuenta
4. Selecciona el repositorio de tu proyecto
5. Vercel detectará automáticamente que es un proyecto Next.js
6. Haz click en **"Deploy"**

---

## 4️⃣ Paso 3: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**
2. Agrega todas las variables de tu `.env.local` (sin comillas)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - ...y cualquier otra que uses
3. Guarda los cambios

---

## 5️⃣ Paso 4: Dominio Personalizado

### 5.1 Comprar un Dominio (si no tienes uno)
- Puedes usar Namecheap, GoDaddy, Google Domains, etc.

### 5.2 Agregar el Dominio en Vercel
1. Ve a tu proyecto en Vercel → **Settings** → **Domains**
2. Click en **"Add"** y escribe tu dominio (ej: `triada.com`)
3. Vercel te dará registros DNS (tipo A o CNAME)
4. Ve a tu proveedor de dominio y agrega los registros que te indica Vercel
5. Espera unos minutos a que propaguen los DNS
6. Vercel mostrará el dominio como "Verified"

---

## 6️⃣ Paso 5: Webhooks y Stripe en Producción

1. Ve a Stripe Dashboard → Webhooks
2. Crea un nuevo endpoint con tu dominio de producción:
   - `https://tu-dominio.com/api/webhooks/stripe`
3. Copia el nuevo `STRIPE_WEBHOOK_SECRET` y agrégalo en Vercel (Settings → Environment Variables)
4. Cambia tus claves de Stripe a las de producción (`pk_live_...`, `sk_live_...`)

---

## 7️⃣ Paso 6: Deploy Automático con Git

- Cada vez que hagas `git push` a la rama principal (main/master), Vercel hará deploy automáticamente
- Puedes ver el progreso y logs en el dashboard de Vercel

---

## 8️⃣ Paso 7: Revisar y Probar

- Accede a tu dominio personalizado
- Prueba el flujo de compra y los webhooks
- Verifica que las variables de entorno estén correctas
- Si usas Supabase, revisa las políticas RLS y los orígenes permitidos

---

## 🆘 Problemas Comunes

- **Error 500:** Revisa los logs en Vercel (Project → Deployments → View Functions Logs)
- **Variables de entorno faltantes:** Asegúrate de agregarlas todas en Vercel
- **Dominio no verificado:** Espera la propagación DNS o revisa los registros
- **Webhooks Stripe no llegan:** Verifica el endpoint y el secret

---

## 📚 Recursos
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Domains](https://vercel.com/docs/concepts/projects/domains)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

¡Listo! Tu proyecto Triada estará online y con deploy automático cada vez que subas cambios a Git 🚀
