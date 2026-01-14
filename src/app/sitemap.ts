import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://triadave.com'
  
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // Obtener cursos publicados dinámicamente
  try {
    const supabase = await createClient()
    const { data: courses } = await supabase
      .from('courses')
      .select('id, updated_at')
      .eq('is_published', true)

    const coursePages: MetadataRoute.Sitemap = courses?.map((course) => ({
      url: `${baseUrl}/courses/${course.id}`,
      lastModified: new Date(course.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

    return [...staticPages, ...coursePages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
