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
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, History, Inbox } from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Loading from '@/components/Loading'
import ErrorAlert from '@/components/ErrorAlert'
import OrderCard from '@/components/kasir/OrderCard'
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
                {incomingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showPrintOnly={false}
                    onConfirmCashPayment={confirmCashPayment}
                    onPrintReceipt={handlePrintReceipt}
                  />
                ))}
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
      </div>
    </div>
  )
}
