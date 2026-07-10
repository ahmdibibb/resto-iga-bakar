'use client'

import { useEffect, useState } from 'react'
import { Settings, Save, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'

export default function AdminSettingsPage() {
  const [restaurantName, setRestaurantName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setRestaurantName(data.restaurant_name)
        setLogoUrl(data.logo_url)
        setBackgroundUrl(data.background_url)
      } else {
        showMsg('error', 'Gagal memuat pengaturan')
      }
    } catch {
      showMsg('error', 'Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0]
    if (!file) return

    const setUploadStatus = type === 'logo' ? setUploadingLogo : setUploadingBg
    setUploadStatus(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (type === 'logo') {
          setLogoUrl(data.url)
        } else {
          setBackgroundUrl(data.url)
        }
        showMsg('success', `${type === 'logo' ? 'Logo' : 'Background'} berhasil diunggah ke Cloudinary!`)
      } else {
        showMsg('error', data.error || 'Gagal mengunggah berkas')
      }
    } catch {
      showMsg('error', 'Gagal mengunggah berkas')
    } finally {
      setUploadStatus(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_name: restaurantName,
          logo_url: logoUrl,
          background_url: backgroundUrl,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showMsg('success', 'Pengaturan berhasil disimpan!')
      } else {
        showMsg('error', data.error || 'Gagal menyimpan pengaturan')
      }
    } catch {
      showMsg('error', 'Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell activeTab="settings" title="Settings">
      <div className="mx-auto max-w-3xl space-y-6 font-inter text-ink py-6">
        {message && (
          <div className={`flex items-start gap-3 p-4 border rounded-none ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-ink" size={32} />
            <p className="text-sm font-medium text-charcoal">Memuat pengaturan...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-canvas border border-hairline p-8 space-y-6">
            <div className="border-b border-hairline pb-4 flex items-center gap-2">
              <Settings size={20} className="text-ink" />
              <h2 className="text-lg font-bold font-jakarta uppercase tracking-tight">Identitas Restoran</h2>
            </div>

            {/* Nama Restoran */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink font-jakarta">Nama Restoran</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                className="w-full rounded-none border border-hairline bg-canvas px-4 py-3 text-base text-ink focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
                placeholder="Masukkan nama restoran..."
              />
            </div>

            {/* Logo Upload */}
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-hairline/50">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink font-jakarta">Logo Restoran</label>
                <p className="text-xs text-charcoal font-medium">Unggah logo format PNG/JPG transparan.</p>
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6">
                {logoUrl ? (
                  <div className="relative h-20 w-20 flex-shrink-0 bg-stone-100 border border-hairline p-2 flex items-center justify-center overflow-hidden">
                    <img src={logoUrl} alt="Logo Resto" className="object-contain max-h-full max-w-full" />
                  </div>
                ) : (
                  <div className="relative h-20 w-20 flex-shrink-0 bg-stone-100 border border-dashed border-hairline flex items-center justify-center text-xs text-stone-brand font-medium">
                    No Logo
                  </div>
                )}
                <div className="flex-1 w-full">
                  <label className="relative flex items-center justify-center gap-2 border border-hairline bg-canvas hover:bg-soft-cloud active:scale-98 transition-all px-4 py-3 cursor-pointer text-sm font-bold uppercase tracking-wider">
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="animate-spin text-ink" size={16} />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Pilih & Unggah Logo
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <p className="text-[10px] text-charcoal font-medium truncate mt-2 max-w-xs">{logoUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Background Upload */}
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-hairline/50">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink font-jakarta">Hero Background</label>
                <p className="text-xs text-charcoal font-medium">Gambar latar belakang halaman utama (Landing Page).</p>
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6">
                {backgroundUrl ? (
                  <div className="relative h-20 w-36 flex-shrink-0 bg-stone-100 border border-hairline flex items-center justify-center overflow-hidden">
                    <img src={backgroundUrl} alt="Hero Background" className="object-cover h-full w-full" />
                  </div>
                ) : (
                  <div className="relative h-20 w-36 flex-shrink-0 bg-stone-100 border border-dashed border-hairline flex items-center justify-center text-xs text-stone-brand font-medium">
                    No Image
                  </div>
                )}
                <div className="flex-1 w-full">
                  <label className="relative flex items-center justify-center gap-2 border border-hairline bg-canvas hover:bg-soft-cloud active:scale-98 transition-all px-4 py-3 cursor-pointer text-sm font-bold uppercase tracking-wider">
                    {uploadingBg ? (
                      <>
                        <Loader2 className="animate-spin text-ink" size={16} />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Pilih & Unggah Background
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'bg')}
                      disabled={uploadingBg}
                      className="hidden"
                    />
                  </label>
                  {backgroundUrl && (
                    <p className="text-[10px] text-charcoal font-medium truncate mt-2 max-w-xs">{backgroundUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Simpan Button */}
            <div className="pt-6 border-t border-hairline flex justify-end">
              <button
                type="submit"
                disabled={saving || uploadingLogo || uploadingBg}
                className="flex items-center justify-center gap-2 bg-ink text-canvas hover:bg-ink/90 active:scale-98 transition-all px-6 py-4 text-sm font-bold uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin text-canvas" size={16} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  )
}
