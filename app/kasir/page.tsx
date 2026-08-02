'use client'

/**
 * KasirPage — Halaman utama dashboard Kasir
 * 
 * Halaman ini mengelola:
 * - Tab "Pesanan Masuk": order yang perlu dikonfirmasi/dicetak
 * - Tab "History Pesanan": riwayat order yang sudah selesai
 * - Real-time updates via SSE (Server-Sent Events)
 * 
 * Komponen UI dan utility telah diekstrak ke:
 * - @/components/kasir/OrderCard      → Kartu pesanan
 * - @/components/kasir/ReceiptPrinter  → Cetak struk
 * - @/components/kasir/types           → Tipe data shared
 * - @/components/kasir/KasirSidebar    → Sidebar navigation
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, History } from 'lucide-react'
import Loading from '@/components/Loading'
import ErrorAlert from '@/components/ErrorAlert'
import OrderCard from '@/components/kasir/OrderCard'
import KasirSidebar from '@/components/kasir/KasirSidebar'
import PrinterSettings from '@/components/kasir/PrinterSettings'
import { printReceipt } from '@/components/kasir/ReceiptPrinter'
import type { Order, ErrorState, TabType, HistoryFilter } from '@/components/kasir/types'

export default function KasirPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('incoming')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('today')
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)
  const [showPrinterSettings, setShowPrinterSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  // Establish SSE connection and fallback polling for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/orders/stream')

    const handleUpdate = () => {
      fetchersRef.current.fetchIncomingOrders()
      fetchersRef.current.fetchHistoryOrders()
    }

    eventSource.addEventListener('orderUpdate', handleUpdate)
    eventSource.addEventListener('orderCreate', handleUpdate)

    eventSource.onerror = (err) => {
      console.warn('SSE connection error:', err)
    }

    // Fallback/Main Polling: Fetch orders every 4 seconds to guarantee real-time updates
    // across process isolation, serverless environments, or SSE disconnects.
    const pollInterval = setInterval(() => {
      fetchersRef.current.fetchIncomingOrders()
      fetchersRef.current.fetchHistoryOrders()
    }, 4000)

    return () => {
      eventSource.close()
      clearInterval(pollInterval)
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

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        fetchIncomingOrders()
        fetchHistoryOrders()
        setError(null)
      } else {
        const data = await res.json()
        setError({
          message: data.error || 'Gagal memperbarui status pesanan',
          type: res.status >= 500 ? 'server' : 'validation'
        })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      setError({
        message: 'Koneksi gagal. Silakan coba lagi.',
        type: 'network'
      })
    }
  }

  const handlePrintReceipt = (order: Order) => {
    printReceipt(order, () => {
      fetchIncomingOrders()
      fetchHistoryOrders()
    })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex min-h-screen bg-canvas font-inter text-ink">
      {/* Sidebar */}
      <KasirSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPrinterSettings={() => setShowPrinterSettings(true)}
        incomingCount={incomingOrders.length}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* Main Content - Match Admin Structure */}
      <div className="flex-1 transition-all duration-300 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-canvas border-b border-hairline px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink lg:hidden cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              <h1 className="text-lg font-bold text-ink uppercase tracking-wider font-jakarta">
                {activeTab === 'incoming' ? 'PESANAN MASUK' : 'HISTORY PESANAN'}
              </h1>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {/* Incoming Orders Tab */}
        {activeTab === 'incoming' && (
          <>
            <div className="mb-6">
              <p className="text-sm text-charcoal">
                Konfirmasi pembayaran cash dan print struk pesanan
              </p>
            </div>

            {incomingOrders.length === 0 ? (
              <div className="rounded-none bg-soft-cloud p-16 text-center border border-hairline">
                <Clock size={64} className="mx-auto text-charcoal mb-4" />
                <p className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-2">
                  Tidak ada pesanan masuk
                </p>
                <p className="text-sm text-charcoal">
                  Pesanan baru akan muncul di sini secara otomatis
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {incomingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showPrintOnly={false}
                    onConfirmCashPayment={confirmCashPayment}
                    onPrintReceipt={handlePrintReceipt}
                    onUpdateStatus={updateOrderStatus}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* History Orders Tab */}
        {activeTab === 'history' && (
          <>
            <div className="mb-6 flex items-start justify-between">
              <p className="text-sm text-charcoal">
                Pesanan yang sudah dikonfirmasi kasir
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryFilter('today')}
                  className={`px-5 py-2.5 rounded-full font-semibold transition-all text-sm border uppercase tracking-wide ${
                    historyFilter === 'today'
                      ? 'bg-ink text-canvas border-ink'
                      : 'bg-canvas text-ink border-hairline hover:bg-soft-cloud'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setHistoryFilter('week')}
                  className={`px-5 py-2.5 rounded-full font-semibold transition-all text-sm border uppercase tracking-wide ${
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
              <div className="rounded-none bg-soft-cloud p-16 text-center border border-hairline">
                <History size={64} className="mx-auto text-charcoal mb-4" />
                <p className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-2">
                  Tidak ada history pesanan
                </p>
                <p className="text-sm text-charcoal">
                  {historyFilter === 'today' ? 'Belum ada pesanan hari ini' : 'Belum ada pesanan minggu ini'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {historyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showPrintOnly={true}
                    onConfirmCashPayment={confirmCashPayment}
                    onPrintReceipt={handlePrintReceipt}
                  />
                ))}
              </div>
            )}
          </>
        )}
        </main>
      </div>

      {/* Printer Settings Modal */}
      {showPrinterSettings && (
        <PrinterSettings onClose={() => setShowPrinterSettings(false)} />
      )}
    </div>
  )
}
