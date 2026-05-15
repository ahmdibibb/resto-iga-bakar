'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import ErrorAlert from '@/components/ErrorAlert'
import { PaymentMethodBadge } from '@/components/StatusBadge'

interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  payment_status: string
  payment_method: 'QRIS' | 'CASH' | null
  orderType: string
  tableNumber: string | null
  customerName: string | null
  notes: string | null
  table: {
    id: string
    name: string
  } | null
  items: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    product: {
      id: string
      name: string
    }
  }>
  payment: {
    id: string
    method: string
    status: string
    qris_string: string | null
    expires_at: string | null
  } | null
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionId = useRef<string | null>(null)

  useEffect(() => {
    // Get session_id from localStorage
    const storedSessionId = localStorage.getItem('session_id')
    sessionId.current = storedSessionId

    fetchOrder()
  }, [orderId])

  useEffect(() => {
    // Start polling when order is loaded
    if (order && sessionId.current) {
      startPolling()
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [order])

  const fetchOrder = async () => {
    try {
      // Build URL with sessionId for guest orders
      let url = `/api/orders/${orderId}`
      if (sessionId.current) {
        url += `?sessionId=${encodeURIComponent(sessionId.current)}`
      }

      const res = await fetch(url, {
        credentials: 'include'  // Include cookies for logged-in users
      })
      const data = await res.json()

      if (!res.ok) {
        setError({
          message: data.error || 'Order not found',
          type: res.status >= 500 ? 'server' : 'validation'
        })
        setLoading(false)
        return
      }

      const processedOrder = {
        ...data,
        totalAmount: Number(data.totalAmount) || 0,
        items: data.items?.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
          subtotal: Number(item.subtotal) || 0,
        })) || [],
      }

      setOrder(processedOrder)
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError({
        message: 'Koneksi gagal. Silakan coba lagi.',
        type: 'network'
      })
      setLoading(false)
    }
  }

  const startPolling = () => {
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionId.current) return

      try {
        const res = await fetch(`/api/orders/status?session_id=${sessionId.current}`)
        const data = await res.json()

        if (res.ok) {
          const updatedOrder = {
            ...data,
            totalAmount: Number(data.totalAmount) || 0,
            items: data.items?.map((item: any) => ({
              ...item,
              price: Number(item.price) || 0,
              subtotal: Number(item.subtotal) || 0,
            })) || [],
          }

          setOrder(updatedOrder)

          // Stop polling if order is completed or cancelled
          if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
            }

            // Redirect to receipt if completed
            if (data.status === 'COMPLETED') {
              setTimeout(() => {
                router.push(`/receipt/${orderId}`)
              }, 2000)
            }
          }

        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000)
  }

  const handleConfirmPayment = async () => {
    if (!order?.id) return

    setConfirming(true)
    setError(null)

    try {
      const res = await fetch(`/api/orders/${order.id}/confirm-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError({
          message: data.error || 'Failed to confirm payment',
          type: res.status >= 500 ? 'server' : 'validation'
        })
        setConfirming(false)
        return
      }

      // Update order state
      setOrder((prev) => prev ? { ...prev, status: data.status, payment_status: data.payment_status } : null)
      setConfirming(false)
    } catch (err: any) {
      console.error('Error confirming payment:', err)
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 text-6xl">😕</div>
          <p className="text-xl font-semibold text-gray-800 mb-2">Oops!</p>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => router.push('/menu')}
            className="rounded-lg bg-orange-600 px-6 py-3 text-white hover:bg-orange-700"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    )
  }

  if (!order) return null

  const getStatusMessage = () => {
    if (order.payment_method === 'QRIS') {
      if (order.status === 'PENDING_PAYMENT') {
        return {
          title: 'Scan QR Code untuk Pembayaran',
          description: 'Gunakan aplikasi e-wallet Anda untuk scan QR code di bawah ini',
          icon: '📱',
          color: 'blue'
        }
      }
      if (order.payment_status === 'PAID' && order.status !== 'COMPLETED') {
        return {
          title: 'Pembayaran Berhasil!',
          description: 'Pesanan Anda sedang diproses',
          icon: '✅',
          color: 'green'
        }
      }
    }

    if (order.payment_method === 'CASH') {
      if (order.status === 'PENDING_PAYMENT') {
        return {
          title: 'Menunggu Pembayaran di Kasir',
          description: 'Silakan ke kasir untuk konfirmasi pembayaran cash',
          icon: '💵',
          color: 'orange'
        }
      }
    }

    if (order.status === 'CANCELLED') {
      return {
        title: 'Pembayaran Gagal',
        description: 'Pembayaran gagal, silakan coba lagi',
        icon: '❌',
        color: 'red'
      }
    }

    if (order.status === 'COMPLETED') {
      return {
        title: 'Pesanan Selesai',
        description: 'Terima kasih atas pesanan Anda!',
        icon: '🎊',
        color: 'green'
      }
    }

    return {
      title: 'Memproses Pesanan',
      description: 'Mohon tunggu sebentar...',
      icon: '⏳',
      color: 'gray'
    }
  }

  const statusMessage = getStatusMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <button
            onClick={() => router.push('/menu')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali ke Menu</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Status Message */}
        <div className={`mb-8 rounded-2xl p-6 text-center ${
          statusMessage.color === 'green' ? 'bg-green-50 border-2 border-green-200' :
          statusMessage.color === 'blue' ? 'bg-blue-50 border-2 border-blue-200' :
          statusMessage.color === 'orange' ? 'bg-orange-50 border-2 border-orange-200' :
          statusMessage.color === 'red' ? 'bg-red-50 border-2 border-red-200' :
          'bg-gray-50 border-2 border-gray-200'
        }`}>
          <div className="text-6xl mb-4">{statusMessage.icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {statusMessage.title}
          </h1>
          <p className="text-gray-600 text-lg">{statusMessage.description}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600 font-medium">⚠️ {error.message}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Side - Payment Info */}
          <div className="space-y-6">
            {/* QRIS QR Code */}
            {order.payment_method === 'QRIS' && order.status === 'PENDING_PAYMENT' && order.payment?.qris_string && (
              <div className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">QR Code Pembayaran</h2>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-xl border-4 border-gray-200">
                    <QRCodeSVG
                      value={order.payment.qris_string}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Scan QR code ini dengan aplikasi e-wallet Anda
                </p>
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    'Saya Sudah Bayar'
                  )}
                </button>
              </div>
            )}

            {/* CASH Message */}
            {order.payment_method === 'CASH' && (
              <div className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
                <div className="text-center">
                  <div className="text-5xl mb-4">💵</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Cash</h2>
                  {order.status === 'PENDING_PAYMENT' && (
                    <p className="text-gray-600">
                      Silakan ke kasir untuk konfirmasi pembayaran cash.
                    </p>
                  )}
                  </div>
              </div>
            )}

            {/* Order Processing Status */}
            {order.status === 'PENDING_PAYMENT' && order.payment_status !== 'PAID' && (
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 shadow-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Status Pesanan</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">Menunggu Pembayaran</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Detail Pesanan</h2>
                <PaymentMethodBadge method={order.payment_method} />
              </div>

              <div className="mb-4 rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Nomor Pesanan</p>
                <p className="font-mono text-lg font-bold text-gray-900">{order.orderNumber}</p>
              </div>

              {order.customerName && (
                <div className="mb-4 flex justify-between text-sm">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-semibold text-gray-900">{order.customerName}</span>
                </div>
              )}

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tipe</span>
                  <span className="font-semibold text-gray-900">
                    {order.orderType === 'DINE_IN' ? '🍽️ Dine-in' : '🥡 Takeaway'}
                  </span>
                </div>
                {order.table && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Meja</span>
                    <span className="font-semibold text-gray-900">{order.table.name}</span>
                  </div>
                )}
                {order.orderType === 'DINE_IN' && order.tableNumber && !order.table && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Meja</span>
                    <span className="font-semibold text-gray-900">#{order.tableNumber}</span>
                  </div>
                )}
              </div>

              <div className="mb-4 border-t border-gray-200 pt-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Items:</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-orange-600">
                    Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 rounded-xl bg-yellow-50 p-3 border border-yellow-200">
                  <p className="text-xs text-gray-600 mb-1">Catatan:</p>
                  <p className="text-sm text-gray-900">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
