import { QrCode, Banknote } from 'lucide-react'

// ─── Order Status ────────────────────────────────────────────────────────────

const ORDER_STATUS_CLASSES: Record<string, string> = {
  PENDING_PAYMENT: 'bg-red-100 text-red-800',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100 text-blue-800',
  PREPARING:       'bg-purple-100 text-purple-800',
  IN_KITCHEN:      'bg-purple-100 text-purple-800',
  READY:           'bg-green-100 text-green-800',
  COMPLETED:       'bg-gray-100 text-gray-800',
  CANCELLED:       'bg-red-100 text-red-800',
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu Pembayaran',
  PENDING:         'Menunggu',
  CONFIRMED:       'Dikonfirmasi',
  PREPARING:       'Dipersiapkan',
  IN_KITCHEN:      'Di Dapur',
  READY:           'Siap',
  COMPLETED:       'Selesai',
  CANCELLED:       'Dibatalkan',
}

interface OrderStatusBadgeProps {
  status: string
  /** Show human-readable label instead of raw enum value */
  showLabel?: boolean
}

export function OrderStatusBadge({ status, showLabel = false }: OrderStatusBadgeProps) {
  const classes = ORDER_STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-800'
  const label = showLabel ? (ORDER_STATUS_LABELS[status] ?? status) : status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}

// ─── Payment Status ──────────────────────────────────────────────────────────

interface PaymentStatusBadgeProps {
  status: string
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
        ✓ Lunas
      </span>
    )
  }
  if (status === 'UNPAID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
        ✗ Belum Bayar
      </span>
    )
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
        ⏳ Pending
      </span>
    )
  }
  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
        ✗ Gagal
      </span>
    )
  }
  return null
}

// ─── Payment Method ──────────────────────────────────────────────────────────

interface PaymentMethodBadgeProps {
  method: string | null
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
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
