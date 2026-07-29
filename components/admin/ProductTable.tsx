/**
 * ProductTable — Tabel daftar produk untuk Admin
 * 
 * Menampilkan seluruh produk dalam format tabel dengan kolom:
 * - Name, Category, Price, Stock, Status (Active/Inactive)
 * - Actions: Edit & Delete
 * 
 * Komponen ini hanya menampilkan data (presentational).
 * Semua aksi (edit, delete) diteruskan ke parent via callback.
 */

'use client'

import { Edit, Trash2 } from 'lucide-react'

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

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-none bg-canvas border border-hairline">
      <table className="w-full">
        <thead className="bg-soft-cloud border-b border-hairline">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-soft-cloud/40 transition-colors">
              <td className="whitespace-nowrap px-6 py-4 font-semibold text-xs text-ink">
                {product.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {product.category ? (
                  <span className="border border-hairline bg-soft-cloud text-ink rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {product.category}
                  </span>
                ) : (
                  <span className="text-mute text-xs">-</span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                Rp {(product.price || 0).toLocaleString('id-ID')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">{product.stock}</td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${product.isActive
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="text-ink hover:text-charcoal p-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="text-sale hover:text-sale-deep p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
