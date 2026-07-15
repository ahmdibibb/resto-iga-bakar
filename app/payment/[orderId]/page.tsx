'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, Clock, XCircle, Receipt, X, Download, Info, AlertTriangle, Banknote, Flame } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import ErrorAlert from '@/components/ErrorAlert'
import { PaymentMethodBadge } from '@/components/StatusBadge'
import jsPDF from 'jspdf'

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
  customerPhone: string | null
  notes: string | null
  createdAt: string
  channel?: string
  pickupTime?: string | null
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
  const [showReceipt, setShowReceipt] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionId = useRef<string | null>(null)
  const [logoUrl, setLogoUrl] = useState('/logo-v3.png')
  const [restaurantName, setRestaurantName] = useState('Iga Bakar Ombenk')

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.logo_url) setLogoUrl(data.logo_url)
        if (data.restaurant_name) setRestaurantName(data.restaurant_name)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const storedSessionId = localStorage.getItem('session_id')
    sessionId.current = storedSessionId
    fetchOrder()
  }, [orderId])

  useEffect(() => {
    if (order && sessionId.current) {
      startPolling()
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [order?.id])

  const fetchOrder = async () => {
    try {
      let url = `/api/orders/${orderId}`
      if (sessionId.current) {
        url += `?sessionId=${encodeURIComponent(sessionId.current)}`
      }
      const res = await fetch(url, { credentials: 'include' })
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
      setError({ message: 'Koneksi gagal. Silakan coba lagi.', type: 'network' })
      setLoading(false)
    }
  }

  const startPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)

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

          // Stop polling only if CANCELLED — no auto-redirect anywhere
          if (data.status === 'CANCELLED') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
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
        setError({ message: data.error || 'Gagal konfirmasi pembayaran', type: res.status >= 500 ? 'server' : 'validation' })
        setConfirming(false)
        return
      }
      setOrder((prev) => prev ? { ...prev, status: data.status, payment_status: data.payment_status } : null)
      setConfirming(false)
    } catch (err: any) {
      setError({ message: 'Terjadi kesalahan. Silakan coba lagi.', type: 'network' })
      setConfirming(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!order) return
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 25

      const drawDashedLine = (yPos: number) => {
        doc.setDrawColor(138, 128, 119)
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([1.5, 1.5], 0)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        doc.setLineDashPattern([], 0)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(21, 17, 15)
      doc.text(restaurantName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(92, 85, 81)
      doc.text(`Terima kasih telah memesan di ${restaurantName}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      drawDashedLine(y)
      y += 8

      const printRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(92, 85, 81)
        doc.text(label, margin, y)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(21, 17, 15)
        doc.text(value, pageWidth - margin, y, { align: 'right' })
        y += 6
      }

      printRow('No. Pesanan:', `#${order.orderNumber}`)
      const orderDate = new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      printRow('Tanggal:', orderDate)
      printRow('Customer:', order.customerName || 'Guest')
      printRow('Tipe:', order.orderType === 'DINE_IN' ? 'Dine-In' : 'Takeaway')
      if (order.table) printRow('Meja:', order.table.name)
      printRow('Pembayaran:', order.payment_method || 'CASH')

      y += 4
      drawDashedLine(y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(21, 17, 15)
      doc.text('ITEM', margin, y)
      doc.text('QTY', margin + 70, y, { align: 'center' })
      doc.text('SUBTOTAL', pageWidth - margin, y, { align: 'right' })
      y += 6

      doc.setDrawColor(210, 201, 191)
      doc.setLineWidth(0.2)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6

      doc.setFontSize(9)
      order.items.forEach((item) => {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(21, 17, 15)
        let name = item.product.name
        if (name.length > 32) name = name.substring(0, 30) + '...'
        doc.text(name, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(92, 85, 81)
        doc.text(item.quantity.toString(), margin + 70, y, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(21, 17, 15)
        doc.text(`Rp ${item.subtotal.toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })
        y += 6.5
      })

      y += 2
      drawDashedLine(y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(21, 17, 15)
      doc.text('TOTAL', margin, y)
      doc.text(`Rp ${order.totalAmount.toLocaleString('id-ID')}`, pageWidth - margin, y, { align: 'right' })
      y += 10

      drawDashedLine(y)
      y += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Terima kasih atas kunjungan Anda!', pageWidth / 2, y, { align: 'center' })
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(92, 85, 81)
      doc.text('Silakan datang kembali :)', pageWidth / 2, y, { align: 'center' })

      doc.save(`Receipt-${order.orderNumber}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  // ─── Payment Status Logic ────────────────────────────────────────────────
  const isPaid = order?.payment_status === 'PAID'
  const isCancelled = order?.status === 'CANCELLED'
  const isPendingPayment = order?.status === 'PENDING_PAYMENT' && !isPaid

  const getStatusBanner = () => {
    if (isCancelled) {
      return {
        bg: 'bg-red-50 border-red-200',
        icon: <XCircle size={36} className="text-red-500" />,
        title: 'Pesanan Dibatalkan',
        // Cancelled karena QRIS tidak dibayar dalam 10 menit (timeout otomatis)
        // atau dibatalkan secara manual oleh kasir
        desc: 'Pesanan ini telah dibatalkan karena batas waktu pembayaran habis atau dibatalkan oleh kasir.',
        badge: <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={12} /> Dibatalkan</span>
      }
    }
    if (isPaid) {
      return {
        bg: 'bg-green-50 border-green-200',
        icon: <CheckCircle2 size={36} className="text-green-600" />,
        title: 'Pembayaran Berhasil!',
        desc: 'Pesanan Anda sedang diproses oleh kasir. Harap tunggu di meja Anda.',
        badge: <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={12} /> Pembayaran Diterima</span>
      }
    }
    if (order?.payment_method === 'QRIS') {
      return {
        bg: 'bg-blue-50 border-blue-200',
        icon: <Clock size={36} className="text-blue-500 animate-pulse" />,
        title: 'Scan QR untuk Bayar',
        desc: 'Gunakan aplikasi e-wallet Anda untuk scan QR Code di bawah ini. Pembayaran akan otomatis terverifikasi.',
        badge: <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><Clock size={12} className="animate-pulse" /> Menunggu Pembayaran QRIS</span>
      }
    }
    if (order?.payment_method === 'CASH') {
      return {
        bg: 'bg-amber-50 border-amber-200',
        icon: <Clock size={36} className="text-amber-500" />,
        title: 'Menunggu Pembayaran Cash',
        desc: 'Silakan ke kasir untuk melakukan pembayaran tunai. Kasir akan mengkonfirmasi pesanan Anda.',
        badge: <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock size={12} /> Menunggu Pembayaran di Kasir</span>
      }
    }
    return {
      bg: 'bg-soft-cloud border-hairline',
      icon: <Loader2 size={36} className="text-ink animate-spin" />,
      title: 'Memproses...',
      desc: 'Mohon tunggu sebentar.',
      badge: null
    }
  }

  const banner = order ? getStatusBanner() : null

  // ─── Loading / Error States ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-inter">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-ink border-t-transparent" />
          <p className="text-lg text-charcoal font-medium">Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-inter">
        <div className="text-center max-w-md mx-auto px-4 rounded-none bg-soft-cloud border border-hairline p-12 shadow-none w-full">
          <p className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-2">Pesanan tidak ditemukan</p>
          <p className="text-charcoal mb-6 font-medium">{error.message}</p>
          <button
            onClick={() => router.push(order?.channel === 'PREORDER' ? '/' : '/menu')}
            className="rounded-full bg-ink px-6 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
          >
            {order?.channel === 'PREORDER' ? 'Kembali ke Beranda' : 'Kembali ke Menu'}
          </button>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      {/* Header */}
      <div className="border-b border-hairline bg-canvas/80 backdrop-blur-sm sticky top-0 z-10 h-16 flex items-center">
        <div className="mx-auto max-w-6xl px-4 w-full flex items-center justify-between">
          <button
            onClick={() => router.push(order.channel === 'PREORDER' ? '/' : '/menu')}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-soft-cloud px-4 py-2 text-xs sm:text-sm font-bold text-ink hover:bg-hairline-soft active:scale-95 transition-all duration-200"
          >
            <ArrowLeft size={16} />
            <span>{order.channel === 'PREORDER' ? 'Kembali ke Beranda' : 'Kembali ke Menu'}</span>
          </button>
          <Image
            src={logoUrl}
            alt={restaurantName}
            width={112}
            height={56}
            className="object-contain h-14 w-auto"
            priority
          />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Status Banner ─────────────────────────────────────── */}
        {banner && (
          <div className={`mb-8 rounded-2xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${banner.bg}`}>
            <div className="flex-shrink-0">{banner.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-jakarta uppercase tracking-tight text-ink mb-1">
                {banner.title}
              </h1>
              <p className="text-charcoal font-medium text-sm mb-3">{banner.desc}</p>
              {banner.badge}
            </div>
            {/* Lihat Receipt button — only shown after payment confirmed */}
            {isPaid && (
              <button
                onClick={() => setShowReceipt(true)}
                className="flex-shrink-0 flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all text-sm"
              >
                <Receipt size={16} />
                Lihat Receipt
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-700 flex-shrink-0" />
              <p className="text-sm text-red-700 font-bold">{error.message}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Side */}
          <div className="space-y-6">

            {/* QRIS QR Code — only when pending payment */}
            {order.payment_method === 'QRIS' && isPendingPayment && order.payment?.qris_string && (
              <div className="rounded-2xl bg-canvas p-6 border border-hairline shadow-none">
                <h2 className="text-lg font-bold font-jakarta uppercase tracking-tight text-ink mb-4 text-center">QR Code Pembayaran</h2>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-xl border border-hairline">
                    <QRCodeSVG
                      value={order.payment.qris_string}
                      size={240}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <p className="text-sm text-charcoal text-center mb-5 font-medium">
                  Scan dengan aplikasi e-wallet (GoPay, OVO, DANA, dll)
                </p>
                {order.payment.expires_at && (
                  <p className="text-xs text-center text-amber-600 font-semibold mb-4">
                    <Clock size={12} className="inline mr-1" />QR berlaku hingga: {new Date(order.payment.expires_at).toLocaleTimeString('id-ID')}
                    <br />
                    <span className="text-charcoal font-normal">Pesanan dibatalkan otomatis jika tidak dibayar dalam 10 menit</span>
                  </p>
                )}
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full rounded-full bg-ink py-4 text-base font-bold text-canvas transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* CASH Info — only when pending */}
            {order.payment_method === 'CASH' && isPendingPayment && (
              <div className="rounded-2xl bg-amber-50 p-6 border border-amber-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Banknote size={32} className="text-amber-700" />
                  </div>
                  <h2 className="text-lg font-bold font-jakarta uppercase tracking-tight text-ink mb-2">Pembayaran Cash</h2>
                  <p className="text-charcoal font-medium text-sm">
                    Silakan ke kasir untuk melakukan pembayaran.<br />
                    Kasir akan mengkonfirmasi dan mencetak struk Anda.
                  </p>
                </div>
              </div>
            )}

            {/* Processing Info — after payment paid */}
            {isPaid && (
              <div className="space-y-6">
                {/* WhatsApp Confirmation Card — only for PREORDER */}
                {order && order.channel === 'PREORDER' && order.customerPhone && (
                  <div className="rounded-2xl p-6 border-2 border-green-400 bg-green-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold font-jakarta text-green-800 mb-1">Konfirmasi Pesanan via WhatsApp</h3>
                        <p className="text-sm text-green-700 mb-4 leading-relaxed">
                          Kirimkan pesan konfirmasi ke WhatsApp restoran agar pesanan Anda segera diproses dan Anda mendapat notifikasi saat pesanan siap diambil.
                        </p>
                        <a
                          href={`https://wa.me/6285894057990?text=${encodeURIComponent(
                            `Konfirmasi Pesanan #${order.orderNumber}\n` +
                            `Nama: ${order.customerName || 'Pelanggan'}\n` +
                            `Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalAmount)}\n` +
                            (order.pickupTime ? `Jam Ambil: ${new Date(order.pickupTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB` : '')
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-white font-bold text-sm hover:bg-green-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Konfirmasi via WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step progress */}
                <div className="rounded-2xl bg-canvas p-6 border border-hairline">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info size={18} className="text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-jakarta uppercase tracking-wider text-ink mb-4">Informasi Pesanan</h3>
                      <div className="space-y-4">
                        {/* Step 1: Payment Received */}
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <p className="text-sm text-charcoal font-semibold">Pembayaran Anda telah diterima</p>
                        </div>

                        {/* Step 2 (Pre-Order only): Konfirmasi WhatsApp */}
                        {order && order.channel === 'PREORDER' && (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <p className="text-sm text-charcoal font-semibold">Kirim konfirmasi via WhatsApp</p>
                          </div>
                        )}

                        {/* Step 2/3: Preparing */}
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                            order && ['PREPARING', 'READY', 'COMPLETED'].includes(order.status)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-soft-cloud text-ink'
                          }`}>
                            {order && order.channel === 'PREORDER' ? 3 : 2}
                          </div>
                          <p className="text-sm text-charcoal font-semibold">Pesanan sedang diproses</p>
                        </div>

                        {/* Step 3/4: Delivered or Ready for Pickup */}
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                            order && (
                              (order.channel === 'PREORDER' && ['READY', 'COMPLETED'].includes(order.status)) ||
                              (order.channel !== 'PREORDER' && order.status === 'COMPLETED')
                            )
                              ? 'bg-green-100 text-green-700'
                              : 'bg-soft-cloud text-ink'
                          }`}>
                            {order && order.channel === 'PREORDER' ? 4 : 3}
                          </div>
                          <p className="text-sm text-charcoal font-semibold">
                            {order && order.channel === 'PREORDER' ? 'Pesanan siap diambil (notifikasi WA)' : 'Pesanan akan diantar'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-charcoal/60 mt-5 italic">Simpan nomor pesanan Anda sebagai referensi</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancelled state */}
            {isCancelled && (
              <div className="rounded-2xl bg-red-50 p-6 border border-red-200 text-center">
                <XCircle size={40} className="text-red-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-red-800">
                  Pesanan dibatalkan karena batas waktu pembayaran habis (10 menit)<br />
                  atau dibatalkan secara manual oleh kasir.
                </p>
                <button
                  onClick={() => router.push(order.channel === 'PREORDER' ? '/menu?mode=preorder' : '/menu')}
                  className="mt-4 rounded-full bg-ink px-6 py-2.5 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all text-sm"
                >
                  Pesan Ulang
                </button>
              </div>
            )}
          </div>

          {/* Right Side — Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-canvas p-6 border border-hairline shadow-none">
              <div className="flex items-center justify-between mb-4 border-b border-hairline pb-3">
                <h2 className="text-base font-bold font-jakarta text-ink uppercase tracking-tight">Detail Pesanan</h2>
                <PaymentMethodBadge method={order.payment_method} />
              </div>

              <div className="mb-4 rounded-xl bg-soft-cloud p-4 border border-hairline">
                <p className="text-xs text-charcoal font-medium mb-1">Nomor Pesanan</p>
                <p className="font-mono text-base font-bold text-ink uppercase tracking-tight">#{order.orderNumber}</p>
              </div>

              {order.customerName && (
                <div className="mb-3 flex justify-between text-sm font-medium">
                  <span className="text-charcoal">Customer</span>
                  <span className="font-bold text-ink">{order.customerName}</span>
                </div>
              )}

              <div className="mb-4 space-y-2 font-medium text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal">Tipe</span>
                  <span className="font-bold text-ink">
                    {order.channel === 'PREORDER' ? 'Pre-Order' : (order.orderType === 'DINE_IN' ? 'Dine-in' : 'Takeaway')}
                  </span>
                </div>
                {order.channel === 'PREORDER' && order.pickupTime && (
                  <div className="flex justify-between">
                    <span className="text-charcoal">Jam Ambil</span>
                    <span className="font-bold text-ink">
                      {new Date(order.pickupTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                    </span>
                  </div>
                )}
                {order.table && (
                  <div className="flex justify-between">
                    <span className="text-charcoal">Meja</span>
                    <span className="font-bold text-ink">{order.table.name}</span>
                  </div>
                )}
                {order.orderType === 'DINE_IN' && order.tableNumber && !order.table && (
                  <div className="flex justify-between">
                    <span className="text-charcoal">Meja</span>
                    <span className="font-bold text-ink">#{order.tableNumber}</span>
                  </div>
                )}
              </div>

              <div className="mb-4 border-t border-hairline pt-4">
                <p className="mb-3 text-xs font-bold font-jakarta uppercase tracking-wider text-ink">Items</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm font-medium">
                      <span className="text-charcoal">{item.product.name} ×{item.quantity}</span>
                      <span className="font-bold text-ink">Rp {(item.subtotal || 0).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-hairline pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold font-jakarta text-ink uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-ink font-jakarta">
                    Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 rounded-xl bg-soft-cloud p-3 border border-hairline">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider mb-1">Catatan:</p>
                  <p className="text-sm text-charcoal font-medium">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Receipt Bottom Sheet Modal ──────────────────────────────── */}
      {showReceipt && order && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setShowReceipt(false)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-2xl bg-canvas rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline flex-shrink-0">
              <div className="flex items-center gap-3">
                <Receipt size={20} className="text-ink" />
                <span className="font-bold font-jakarta text-ink uppercase tracking-tight">Receipt Pesanan</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-canvas text-xs font-semibold hover:bg-ink/90 active:scale-95 transition-all"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="p-2 rounded-full hover:bg-soft-cloud transition-colors text-charcoal hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sheet Content — scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              {/* Receipt Header */}
              <div className="border-b-2 border-dashed border-hairline pb-6 text-center mb-6">
                <div className="flex justify-center mb-3">
                  <Image src={logoUrl} alt={restaurantName} width={100} height={50} className="object-contain h-14 w-auto" />
                </div>
                <p className="text-sm text-charcoal font-medium">Terima kasih telah memesan!</p>
              </div>

              {/* Order Info */}
              <div className="space-y-3 font-medium text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-charcoal">No. Pesanan</span>
                  <span className="font-mono font-bold text-ink">#{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal">Tanggal</span>
                  <span className="text-ink">{new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal">Customer</span>
                  <span className="text-ink font-semibold">{order.customerName || 'Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal">Tipe</span>
                  <span className="text-ink">{order.orderType === 'DINE_IN' ? 'Dine-In' : 'Takeaway'}</span>
                </div>
                {order.table && (
                  <div className="flex justify-between">
                    <span className="text-charcoal">Meja</span>
                    <span className="text-ink font-semibold">{order.table.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-charcoal">Pembayaran</span>
                  <PaymentMethodBadge method={order.payment_method} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal">Status</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle2 size={11} /> Pembayaran Diterima
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <p className="text-xs font-bold font-jakarta uppercase tracking-wider text-ink mb-3">Order Items</p>
                <div className="border border-hairline rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-soft-cloud">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-bold text-charcoal uppercase tracking-wider">Item</th>
                        <th className="px-4 py-2.5 text-center text-xs font-bold text-charcoal uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold text-charcoal uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-ink font-medium">{item.product.name}</td>
                          <td className="px-4 py-3 text-center text-sm text-charcoal">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-ink">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-hairline pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold font-jakarta text-ink uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-ink">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-dashed border-hairline pt-4 text-center">
                <p className="text-sm font-bold font-jakarta uppercase tracking-wider text-ink">Terima kasih!</p>
                <p className="mt-1 text-xs text-charcoal font-medium inline-flex items-center gap-1">Silakan datang kembali ke {restaurantName} <Flame size={12} className="text-orange-500" /></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>
    </div>
  )
}
