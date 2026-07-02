'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Calendar, UtensilsCrossed, ShoppingBag } from 'lucide-react'
import OrderDetailModal from './OrderDetailModal'
import { OrderStatusBadge, PaymentMethodBadge, PaymentStatusBadge } from '@/components/StatusBadge'

interface Order {
    id: string
    orderNumber: string
    totalAmount: number
    status: string
    payment_status: string
    payment_method: string | null
    orderType: string
    tableNumber?: string
    customerName?: string | null
    createdAt: string
    table?: {
        id: string
        name: string
    } | null
    user?: {
        name: string
        email: string
    } | null
    items: Array<{
        id: string
        quantity: number
        price: number
        subtotal: number
        product: {
            name: string
            category: string
        }
    }>
}

export default function OrderList() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('daily')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL')
    const [orderTypeFilter, setOrderTypeFilter] = useState<string>('ALL')
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
    })
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [period, date, paymentMethodFilter, orderTypeFilter])

    const fetchOrders = async () => {        setLoading(true)
        try {
            let params = new URLSearchParams({ period })

            if (period === 'daily') {
                params.append('date', date)
            } else if (period === 'weekly') {
                // For weekly, send the start date of the week
                params.append('date', date)
            } else if (period === 'monthly') {
                params.append('date', date.substring(0, 7))
            }

            const res = await fetch(`/api/admin/orders?${params}`, {
                credentials: 'include',
            })
            const data = await res.json()
            
            let filteredOrders = data.orders || []
            
            // Apply payment method filter
            if (paymentMethodFilter !== 'ALL') {
                filteredOrders = filteredOrders.filter((order: Order) => 
                    order.payment_method === paymentMethodFilter
                )
            }
            
            // Apply order type filter
            if (orderTypeFilter !== 'ALL') {
                filteredOrders = filteredOrders.filter((order: Order) => 
                    order.orderType === orderTypeFilter
                )
            }
            
            setOrders(filteredOrders)
            setStats(data.stats || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 })
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 text-ink font-inter">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShoppingCart className="text-ink" size={20} />
                    <h2 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Order List</h2>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-canvas border border-hairline p-6 rounded-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Period Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-ink uppercase tracking-wider">Period</label>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-ink" />
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="flex-1 bg-soft-cloud text-ink border border-hairline rounded-full px-4 py-2 focus:bg-canvas focus:border-ink focus:outline-none text-sm appearance-none"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-ink uppercase tracking-wider">Date</label>
                        <input
                            type={period === 'monthly' ? 'month' : 'date'}
                            value={period === 'monthly' ? date.substring(0, 7) : date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-soft-cloud text-ink border border-hairline rounded-full px-4 py-2 focus:bg-canvas focus:border-ink focus:outline-none text-sm"
                        />
                    </div>

                    {/* Payment Method Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-ink uppercase tracking-wider">Payment Method</label>
                        <select
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="bg-soft-cloud text-ink border border-hairline rounded-full px-4 py-2 focus:bg-canvas focus:border-ink focus:outline-none text-sm appearance-none"
                        >
                            <option value="ALL">Semua Metode</option>
                            <option value="QRIS">QRIS</option>
                            <option value="CASH">CASH</option>
                        </select>
                    </div>

                    {/* Order Type Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-ink uppercase tracking-wider">Type</label>
                        <select
                            value={orderTypeFilter}
                            onChange={(e) => setOrderTypeFilter(e.target.value)}
                            className="bg-soft-cloud text-ink border border-hairline rounded-full px-4 py-2 focus:bg-canvas focus:border-ink focus:outline-none text-sm appearance-none"
                        >
                            <option value="ALL">All Types</option>
                            <option value="DINE_IN">Dine-In</option>
                            <option value="TAKEAWAY">Takeaway</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Only 2 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                    <p className="text-xs font-semibold uppercase tracking-wider text-mute">Total Orders</p>
                    <p className="text-3xl font-bold text-ink mt-2">{stats.totalOrders}</p>
                </div>
                <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                    <p className="text-xs font-semibold uppercase tracking-wider text-mute">Total Revenue</p>
                    <p className="text-3xl font-bold text-ink mt-2">
                        Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border border-ink border-t-transparent"></div>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-none bg-canvas border border-hairline">
                    <table className="w-full">
                        <thead className="bg-soft-cloud border-b border-hairline">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Order #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Table
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-soft-cloud/40 cursor-pointer transition-colors"
                                >
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-ink">
                                        {order.orderNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-xs text-ink">{order.customerName || order.user?.name || 'Guest'}</p>
                                            {order.user?.email && <p className="text-[10px] text-charcoal mt-0.5">{order.user.email}</p>}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                                        {order.table ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-ink"><UtensilsCrossed size={12} /> {order.table.name}</span>
                                        ) : order.tableNumber ? (
                                            <span>Meja #{order.tableNumber}</span>
                                        ) : (
                                            <span className="text-mute">-</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                                        <span className="inline-flex items-center gap-1">{order.orderType === 'DINE_IN' ? <><UtensilsCrossed size={12} /> Dine-in</> : <><ShoppingBag size={12} /> Takeaway</>}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <PaymentMethodBadge method={order.payment_method} />
                                            <PaymentStatusBadge status={order.payment_status} />
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                                        {order.items.length} items
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 font-bold text-xs text-ink">
                                        Rp {order.totalAmount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                                        {new Date(order.createdAt).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && (
                        <div className="py-12 text-center text-mute text-xs font-semibold uppercase tracking-wider">
                            No orders found for this period
                        </div>
                    )}
                </div>
            )}

            {/* Order Detail Modal */}
            <OrderDetailModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    )
}
