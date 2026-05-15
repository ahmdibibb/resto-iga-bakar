'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Eye, Filter, X, Search, Calendar, CreditCard } from 'lucide-react'
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
      COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      PENDING_PAYMENT: 'bg-red-100 text-red-700 border-red-200',
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
      CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
      PREPARING: 'bg-blue-100 text-blue-700 border-blue-200',
      IN_KITCHEN: 'bg-blue-100 text-blue-700 border-blue-200',
      READY: 'bg-purple-100 text-purple-700 border-purple-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    }
    return map[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <OwnerShell
      title="Orders"
      subtitle="Monitor semua pesanan dan statusnya"
      onRefresh={fetchOrders}
    >
      <div className="space-y-5">

        {/* Info Banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
          <Eye size={16} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>View Only:</strong> Anda dapat melihat semua informasi order namun tidak dapat mengubah status. Hubungi Admin atau Kasir untuk perubahan.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-900">Filters</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <X size={14} /> Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Metode Bayar</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Daftar Order</h3>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{orders.length}</span>
            </div>
            {fetching && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Memuat...
              </div>
            )}
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                    <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pembayaran</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3.5 px-5 font-mono text-sm font-semibold text-gray-900">
                        {order.orderNumber || `#${order.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-medium text-gray-900">
                          {order.customerName || order.user?.name || 'Guest'}
                        </p>
                        {order.user?.email && (
                          <p className="text-xs text-gray-400">{order.user.email}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-700">
                        {order.payment_method ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            order.payment_method === 'QRIS' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                          }`}>
                            <CreditCard size={11} />
                            {order.payment_method}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">–</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-sm font-bold text-gray-900 text-right">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
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
            <div className="text-center py-16">
              <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">Tidak ada order ditemukan</p>
              <p className="text-sm text-gray-400 mt-1">Coba ubah filter atau tanggal</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detail Order</h3>
                <p className="text-sm text-gray-500 mt-0.5 font-mono">
                  {selectedOrder.orderNumber || `#${selectedOrder.id.slice(0, 8)}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Informasi Customer</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 w-20 font-medium">Nama</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedOrder.customerName || selectedOrder.user?.name || 'Guest'}
                    </span>
                  </div>
                  {selectedOrder.user?.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 w-20 font-medium">Email</span>
                      <span className="text-sm text-gray-700">{selectedOrder.user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 w-20 font-medium">Tipe</span>
                    <span className="text-sm text-gray-700">{selectedOrder.orderType?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  {(selectedOrder.tableNumber || selectedOrder.table?.name) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 w-20 font-medium">Meja</span>
                      <span className="text-sm text-gray-700">{selectedOrder.table?.name || `#${selectedOrder.tableNumber}`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-2">Status Order</p>
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-2">Metode Bayar</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedOrder.payment_method === 'QRIS' ? 'bg-purple-100 text-purple-700' :
                    selectedOrder.payment_method === 'CASH' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedOrder.payment_method || 'Belum dibayar'}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{item.product?.name || 'Produk'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantity} × Rp {Number(item.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">
                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-base font-bold text-gray-900">Total Pembayaran</span>
                <span className="text-2xl font-black text-blue-700">
                  Rp {Number(selectedOrder.totalAmount).toLocaleString('id-ID')}
                </span>
              </div>

              {/* View Only Notice */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                <Eye size={15} className="text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800 font-medium">
                  View Only — Tidak dapat mengubah order ini. Hubungi Admin atau Kasir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </OwnerShell>
  )
}
