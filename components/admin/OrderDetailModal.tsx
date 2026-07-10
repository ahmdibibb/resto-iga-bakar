'use client'

import { X, UtensilsCrossed, ShoppingBag, Clock, Phone } from 'lucide-react'

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
    orderType: string
    customerName?: string | null
    customerPhone?: string | null
    channel?: string
    pickupTime?: string | null
    tableNumber?: string | null
    table?: {
        id: string
        name: string
    } | null
    createdAt: string
    user?: {
        name: string
        email: string
    } | null
    items: OrderItem[]
}

interface OrderDetailModalProps {
    order: Order | null
    onClose: () => void
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
    if (!order) return null

    const getStatusBadge = (status: string) => {
        const badges = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            READY: 'bg-green-100 text-green-800',
            COMPLETED: 'bg-gray-100 text-gray-800',
        }
        return badges[status as keyof typeof badges] || badges.PENDING
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
            <div className="bg-canvas border border-hairline rounded-none shadow-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-canvas border-b border-hairline px-6 py-4 flex items-center justify-between rounded-none z-10">
                    <div>
                        <h2 className="text-lg font-bold text-ink uppercase tracking-wider font-jakarta">Order Details</h2>
                        <p className="text-xs text-mute font-semibold mt-0.5">{order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-mute hover:text-ink hover:bg-soft-cloud transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-soft-cloud border border-hairline p-4 rounded-none">
                        <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Customer Information</h3>
                        <div className="space-y-1">
                            <p className="text-ink font-semibold text-sm">{order.customerName || order.user?.name || 'Guest'}</p>
                            {order.user?.email && <p className="text-xs text-charcoal">{order.user.email}</p>}
                            {order.customerPhone && (
                                <p className="text-xs text-charcoal flex items-center gap-1">
                                    <Phone size={11} /> {order.customerPhone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* PRE-ORDER Info block */}
                    {order.channel === 'PREORDER' && (
                        <div className="border-2 border-ink bg-soft-cloud p-4 rounded-none">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-ink px-2 py-0.5 text-[10px] font-bold text-canvas uppercase tracking-wider">
                                    PRE-ORDER
                                </span>
                            </div>
                            {order.pickupTime && (
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-ink" />
                                    <div>
                                        <p className="text-[10px] font-bold text-mute uppercase tracking-wider">Jam Pengambilan</p>
                                        <p className="text-sm font-bold text-ink">
                                            {new Date(order.pickupTime).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'Asia/Jakarta'
                                            })} WIB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-mute uppercase tracking-wider mb-1">Order Type</p>
                            <p className="font-semibold text-xs text-ink inline-flex items-center gap-1">
                                {order.orderType === 'DINE_IN' ? <><UtensilsCrossed size={12} /> Dine-In</> : <><ShoppingBag size={12} /> Takeaway</>}
                            </p>
                            {(order.table?.name || order.tableNumber) && (
                                <p className="text-xs text-charcoal mt-0.5">Table {order.table?.name || order.tableNumber}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-mute uppercase tracking-wider mb-1">Status</p>
                            <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-mute uppercase tracking-wider mb-1">Order Date</p>
                            <p className="font-semibold text-xs text-ink">
                                {new Date(order.createdAt).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Order Items</h3>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-soft-cloud border border-hairline p-3 rounded-none">
                                    <div className="flex-1">
                                        <p className="font-semibold text-xs text-ink">{item.product.name}</p>
                                        <p className="text-[10px] text-charcoal mt-0.5">
                                            {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <p className="font-bold text-xs text-ink">
                                        Rp {item.subtotal.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-hairline pt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-ink uppercase tracking-wider">Total Amount</p>
                            <p className="text-lg font-bold text-ink">
                                Rp {order.totalAmount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-soft-cloud border-t border-hairline px-6 py-4 rounded-none flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full bg-ink text-canvas py-2.5 rounded-full hover:bg-charcoal transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
