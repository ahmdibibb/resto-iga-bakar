/**
 * ProductForm — Form tambah/edit produk untuk Admin
 * 
 * Komponen form yang digunakan untuk membuat produk baru
 * atau mengedit produk yang sudah ada. Mendukung field:
 * - Name, Price, Stock, Category (Makanan/Minuman)
 * - Description, Image URL
 * 
 * Props:
 * - editingProduct: jika diisi, form dalam mode edit
 * - onSubmit: callback saat form di-submit
 * - onCancel: callback saat tombol Cancel ditekan
 */

'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  isActive: boolean
  category: string | null
  image: string | null
}

interface ProductFormData {
  name: string
  description: string
  price: string
  stock: string
  image: string
  category: string
}

interface ProductFormProps {
  editingProduct: Product | null
  onSubmit: (formData: ProductFormData) => Promise<void>
  onCancel: () => void
}

export default function ProductForm({ editingProduct, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    category: '',
  })
  const [uploading, setUploading] = useState(false)

  // Populate form when editing an existing product
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: editingProduct.price.toString(),
        stock: editingProduct.stock.toString(),
        image: editingProduct.image || '',
        category: editingProduct.category || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        category: '',
      })
    }
  }, [editingProduct])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
      const res = await fetch('/api/products/upload', {
        method: 'POST',
        body: uploadData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah gambar')
      }

      setFormData(prev => ({ ...prev, image: data.url }))
    } catch (err: any) {
      console.error('Image upload error:', err)
      alert(err.message || 'Gagal mengunggah gambar. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <div className="mb-6 bg-soft-cloud p-6 border border-hairline rounded-none">
      <h3 className="mb-4 text-sm font-bold text-ink uppercase tracking-wider font-jakarta">
        {editingProduct ? 'Edit Product' : 'Add New Product'}
      </h3>
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 md:grid-cols-2"
      >
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            required
            className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Stock
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: e.target.value })
            }
            required
            className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
          >
            <option value="">Pilih Kategori</option>
            <option value="MAKANAN">Makanan</option>
            <option value="MINUMAN">Minuman</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-canvas text-ink border border-hairline rounded-2xl px-4 py-2 focus:border-ink focus:outline-none text-sm"
            rows={3}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
            Gambar Produk
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-xs text-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink file:text-canvas hover:file:bg-charcoal cursor-pointer"
            />
            {uploading && (
              <span className="text-xs text-charcoal animate-pulse">Mengunggah...</span>
            )}
          </div>
          {formData.image && (
            <div className="mt-3 relative w-20 h-20 border border-hairline overflow-hidden bg-white">
              <img
                src={formData.image}
                alt="Preview produk"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-2.5 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider"
          >
            {editingProduct ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-hairline px-6 py-2.5 text-ink hover:bg-soft-cloud text-xs font-semibold uppercase tracking-wider"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
