# 🎓 Guía de Configuración - Panel de Administración Triada

## ✅ Lo que ya tienes listo

- ✅ Panel de admin con sidebar de navegación
- ✅ Dashboard con estadísticas
- ✅ Página para gestionar cursos (ver, editar, eliminar, publicar/ocultar)
- ✅ Formulario para crear nuevos cursos con upload de imágenes
- ✅ Página para gestionar usuarios y cambiar roles
- ✅ Diseño con los colores de Triada

## 📋 Pasos para empezar a usar el panel

### 1. Ejecutar la migración de la base de datos

Si aún no lo has hecho, ejecuta el archivo de migración:

1. Ve a Supabase Dashboard → SQL Editor
2. Abre el archivo: `supabase/migrations/00001_create_triada_schema.sql`
3. Copia todo el contenido
4. Pega en el SQL Editor de Supabase
5. Haz clic en **RUN** o presiona `Ctrl+Enter`

Esto creará:
- Tipos ENUM (roles, categorías, niveles, etc.)
- Tablas (profiles, courses, lessons, enrollments, etc.)
- Políticas RLS para seguridad
- Triggers para auto-actualización

### 2. Configurar Supabase Storage

Sigue las instrucciones en el archivo `SETUP_STORAGE.md`:

1. Crear bucket `course-images` (público)
2. Aplicar políticas RLS para que admins/teachers puedan subir
3. Permitir lectura pública de imágenes

### 3. Registrar tu primer usuario

1. Ve a: `http://localhost:3000/register`
2. Regístrate con tu email y contraseña
3. Esto creará automáticamente:
   - Usuario en Supabase Auth
   - Perfil en la tabla `profiles` (con rol `user` por defecto)

### 4. Convertir tu usuario en administrador

**Opción A: Usando el SQL Editor de Supabase**

```sql
-- Reemplaza 'tu-email@ejemplo.com' con tu email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'tu-email@ejemplo.com';
```

**Opción B: Si ya tienes otro admin, usa el panel**

1. Inicia sesión con el admin existente
2. Ve a `/admin/usuarios`
3. Cambia el rol del usuario en el dropdown

### 5. Acceder al panel de administración

1. Inicia sesión: `http://localhost:3000/login`
2. Ve a: `http://localhost:3000/admin`
3. Deberías ver el dashboard con el sidebar

Si no puedes acceder:
- Verifica que tu usuario tiene rol `admin` o `teacher`
- Revisa la consola del navegador para ver errores

## 🚀 Crear tu primer curso

1. Ve a: `http://localhost:3000/admin/courses`
2. Haz clic en **"Nuevo Curso"**
3. Completa el formulario:
   - **Título**: El nombre del curso (el slug se genera automáticamente)
   - **Descripción**: Descripción detallada del curso
   - **Imagen**: Sube una imagen representativa (PNG/JPG, máx 5MB)
   - **Precio**: En pesos mexicanos (ej: 999.00)
   - **Categoría**: Selecciona una categoría
   - **Nivel**: Principiante, Intermedio o Avanzado
   - **Estado**: Borrador (no visible) o Publicado (visible en el sitio)
   - **Etiquetas**: Palabras clave separadas por comas
4. Haz clic en **"Crear Curso"**

El curso aparecerá en la lista y podrás:
- ✏️ Editarlo
- 👁️ Ver cómo se ve en el sitio
- 🙈 Ocultarlo (cambiar a borrador)
- 👁️‍🗨️ Publicarlo
- 🗑️ Eliminarlo

## 📊 Funciones del Dashboard

### Dashboard Principal (`/admin`)
- Estadísticas en tiempo real:
  - Total de cursos
  - Total de estudiantes
  - Ingresos totales
  - Pagos pendientes
- Lista de cursos recientes
- Accesos rápidos a crear curso y gestionar usuarios

### Gestión de Cursos (`/admin/courses`)
- Ver todos los cursos
- Filtrar por: Todos, Publicados, Borradores
- Crear nuevo curso
- Editar curso existente
- Cambiar estado (publicar/ocultar)
- Ver curso en el sitio
- Eliminar curso

### Gestión de Usuarios (`/admin/usuarios`)
- Ver todos los usuarios registrados
- Cambiar roles (Usuario, Instructor, Administrador)
- Ver fecha de registro
- Ver email e ID

## 🎨 Estructura de URLs

```
/admin                          → Dashboard principal
/admin/courses                  → Lista de cursos
/admin/courses/new              → Crear nuevo curso
/admin/courses/[id]/edit        → Editar curso (por crear)
/admin/usuarios                 → Gestión de usuarios
```

## 🔒 Roles y Permisos

### Usuario (`user`)
- Puede ver cursos públicos
- Puede inscribirse y pagar
- Puede ver su progreso
- **NO** puede acceder al panel de admin

### Instructor (`teacher`)
- Todo lo de usuario
- Puede acceder al panel de admin
- Puede crear y gestionar cursos
- Puede ver estadísticas
- **NO** puede gestionar usuarios

### Administrador (`admin`)
- Todo lo de instructor
- Puede gestionar usuarios
- Puede cambiar roles
- Acceso total al sistema

## 🐛 Solución de Problemas

### No puedo acceder a /admin
- Verifica que estás autenticado (`/login`)
- Verifica que tu usuario tiene rol `admin` o `teacher`
- Ejecuta en Supabase SQL Editor:
  ```sql
  SELECT id, email, role FROM profiles WHERE email = 'tu-email@ejemplo.com';
  ```

### No puedo subir imágenes
- Verifica que el bucket `course-images` existe
- Verifica que es público
- Verifica que las políticas RLS están aplicadas
- Ver archivo `SETUP_STORAGE.md`

### Los cursos no aparecen en el sitio
- Verifica que el curso tiene estado `published`
- Verifica que hay una imagen asignada
- Refresca la página de cursos

### Error al crear curso
- Verifica que todos los campos requeridos están completos
- Verifica que el precio es un número válido
- Verifica que el slug es único
- Revisa la consola del navegador para errores específicos

## 🎯 Próximos Pasos

Una vez que tengas cursos creados, puedes:

1. **Crear lecciones** para los cursos (por implementar)
2. **Probar el flujo de compra** con Stripe
3. **Ver estadísticas** de inscripciones
4. **Gestionar reseñas** de estudiantes (por implementar)

## 📝 Notas Importantes

- Las imágenes se almacenan en Supabase Storage
- Los slugs deben ser únicos (se genera automáticamente del título)
- Los cursos en borrador NO son visibles en el sitio público
- Solo admins y teachers pueden acceder al panel
- Las estadísticas se actualizan en tiempo real con triggers

---

¿Necesitas ayuda? Revisa los archivos:
- `SETUP_STORAGE.md` - Para configurar el storage
- `supabase/migrations/00001_create_triada_schema.sql` - Para ver el esquema de BD
- `.env.local` - Para verificar las variables de entorno
