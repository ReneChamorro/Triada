# Configurar Storage en Supabase

Para que funcione el upload de imágenes de cursos, necesitas crear un bucket en Supabase Storage.

## Pasos:

### 1. Crear el Bucket

1. Ve a tu proyecto en Supabase Dashboard
2. En el menú lateral, haz clic en **Storage**
3. Haz clic en **"Create a new bucket"** o **"New bucket"**
4. Configura el bucket con estos datos:
   - **Name**: `course-images`
   - **Public bucket**: ✅ **Activado** (para que las imágenes sean públicas)
   - **File size limit**: 5MB (opcional)
   - **Allowed MIME types**: `image/*` (opcional)
5. Haz clic en **"Create bucket"**

### 2. Configurar Políticas de Acceso (RLS)

El bucket debe tener políticas para que los admins puedan subir y todos puedan ver.

#### Política 1: Permitir lectura pública
```sql
-- Policy for public read access
CREATE POLICY "Public can view course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');
```

#### Política 2: Permitir subida a admins/teachers
```sql
-- Policy for admins/teachers to upload
CREATE POLICY "Admins and teachers can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' 
  AND auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'teacher')
  )
);
```

#### Política 3: Permitir actualización/eliminación a admins/teachers
```sql
-- Policy for admins/teachers to update/delete
CREATE POLICY "Admins and teachers can update course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' 
  AND auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Admins and teachers can delete course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' 
  AND auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'teacher')
  )
);
```

### 3. Aplicar las Políticas

1. En Supabase Dashboard, ve a **Storage** > **Policies**
2. Selecciona el bucket `course-images`
3. Haz clic en **"New Policy"**
4. Elige **"Create a policy from scratch"**
5. Copia y pega cada una de las políticas SQL de arriba
6. O puedes ir al **SQL Editor** y ejecutar todas las políticas de una vez

## Verificación

Para verificar que todo está funcionando:

1. Ve a `/admin/courses/new` en tu aplicación
2. Intenta subir una imagen
3. Si funciona, verás la imagen en el preview
4. Después de crear el curso, verifica que la imagen se muestre en la lista de cursos

## Notas Importantes

- Las imágenes se subirán con un nombre único: `{timestamp}-{random}.{ext}`
- Las imágenes quedarán en: `course-images/courses/{filename}`
- Las URLs públicas serán del tipo: `https://{project-ref}.supabase.co/storage/v1/object/public/course-images/courses/{filename}`
- El bucket DEBE ser público para que las imágenes se vean en el frontend

## Troubleshooting

Si las imágenes no se suben:
1. Verifica que el bucket existe y es público
2. Verifica que las políticas RLS están aplicadas
3. Verifica que tu usuario tiene rol `admin` o `teacher` en la tabla `profiles`
4. Revisa la consola del navegador para ver errores específicos
