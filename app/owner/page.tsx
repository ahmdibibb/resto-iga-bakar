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
      loading: todayLoading,
    },
    {
      label: 'Orders Hari Ini',
      value: todayOrders?.toString() ?? '0',
      sub: 'Status COMPLETED',
      icon: ShoppingCart,
      loading: todayLoading,
    },
    {
      label: 'Produk Terjual',
      value: todayProductsSold?.toString() ?? '0',
      sub: `Total menu: ${products?.length ?? 0}`,
      icon: Package,
      loading: todayLoading,
    },
    {
      label: 'Rata-rata Order',
      value: `Rp ${(stats?.averageOrderValue ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`,
      sub: `Periode: ${revenuePeriod === 'today' ? 'Hari Ini' : revenuePeriod === 'weekly' ? 'Mingguan' : 'Bulanan'}`,
      icon: TrendingUp,
      loading: statsLoading,
    },
  ]

  return (
    <OwnerShell
      title="Dashboard"
      subtitle="Pantau performa bisnis secara real-time"
      onRefresh={handleRefresh}
    >
      <div className="space-y-6 font-inter text-ink">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="bg-soft-cloud p-5 border border-hairline rounded-none"
              >
                {card.loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-ink/20 rounded w-2/3" />
                    <div className="h-8 bg-ink/20 rounded w-full" />
                    <div className="h-3 bg-ink/20 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-mute mb-1 font-jakarta">{card.label}</p>
                      <p className="text-xl font-bold text-ink mt-1 mb-1 font-jakarta tracking-tight">{card.value}</p>
                      <p className="text-[10px] text-mute uppercase tracking-wide">{card.sub}</p>
                    </div>
                    <div className="w-9 h-9 bg-ink rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                      <Icon size={16} className="text-canvas" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-canvas p-5 border border-sale rounded-none">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 bg-sale rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} className="text-canvas" />
              </div>
              <div className="flex-1 font-jakarta">
                <h4 className="font-bold text-sale uppercase tracking-wider text-sm mb-1">⚠️ Peringatan Stok Tipis</h4>
                <p className="text-xs text-charcoal mb-3">{lowStockProducts.length} produk perlu restok segera</p>
                <div className="space-y-2 font-inter">
                  {lowStockProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between bg-soft-cloud px-4 py-2 border border-hairline rounded-none">
                      <span className="text-xs font-bold text-ink uppercase tracking-wide">{product.name}</span>
                      <span className="text-xs font-bold bg-sale text-canvas px-2.5 py-0.5 rounded-full">
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
        <div className="bg-canvas border border-hairline p-6 rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold uppercase tracking-wider text-ink font-jakarta">Revenue Trend</h3>
              <p className="text-xs text-mute uppercase tracking-wide mt-0.5">Pantau performa penjualan</p>
            </div>
            <div className="flex gap-1 bg-soft-cloud rounded-full p-1 border border-hairline font-jakarta self-start sm:self-auto">
              {[
                { key: 'today', label: 'Hari' },
                { key: 'weekly', label: 'Minggu' },
                { key: 'monthly', label: 'Bulan' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRevenuePeriod(key)}
                  className={`px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-150 cursor-pointer ${
                    revenuePeriod === key
                      ? 'bg-ink text-canvas'
                      : 'text-mute hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {statsLoading ? (
            <div className="h-72 animate-pulse rounded-none bg-soft-cloud border border-hairline" />
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
        <div className="bg-canvas border border-hairline rounded-none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-hairline font-jakarta">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
                <ShoppingCart size={15} className="text-canvas" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Orders Hari Ini</h3>
                <p className="text-[10px] text-mute uppercase tracking-widest mt-0.5">Order COMPLETED (WIB)</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/owner/orders')}
              className="text-xs font-bold uppercase tracking-wider text-ink hover:underline cursor-pointer flex items-center gap-1"
            >
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-soft-cloud border-b border-hairline">
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Order #</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Customer</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Items</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Status</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Bayar</th>
                    <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {recentOrders.slice(0, 7).map((order: any) => (
                    <tr key={order.id} className="hover:bg-soft-cloud/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-xs font-bold text-ink">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-6 text-xs font-bold text-ink uppercase tracking-wide">
                        {order.customerName || order.user?.name || 'Guest'}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-charcoal">
                        {order.items?.length || 0} item
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          order.status === 'COMPLETED' ? 'bg-canvas text-success border-success' :
                          order.status === 'PENDING_PAYMENT' ? 'bg-canvas text-sale border-sale' :
                          order.status === 'PENDING' ? 'bg-canvas text-mute border-mute' :
                          order.status === 'PREPARING' || order.status === 'IN_KITCHEN' ? 'bg-canvas text-ink border-ink' :
                          order.status === 'READY' ? 'bg-canvas text-ink border-ink' :
                          'bg-canvas text-charcoal border-hairline'
                        }`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs font-semibold text-charcoal uppercase tracking-wider">{order.payment_method || 'N/A'}</td>
                      <td className="py-3.5 px-6 text-xs font-extrabold text-ink text-right font-jakarta">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-ash font-jakarta">
              <ShoppingCart size={40} className="mx-auto mb-3 text-hairline" />
              <p className="text-xs font-bold uppercase tracking-wider text-mute">Belum ada order hari ini</p>
              <p className="text-[10px] mt-1 uppercase tracking-wide">Order akan muncul di sini setelah masuk</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
