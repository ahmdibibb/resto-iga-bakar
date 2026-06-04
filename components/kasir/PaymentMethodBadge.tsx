/**
 * PaymentMethodBadge — Badge visual metode pembayaran
 * 
 * Menampilkan badge QRIS atau CASH dengan icon dan warna
 * yang sesuai. Digunakan di dalam OrderCard kasir.
 */

import { QrCode, Banknote } from 'lucide-react'

interface PaymentMethodBadgeProps {
  method: string | null
}

export default function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
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
