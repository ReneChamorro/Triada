'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Save, Plus, Trash2, Loader2, MoveUp, MoveDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Feature {
  id: string
  title: string
  description: string
  icon_url: string | null
  position: number
  is_highlighted: boolean
}

export default function LandingSettingsPage() {
  const router = useRouter()
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('landing_features')
      .select('*')
      .order('position')
    
    if (data) setFeatures(data)
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
      console.error('Error uploading image:', error)
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
      console.error('Error updating feature:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#a4c639]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-[#1a5744]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#1a5744]">
                Configurar Landing Page
              </h1>
              <p className="text-gray-700 mt-1">
                Gestiona las características que aparecen en la página principal
              </p>
            </div>
          </div>
          
          <button
            onClick={addFeature}
            className="flex items-center gap-2 bg-[#a4c639] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#8fb030] transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Agregar Característica
          </button>
        </div>

        {/* Features List */}
        <div className="space-y-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`bg-white rounded-3xl shadow-xl p-6 border-2 ${
                feature.is_highlighted ? 'border-[#a4c639] ring-4 ring-[#a4c639]/20' : 'border-gray-200'
              }`}
            >
              <div className="grid md:grid-cols-[200px_1fr] gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-[#1a5744] mb-2">
                    Imagen/Ícono
                  </label>
                  <div className="aspect-square bg-[#F5E6D3] rounded-2xl flex items-center justify-center overflow-hidden relative group">
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#a4c639] focus:outline-none"
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#a4c639] focus:outline-none resize-none"
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
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <button
                      onClick={() => moveFeature(feature.id, 'up')}
                      disabled={index === 0}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <MoveUp className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => moveFeature(feature.id, 'down')}
                      disabled={index === features.length - 1}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <MoveDown className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => deleteFeature(feature.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {features.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl shadow-xl">
            <p className="text-gray-500 mb-4">No hay características configuradas</p>
            <button
              onClick={addFeature}
              className="inline-flex items-center gap-2 bg-[#a4c639] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#8fb030] transition-colors"
            >
              <Plus className="h-5 w-5" />
              Agregar Primera Característica
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
