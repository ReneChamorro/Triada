'use client'
import { logger } from '@/lib/logger'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users, Shield, UserCircle } from 'lucide-react'
import { motion } from 'motion/react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'teacher' | 'user'
  created_at: string
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-[#1a5744] text-[#a4c639]',
  teacher: 'bg-[#a4c639]/20 text-[#2d7a5f]',
  user: 'bg-[#e8e4d0] text-[#1a5744]/65',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Instructor',
  user: 'Usuario',
}

export default function UsersPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      logger.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: 'admin' | 'teacher' | 'user') {
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar el rol')
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      alert('Rol actualizado exitosamente')
    } catch (error) {
      logger.error('Error updating role:', error)
      alert('Error al actualizar el rol')
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
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-2">
          Gestión
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
          Usuarios
        </h1>
        <p className="text-[#1a5744]/50 mt-1 text-sm">
          Administra los usuarios de la plataforma
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#1a5744]">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white/70 uppercase tracking-widest">
                  Usuario
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white/70 uppercase tracking-widest">
                  Email
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white/70 uppercase tracking-widest">
                  Rol Actual
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white/70 uppercase tracking-widest">
                  Cambiar Rol
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-white/70 uppercase tracking-widest">
                  Registrado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e4d0]">
              {users.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="hover:bg-[#f5f3e8] transition-colors"
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#a4c639] flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1a5744]">
                          {user.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-[#1a5744]/40">
                          ID: {user.id.substring(0, 8)}…
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#1a5744]/70">{user.email}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${ROLE_STYLES[user.role] || ROLE_STYLES.user}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                      className="text-sm border border-[#e8e4d0] rounded-xl px-3 py-1.5
                                 bg-white text-[#1a5744] focus:ring-2 focus:ring-[#a4c639]
                                 focus:border-transparent outline-none"
                    >
                      <option value="user">Usuario</option>
                      <option value="teacher">Instructor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-[#1a5744]/45">
                    {new Date(user.created_at).toLocaleDateString('es-MX')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 bg-[#e8e4d0] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-[#1a5744]/30" />
            </div>
            <p className="text-[#1a5744]/40 font-semibold text-sm">No hay usuarios registrados</p>
          </div>
        )}
      </motion.div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="mt-6 bg-[#e8e4d0] border border-[#1a5744]/10 rounded-[1.25rem] p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-[#1a5744] rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#a4c639]" />
          </div>
          <div>
            <h3 className="text-[#1a5744] font-bold text-sm mb-1.5">Sobre los roles</h3>
            <ul className="text-sm text-[#1a5744]/65 space-y-1">
              <li><strong className="text-[#1a5744]">Usuario:</strong> Puede inscribirse y ver cursos comprados</li>
              <li><strong className="text-[#1a5744]">Instructor:</strong> Puede crear y gestionar cursos</li>
              <li><strong className="text-[#1a5744]">Administrador:</strong> Acceso total al panel y gestión de usuarios</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
