import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardHeader from '@/components/DashboardHeader'
import Footer from '@/components/Footer'
import AccountActions from '@/components/AccountActions'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if the user has an email+password identity (most reliable method)
  const hasPasswordAuth = user.identities?.some((i) => i.provider === 'email') ?? false

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      <DashboardHeader profile={profile} />

      {/* Header strip */}
      <div className="bg-[#2d7a5f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
          <p className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest mb-2">Tu cuenta</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Configuración</h1>
          <p className="mt-1 text-white/50 text-sm">Gestiona tu información personal y preferencias</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[#a4c639] inline-block" />
            <h2 className="text-base font-bold text-[#2d7a5f]">Información Personal</h2>
          </div>
          <div className="px-6 py-4 divide-y divide-gray-50">
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-400 font-medium">Nombre</span>
              <span className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Sin nombre'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-400 font-medium">Email</span>
              <span className="text-sm font-semibold text-gray-900">{user.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-400 font-medium">Teléfono</span>
                <span className="text-sm font-semibold text-gray-900">{profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-400 font-medium">Miembro desde</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(profile?.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <AccountActions userEmail={user.email || ''} hasPasswordAuth={hasPasswordAuth} />
      </div>

      <Footer />
    </div>
  )
}
