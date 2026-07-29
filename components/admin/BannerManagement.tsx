'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react'

interface Banner {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function BannerManagement() {
  const { data: banners, error, mutate } = useSWR<Banner[]>('/api/admin/banners', fetcher)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    isActive: false
  })
  
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 4MB)
    const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB
    if (file.size > MAX_FILE_SIZE) {
      alert('Ukuran gambar terlalu besar. Maksimal 4MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
      const res = await fetch('/api/products/upload', {
        method: 'POST',
        body: uploadData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar')
      
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
    } catch (err: any) {
      console.error('Image upload error:', err)
      alert(err.message || 'Gagal mengunggah gambar.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners'
      const method = editingBanner ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) throw new Error('Gagal menyimpan banner')
      
      await mutate()
      setIsFormOpen(false)
      setEditingBanner(null)
      setFormData({ title: '', subtitle: '', imageUrl: '', isActive: false })
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      isActive: banner.isActive
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return
    
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      alert('Gagal menghapus')
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive })
      })
      mutate()
    } catch (error) {
      alert('Gagal mengupdate status')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-ink uppercase tracking-tight font-bebas">Campaign Banners</h2>
          <p className="text-sm text-charcoal font-medium">Kelola banner promo di halaman utama (Menu)</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingBanner(null)
              setFormData({ title: '', subtitle: '', imageUrl: '', isActive: false })
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 bg-ink text-canvas px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-charcoal transition-colors"
          >
            <Plus size={16} />
            Tambah Banner
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="mb-8 bg-soft-cloud p-6 border border-hairline rounded-none">
          <h3 className="mb-4 text-sm font-bold text-ink uppercase tracking-wider font-jakarta">
            {editingBanner ? 'Edit Banner' : 'Banner Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Headline / Judul Utama (Contoh: IGA BAKAR MERAPI)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Subtitle (Contoh: Spesial Akhir Pekan)
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                required
                className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
              />
            </div>
            
            <div className="md:col-span-2 border border-hairline bg-canvas p-4 rounded-none">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-ink"
                />
                <span className="text-sm font-bold text-ink">Set as Active Banner</span>
              </label>
              <p className="text-xs text-charcoal mt-1 ml-6">Jika dicentang, banner ini akan langsung tampil di halaman menu dan mematikan banner lain yang aktif.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                Gambar Banner (Landscape 16:9)
              </label>
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink file:text-canvas hover:file:bg-charcoal cursor-pointer"
                />
                {uploading && <span className="text-xs animate-pulse">Mengunggah...</span>}
              </div>
              
              {formData.imageUrl && (
                <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden bg-black/10 border border-hairline">
                  <img src={formData.imageUrl} alt="Banner Preview" className="object-cover w-full h-full" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent">
                    <span className="text-[10px] font-bold tracking-widest text-canvas/80 uppercase font-jakarta mb-1">
                      {formData.subtitle || 'SUBTITLE'}
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-canvas font-bebas leading-[0.9] uppercase mb-3">
                      {formData.title || 'HEADLINE TEXT HERE'}
                    </h2>
                    <div>
                      <span className="inline-flex items-center justify-center rounded-none bg-canvas px-4 py-2 text-[10px] font-bold text-ink uppercase tracking-widest">
                        PESAN SEKARANG
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 flex gap-2 mt-4">
              <button
                type="submit"
                disabled={submitting || uploading || !formData.imageUrl}
                className="rounded-full bg-ink px-6 py-2.5 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Banner'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full border border-hairline px-6 py-2.5 text-ink hover:bg-soft-cloud text-xs font-semibold uppercase tracking-wider"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {banners?.map(banner => (
          <div key={banner.id} className={`border ${banner.isActive ? 'border-green-500 shadow-md ring-1 ring-green-500' : 'border-hairline'} bg-canvas overflow-hidden group`}>
            <div className="relative aspect-[16/9] bg-stone-100">
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              {banner.isActive && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] text-charcoal font-bold uppercase tracking-wider mb-1">{banner.subtitle}</p>
              <h4 className="font-bebas text-xl text-ink leading-tight mb-4">{banner.title}</h4>
              
              <div className="flex items-center justify-between pt-3 border-t border-hairline/50">
                <button
                  onClick={() => toggleActive(banner)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded ${
                    banner.isActive 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {banner.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-1.5 text-charcoal hover:text-ink hover:bg-soft-cloud rounded"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-1.5 text-sale hover:bg-sale/10 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners?.length === 0 && !isFormOpen && (
          <div className="col-span-full py-12 text-center border border-dashed border-hairline bg-soft-cloud/50">
            <ImageIcon size={48} className="mx-auto text-stone-brand/30 mb-3" />
            <p className="text-sm font-medium text-charcoal">Belum ada banner promo yang dibuat.</p>
          </div>
        )}
      </div>
    </div>
  )
}
