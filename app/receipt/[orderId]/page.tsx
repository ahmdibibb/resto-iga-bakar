'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Download, Home } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ErrorAlert from '@/components/ErrorAlert'

interface OrderItem {
  id: string
  quantity: number
  price: number
  subtotal: number
  product: {
    name: string
    category: string
  }
}

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  payment_status: string
  payment_method: 'QRIS' | 'CASH' | null
  orderType: string
  tableNumber?: string
  customerName?: string | null
  createdAt: string
  updatedAt: string
  user?: {
    name: string
    email: string
  } | null
  table?: {
    id: string
    name: string
  } | null
  items: OrderItem[]
  payment?: {
    method: string
    status: string
    paidAt: string
  }
}

interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      // Get sessionId from localStorage for guest orders
      const sessionId = localStorage.getItem('session_id')
      
      // Build URL with sessionId if available
      let url = `/api/orders/${orderId}`
      if (sessionId) {
        url += `?sessionId=${encodeURIComponent(sessionId)}`
      }

      const res = await fetch(url, {
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        setError({
          message: data.error || 'Gagal memuat pesanan',
          type: 'server'
        })
        return
      }
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        setError(null)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError({
        message: 'Koneksi gagal. Silakan coba lagi.',
        type: 'network'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Receipt-${order?.orderNumber}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal membuat PDF')
    }
  }

  const getPaymentMethodBadge = () => {
    if (!order?.payment_method) return null
    
    const badges = {
      QRIS: { color: 'bg-green-100 text-green-700 border-green-200', label: 'QRIS' },
      CASH: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'CASH' },
    }
    
    const badge = badges[order.payment_method]
    if (!badge) return null
    
    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getOrderStatusBadge = () => {
    if (!order?.status) return null
    
    const statusConfig = {
      PENDING_PAYMENT: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Menunggu Pembayaran' },
      IN_KITCHEN: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Sedang Diproses' },
      READY: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Siap Diambil' },
      COMPLETED: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Selesai' },
      CANCELLED: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Dibatalkan' },
    }
    
    const status = statusConfig[order.status as keyof typeof statusConfig]
    if (!status) return null
    
    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${status.color}`}>
        {status.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900">Order tidak ditemukan</h1>
        <button
          onClick={() => router.push('/menu')}
          className="mt-4 rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
        >
          Kembali ke Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      
      {/* Action Buttons */}
      <div className="mx-auto mb-6 max-w-2xl px-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Download PDF
          </button>
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 transition-colors font-semibold"
          >
            <Home size={20} />
            Pesan Lagi
          </button>
        </div>
      </div>

      {/* Receipt Content */}
      <div id="receipt-content" className="mx-auto max-w-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="border-b-2 border-dashed border-gray-300 pb-6 text-center">
          <h1 className="text-3xl font-bold text-orange-600">Resto Iga Bakar</h1>
          <p className="mt-2 text-sm text-gray-600">Jl. Contoh No. 123, Jakarta</p>
          <p className="text-sm text-gray-600">Telp: (021) 1234-5678</p>
        </div>

        {/* Order Info */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Order Number:</span>
            <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Date:</span>
            <span className="text-gray-900">
              {new Date(order.createdAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Last Updated:</span>
            <span className="text-gray-900">
              {new Date(order.updatedAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Customer:</span>
            <span className="text-gray-900">{order.customerName || order.user?.name || 'Guest'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Type:</span>
            <span className="text-gray-900">
              {order.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}
            </span>
          </div>
          {(order.table || order.tableNumber) && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Table:</span>
              <span className="text-gray-900">
                {order.table ? order.table.name : `#${order.tableNumber}`}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Payment Method:</span>
            {getPaymentMethodBadge()}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Status:</span>
            {getOrderStatusBadge()}
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Order Items</h2>
          <table className="w-full">
            <thead className="border-b-2 border-gray-300">
              <tr>
                <th className="pb-2 text-left text-sm font-semibold text-gray-700">Item</th>
                <th className="pb-2 text-center text-sm font-semibold text-gray-700">Qty</th>
                <th className="pb-2 text-right text-sm font-semibold text-gray-700">Price</th>
                <th className="pb-2 text-right text-sm font-semibold text-gray-700">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-900">{item.product.name}</td>
                  <td className="py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-gray-900">
                    Rp {item.price.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 text-right text-sm font-semibold text-gray-900">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="mt-6 border-t-2 border-gray-300 pt-4">
          <div className="flex justify-between text-xl font-bold">
            <span className="text-gray-900">TOTAL</span>
            <span className="text-orange-600">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t-2 border-dashed border-gray-300 pt-6 text-center">
          <p className="text-sm font-semibold text-gray-900">Terima kasih atas kunjungan Anda!</p>
          <p className="mt-2 text-xs text-gray-600">Silakan datang kembali</p>
        </div>
      </div>
    </div>
  )
}
