'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Shield, User as UserIcon, ChefHat } from 'lucide-react'

interface User {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'KASIR',
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', {
                credentials: 'include',
            })
            const data = await res.json()
            // Ensure data is an array
            setUsers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching users:', error)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : '/api/admin/users'
            const method = editingUser ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to save user')
                return
            }

            setShowForm(false)
            setEditingUser(null)
            setFormData({ email: '', name: '', password: '', role: 'KASIR' })
            fetchUsers()
        } catch (error) {
            console.error('Error saving user:', error)
            setError('Network error. Please try again.')
        }
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            email: user.email,
            name: user.name,
            password: '',
            role: user.role,
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || 'Failed to delete user')
                return
            }

            fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Network error. Please try again.')
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <Shield size={12} className="text-purple-800" />
            case 'KASIR':
                return <ChefHat size={12} className="text-blue-800" />
            default:
                return <UserIcon size={12} className="text-ink" />
        }
    }

    const getRoleBadge = (role: string) => {
        const colors = {
            ADMIN: 'border border-purple-200 bg-purple-50 text-purple-800',
            KASIR: 'border border-blue-200 bg-blue-50 text-blue-800',
        }
        return colors[role as keyof typeof colors] || 'border border-hairline bg-soft-cloud text-ink'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border border-ink border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="text-ink" size={20} />
                    <h2 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">User Management</h2>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null)
                        setFormData({ email: '', name: '', password: '', role: 'KASIR' })
                        setShowForm(true)
                    }}
                    className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer"
                >
                    <Plus size={16} />
                    Add User
                </button>
            </div>

            {error && (
                <div className="rounded-none bg-soft-cloud border border-hairline p-4">
                    <p className="text-sm text-sale font-semibold">{error}</p>
                </div>
            )}

            {/* Info about OWNER accounts */}
            <div className="rounded-none bg-soft-cloud border border-hairline p-4">
                <p className="text-xs text-ink">
                    <strong>Note:</strong> OWNER accounts are hidden from this view and cannot be created or modified by ADMIN users. Only OWNER users can manage OWNER accounts.
                </p>
            </div>

            {showForm && (
                <div className="bg-soft-cloud p-6 border border-hairline rounded-none">
                    <h3 className="mb-4 text-sm font-bold text-ink uppercase tracking-wider font-jakarta">
                        {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                                Password {editingUser && '(leave blank to keep current)'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                                className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                                Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm cursor-pointer"
                                title="ADMIN users cannot create OWNER accounts"
                            >
                                <option value="KASIR">Kasir</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <button
                                type="submit"
                                className="rounded-full bg-ink px-6 py-2.5 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider cursor-pointer"
                            >
                                {editingUser ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingUser(null)
                                    setError('')
                                }}
                                className="rounded-full border border-hairline px-6 py-2.5 text-ink hover:bg-soft-cloud text-xs font-semibold uppercase tracking-wider cursor-pointer"
                              >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto rounded-none bg-canvas border border-hairline">
                <table className="w-full">
                    <thead className="bg-soft-cloud border-b border-hairline">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                        {users.filter(u => u.role === 'ADMIN' || u.role === 'KASIR').length > 0 ? (
                            users.filter(u => u.role === 'ADMIN' || u.role === 'KASIR').map((user) => (
                                <tr key={user.id} className="hover:bg-soft-cloud/40 transition-colors">
                                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-xs text-ink">
                                        {user.name}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                                        {user.email}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getRoleBadge(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-ink hover:text-charcoal p-1"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-sale hover:text-sale-deep p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-mute text-xs font-semibold uppercase tracking-wider">
                                    No users found. Click "Add User" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
