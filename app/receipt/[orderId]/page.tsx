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
    if (!order) return

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 25

      const drawDashedLine = (yPos: number) => {
        doc.setDrawColor(138, 128, 119) // Smoked Wood
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([1.5, 1.5], 0)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        doc.setLineDashPattern([], 0) // Reset to solid
      }

      // Title & Header Info
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(21, 17, 15) // Smoked Black
      doc.text('RESTO IGA BAKAR', pageWidth / 2, y, { align: 'center' })
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(92, 85, 81) // Ash
      doc.text('Jl. Contoh No. 123, Jakarta', pageWidth / 2, y, { align: 'center' })
      y += 5
      doc.text('Telp: (021) 1234-5678', pageWidth / 2, y, { align: 'center' })
      y += 10

      // Line
      drawDashedLine(y)
      y += 8

      // Metadata Key-Value pairs
      doc.setFontSize(10)
      
      const printRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(92, 85, 81)
        doc.text(label, margin, y)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(21, 17, 15)
        doc.text(value, pageWidth - margin, y, { align: 'right' })
        y += 6
      }

      printRow('Order Number:', `#${order.orderNumber}`)
      
      const orderDate = new Date(order.createdAt).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
      printRow('Date:', orderDate)
      
      printRow('Customer:', order.customerName || order.user?.name || 'Guest')
      printRow('Type:', order.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway')
      
      if (order.table || order.tableNumber) {
        printRow('Table:', order.table ? order.table.name : `#${order.tableNumber}`)
      }
      
      printRow('Payment Method:', order.payment_method || 'CASH')
      printRow('Status:', order.status?.replace(/_/g, ' ') || 'PENDING')

      y += 4
      drawDashedLine(y)
      y += 8

      // Table Header for Items
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(21, 17, 15)
      doc.text('ITEM', margin, y)
      doc.text('QTY', margin + 70, y, { align: 'center' })
      doc.text('PRICE', margin + 110, y, { align: 'right' })
      doc.text('SUBTOTAL', pageWidth - margin, y, { align: 'right' })
      y += 6

      doc.setDrawColor(210, 201, 191) // Ember Divider
      doc.setLineWidth(0.2)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6

      // Items Rows
      doc.setFontSize(9)

      order.items.forEach((item) => {
        // Name
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(21, 17, 15)
        
        // Truncate name if too long for layout
        let name = item.product.name
        if (name.length > 32) {
          name = name.substring(0, 30) + '...'
        }
        doc.text(name, margin, y)

        // Qty, Price, Subtotal
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(92, 85, 81)
        doc.text(item.quantity.toString(), margin + 70, y, { align: 'center' })
        doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, margin + 110, y, { align: 'right' })
        
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(21, 17, 15)
        doc.text(`Rp ${item.subtotal.toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })
        
        y += 6.5
      })

      y += 2
      drawDashedLine(y)
      y += 8

      // Total
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(21, 17, 15)
      doc.text('TOTAL', margin, y)
      doc.text(`Rp ${order.totalAmount.toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })
      y += 10

      drawDashedLine(y)
      y += 8

      // Footer
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(21, 17, 15)
      doc.text('Terima kasih atas kunjungan Anda!', pageWidth / 2, y, { align: 'center' })
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(92, 85, 81)
      doc.text('Silakan datang kembali', pageWidth / 2, y, { align: 'center' })

      doc.save(`Receipt-${order.orderNumber}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal membuat PDF')
    }
  }

  const getPaymentMethodBadge = () => {
    if (!order?.payment_method) return null
    
    const badges = {
      QRIS: { color: 'bg-success/10 text-success border-success/20', label: 'QRIS' },
      CASH: { color: 'bg-soft-cloud text-ink border-hairline', label: 'CASH' },
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
      PENDING_PAYMENT: { color: 'bg-soft-cloud text-ink border-hairline', label: 'Menunggu Pembayaran' },
      IN_KITCHEN: { color: 'bg-soft-cloud text-ink border-hairline', label: 'Sedang Diproses' },
      READY: { color: 'bg-success/10 text-success border-success/20', label: 'Siap Diambil' },
      COMPLETED: { color: 'bg-success/10 text-success border-success/20', label: 'Selesai' },
      CANCELLED: { color: 'bg-sale/10 text-sale border-sale/20', label: 'Dibatalkan' },
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
      <div className="flex min-h-screen items-center justify-center bg-canvas font-inter text-ink">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas font-inter text-ink p-4">
        <div className="rounded-none bg-soft-cloud p-12 text-center border border-hairline shadow-none max-w-md w-full">
          <h1 className="text-2xl font-bold font-jakarta text-ink uppercase tracking-tight">Order tidak ditemukan</h1>
          <button
            onClick={() => router.push('/menu')}
            className="mt-4 rounded-full bg-ink px-6 py-3 font-semibold text-canvas hover:bg-ink/90 active:scale-95 transition-all"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas font-inter text-ink py-8">
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      
      {/* Action Buttons */}
      <div className="mx-auto mb-6 max-w-2xl px-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-canvas hover:bg-ink/90 transition-colors font-semibold active:scale-95"
          >
            <Download size={20} />
            Download PDF
          </button>
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-canvas hover:bg-ink/90 transition-colors font-semibold active:scale-95"
          >
            <Home size={20} />
            Pesan Lagi
          </button>
        </div>
      </div>

      {/* Receipt Content */}
      <div id="receipt-content" className="mx-auto max-w-2xl bg-canvas p-8 border border-hairline shadow-none">
        {/* Header */}
        <div className="border-b-2 border-dashed border-hairline pb-6 text-center">
          <h1 className="text-3xl font-bold font-jakarta text-ink uppercase tracking-tight">Resto Iga Bakar</h1>
          <p className="mt-2 text-sm text-charcoal font-medium">Jl. Contoh No. 123, Jakarta</p>
          <p className="text-sm text-charcoal font-medium">Telp: (021) 1234-5678</p>
        </div>

        {/* Order Info */}
        <div className="mt-6 space-y-3 font-medium text-sm">
          <div className="flex justify-between">
            <span className="text-charcoal">Order Number:</span>
            <span className="font-mono font-bold text-ink uppercase tracking-tight">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal">Date:</span>
            <span className="text-ink">
              {new Date(order.createdAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal">Last Updated:</span>
            <span className="text-ink">
              {new Date(order.updatedAt).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal">Customer:</span>
            <span className="text-ink">{order.customerName || order.user?.name || 'Guest'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal">Type:</span>
            <span className="text-ink">
              {order.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}
            </span>
          </div>
          {(order.table || order.tableNumber) && (
            <div className="flex justify-between">
              <span className="text-charcoal">Table:</span>
              <span className="text-ink">
                {order.table ? order.table.name : `#${order.tableNumber}`}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-charcoal">Payment Method:</span>
            {getPaymentMethodBadge()}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-charcoal">Status:</span>
            {getOrderStatusBadge()}
          </div>
        </div>

        {/* Items */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold font-jakarta text-ink uppercase tracking-tight">Order Items</h2>
          <table className="w-full">
            <thead className="border-b border-hairline">
              <tr>
                <th className="pb-2 text-left text-sm font-semibold text-charcoal font-jakarta uppercase tracking-wider">Item</th>
                <th className="pb-2 text-center text-sm font-semibold text-charcoal font-jakarta uppercase tracking-wider">Qty</th>
                <th className="pb-2 text-right text-sm font-semibold text-charcoal font-jakarta uppercase tracking-wider">Price</th>
                <th className="pb-2 text-right text-sm font-semibold text-charcoal font-jakarta uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-ink">{item.product.name}</td>
                  <td className="py-3 text-center text-sm text-charcoal">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-charcoal">
                    Rp {item.price.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-ink">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="mt-6 border-t-2 border-hairline pt-4">
          <div className="flex justify-between text-xl font-bold font-jakarta uppercase tracking-wider">
            <span className="text-ink">TOTAL</span>
            <span className="text-ink">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t-2 border-dashed border-hairline pt-6 text-center">
          <p className="text-sm font-bold font-jakarta uppercase tracking-wider text-ink">Terima kasih atas kunjungan Anda!</p>
          <p className="mt-2 text-xs text-charcoal font-medium">Silakan datang kembali</p>
        </div>
      </div>
    </div>
  )
}
