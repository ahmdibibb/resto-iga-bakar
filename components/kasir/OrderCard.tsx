/**
 * OrderCard — Kartu pesanan untuk dashboard Kasir
 * 
 * Menampilkan detail satu pesanan termasuk:
 * - Nomor order, tanggal, badge metode pembayaran
 * - Info customer, meja/takeaway, daftar item
 * - Catatan pesanan (jika ada)
 * - Tombol aksi: konfirmasi pembayaran cash / print struk
 * 
 * Mode tampilan:
 * - showPrintOnly=false → Tab "Pesanan Masuk" (ada tombol konfirmasi + print)
 * - showPrintOnly=true  → Tab "History" (hanya tombol print ulang)
 */

'use client'

import { Banknote, Printer, UtensilsCrossed, ShoppingBag, ClipboardList, Check } from 'lucide-react'
import type { Order } from './types'
import PaymentMethodBadge from './PaymentMethodBadge'

interface OrderCardProps {
  order: Order
  showPrintOnly?: boolean
  onConfirmCashPayment: (orderId: string) => void
  onPrintReceipt: (order: Order) => void
}

export default function OrderCard({
  order,
  showPrintOnly = false,
  onConfirmCashPayment,
  onPrintReceipt,
}: OrderCardProps) {
  return (
    <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none transition-colors hover:bg-soft-cloud/20">
      {/* Header: Order number + Payment badge */}
      <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
        <div>
          <p className="text-sm font-bold font-jakarta text-ink uppercase tracking-tight">#{order.orderNumber}</p>
          <p className="text-xs text-charcoal font-medium">
            {new Date(order.createdAt).toLocaleString('id-ID')}
          </p>
        </div>
        <PaymentMethodBadge method={order.payment_method} />
      </div>

      {/* Body: Customer info + Items */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-ink">
          Customer: {order.customerName || order.user?.name || 'Guest'}
        </p>
        
        {order.table && (
          <p className="mb-1 text-sm text-charcoal font-medium inline-flex items-center gap-1"><UtensilsCrossed size={14} /> {order.table.name}</p>
        )}
        {order.orderType === 'DINE_IN' && order.tableNumber && !order.table && (
          <p className="mb-1 text-sm text-charcoal font-medium inline-flex items-center gap-1"><UtensilsCrossed size={14} /> Meja #{order.tableNumber}</p>
        )}
        {order.orderType === 'TAKEAWAY' && (
          <p className="mb-1 text-sm text-charcoal font-medium inline-flex items-center gap-1"><ShoppingBag size={14} /> Takeaway</p>
        )}
        
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm bg-soft-cloud rounded-none border border-hairline px-3 py-2">
              <span className="font-semibold text-ink">
                {item.quantity}x {item.product.name}
              </span>
            </div>
          ))}
        </div>
        
        {order.notes && (
          <div className="mt-3 rounded-none bg-soft-cloud border border-hairline p-3">
            <p className="text-xs font-bold text-ink uppercase tracking-wider inline-flex items-center gap-1"><ClipboardList size={12} /> Catatan:</p>
            <p className="text-xs text-charcoal mt-1">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!showPrintOnly && (
          <>
            {/* CASH: Show payment confirmation button */}
            {order.payment_method === 'CASH' && order.payment_status === 'UNPAID' && (
              <button
                onClick={() => onConfirmCashPayment(order.id)}
                className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
              >
                <Banknote size={18} />
                Konfirmasi Pembayaran Cash
              </button>
            )}

            {/* CASH: After payment confirmed, show print button */}
            {order.payment_method === 'CASH' && order.payment_status === 'PAID' && (
              <>
                <div className="rounded-none bg-success/10 border border-success/20 px-4 py-2 text-center">
                  <p className="text-sm font-bold text-success inline-flex items-center gap-1"><Check size={14} /> Pembayaran Cash Lunas</p>
                </div>
                <button
                  onClick={() => onPrintReceipt(order)}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
                >
                  <Printer size={18} />
                  Print Struk Kitchen
                </button>
              </>
            )}

            {/* QRIS: Show print button (payment auto-confirmed) */}
            {order.payment_method === 'QRIS' && order.payment_status === 'PAID' && (
              <>
                <div className="rounded-none bg-success/10 border border-success/20 px-4 py-2 text-center">
                  <p className="text-sm font-bold text-success inline-flex items-center gap-1"><Check size={14} /> Pembayaran QRIS Lunas</p>
                  <p className="text-xs text-success font-medium">Auto-confirmed</p>
                </div>
                <button
                  onClick={() => onPrintReceipt(order)}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
                >
                  <Printer size={18} />
                  Print Struk Kitchen
                </button>
              </>
            )}
          </>
        )}

        {/* History view: Only show print button */}
        {showPrintOnly && (
          <button
            onClick={() => onPrintReceipt(order)}
            className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
          >
            <Printer size={18} />
            Print Ulang Struk
          </button>
        )}
      </div>
    </div>
  )
}
