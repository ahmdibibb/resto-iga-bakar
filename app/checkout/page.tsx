'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Tag, UtensilsCrossed, ShoppingBag, User, ShoppingCart, Phone, Clock } from 'lucide-react'
import ErrorAlert from '@/components/ErrorAlert'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

type OrderType = 'DINE_IN' | 'TAKEAWAY'
type PaymentMethod = 'QRIS' | 'CASH'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [discountCode, setDiscountCode] = useState('')

  // Order details
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [tableFromQR, setTableFromQR] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)

  // Pre-order specific fields
  const [isPreorder, setIsPreorder] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  const [pickupTime, setPickupTime] = useState('')

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    } else {
      router.push('/menu')
    }

    // Auto-fill from QR code data stored in localStorage
    const savedTable = localStorage.getItem('tableNumber')
    const savedOrderType = localStorage.getItem('orderType')
    const savedSessionId = localStorage.getItem('session_id')
    const savedTableId = localStorage.getItem('table_id')
    const savedQrToken = localStorage.getItem('qr_token')
    const savedChannel = localStorage.getItem('channel')

    // Detect pre-order mode
    if (savedChannel === 'PREORDER') {
      setIsPreorder(true)
      setPaymentMethod('QRIS') // Pre-order always QRIS
    }

    // For TAKEAWAY, ensure NO table data is used
    if (savedOrderType === 'TAKEAWAY') {
      setOrderType('TAKEAWAY')
      // Do NOT set tableNumber or tableId for TAKEAWAY
    } else if (savedOrderType === 'DINE_IN') {
      setOrderType('DINE_IN')
      if (savedTable) {
        setTableNumber(savedTable)
        setTableFromQR(true)
      }
      if (savedTableId) {
        setTableId(savedTableId)
      }
    }
    
    if (savedSessionId) setSessionId(savedSessionId)
    if (savedQrToken) setQrToken(savedQrToken)
  }, [router])

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getSubtotal = () => {
    return getTotalPrice()
  }

  const getDiscount = () => {
    return discountCode === 'DISCOUNT10' ? getTotalPrice() * 0.1 : 0
  }

  const getShipping = () => {
    return 0
  }

  const getFinalTotal = () => {
    return getSubtotal() - getDiscount() + getShipping()
  }

  const handleCreateOrder = async () => {
    // Validation
    if (!customerName.trim()) {
      setError({ message: 'Nama customer wajib diisi', field: 'customerName', type: 'validation' })
      return
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      setError({ message: 'Nomor meja wajib diisi untuk Dine-in', field: 'tableNumber', type: 'validation' })
      return
    }

    // Pre-order validations
    if (isPreorder) {
      if (!customerPhone.trim()) {
        setError({ message: 'Nomor HP wajib diisi untuk pre-order', field: 'customerPhone', type: 'validation' })
        return
      }
      if (!pickupTime) {
        setError({ message: 'Jam pengambilan wajib dipilih', field: 'pickupTime', type: 'validation' })
        return
      }
      // Validate pickup time: must be at least 30 minutes from now and within operating hours 09:00-21:00
      const now = new Date()
      const [hours, minutes] = pickupTime.split(':').map(Number)
      const pickup = new Date(now)
      pickup.setHours(hours, minutes, 0, 0)
      const diffMinutes = (pickup.getTime() - now.getTime()) / 60000
      if (diffMinutes < 30) {
        setError({ message: 'Jam pengambilan minimal 30 menit dari sekarang', field: 'pickupTime', type: 'validation' })
        return
      }
      if (hours < 9 || hours >= 21) {
        setError({ message: 'Jam pengambilan harus antara 09:00 – 21:00 WIB', field: 'pickupTime', type: 'validation' })
        return
      }
    }

    if (!paymentMethod) {
      setError({ message: 'Metode pembayaran wajib dipilih', field: 'paymentMethod', type: 'validation' })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : null,
          notes: notes.trim() || null,
          customerName: customerName.trim(),
          customerPhone: isPreorder ? customerPhone.trim() : null,
          pickupTime: isPreorder && pickupTime ? (() => {
            const now = new Date()
            const [h, m] = pickupTime.split(':').map(Number)
            const pickup = new Date(now)
            pickup.setHours(h, m, 0, 0)
            return pickup.toISOString()
          })() : null,
          channel: isPreorder ? 'PREORDER' : 'DIRECT',
          session_id: sessionId,
          table_id: orderType === 'DINE_IN' ? tableId : null,
          qr_token: qrToken,
          payment_method: paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError({
          message: data.error || 'Gagal membuat pesanan',
          field: data.field,
          type: res.status >= 500 ? 'server' : 'validation'
        })
        return
      }

      // Clear cart and channel data
      localStorage.removeItem('cart')
      localStorage.removeItem('channel')

      // Redirect to payment
      router.push(`/payment/${data.id}`)
    } catch (err) {
      setError({
        message: 'Koneksi gagal. Silakan coba lagi.',
        type: 'network'
      })
      // Restore cart from localStorage on network error
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-inter text-ink">
        <div className="rounded-none bg-soft-cloud p-12 text-center border border-hairline shadow-none max-w-md w-full">
          <div className="mb-4 flex items-center justify-center text-ink"><ShoppingCart size={64} strokeWidth={1} /></div>
          <p className="text-lg font-bold font-jakarta uppercase tracking-tight text-ink mb-4">Keranjang Anda Kosong</p>
          <Link
            href="/menu"
            className="inline-block rounded-full bg-ink px-6 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
          >
            Kembali ke Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      {/* Header */}
      <div className="border-b border-hairline bg-canvas/80 backdrop-blur-sm sticky top-0 z-10 shadow-none">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-charcoal hover:text-ink transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali ke Menu</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-jakarta text-ink uppercase tracking-tight mb-2">
            Review Pesanan Anda
          </h1>
          <p className="text-charcoal text-sm font-medium">Periksa kembali pesanan sebelum melanjutkan ke pembayaran</p>
        </div>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Side - Cart Items & Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Name */}
            <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <h2 className="mb-4 text-xl font-bold font-jakarta text-ink uppercase tracking-tight flex items-center gap-2">
                <User size={22} className="text-ink" />
                Informasi Customer
              </h2>
              <div>
                <label htmlFor="customerName" className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                  Nama Customer <span className="text-sale">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-3 text-lg focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <h2 className="text-xl font-bold font-jakarta text-ink uppercase tracking-tight mb-4">Pesanan</h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-none bg-soft-cloud p-4 border border-hairline"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-ink">{item.name}</h3>
                      <p className="text-sm text-charcoal font-medium">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink text-lg">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DINE-IN SECTION */}
            {orderType === 'DINE_IN' && (
              <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none animate-fadeIn">
                <h2 className="mb-4 text-xl font-bold font-jakarta text-ink uppercase tracking-tight flex items-center gap-2">
                  <UtensilsCrossed size={22} className="text-ink" />
                  Tipe Pesanan
                </h2>
                
                {/* Order Type Display */}
                <div className="mb-6 rounded-none bg-soft-cloud p-4 border border-hairline">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-3 bg-ink">
                      <UtensilsCrossed size={24} className="text-canvas" />
                    </div>
                    <div>
                      <p className="font-bold font-jakarta text-ink uppercase tracking-wider">Dine-in</p>
                      <p className="text-sm text-charcoal font-medium">Makan di tempat</p>
                    </div>
                  </div>
                </div>

                {/* Table Number Input */}
                <div>
                  <label htmlFor="tableNumber" className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                    Nomor Meja <span className="text-sale">*</span>
                  </label>
                  <input
                    id="tableNumber"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: 5"
                    className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-3 text-lg focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
                    readOnly={tableFromQR}
                  />
                  {tableFromQR && (
                    <p className="mt-2 text-xs text-success font-semibold flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Nomor meja otomatis dari QR code
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAKEAWAY SECTION - only show for regular takeaway (not pre-order) */}
            {orderType === 'TAKEAWAY' && !isPreorder && (
              <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none animate-fadeIn">
                <h2 className="mb-4 text-xl font-bold font-jakarta text-ink uppercase tracking-tight flex items-center gap-2">
                  <ShoppingBag size={22} className="text-ink" />
                  Tipe Pesanan
                </h2>
                <div className="rounded-none bg-soft-cloud p-4 border border-hairline">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-3 bg-ink">
                      <ShoppingBag size={24} className="text-canvas" />
                    </div>
                    <div>
                      <p className="font-bold font-jakarta text-ink uppercase tracking-wider">Takeaway</p>
                      <p className="text-sm text-charcoal font-medium">Bawa pulang</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRE-ORDER SECTION */}
            {isPreorder && (
              <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none animate-fadeIn">
                <h2 className="mb-4 text-xl font-bold font-jakarta text-ink uppercase tracking-tight flex items-center gap-2">
                  <Clock size={22} className="text-ink" />
                  Detail Pre-Order
                </h2>

                {/* Pre-order badge */}
                <div className="mb-5 flex items-center gap-2 rounded-none bg-soft-cloud px-4 py-3 border border-hairline">
                  <ShoppingBag size={16} className="text-ink" />
                  <p className="text-sm font-semibold text-ink font-jakarta">
                    Pre-Order — Ambil sendiri di restoran
                  </p>
                </div>

                {/* Customer Phone */}
                <div className="mb-4">
                  <label htmlFor="customerPhone" className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      Nomor HP / WhatsApp <span className="text-sale">*</span>
                    </span>
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
                  />
                  <p className="mt-1 text-xs text-charcoal">Kami akan kirim notifikasi WhatsApp saat pesanan siap</p>
                </div>

                {/* Pickup Time */}
                <div>
                  <label htmlFor="pickupTime" className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Jam Pengambilan <span className="text-sale">*</span>
                    </span>
                  </label>
                  <input
                    id="pickupTime"
                    type="time"
                    min="09:00"
                    max="21:00"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
                  />
                  <p className="mt-1 text-xs text-charcoal">
                    Jam operasional: 09:00 – 21:00 WIB. Minimal 30 menit dari sekarang.
                  </p>
                </div>
              </div>
            )}

            {/* Special Notes */}
            <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <label htmlFor="notes" className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tidak pakai sambal, level pedas sedang, dll"
                rows={3}
                className="w-full rounded-none border border-hairline bg-canvas text-ink px-4 py-3 focus:outline-none focus:ring-1 focus:ring-ink transition-all font-medium"
              />
            </div>

            {/* Payment Method Selection */}
            <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <h2 className="mb-4 text-xl font-bold font-jakarta text-ink uppercase tracking-tight">Metode Pembayaran <span className="text-sale">*</span></h2>

              {/* Pre-order: always QRIS, show info */}
              {isPreorder ? (
                <div className="flex items-center gap-4 rounded-none border-2 border-ink bg-soft-cloud p-5">
                  <div className="rounded-full p-3 bg-ink">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <rect x="7" y="7" width="3" height="3"></rect>
                      <rect x="14" y="7" width="3" height="3"></rect>
                      <rect x="7" y="14" width="3" height="3"></rect>
                      <rect x="14" y="14" width="3" height="3"></rect>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold font-jakarta text-ink uppercase tracking-wider">QRIS</p>
                    <p className="text-xs text-charcoal">Pre-order wajib bayar via QRIS</p>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`group relative overflow-hidden rounded-none border p-6 transition-all duration-300 ${
                    paymentMethod === 'QRIS'
                      ? 'border-ink bg-soft-cloud'
                      : 'border-hairline bg-canvas hover:border-ink'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-full p-3 transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'bg-ink text-canvas'
                        : 'bg-soft-cloud text-ink group-hover:bg-hairline-soft'
                    }`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="currentColor"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <rect x="7" y="7" width="3" height="3"></rect>
                        <rect x="14" y="7" width="3" height="3"></rect>
                        <rect x="7" y="14" width="3" height="3"></rect>
                        <rect x="14" y="14" width="3" height="3"></rect>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold font-jakarta text-ink uppercase tracking-wider">QRIS</p>
                      <p className="text-xs text-charcoal font-medium">Bayar dengan scan QR</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`group relative overflow-hidden rounded-none border p-6 transition-all duration-300 ${
                    paymentMethod === 'CASH'
                      ? 'border-ink bg-soft-cloud'
                      : 'border-hairline bg-canvas hover:border-ink'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-full p-3 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-ink text-canvas'
                        : 'bg-soft-cloud text-ink group-hover:bg-hairline-soft'
                    }`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="currentColor"
                      >
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold font-jakarta text-ink uppercase tracking-wider">Cash</p>
                      <p className="text-xs text-charcoal font-medium">Bayar di kasir</p>
                    </div>
                  </div>
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <h2 className="mb-6 text-lg font-bold font-jakarta text-ink uppercase tracking-tight">Rincian Pesanan</h2>

              <div className="space-y-3 border-b border-hairline pb-4 mb-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-charcoal font-medium">
                        {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="font-bold text-ink">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-b border-hairline pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal font-medium">Subtotal</span>
                  <span className="font-bold text-ink">
                    Rp {getSubtotal().toLocaleString('id-ID')}
                  </span>
                </div>

                {getDiscount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal font-medium">Discount</span>
                    <span className="font-bold text-sale">
                      -Rp {getDiscount().toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-none bg-soft-cloud p-4 border border-hairline">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold font-jakarta text-ink uppercase tracking-wider">Total</span>
                  <span className="text-3xl font-bold text-ink font-jakarta">
                    Rp {getFinalTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full rounded-full bg-ink py-4 text-lg font-bold text-canvas transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-canvas border-t-transparent"></div>
                    Memproses...
                  </span>
                ) : (
                  'Lanjut ke Pembayaran'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
