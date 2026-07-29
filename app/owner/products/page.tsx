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
      <div className="space-y-5 font-inter text-ink">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-none bg-canvas border border-sale">
            <AlertTriangle size={14} className="text-sale flex-shrink-0" />
            <p className="text-sm text-sale font-semibold">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Produk', value: products.length, color: 'text-ink', bg: 'bg-soft-cloud border-hairline' },
            { label: 'Aktif', value: activeCount, color: 'text-success', bg: 'bg-soft-cloud border-hairline' },
            { label: 'Non-aktif', value: products.length - activeCount, color: 'text-mute', bg: 'bg-soft-cloud border-hairline' },
            { label: 'Stok Rendah', value: lowStock.length, color: lowStock.length > 0 ? 'text-sale' : 'text-ink', bg: 'bg-soft-cloud border-hairline' },
          ].map((card) => (
            <div key={card.label} className={`rounded-none p-4 border ${card.bg}`}>
              <p className="text-[10px] text-mute font-bold uppercase tracking-wider font-jakarta">{card.label}</p>
              <p className={`text-2xl font-black mt-1 font-jakarta ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="bg-canvas p-5 border border-sale rounded-none">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-sale rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-canvas" />
              </div>
              <div className="flex-1 font-jakarta">
                <h4 className="font-bold text-sale uppercase tracking-wider text-xs mb-1 inline-flex items-center gap-1"><AlertTriangle size={11} /> Peringatan Stok Tipis</h4>
                <p className="text-xs text-charcoal mb-3">{lowStock.length} produk perlu segera direstok (stok &lt; 10)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-inter">
                  {lowStock.map(product => (
                    <div key={product.id} className="flex items-center justify-between bg-soft-cloud rounded-none px-4 py-2 border border-hairline">
                      <span className="text-xs font-bold text-ink uppercase tracking-wide">{product.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock === 0 ? 'bg-sale text-canvas' : 'bg-soft-cloud border border-hairline text-ink'}`}>
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
        <div className="bg-canvas rounded-none border border-hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-jakarta">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-ink" />
              <h3 className="font-bold text-ink uppercase tracking-wider text-sm">Daftar Produk</h3>
            </div>
            <div className="relative self-start sm:self-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="pl-8 pr-4 py-2 text-xs border border-hairline rounded-full focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas w-52 transition-colors font-semibold"
              />
            </div>
          </div>

          {fetching ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3 border-b border-hairline/50">
                  <div className="w-11 h-11 bg-soft-cloud border border-hairline" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-soft-cloud rounded w-1/3" />
                    <div className="h-3 bg-soft-cloud rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-soft-cloud rounded w-24" />
                  <div className="h-4 bg-soft-cloud rounded w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-cloud border-b border-hairline">
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Produk</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Kategori</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-right">Harga</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-right">Stok</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-soft-cloud/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-11 h-11 rounded-none object-cover border border-hairline bg-soft-cloud" />
                          ) : (
                            <div className="w-11 h-11 rounded-none bg-soft-cloud flex items-center justify-center border border-hairline">
                              <Package size={16} className="text-mute" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-ink text-xs uppercase tracking-wide">{product.name}</p>
                            {product.description && (
                              <p className="text-[10px] text-mute line-clamp-1 max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-soft-cloud border border-hairline text-ink">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-jakarta font-bold text-xs">
                        Rp {Number(product.price).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-bold ${product.stock === 0 ? 'text-sale' : product.stock < 10 ? 'text-sale' : 'text-ink'}`}>
                            {product.stock}
                          </span>
                          {product.stock < 10 && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${product.stock === 0 ? 'bg-sale text-canvas border-sale' : 'bg-canvas text-sale border-sale'}`}>
                              {product.stock === 0 ? 'HABIS' : 'LOW'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          product.isActive ? 'bg-canvas text-success border-success' : 'bg-canvas text-mute border-hairline'
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
            <div className="text-center py-16 text-mute">
              <Package size={40} className="mx-auto mb-3 text-hairline" />
              <p className="text-xs font-bold uppercase tracking-wider">{search ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
