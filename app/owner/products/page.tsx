'use client'

import { useEffect, useState } from 'react'
import { Package, AlertTriangle, Search } from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'

export default function OwnerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/products?includeStock=true', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
        setError(null)
      } else {
        setError('Gagal memuat produk')
      }
    } catch {
      setError('Gagal memuat produk')
    } finally {
      setFetching(false)
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = products.filter(p => p.stock < 10)
  const activeCount = products.filter(p => p.isActive).length

  return (
    <OwnerShell
      title="Products"
      subtitle="Monitor inventori dan status produk"
      onRefresh={fetchProducts}
    >
      <div className="space-y-5">

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Produk', value: products.length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'Aktif', value: activeCount, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Non-aktif', value: products.length - activeCount, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
            { label: 'Stok Rendah', value: lowStock.length, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl p-4 border ${card.bg} shadow-sm`}>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-1">⚠️ Low Stock Alert</h4>
                <p className="text-sm text-amber-700 mb-3">{lowStock.length} produk perlu segera direstok (stok &lt; 10)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lowStock.map(product => (
                    <div key={product.id} className="flex items-center justify-between bg-white/70 rounded-xl px-4 py-2.5 border border-amber-100">
                      <span className="text-sm font-medium text-amber-900">{product.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${product.stock === 0 ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                        {product.stock} unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Package size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Daftar Produk</h3>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white w-52 transition-colors"
              />
            </div>
          </div>

          {fetching ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                    <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-11 h-11 rounded-xl object-cover shadow-sm border border-gray-100" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-100">
                              <Package size={18} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                            {product.stock}
                          </span>
                          {product.stock < 10 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {product.stock === 0 ? 'HABIS' : 'LOW'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {product.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">{search ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
