'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Calendar } from 'lucide-react'
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShoppingCart className="text-orange-600" size={28} />
                    <h2 className="text-2xl font-bold text-gray-900">Order List</h2>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Period Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Period</label>
                        <div className="flex items-center gap-2">
                            <Calendar size={20} className="text-gray-600" />
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        <input
                            type={period === 'monthly' ? 'month' : 'date'}
                            value={period === 'monthly' ? date.substring(0, 7) : date}
                            onChange={(e) => setDate(e.target.value)}
                            className="rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    {/* Payment Method Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                        >
                            <option value="ALL">Semua Metode</option>
                            <option value="QRIS">QRIS</option>
                            <option value="CASH">CASH</option>
                        </select>
                    </div>

                    {/* Order Type Filter */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={orderTypeFilter}
                            onChange={(e) => setOrderTypeFilter(e.target.value)}
                            className="rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
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
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                    <p className="text-4xl font-bold text-blue-900 mt-2">{stats.totalOrders}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-6 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                    <p className="text-4xl font-bold text-green-900 mt-2">
                        Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-lg">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Order #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Table
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-medium text-gray-900">
                                        {order.orderNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{order.customerName || order.user?.name || 'Guest'}</p>
                                            {order.user?.email && <p className="text-xs text-gray-500">{order.user.email}</p>}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                        {order.table ? (
                                            <span className="font-medium text-gray-900">🍽️ {order.table.name}</span>
                                        ) : order.tableNumber ? (
                                            <span className="text-gray-600">Meja #{order.tableNumber}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                        {order.orderType === 'DINE_IN' ? '🍽️ Dine-in' : '🥡 Takeaway'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <PaymentMethodBadge method={order.payment_method} />
                                            <PaymentStatusBadge status={order.payment_status} />
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                        {order.items.length} items
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                                        Rp {order.totalAmount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                        {new Date(order.createdAt).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && (
                        <div className="py-12 text-center text-gray-500">
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
