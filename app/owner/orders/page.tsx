'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Eye, Filter, X, Search, Calendar, CreditCard, AlertTriangle } from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, paymentFilter, dateFilter])

  const fetchOrders = async () => {
    setFetching(true)
    try {
      let url = '/api/orders?'
      if (statusFilter) url += `status=${statusFilter}&`
      if (paymentFilter) url += `paymentMethod=${paymentFilter}&`
      if (dateFilter) url += `date=${dateFilter}&`

      const res = await fetch(url, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || data || [])
        setError(null)
      } else {
        setError('Gagal memuat data orders')
      }
    } catch {
      setError('Gagal memuat data orders')
    } finally {
      setFetching(false)
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setPaymentFilter('')
    setDateFilter('')
  }

  const hasFilters = statusFilter || paymentFilter || dateFilter

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-canvas text-success border-success',
      PENDING_PAYMENT: 'bg-canvas text-sale border-sale',
      PENDING: 'bg-canvas text-mute border-hairline',
      CONFIRMED: 'bg-canvas text-ink border-ink',
      PREPARING: 'bg-canvas text-ink border-ink',
      IN_KITCHEN: 'bg-canvas text-ink border-ink',
      READY: 'bg-canvas text-ink border-ink',
      CANCELLED: 'bg-canvas text-sale border-sale',
    }
    return map[status] || 'bg-canvas text-charcoal border-hairline'
  }

  return (
    <OwnerShell
      title="Orders"
      subtitle="Monitor semua pesanan dan statusnya"
      onRefresh={fetchOrders}
    >
      <div className="space-y-5 font-inter text-ink">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-none bg-canvas border border-sale">
            <AlertTriangle size={14} className="text-sale flex-shrink-0" />
            <p className="text-sm text-sale font-semibold">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-canvas rounded-none border border-hairline p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-jakarta">
              <Filter size={16} className="text-ink" />
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs">Filters</h3>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-ink border border-hairline bg-soft-cloud hover:bg-hairline-soft font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X size={12} /> Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-jakarta">
            <div>
              <label className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-hairline rounded-full focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5">Metode Bayar</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-hairline rounded-full focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-1.5">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-hairline rounded-full focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-canvas rounded-none border border-hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between font-jakarta">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-ink" />
              <h3 className="font-bold text-ink uppercase tracking-wider text-sm">Daftar Order</h3>
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-soft-cloud border border-hairline text-ink text-[10px] font-bold">{orders.length}</span>
            </div>
            {fetching && (
              <div className="flex items-center gap-2 text-xs font-bold text-mute uppercase">
                <div className="w-3.5 h-3.5 border-[2px] border-ink border-t-transparent rounded-full animate-spin" />
                Memuat...
              </div>
            )}
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-cloud border-b border-hairline">
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Order #</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Customer</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Items</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-center">Status</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta">Pembayaran</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-right">Total</th>
                    <th className="py-3 px-5 text-xs font-bold text-mute uppercase tracking-wider font-jakarta text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-soft-cloud/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-ink">
                        {order.orderNumber || `#${order.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-xs font-bold text-ink uppercase tracking-wide">
                          {order.customerName || order.user?.name || 'Guest'}
                        </p>
                        {order.user?.email && (
                          <p className="text-[10px] text-mute font-medium">{order.user.email}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-charcoal">
                        {order.items?.length || 0} items
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {order.payment_method ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-hairline rounded-full bg-soft-cloud text-[10px] font-bold uppercase tracking-wider text-ink">
                            <CreditCard size={10} />
                            {order.payment_method}
                          </span>
                        ) : (
                          <span className="text-mute text-[10px] font-bold uppercase">–</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs font-extrabold text-ink text-right font-jakarta">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink bg-soft-cloud border border-hairline hover:bg-hairline-soft rounded-full transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-mute">
              <ShoppingCart size={40} className="mx-auto mb-3 text-hairline" />
              <p className="text-xs font-bold uppercase tracking-wider">Tidak ada order ditemukan</p>
              <p className="text-[10px] mt-1">Coba ubah filter atau tanggal</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="bg-canvas border border-hairline rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-ink border-b border-hairline/25 px-6 py-4 flex items-center justify-between">
              <div className="font-jakarta">
                <h3 className="text-sm font-bold text-canvas uppercase tracking-wider">Detail Order</h3>
                <p className="text-[10px] text-stone-brand mt-0.5 font-mono">
                  {selectedOrder.orderNumber || `#${selectedOrder.id.slice(0, 8)}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-stone-brand hover:text-canvas hover:bg-soft-cloud/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="bg-soft-cloud rounded-none p-4 border border-hairline">
                <h4 className="text-[10px] font-bold text-mute uppercase tracking-widest mb-3 font-jakarta">Informasi Customer</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-mute w-20 font-bold uppercase">Nama</span>
                    <span className="text-xs font-bold text-ink uppercase tracking-wide">
                      {selectedOrder.customerName || selectedOrder.user?.name || 'Guest'}
                    </span>
                  </div>
                  {selectedOrder.user?.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-mute w-20 font-bold uppercase">Email</span>
                      <span className="text-xs font-bold text-ink uppercase tracking-wide">{selectedOrder.user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-mute w-20 font-bold uppercase">Tipe</span>
                    <span className="text-xs font-bold text-ink uppercase tracking-wide">{selectedOrder.orderType?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  {(selectedOrder.tableNumber || selectedOrder.table?.name) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-mute w-20 font-bold uppercase">Meja</span>
                      <span className="text-xs font-bold text-ink uppercase tracking-wide">{selectedOrder.table?.name || `#${selectedOrder.tableNumber}`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-soft-cloud rounded-none p-4 border border-hairline">
                  <p className="text-[10px] text-mute font-bold uppercase tracking-wider mb-2 font-jakarta">Status Order</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="bg-soft-cloud rounded-none p-4 border border-hairline">
                  <p className="text-[10px] text-mute font-bold uppercase tracking-wider mb-2 font-jakarta">Metode Bayar</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    selectedOrder.payment_method === 'QRIS' ? 'bg-canvas text-ink border-ink' :
                    selectedOrder.payment_method === 'CASH' ? 'bg-canvas text-ink border-ink' :
                    'bg-canvas text-mute border-hairline'
                  }`}>
                    {selectedOrder.payment_method || 'Belum dibayar'}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-[10px] font-bold text-mute uppercase tracking-widest mb-3 font-jakarta">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-soft-cloud rounded-none border border-hairline">
                      <div className="flex-1">
                        <p className="font-bold text-ink text-xs uppercase tracking-wide">{item.product?.name || 'Produk'}</p>
                        <p className="text-[10px] text-mute mt-0.5">
                          {item.quantity} × Rp {Number(item.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-ink text-xs font-jakarta">
                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t border-hairline">
                <span className="text-xs font-bold text-ink uppercase tracking-wider font-jakarta">Total Pembayaran</span>
                <span className="text-lg font-black text-ink font-jakarta">
                  Rp {Number(selectedOrder.totalAmount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  )
}
