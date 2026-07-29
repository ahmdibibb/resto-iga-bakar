'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email.trim()) {
      setError('Email dan Password tidak boleh kosong')
      return
    }

    if (!password) {
      setError('Email dan Password tidak boleh kosong')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login gagal')
        return
      }

      // Redirect based on role - use full page navigation for cookie reliability
      const role = data.user.role
      if (role === 'ADMIN') {
        window.location.href = '/admin'
      } else if (role === 'KASIR') {
        window.location.href = '/kasir'
      } else if (role === 'OWNER') {
        window.location.href = '/owner'
      } else {
        window.location.href = '/menu'
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4 font-inter text-ink">
      <div className="relative w-full max-w-md rounded-none bg-soft-cloud border border-hairline p-8 shadow-none">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold font-jakarta text-ink uppercase tracking-tight">Resto Iga Bakar</h1>
          <p className="mt-2 text-sm text-charcoal font-medium">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-none bg-sale/10 border border-sale/20 p-3 text-sm text-sale font-semibold">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-1 font-jakarta">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="block w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-1 font-jakarta">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="block w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-2.5 pr-10 focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full rounded-full bg-ink px-4 py-3 font-semibold text-canvas hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>


      </div>
    </div>
  )
}
