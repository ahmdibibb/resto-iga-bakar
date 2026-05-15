'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Banknote, QrCode, History, Inbox, Printer } from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Loading from '@/components/Loading'
import ErrorAlert from '@/components/ErrorAlert'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  payment_status: string
  payment_method: string | null
  orderType: string
  tableNumber: string | null
  customerName: string | null
  notes: string | null
  createdAt: string
  items: OrderItem[]
  table: {
    name: string
  } | null
  user: {
    name: string
  } | null
}

interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

type TabType = 'incoming' | 'history'
type HistoryFilter = 'today' | 'week'

export default function KasirPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('incoming')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('today')
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)

  useEffect(() => {
    fetchIncomingOrders()
    fetchHistoryOrders()
    const interval = setInterval(() => {
      fetchIncomingOrders()
      if (activeTab === 'history') {
        fetchHistoryOrders()
      }
    }, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [historyFilter, activeTab])

  const fetchIncomingOrders = async () => {
    try {
      const res = await fetch('/api/kasir/orders')
      
      if (!res.ok) {
        setIncomingOrders([])
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
        }
        return
      }
      
      const data = await res.json()
      if (Array.isArray(data)) {
        setIncomingOrders(data)
        setError(null)
      }
    } catch (error) {
      console.error('Error fetching incoming orders:', error)
      setIncomingOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHistoryOrders = async () => {
    try {
      const res = await fetch(`/api/kasir/orders/history?filter=${historyFilter}`)
      
      if (!res.ok) {
        setHistoryOrders([])
        return
      }
      
      const data = await res.json()
      if (Array.isArray(data)) {
        setHistoryOrders(data)
      }
    } catch (error) {
      console.error('Error fetching history orders:', error)
      setHistoryOrders([])
    }
  }

  const confirmCashPayment = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'PATCH',
      })

      if (res.ok) {
        fetchIncomingOrders()
        setError(null)
      } else {
        const data = await res.json()
        setError({
          message: data.error || 'Failed to confirm payment',
          type: res.status >= 500 ? 'server' : 'validation'
        })
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      setError({
        message: 'Koneksi gagal. Silakan coba lagi.',
        type: 'network'
      })
    }
  }

  const printReceipt = async (order: Order) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print receipt')
      return
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pesanan - ${order.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
          }
          .order-info {
            margin: 10px 0;
            font-size: 12px;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 12px;
          }
          .notes {
            margin: 10px 0;
            padding: 5px;
            background: #f0f0f0;
            font-size: 11px;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 11px;
          }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">RESTO IGA BAKAR</div>
          <div>Struk Pesanan Kitchen</div>
        </div>
        
        <div class="order-info">
          <div><strong>No. Pesanan:</strong> ${order.orderNumber}</div>
          <div><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</div>
          <div><strong>Customer:</strong> ${order.customerName || order.user?.name || 'Guest'}</div>
          ${order.table ? `<div><strong>Meja:</strong> ${order.table.name}</div>` : ''}
          ${order.orderType === 'TAKEAWAY' ? '<div><strong>Tipe:</strong> Takeaway</div>' : ''}
          <div><strong>Pembayaran:</strong> ${order.payment_method || 'N/A'}</div>
        </div>
        
        <div class="items">
          <div style="font-weight: bold; margin-bottom: 5px;">PESANAN:</div>
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product.name}</span>
            </div>
          `).join('')}
        </div>
        
        ${order.notes ? `
          <div class="notes">
            <strong>Catatan:</strong><br/>
            ${order.notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Terima kasih!</div>
          <div style="margin-top: 10px;">---</div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(receiptHTML)
    printWindow.document.close()

    // Mark order as printed after print dialog
    try {
      const res = await fetch(`/api/orders/${order.id}/print`, {
        method: 'PATCH',
      })

      if (res.ok) {
        // Refresh orders to move to history
        fetchIncomingOrders()
        fetchHistoryOrders()
      }
    } catch (error) {
      console.error('Error marking order as printed:', error)
    }
  }

  const getPaymentMethodBadge = (method: string | null) => {
    if (method === 'QRIS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          <QrCode size={14} />
          QRIS
        </span>
      )
    }
    if (method === 'CASH') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
          <Banknote size={14} />
          CASH
        </span>
      )
    }
    return null
  }

  const renderOrderCard = (order: Order, showPrintOnly: boolean = false) => (
    <div
      key={order.id}
      className="rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg border border-gray-100"
    >
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </div>
        {getPaymentMethodBadge(order.payment_method)}
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">
          Customer: {order.customerName || order.user?.name || 'Guest'}
        </p>
        
        {order.table && (
          <p className="mb-1 text-sm text-gray-600">🍽️ {order.table.name}</p>
        )}
        {order.orderType === 'DINE_IN' && order.tableNumber && !order.table && (
          <p className="mb-1 text-sm text-gray-600">🍽️ Meja #{order.tableNumber}</p>
        )}
        {order.orderType === 'TAKEAWAY' && (
          <p className="mb-1 text-sm text-gray-600">🥡 Takeaway</p>
        )}
        
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-medium text-gray-900">
                {item.quantity}x {item.product.name}
              </span>
            </div>
          ))}
        </div>
        
        {order.notes && (
          <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs font-semibold text-yellow-800">📝 Catatan:</p>
            <p className="text-xs text-yellow-900 mt-1">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {!showPrintOnly && (
          <>
            {/* CASH: Show payment confirmation button */}
            {order.payment_method === 'CASH' && order.payment_status === 'UNPAID' && (
              <button
                onClick={() => confirmCashPayment(order.id)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
              >
                <Banknote size={18} />
                Konfirmasi Pembayaran Cash
              </button>
            )}

            {/* CASH: After payment confirmed, show print button */}
            {order.payment_method === 'CASH' && order.payment_status === 'PAID' && (
              <>
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-center">
                  <p className="text-sm font-bold text-green-800">✓ Pembayaran Cash Lunas</p>
                </div>
                <button
                  onClick={() => printReceipt(order)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                >
                  <Printer size={18} />
                  Print Struk Kitchen
                </button>
              </>
            )}

            {/* QRIS: Show print button (payment auto-confirmed) */}
            {order.payment_method === 'QRIS' && order.payment_status === 'PAID' && (
              <>
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-center">
                  <p className="text-sm font-bold text-green-800">✓ Pembayaran QRIS Lunas</p>
                  <p className="text-xs text-green-600">Auto-confirmed</p>
                </div>
                <button
                  onClick={() => printReceipt(order)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                >
                  <Printer size={18} />
                  Print Struk Kitchen
                </button>
              </>
            )}
          </>
        )}

        {/* History view: Only show print button */}
        {showPrintOnly && (
          <button
            onClick={() => printReceipt(order)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
          >
            <Printer size={18} />
            Print Ulang Struk
          </button>
        )}
      </div>
    </div>
  )

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Kasir Dashboard" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === 'incoming'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Inbox size={20} />
            Pesanan Masuk
            {incomingOrders.length > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                {incomingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === 'history'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History size={20} />
            History Pesanan
          </button>
        </div>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {/* Incoming Orders Tab */}
        {activeTab === 'incoming' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pesanan Masuk</h2>
              <p className="text-sm text-gray-600 mt-1">
                Konfirmasi pembayaran cash dan print struk pesanan
              </p>
            </div>

            {incomingOrders.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-md">
                <Clock size={48} className="mx-auto text-gray-400" />
                <p className="mt-4 text-lg font-semibold text-gray-600">Tidak ada pesanan masuk</p>
                <p className="text-sm text-gray-500 mt-2">Pesanan baru akan muncul di sini</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {incomingOrders.map((order) => renderOrderCard(order, false))}
              </div>
            )}
          </>
        )}

        {/* History Orders Tab */}
        {activeTab === 'history' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">History Pesanan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pesanan yang sudah dikonfirmasi kasir
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryFilter('today')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    historyFilter === 'today'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setHistoryFilter('week')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    historyFilter === 'week'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Minggu Ini
                </button>
              </div>
            </div>

            {historyOrders.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-md">
                <History size={48} className="mx-auto text-gray-400" />
                <p className="mt-4 text-lg font-semibold text-gray-600">Tidak ada history pesanan</p>
                <p className="text-sm text-gray-500 mt-2">
                  {historyFilter === 'today' ? 'Belum ada pesanan hari ini' : 'Belum ada pesanan minggu ini'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {historyOrders.map((order) => renderOrderCard(order, true))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
