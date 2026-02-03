'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Upload, X, Save } from 'lucide-react';

interface Instructor {
  id: string;
  full_name: string;
  role: string;
}

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [defaultInstructorId, setDefaultInstructorId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    category: 'psychology',
    status: 'draft',
    course_type: 'course',
    tags: '',
    instructor_id: '',
    is_featured: false,
  });

  useEffect(() => {
    async function loadInstructors() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'teacher'])
        .order('full_name');
      
      if (data) {
        setInstructors(data);
        
        // Buscar a Sophia Behrens como default
        const sophiaDefault = data.find(p => p.full_name === 'Sophia Behrens');
        const defaultId = sophiaDefault?.id || data[0]?.id || '';
        
        setDefaultInstructorId(defaultId);
        setFormData(prev => ({ ...prev, instructor_id: defaultId }));
      }
    }
    loadInstructors();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[áäâà]/g, 'a')
      .replace(/[éëêè]/g, 'e')
      .replace(/[íïîì]/g, 'i')
      .replace(/[óöôò]/g, 'o')
      .replace(/[úüûù]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `courses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error('Error al subir la imagen: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('course-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          instructor_id: formData.instructor_id,
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          status: formData.status,
          course_type: formData.course_type,
          image_url: imageUrl,
          tags: tagsArray,
          is_featured: formData.is_featured,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      alert('Curso creado exitosamente');
      router.push('/admin/courses');
    } catch (error: any) {
      console.error('Error creating course:', error);
      alert(error.message || 'Error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a5744]">Nuevo Curso</h1>
        <p className="text-gray-600 mt-2">Crea un nuevo curso para la plataforma</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">
            Imagen del Curso
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-gray-600">Click para subir imagen</span>
              <span className="text-sm text-gray-400 mt-1">PNG, JPG hasta 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Instructor *
            </label>
            <select
              required
              value={formData.instructor_id}
              onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            >
              <option value="">Seleccionar instructor...</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.full_name} ({instructor.role})
                </option>
              ))}
            </select>
            {defaultInstructorId && (
              <p className="text-sm text-gray-500 mt-1">
                Default: Sophia Behrens
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Título del Curso *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            />
            {formData.slug && (
              <p className="text-sm text-gray-500 mt-1">
                URL: /courses/{formData.slug}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Descripción *
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
              placeholder="Describe el curso en detalle..."
            />
          </div>
        </div>

        {/* Course Details */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                Precio ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                placeholder="999.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                Categoría *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
              >
                <option value="psychology">Psicología</option>
                <option value="therapy">Terapia</option>
                <option value="intervention">Intervención</option>
                <option value="research">Investigación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                Tipo de Curso *
              </label>
              <select
                required
                value={formData.course_type}
                onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
              >
                <option value="course">Curso</option>
                <option value="masterclass">Masterclass</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                Estado *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-[#a4c639] bg-gray-100 border-gray-300 rounded focus:ring-[#a4c639] focus:ring-2"
              />
              <label htmlFor="is_featured" className="text-sm font-semibold text-[#1a5744]">
                Curso Destacado
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
              placeholder="javascript, react, frontend"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-[#a4c639] text-white px-6 py-3 rounded-lg hover:bg-[#2d7a5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Crear Curso</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
