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
    <div className="min-h-screen bg-[#e8e4d0]">
      <DashboardHeader profile={profile} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744] mb-8">
          Configuración de Cuenta
        </h1>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-[#1a5744] mb-4">Información Personal</h2>
          <div className="space-y-3 text-sm md:text-base">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Nombre</span>
              <span className="font-medium text-gray-900">{profile?.full_name || 'Sin nombre'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Teléfono</span>
                <span className="font-medium text-gray-900">{profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Miembro desde</span>
              <span className="font-medium text-gray-900">
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
