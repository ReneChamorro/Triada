# Guía de SEO y Google Search Console para Triada

Esta guía te ayudará a resolver los problemas de indexación y optimizar el SEO de tu sitio.

## ✅ Archivos Creados

### 1. `/public/robots.txt`
- Indica a Google qué páginas puede indexar
- Bloquea rutas privadas (/admin, /api/)
- Incluye referencia al sitemap

### 2. `/src/app/sitemap.ts`
- Genera automáticamente el sitemap XML
- Incluye todas las páginas estáticas
- Incluye cursos publicados dinámicamente
- Se actualiza automáticamente con cada deploy

### 3. `/src/app/not-found.tsx`
- Página 404 personalizada con diseño de Triada
- Ayuda a retener usuarios que llegan a URLs inválidas
- Links de navegación al inicio y cursos

### 4. `/src/app/manifest.ts`
- Manifiesto PWA para instalación como app
- Mejora experiencia mobile
- Configura colores y nombre de la app

### 5. Metadata en Layout Principal
- Canonical URLs para evitar contenido duplicado
- Verificación de Google Search Console
- Open Graph para redes sociales
- Twitter Cards
- Robots meta tags

### 6. Metadata en Páginas Individuales
- `/login/layout.tsx` - SEO para página de login
- `/register/layout.tsx` - SEO para página de registro
- `/courses/layout.tsx` - SEO para listado de cursos

---

## 🔧 Pasos en Google Search Console

### Paso 1: Enviar Sitemap
1. Ve a [Google Search Console](https://search.google.com/search-console)
2. Selecciona tu propiedad (triadave.com)
3. En el menú lateral, ve a **"Sitemaps"**
4. Agrega el sitemap: `https://triadave.com/sitemap.xml`
5. Haz clic en **"Enviar"**

### Paso 2: Solicitar Indexación Manual
Para las páginas que muestran error 404:

1. En Search Console, ve a **"Inspección de URLs"**
2. Ingresa la URL completa (ej: `https://triadave.com/login`)
3. Espera la inspección
4. Si dice "URL no está en Google", haz clic en **"Solicitar indexación"**
5. Repite para cada URL importante:
   - https://triadave.com
   - https://triadave.com/courses
   - https://triadave.com/login
   - https://triadave.com/register

### Paso 3: Verificar Canonical URLs
1. Ve a **"Cobertura"** en Search Console
2. Busca páginas marcadas como **"Duplicada"**
3. Verifica que cada página tenga su canonical URL correcta
4. Las canonical URLs ya están configuradas en el código

### Paso 4: Revisar robots.txt
1. En Search Console, ve a **"Rastreo"** → **"robots.txt"**
2. Verifica que el archivo se esté sirviendo correctamente
3. URL: `https://triadave.com/robots.txt`

---

## 🚀 Deploy y Verificación

### 1. Hacer Deploy
```bash
git add .
git commit -m "Add SEO optimization files"
git push
```

Vercel detectará el push y desplegará automáticamente.

### 2. Verificar Archivos en Producción

Después del deploy, verifica que estos archivos estén disponibles:

✅ **Robots.txt:** https://triadave.com/robots.txt
✅ **Sitemap:** https://triadave.com/sitemap.xml
✅ **Manifest:** https://triadave.com/manifest.json

### 3. Esperar Indexación

Google puede tardar:
- **Sitemap:** 1-7 días para rastrear completamente
- **Páginas nuevas:** 2-4 semanas para indexar
- **Solicitud manual:** 1-2 días (más rápido)

---

## 📊 Monitoreo Continuo

### En Google Search Console, monitorea:

1. **Cobertura:**
   - Páginas válidas indexadas
   - Páginas con errores
   - Páginas excluidas

2. **Mejoras:**
   - Core Web Vitals (velocidad del sitio)
   - Experiencia móvil
   - HTTPS

3. **Rendimiento:**
   - Clics desde Google
   - Impresiones
   - CTR (Click-Through Rate)
   - Posición promedio

---

## 🎯 Mejores Prácticas Adicionales

### 1. Agregar Descripciones a Cursos
Cada curso debe tener:
- Título descriptivo (50-60 caracteres)
- Meta descripción (150-160 caracteres)
- URL amigable

### 2. Optimizar Imágenes
- Usa WebP cuando sea posible
- Agrega atributos `alt` descriptivos
- Comprime imágenes (< 200KB)

### 3. Velocidad del Sitio
- Verifica en [PageSpeed Insights](https://pagespeed.web.dev/)
- Meta: > 90 en móvil y desktop
- Usa lazy loading para imágenes

### 4. Enlaces Internos
- Agrega links entre páginas relacionadas
- Usa texto ancla descriptivo
- Crea breadcrumbs para navegación

---

## ❗ Resolver Errores Comunes

### Error: "No se ha encontrado (404)"

**Causa:** Página no existe o URL incorrecta

**Solución:**
1. Verifica que la página exista en `/src/app/`
2. Revisa la estructura de carpetas
3. Asegúrate de que el deploy se completó
4. Solicita re-indexación manual

### Error: "Duplicada: el usuario no ha indicado ninguna versión canónica"

**Causa:** Google encontró contenido duplicado

**Solución:**
1. Verifica que cada página tenga `canonical` URL
2. Evita duplicar contenido entre páginas
3. Usa redirects 301 para URLs antiguas
4. Las canonical URLs ya están configuradas en el código

### Error: "Rastreada, actualmente no indexada"

**Causa:** Google rastreó la página pero decidió no indexarla

**Solución:**
1. Mejora el contenido (más texto, más valor)
2. Agrega enlaces internos a la página
3. Aumenta la autoridad del dominio
4. Espera 2-4 semanas

---

## 📈 KPIs de SEO a Monitorear

| Métrica | Meta | Frecuencia |
|---------|------|------------|
| Páginas indexadas | 100% de páginas públicas | Semanal |
| Errores 404 | 0 | Semanal |
| Core Web Vitals | Verde (Good) | Mensual |
| Posición promedio | Top 10 para keywords clave | Mensual |
| Clics orgánicos | Crecimiento 10%/mes | Mensual |

---

## 🔗 Enlaces Útiles

- **Google Search Console:** https://search.google.com/search-console
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse
- **Schema Markup Validator:** https://validator.schema.org/
- **Robots.txt Tester:** https://support.google.com/webmasters/answer/6062598

---

## ✅ Checklist de Implementación

Después del deploy, verifica:

- [ ] robots.txt accesible
- [ ] sitemap.xml accesible y genera URLs correctas
- [ ] Manifest.json accesible
- [ ] Página 404 personalizada funciona
- [ ] Canonical URLs configuradas
- [ ] Google Search Console verificado
- [ ] Sitemap enviado a Search Console
- [ ] Solicitud de indexación para páginas principales
- [ ] No hay errores en Coverage Report
- [ ] Core Web Vitals en verde

---

## 🎉 Resultado Esperado

En 2-4 semanas deberías ver:
- ✅ 0 errores 404 en Search Console
- ✅ 0 páginas duplicadas
- ✅ Todas las páginas indexadas
- ✅ Aparición en búsquedas de Google
- ✅ Tráfico orgánico inicial

¿Necesitas ayuda con algo específico? Revisa los logs en Search Console para diagnóstico detallado.
