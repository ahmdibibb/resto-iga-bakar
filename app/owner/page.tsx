'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
  ArrowUpRight,
} from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'
import { RevenueBarChart } from '@/components/admin/RevenueBarChart'
import {
  useAdminStats,
  useTodayStats,
  useRecentOrders,
  useProducts,
} from '@/lib/hooks/useAdminStats'

export default function OwnerDashboard() {
  const router = useRouter()
  const [revenuePeriod, setRevenuePeriod] = useState('monthly')
  const [refreshing, setRefreshing] = useState(false)

  const { chartData, stats, isLoading: statsLoading, mutate: mutateStats } = useAdminStats(revenuePeriod)
  const { todayOrders, todayRevenue, todayProductsSold, isLoading: todayLoading, mutate: mutateToday } = useTodayStats()
  const { orders: recentOrders, mutate: mutateOrders } = useRecentOrders()
  const { products } = useProducts()
  const lowStockProducts = stats?.lowStockProducts?.slice(0, 3) ?? []

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([mutateStats(), mutateToday(), mutateOrders()])
    setRefreshing(false)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      mutateStats(); mutateToday(); mutateOrders()
    }, 30000)
    return () => clearInterval(interval)
  }, [mutateStats, mutateToday, mutateOrders])

  const statCards = [
    {
      label: 'Revenue Hari Ini',
      value: `Rp ${(todayRevenue || 0).toLocaleString('id-ID')}`,
      sub: 'Order selesai (WIB)',
      icon: DollarSign,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-900',
      sub_color: 'text-blue-600',
      loading: todayLoading,
    },
    {
      label: 'Orders Hari Ini',
      value: todayOrders?.toString() ?? '0',
      sub: 'Status COMPLETED',
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      sub_color: 'text-emerald-600',
      loading: todayLoading,
    },
    {
      label: 'Produk Terjual',
      value: todayProductsSold?.toString() ?? '0',
      sub: `Total menu: ${products?.length ?? 0}`,
      icon: Package,
      gradient: 'from-violet-500 to-violet-600',
      bg: 'from-violet-50 to-violet-100',
      border: 'border-violet-200',
      text: 'text-violet-900',
      sub_color: 'text-violet-600',
      loading: todayLoading,
    },
    {
      label: 'Rata-rata Order',
      value: `Rp ${(todayOrders > 0 ? todayRevenue / todayOrders : 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`,
      sub: `Periode: ${revenuePeriod}`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      bg: 'from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-900',
      sub_color: 'text-orange-600',
      loading: todayLoading,
    },
  ]

  return (
    <OwnerShell
      title="Dashboard"
      subtitle="Pantau performa bisnis secara real-time"
      onRefresh={handleRefresh}
    >
      <div className="space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`bg-gradient-to-br ${card.bg} rounded-2xl p-5 border ${card.border} shadow-sm hover:shadow-md transition-all duration-200 group`}
              >
                {card.loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-current opacity-20 rounded w-2/3" />
                    <div className="h-8 bg-current opacity-20 rounded w-full" />
                    <div className="h-3 bg-current opacity-20 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${card.sub_color} mb-1`}>{card.label}</p>
                      <p className={`text-2xl font-bold ${card.text} mt-1 mb-1`}>{card.value}</p>
                      <p className={`text-xs ${card.sub_color} opacity-80`}>{card.sub}</p>
                    </div>
                    <div className={`w-11 h-11 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <AlertCircle size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-1">⚠️ Low Stock Alert</h4>
                <p className="text-sm text-amber-700 mb-3">{lowStockProducts.length} produk perlu restok segera</p>
                <div className="space-y-2">
                  {lowStockProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-amber-100">
                      <span className="text-sm font-medium text-amber-900">{product.name}</span>
                      <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2.5 py-1 rounded-full">
                        {product.stock} unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500">Pantau performa penjualan</p>
            </div>
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200">
              {[
                { key: 'today', label: 'Hari' },
                { key: 'weekly', label: 'Minggu' },
                { key: 'monthly', label: 'Bulan' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRevenuePeriod(key)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    revenuePeriod === key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {statsLoading ? (
            <div className="h-72 animate-pulse rounded-xl bg-gray-100" />
          ) : (
            <RevenueBarChart
              data={chartData}
              title=""
              description=""
              period={revenuePeriod === 'today' ? 'today' : revenuePeriod === 'weekly' ? 'week' : 'month'}
            />
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Orders Hari Ini</h3>
                <p className="text-xs text-gray-500">Order COMPLETED (WIB)</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ml-1">
                <Eye size={11} /> View Only
              </span>
            </div>
            <button
              onClick={() => router.push('/owner/orders')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayar</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 7).map((order: any) => (
                    <tr key={order.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-5 font-mono text-sm font-medium text-gray-900">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-700 font-medium">
                        {order.customerName || order.user?.name || 'Guest'}
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-600">
                        {order.items?.length || 0} item
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'PENDING_PAYMENT' ? 'bg-red-100 text-red-700' :
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'PREPARING' || order.status === 'IN_KITCHEN' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'READY' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-600">{order.payment_method || 'N/A'}</td>
                      <td className="py-3 px-5 text-sm font-bold text-gray-900 text-right">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Belum ada order hari ini</p>
              <p className="text-sm mt-1">Order akan muncul di sini setelah masuk</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
