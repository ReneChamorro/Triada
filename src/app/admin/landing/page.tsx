'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Plus, Trash2, Loader2, MoveUp, MoveDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'motion/react'

interface Feature {
  id: string
  title: string
  description: string
  icon_url: string | null
  position: number
  is_highlighted: boolean
}

interface AboutSection {
  id: string
  title: string
  subtitle: string | null
  description: string
  description_secondary: string | null
  image_url: string | null
  button_text: string
  hero_tagline: string | null
  hero_subtitle: string | null
}

export default function LandingSettingsPage() {
  const router = useRouter()
  const [features, setFeatures] = useState<Feature[]>([])
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    // Fetch features
    const { data: featuresData } = await supabase
      .from('landing_features')
      .select('*')
      .order('position')
    
    if (featuresData) setFeatures(featuresData)

    // Fetch about section
    const { data: aboutData } = await supabase
      .from('landing_about')
      .select('*')
      .single()
    
    if (aboutData) setAboutSection(aboutData)
    
    setLoading(false)
  }

  const handleImageUpload = async (featureId: string, file: File) => {
    setUploadingId(featureId)
    const supabase = createClient()

    try {
      // Generar nombre único para la imagen
      const fileExt = file.name.split('.').pop()
      const fileName = `${featureId}-${Date.now()}.${fileExt}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('landing-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('landing-images')
        .getPublicUrl(fileName)

      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('landing_features')
        .update({ icon_url: publicUrl })
        .eq('id', featureId)

      if (updateError) throw updateError

      // Actualizar estado local
      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, icon_url: publicUrl } : f
      ))

      alert('Imagen subida correctamente')
    } catch (error) {
      logger.error('Error uploading image:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploadingId(null)
    }
  }

  const updateFeature = async (featureId: string, updates: Partial<Feature>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('landing_features')
      .update(updates)
      .eq('id', featureId)

    if (error) {
      logger.error('Error updating feature:', error)
      alert('Error al actualizar')
      return
    }

    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    ))
  }

  const moveFeature = async (featureId: string, direction: 'up' | 'down') => {
    const currentIndex = features.findIndex(f => f.id === featureId)
    if (currentIndex === -1) return
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= features.length) return

    const newFeatures = [...features]
    const temp = newFeatures[currentIndex]
    newFeatures[currentIndex] = newFeatures[targetIndex]
    newFeatures[targetIndex] = temp

    // Actualizar posiciones
    const supabase = createClient()
    await Promise.all(
      newFeatures.map((f, idx) =>
        supabase
          .from('landing_features')
          .update({ position: idx + 1 })
          .eq('id', f.id)
      )
    )

    setFeatures(newFeatures.map((f, idx) => ({ ...f, position: idx + 1 })))
  }

  const deleteFeature = async (featureId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta característica?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('landing_features')
      .delete()
      .eq('id', featureId)

    if (error) {
      alert('Error al eliminar')
      return
    }

    setFeatures(prev => prev.filter(f => f.id !== featureId))
  }

  const addFeature = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('landing_features')
      .insert({
        title: 'Nueva Característica',
        description: 'Descripción de la característica',
        position: features.length + 1,
        is_highlighted: false
      })
      .select()
      .single()

    if (error) {
      alert('Error al crear característica')
      return
    }

    if (data) {
      setFeatures(prev => [...prev, data])
    }
  }

  const updateAboutSection = async (updates: Partial<AboutSection>) => {
    if (!aboutSection) return

    const supabase = createClient()
    const { error } = await supabase
      .from('landing_about')
      .update(updates)
      .eq('id', aboutSection.id)

    if (error) {
      alert('Error al actualizar')
      return
    }

    setAboutSection(prev => prev ? { ...prev, ...updates } : null)
  }

  const handleAboutImageUpload = async (file: File) => {
    if (!aboutSection) return
    
    setUploadingId('about-image')
    const supabase = createClient()

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `about-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('landing-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('landing-images')
        .getPublicUrl(fileName)

      await updateAboutSection({ image_url: publicUrl })

      alert('Imagen subida correctamente')
    } catch (error) {
      logger.error('Error uploading image:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#e8e4d0] rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[#1a5744]" />
            </button>
            <div>
              <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-1">
                Contenido
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
                Landing Page
              </h1>
            </div>
          </div>

          <button
            onClick={addFeature}
            className="flex items-center gap-2 bg-[#a4c639] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2d7a5f] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Característica
          </button>
        </motion.div>

        {/* Hero Section */}
        {aboutSection && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mb-8"
          >
            <h2 className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest mb-4">
              Sección Hero
            </h2>
            <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1a5744] mb-2">
                    Frase destacada (tagline)
                  </label>
                  <input
                    type="text"
                    value={aboutSection.hero_tagline || ''}
                    onChange={(e) => updateAboutSection({ hero_tagline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none"
                    placeholder="Ej: Ciencia. Formación. Aplicación."
                  />
                  <p className="text-xs text-gray-500 mt-1">Aparece en verde debajo del título principal.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1a5744] mb-2">
                    Subtítulo del hero
                  </label>
                  <textarea
                    value={aboutSection.hero_subtitle || ''}
                    onChange={(e) => updateAboutSection({ hero_subtitle: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none resize-none"
                    placeholder="Ej: Docencia basada en evidencia e investigación aplicada..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Texto descriptivo debajo de la frase destacada.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* About Section */}
        {aboutSection && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            className="mb-8"
          >
            <h2 className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest mb-4">
              Sobre Nosotros
            </h2>

            <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6">
              <div className="grid md:grid-cols-[300px_1fr] gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-[#1a5744] mb-2">
                    Imagen Principal
                  </label>
                  <div className="aspect-square bg-[#f5f3e8] rounded-2xl flex items-center justify-center overflow-hidden relative group">
                    {aboutSection.image_url ? (
                      <>
                        <Image
                          src={aboutSection.image_url}
                          alt="Sobre Nosotros"
                          fill
                          className="object-cover"
                        />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                          <Upload className="h-8 w-8 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleAboutImageUpload(file)
                            }}
                          />
                        </label>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                        {uploadingId === 'about-image' ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8" />
                            <span className="text-xs">Subir imagen</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAboutImageUpload(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Recomendado: 600x600px JPG o PNG
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={aboutSection.title}
                      onChange={(e) => updateAboutSection({ title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none"
                      placeholder="Ej: Sobre Nosotros"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Subtítulo (Nombre destacado)
                    </label>
                    <input
                      type="text"
                      value={aboutSection.subtitle || ''}
                      onChange={(e) => updateAboutSection({ subtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none"
                      placeholder="Ej: Triada Global"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Descripción Principal
                    </label>
                    <textarea
                      value={aboutSection.description}
                      onChange={(e) => updateAboutSection({ description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none resize-none"
                      placeholder="Primera descripción..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Descripción Secundaria (Misión/Visión)
                    </label>
                    <textarea
                      value={aboutSection.description_secondary || ''}
                      onChange={(e) => updateAboutSection({ description_secondary: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none resize-none"
                      placeholder="Segunda descripción..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Texto del Botón
                    </label>
                    <input
                      type="text"
                      value={aboutSection.button_text}
                      onChange={(e) => updateAboutSection({ button_text: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none"
                      placeholder="Ej: Ver Más"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <h2 className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest mb-4 mt-8">
          Características de la Landing
        </h2>

        {/* Features List */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 + index * 0.06 }}
              className={`bg-white rounded-[1.5rem] p-6 border ${
                feature.is_highlighted ? 'border-[#a4c639] ring-2 ring-[#a4c639]/20' : 'border-[#e8e4d0]'
              }`}
            >
              <div className="grid md:grid-cols-[200px_1fr] gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-[#1a5744] mb-2">
                    Imagen/Ícono
                  </label>
                  <div className="aspect-square bg-[#f5f3e8] rounded-2xl flex items-center justify-center overflow-hidden relative group">
                    {feature.icon_url ? (
                      <>
                        <Image
                          src={feature.icon_url}
                          alt={feature.title}
                          fill
                          className="object-contain p-4"
                        />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                          <Upload className="h-8 w-8 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(feature.id, file)
                            }}
                          />
                        </label>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                        {uploadingId === feature.id ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8" />
                            <span className="text-xs">Subir imagen</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(feature.id, file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Recomendado: 200x200px PNG o SVG
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1a5744] mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={feature.description}
                      onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e8e4d0] focus:border-[#a4c639] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.is_highlighted}
                        onChange={(e) => updateFeature(feature.id, { is_highlighted: e.target.checked })}
                        className="w-5 h-5 text-[#a4c639] rounded focus:ring-[#a4c639]"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Destacar (fondo verde)
                      </span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-[#e8e4d0]">
                    <button
                      onClick={() => moveFeature(feature.id, 'up')}
                      disabled={index === 0}
                      className="p-2 hover:bg-[#e8e4d0] rounded-xl transition-colors disabled:opacity-30"
                    >
                      <MoveUp className="h-5 w-5 text-[#1a5744]/50" />
                    </button>
                    <button
                      onClick={() => moveFeature(feature.id, 'down')}
                      disabled={index === features.length - 1}
                      className="p-2 hover:bg-[#e8e4d0] rounded-xl transition-colors disabled:opacity-30"
                    >
                      <MoveDown className="h-5 w-5 text-[#1a5744]/50" />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => deleteFeature(feature.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {features.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[1.5rem] border border-[#e8e4d0]">
            <p className="text-[#1a5744]/40 font-semibold text-sm mb-4">No hay características configuradas</p>
            <button
              onClick={addFeature}
              className="inline-flex items-center gap-2 bg-[#a4c639] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2d7a5f] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar Primera Característica
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
