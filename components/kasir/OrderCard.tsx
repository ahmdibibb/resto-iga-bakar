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

import { Banknote, Printer, UtensilsCrossed, ShoppingBag, ClipboardList, Check, Clock, Send } from 'lucide-react'
import type { Order } from './types'
import PaymentMethodBadge from './PaymentMethodBadge'

interface OrderCardProps {
  order: Order
  showPrintOnly?: boolean
  onConfirmCashPayment: (orderId: string) => void
  onPrintReceipt: (order: Order) => void
  onUpdateStatus?: (orderId: string, status: string) => void
}

export default function OrderCard({
  order,
  showPrintOnly = false,
  onConfirmCashPayment,
  onPrintReceipt,
  onUpdateStatus,
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
        {order.orderType === 'TAKEAWAY' && order.channel !== 'PREORDER' && (
          <p className="mb-1 text-sm text-charcoal font-medium inline-flex items-center gap-1"><ShoppingBag size={14} /> Takeaway</p>
        )}
        {order.channel === 'PREORDER' && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-none bg-ink px-2 py-0.5 text-[10px] font-bold text-canvas uppercase tracking-wider">
              PRE-ORDER
            </span>
            {order.pickupTime && (
              <p className="mt-1 text-xs font-semibold text-ink inline-flex items-center gap-1">
                <Clock size={12} /> Ambil: {new Date(order.pickupTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
              </p>
            )}
          </div>
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
            {order.channel === 'PREORDER' ? (
              <>
                {/* PREORDER: CONFIRMED (Paid but not printed yet) */}
                {order.status === 'CONFIRMED' && (
                  <>
                    <div className="rounded-none bg-success/10 border border-success/20 px-4 py-2 text-center">
                      <p className="text-sm font-bold text-success inline-flex items-center gap-1"><Check size={14} /> Pembayaran QRIS Lunas</p>
                    </div>
                    <button
                      onClick={() => onPrintReceipt(order)}
                      className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all cursor-pointer"
                    >
                      <Printer size={18} />
                      Print Struk Kitchen
                    </button>
                  </>
                )}

                {/* PREORDER: PREPARING (Printed, kitchen cooking) */}
                {order.status === 'PREPARING' && (
                  <>
                    <div className="rounded-none bg-yellow-50 border border-yellow-200 px-4 py-2 text-center">
                      <p className="text-sm font-bold text-yellow-800">Sedang Diproses Kitchen</p>
                    </div>
                    <button
                      onClick={() => onUpdateStatus && onUpdateStatus(order.id, 'READY')}
                      className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-3 text-canvas font-semibold hover:bg-green-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <Send size={18} />
                      Pesanan Siap di Pick Up
                    </button>
                  </>
                )}

                {/* PREORDER: READY (Food ready, WA notification sent) */}
                {order.status === 'READY' && (
                  <>
                    <div className="rounded-none bg-green-50 border border-green-200 px-4 py-2 text-center">
                      <p className="text-sm font-bold text-green-800">Pesanan Siap / WA Terkirim</p>
                    </div>
                    <button
                      onClick={() => onUpdateStatus && onUpdateStatus(order.id, 'COMPLETED')}
                      className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check size={18} />
                      Selesai / Diambil
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* CASH: Show payment confirmation button */}
                {order.payment_method === 'CASH' && order.payment_status === 'UNPAID' && (
                  <button
                    onClick={() => onConfirmCashPayment(order.id)}
                    className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all cursor-pointer"
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
                      className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all cursor-pointer"
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
                      className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all cursor-pointer"
                    >
                      <Printer size={18} />
                      Print Struk Kitchen
                    </button>
                  </>
                )}
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
