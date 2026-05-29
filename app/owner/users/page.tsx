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
      OWNER:  { badge: 'bg-canvas text-ink border-ink',       dot: 'bg-ink',   label: 'Owner' },
      ADMIN:  { badge: 'bg-canvas text-ink border-ink',       dot: 'bg-ink',   label: 'Admin' },
      KASIR:  { badge: 'bg-canvas text-success border-success', dot: 'bg-success', label: 'Kasir' },
    }
    return map[role] || { badge: 'bg-canvas text-mute border-hairline', dot: 'bg-mute', label: role }
  }

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const getAvatarBg = (role: string) => {
    const map: Record<string, string> = {
      OWNER: 'bg-ink text-canvas',
      ADMIN: 'bg-ink text-canvas',
      KASIR: 'bg-soft-cloud text-ink',
    }
    return map[role] || 'bg-soft-cloud text-ink'
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
      <div className="space-y-5 font-inter text-ink">

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-none bg-canvas border border-sale">
            <p className="text-sm text-sale font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: users.length, bg: 'bg-soft-cloud border-hairline' },
            { label: 'Admin', value: roleCount('ADMIN'), bg: 'bg-soft-cloud border-hairline' },
            { label: 'Kasir', value: roleCount('KASIR'), bg: 'bg-soft-cloud border-hairline' },
          ].map((card) => {
            return (
              <div key={card.label} className={`rounded-none p-4 border ${card.bg}`}>
                <div>
                  <p className="text-[10px] text-mute font-bold uppercase tracking-wider font-jakarta">{card.label}</p>
                  <p className="text-2xl font-black mt-1 font-jakarta text-ink">{card.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter & Table */}
        <div className="bg-canvas rounded-none border border-hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex flex-wrap items-center gap-3 font-jakarta justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-ink" />
              <h3 className="font-bold text-ink uppercase tracking-wider text-sm">Daftar User</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-1.5 border border-hairline rounded-full focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="KASIR">Kasir</option>
              </select>
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari user..."
                  className="pl-8 pr-4 py-1.5 text-xs border border-hairline rounded-full focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas w-48 transition-colors font-semibold"
                />
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3 border-b border-hairline/50">
                  <div className="w-10 h-10 bg-soft-cloud rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-soft-cloud rounded w-1/4" />
                    <div className="h-3 bg-soft-cloud rounded w-1/3" />
                  </div>
                  <div className="h-6 bg-soft-cloud rounded-full w-16" />
                  <div className="h-4 bg-soft-cloud rounded w-28" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-cloud border-b border-hairline">
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Nama</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Email</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-center">Role</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.map((user) => {
                    const roleStyle = getRoleStyle(user.role)
                    return (
                      <tr key={user.id} className="hover:bg-soft-cloud/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${getAvatarBg(user.role)} flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                              {getInitials(user.name)}
                            </div>
                            <span className="font-bold text-ink text-xs uppercase tracking-wide">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-charcoal">{user.email}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleStyle.badge}`}>
                            <span className={`w-1 h-1 rounded-full ${roleStyle.dot}`} />
                            {roleStyle.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-mute uppercase">
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
            <div className="text-center py-16 text-mute">
              <Users size={40} className="mx-auto mb-3 text-hairline" />
              <p className="text-xs font-bold uppercase tracking-wider">{search ? 'User tidak ditemukan' : 'Belum ada user'}</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-canvas border border-hairline p-5 rounded-none">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-soft-cloud border border-hairline rounded-full flex items-center justify-center flex-shrink-0 text-ink">
              <Key size={14} />
            </div>
            <div className="font-jakarta">
              <h4 className="font-bold text-ink uppercase tracking-wider text-xs mb-1">Catatan Keamanan</h4>
              <p className="text-xs text-charcoal font-inter">
                Akun OWNER lain disembunyikan dari tampilan ini untuk keamanan. Hanya ADMIN yang dapat melihat dan mengelola akun OWNER.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
