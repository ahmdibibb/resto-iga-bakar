'use client'

import { useEffect, useState, useRef } from 'react'
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

  // Keep references to fetch functions to prevent stale closures in SSE effect
  const fetchersRef = useRef({ fetchIncomingOrders, fetchHistoryOrders })
  useEffect(() => {
    fetchersRef.current = { fetchIncomingOrders, fetchHistoryOrders }
  })

  // Load/refresh when tab or history filter changes
  useEffect(() => {
    fetchIncomingOrders()
    fetchHistoryOrders()
  }, [historyFilter, activeTab])

  // Establish SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/orders/stream')

    const handleUpdate = () => {
      fetchersRef.current.fetchIncomingOrders()
      fetchersRef.current.fetchHistoryOrders()
    }

    eventSource.addEventListener('orderUpdate', handleUpdate)
    eventSource.addEventListener('orderCreate', handleUpdate)

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
    }

    return () => {
      eventSource.close()
    }
  }, [])

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
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs font-semibold text-success">
          <QrCode size={14} />
          QRIS
        </span>
      )
    }
    if (method === 'CASH') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-soft-cloud border border-hairline px-3 py-1 text-xs font-semibold text-ink">
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
      className="rounded-none bg-canvas p-6 border border-hairline shadow-none transition-colors hover:bg-soft-cloud/20"
    >
      <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
        <div>
          <p className="text-sm font-bold font-jakarta text-ink uppercase tracking-tight">#{order.orderNumber}</p>
          <p className="text-xs text-charcoal font-medium">
            {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </div>
        {getPaymentMethodBadge(order.payment_method)}
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-ink">
          Customer: {order.customerName || order.user?.name || 'Guest'}
        </p>
        
        {order.table && (
          <p className="mb-1 text-sm text-charcoal font-medium">🍽️ {order.table.name}</p>
        )}
        {order.orderType === 'DINE_IN' && order.tableNumber && !order.table && (
          <p className="mb-1 text-sm text-charcoal font-medium">🍽️ Meja #{order.tableNumber}</p>
        )}
        {order.orderType === 'TAKEAWAY' && (
          <p className="mb-1 text-sm text-charcoal font-medium">🥡 Takeaway</p>
        )}
        
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm bg-soft-cloud rounded-none border border-hairline px-3 py-2">
              <span className="font-semibold text-ink">
                {item.quantity}x {item.product.name}
              </span>
            </div>
          ))}
        </div>
        
        {order.notes && (
          <div className="mt-3 rounded-none bg-soft-cloud border border-hairline p-3">
            <p className="text-xs font-bold text-ink uppercase tracking-wider">📝 Catatan:</p>
            <p className="text-xs text-charcoal mt-1">{order.notes}</p>
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
                className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
              >
                <Banknote size={18} />
                Konfirmasi Pembayaran Cash
              </button>
            )}

            {/* CASH: After payment confirmed, show print button */}
            {order.payment_method === 'CASH' && order.payment_status === 'PAID' && (
              <>
                <div className="rounded-none bg-success/10 border border-success/20 px-4 py-2 text-center">
                  <p className="text-sm font-bold text-success">✓ Pembayaran Cash Lunas</p>
                </div>
                <button
                  onClick={() => printReceipt(order)}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
                >
                  <Printer size={18} />
                  Print Struk Kitchen
                </button>
              </>
            )}

            {/* QRIS: Show print button (payment auto-confirmed) */}
            {order.payment_method === 'QRIS' && order.payment_status === 'PAID' && (
              <>
                <div className="rounded-none bg-success/10 border border-success/20 px-4 py-2 text-center">
                  <p className="text-sm font-bold text-success">✓ Pembayaran QRIS Lunas</p>
                  <p className="text-xs text-success font-medium">Auto-confirmed</p>
                </div>
                <button
                  onClick={() => printReceipt(order)}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
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
            className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
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
    <div className="min-h-screen bg-canvas font-inter text-ink">
      <Navbar title="Kasir Dashboard" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-hairline">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all font-jakarta uppercase tracking-wider text-xs ${
              activeTab === 'incoming'
                ? 'border-b-2 border-ink text-ink font-bold'
                : 'text-charcoal hover:text-ink'
            }`}
          >
            <Inbox size={20} />
            Pesanan Masuk
            {incomingOrders.length > 0 && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-canvas ml-1 font-bold">
                {incomingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all font-jakarta uppercase tracking-wider text-xs ${
              activeTab === 'history'
                ? 'border-b-2 border-ink text-ink font-bold'
                : 'text-charcoal hover:text-ink'
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
              <h2 className="text-2xl font-bold font-jakarta uppercase tracking-tight text-ink">Pesanan Masuk</h2>
              <p className="text-sm text-charcoal mt-1">
                Konfirmasi pembayaran cash dan print struk pesanan
              </p>
            </div>

            {incomingOrders.length === 0 ? (
              <div className="rounded-none bg-soft-cloud p-12 text-center border border-hairline shadow-none">
                <Clock size={48} className="mx-auto text-charcoal" />
                <p className="mt-4 text-lg font-bold font-jakarta uppercase tracking-tight text-ink">Tidak ada pesanan masuk</p>
                <p className="text-sm text-charcoal mt-2">Pesanan baru akan muncul di sini</p>
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
                <h2 className="text-2xl font-bold font-jakarta uppercase tracking-tight text-ink">History Pesanan</h2>
                <p className="text-sm text-charcoal mt-1">
                  Pesanan yang sudah dikonfirmasi kasir
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryFilter('today')}
                  className={`px-4 py-2 rounded-full font-semibold transition-all text-sm border ${
                    historyFilter === 'today'
                      ? 'bg-ink text-canvas border-ink'
                      : 'bg-canvas text-ink border-hairline hover:bg-soft-cloud'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setHistoryFilter('week')}
                  className={`px-4 py-2 rounded-full font-semibold transition-all text-sm border ${
                    historyFilter === 'week'
                      ? 'bg-ink text-canvas border-ink'
                      : 'bg-canvas text-ink border-hairline hover:bg-soft-cloud'
                  }`}
                >
                  Minggu Ini
                </button>
              </div>
            </div>

            {historyOrders.length === 0 ? (
              <div className="rounded-none bg-soft-cloud p-12 text-center border border-hairline shadow-none">
                <History size={48} className="mx-auto text-charcoal" />
                <p className="mt-4 text-lg font-bold font-jakarta uppercase tracking-tight text-ink">Tidak ada history pesanan</p>
                <p className="text-sm text-charcoal mt-2">
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
