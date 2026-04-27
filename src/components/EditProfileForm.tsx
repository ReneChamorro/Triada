'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Pencil, X, Check, Loader2 } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EditProfileFormProps {
  userId: string
  initialName: string | null
}

export default function EditProfileForm({ userId, initialName }: EditProfileFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('El nombre no puede estar vacío')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', userId)

      if (updateError) throw updateError

      setEditing(false)
      router.refresh()
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(initialName || '')
    setError('')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex justify-between items-center py-3">
        <span className="text-sm text-gray-400 font-medium">Nombre</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            {initialName || 'Sin nombre'}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-[#2d7a5f] hover:text-[#a4c639] font-medium transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400 font-medium">Nombre</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent outline-none"
          placeholder="Tu nombre completo"
          autoFocus
          disabled={saving}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1.5 rounded-lg bg-[#a4c639] text-white hover:bg-[#2d7a5f] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
