'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Tag, UtensilsCrossed, ShoppingBag, User } from 'lucide-react'
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

    console.log('=== CHECKOUT PAGE DEBUG ===')
    console.log('savedOrderType:', savedOrderType)
    console.log('savedTable:', savedTable)
    console.log('savedTableId:', savedTableId)
    console.log('savedQrToken:', savedQrToken)

    // For TAKEAWAY, ensure NO table data is used
    if (savedOrderType === 'TAKEAWAY') {
      setOrderType('TAKEAWAY')
      console.log('✅ Setting orderType to TAKEAWAY - NO table data')
      // Do NOT set tableNumber or tableId for TAKEAWAY
    } else if (savedOrderType === 'DINE_IN') {
      setOrderType('DINE_IN')
      console.log('✅ Setting orderType to DINE_IN')
      if (savedTable) {
        setTableNumber(savedTable)
        setTableFromQR(true)
        console.log('✅ Table number set:', savedTable)
      }
      if (savedTableId) {
        setTableId(savedTableId)
      }
    }
    
    if (savedSessionId) {
      setSessionId(savedSessionId)
    }
    if (savedQrToken) {
      setQrToken(savedQrToken)
    }
    
    console.log('=== END DEBUG ===')
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
      setError({
        message: 'Nama customer wajib diisi',
        field: 'customerName',
        type: 'validation'
      })
      return
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      setError({
        message: 'Nomor meja wajib diisi untuk Dine-in',
        field: 'tableNumber',
        type: 'validation'
      })
      return
    }

    if (!paymentMethod) {
      setError({
        message: 'Metode pembayaran wajib dipilih',
        field: 'paymentMethod',
        type: 'validation'
      })
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

      // Clear cart and QR data
      localStorage.removeItem('cart')

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="mb-4 text-6xl">🛒</div>
          <p className="text-lg text-gray-600 mb-4">Keranjang kosong</p>
          <Link
            href="/menu"
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 text-white hover:bg-orange-700 transition-all"
          >
            Kembali ke Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali ke Menu</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Review Pesanan Anda
          </h1>
          <p className="text-gray-600">Periksa kembali pesanan sebelum melanjutkan ke pembayaran</p>
        </div>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Side - Cart Items & Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Name */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
              <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
                <User size={22} className="text-orange-600" />
                Informasi Customer
              </h2>
              <div>
                <label htmlFor="customerName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Customer <span className="text-red-500">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pesanan</h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-50 to-transparent p-4 border border-orange-100"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-lg">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DINE-IN SECTION */}
            {orderType === 'DINE_IN' && (
              <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 animate-fadeIn">
                <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UtensilsCrossed size={22} className="text-orange-600" />
                  Tipe Pesanan
                </h2>
                
                {/* Order Type Display */}
                <div className="mb-6 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 p-4 border-2 border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-3 bg-gradient-to-br from-orange-500 to-orange-600">
                      <UtensilsCrossed size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Dine-in</p>
                      <p className="text-sm text-gray-600">Makan di tempat</p>
                    </div>
                  </div>
                </div>

                {/* Table Number Input */}
                <div>
                  <label htmlFor="tableNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Meja <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tableNumber"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: 5"
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                    readOnly={tableFromQR}
                  />
                  {tableFromQR && (
                    <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Nomor meja otomatis dari QR code
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAKEAWAY SECTION */}
            {orderType === 'TAKEAWAY' && (
              <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 animate-fadeIn">
                <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag size={22} className="text-purple-600" />
                  Tipe Pesanan
                </h2>
                
                {/* Order Type Display */}
                <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 p-4 border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-3 bg-gradient-to-br from-purple-500 to-purple-600">
                      <ShoppingBag size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Takeaway</p>
                      <p className="text-sm text-gray-600">Bawa pulang</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Special Notes */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tidak pakai sambal, level pedas sedang, dll"
                rows={3}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>

            {/* Payment Method Selection */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Metode Pembayaran <span className="text-red-500">*</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 ${paymentMethod === 'QRIS'
                    ? 'border-green-600 bg-gradient-to-br from-green-50 to-green-100 shadow-lg scale-105'
                    : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-xl p-3 transition-all ${paymentMethod === 'QRIS'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : 'bg-gray-100 group-hover:bg-green-100'
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
                        className={paymentMethod === 'QRIS' ? 'text-white' : 'text-gray-600 group-hover:text-green-600'}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <rect x="7" y="7" width="3" height="3"></rect>
                        <rect x="14" y="7" width="3" height="3"></rect>
                        <rect x="7" y="14" width="3" height="3"></rect>
                        <rect x="14" y="14" width="3" height="3"></rect>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">QRIS</p>
                      <p className="text-xs text-gray-500">Bayar dengan scan QR</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 ${paymentMethod === 'CASH'
                    ? 'border-orange-600 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg scale-105'
                    : 'border-gray-300 bg-white hover:border-orange-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-xl p-3 transition-all ${paymentMethod === 'CASH'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gray-100 group-hover:bg-orange-100'
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
                        className={paymentMethod === 'CASH' ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'}
                      >
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Cash</p>
                      <p className="text-xs text-gray-500">Bayar di kasir</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
              <h2 className="mb-6 text-lg font-bold text-gray-900">Rincian Pesanan</h2>

              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    Rp {getSubtotal().toLocaleString('id-ID')}
                  </span>
                </div>

                {getDiscount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-semibold text-green-600">
                      -Rp {getDiscount().toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    Rp {getFinalTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
