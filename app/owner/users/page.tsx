'use client'

import { useEffect, useState } from 'react'
import { Users, Shield, Search, UserCheck, Key } from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'

export default function OwnerUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchUsers() }, [roleFilter])

  const fetchUsers = async () => {
    setFetching(true)
    try {
      let url = '/api/admin/users'
      if (roleFilter) url += `?role=${roleFilter}`
      const res = await fetch(url, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
        setError(null)
      } else {
        setError('Gagal memuat users')
      }
    } catch {
      setError('Gagal memuat users')
    } finally {
      setFetching(false)
    }
  }

  const getRoleStyle = (role: string) => {
    const map: Record<string, { badge: string; dot: string; label: string }> = {
      OWNER:  { badge: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500', label: 'Owner' },
      ADMIN:  { badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500',   label: 'Admin' },
      KASIR:  { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Kasir' },
      USER:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400',   label: 'User' },
    }
    return map[role] || map.USER
  }

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const getAvatarGradient = (role: string) => {
    const map: Record<string, string> = {
      OWNER: 'from-violet-500 to-indigo-600',
      ADMIN: 'from-blue-500 to-blue-700',
      KASIR: 'from-emerald-500 to-teal-600',
      USER:  'from-gray-400 to-gray-600',
    }
    return map[role] || map.USER
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const roleCount = (role: string) => users.filter(u => u.role === role).length

  return (
    <OwnerShell
      title="Users"
      subtitle="Monitor akun sistem dan peran pengguna"
      onRefresh={fetchUsers}
    >
      <div className="space-y-5">

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Users },
            { label: 'Admin', value: roleCount('ADMIN'), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Shield },
            { label: 'Kasir', value: roleCount('KASIR'), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: UserCheck },
            { label: 'Customers', value: roleCount('USER'), color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Users },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`rounded-2xl p-4 border ${card.bg} shadow-sm flex items-center gap-4`}>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter & Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Users size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Daftar User</h3>
            </div>
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="KASIR">Kasir</option>
              <option value="USER">User</option>
            </select>
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari user..."
                className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 w-48 transition-colors"
              />
            </div>
          </div>

          {fetching ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-4 bg-gray-200 rounded w-28" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const roleStyle = getRoleStyle(user.role)
                    return (
                      <tr key={user.id} className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(user.role)} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                              {getInitials(user.name)}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleStyle.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                            {roleStyle.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Users size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">{search ? 'User tidak ditemukan' : 'Belum ada user'}</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Key size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Catatan Keamanan</h4>
              <p className="text-sm text-gray-600">
                Akun OWNER lain disembunyikan dari tampilan ini untuk keamanan. Hanya ADMIN yang dapat melihat dan mengelola akun OWNER.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
