'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Download, RefreshCw, Package, DollarSign, ShoppingBag } from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface AnalyticsData {
  salesTrend?: Array<{ date: string; revenue: number; orders: number }>
  topProducts?: Array<{ name: string; category: string; quantitySold: number; totalRevenue: number }>
  revenueByMethod?: { CASH: number; QRIS: number }
  revenueByOrderType?: { DINE_IN: number; TAKEAWAY: number }
  revenueByCategory?: { [key: string]: number }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function OwnerAnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(30)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({})

  useEffect(() => { fetchAnalytics() }, [period])

  useEffect(() => {
    const interval = setInterval(() => fetchAnalytics(), 60000)
    return () => clearInterval(interval)
  }, [period])

  const fetchAnalytics = async () => {
    setRefreshing(true)
    try {
      const [trendRes, productsRes, revenueRes, categoryRes] = await Promise.all([
        fetch(`/api/owner/analytics?type=sales-trend&days=${period}`, { credentials: 'include' }),
        fetch(`/api/owner/analytics?type=top-products&days=${period}`, { credentials: 'include' }),
        fetch(`/api/owner/analytics?type=revenue-breakdown&days=${period}`, { credentials: 'include' }),
        fetch(`/api/owner/analytics?type=category-revenue&days=${period}`, { credentials: 'include' }),
      ])

      const [trendData, productsData, revenueData, categoryData] = await Promise.all([
        trendRes.ok ? trendRes.json() : null,
        productsRes.ok ? productsRes.json() : null,
        revenueRes.ok ? revenueRes.json() : null,
        categoryRes.ok ? categoryRes.json() : null,
      ])

      setAnalyticsData({
        salesTrend: trendData?.salesTrend,
        topProducts: productsData?.topProducts,
        revenueByMethod: revenueData?.revenueByMethod,
        revenueByOrderType: revenueData?.revenueByOrderType,
        revenueByCategory: categoryData?.revenueByCategory,
      })
      setError(null)
    } catch {
      setError('Gagal memuat data analytics')
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/owner/analytics/export?days=${period}&format=csv&type=overview`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `analytics-${period}days.csv`
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch {
      alert('Gagal export analytics')
    }
  }

  const headerRight = (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md shadow-blue-200"
    >
      <Download size={15} />
      Export CSV
    </button>
  )

  return (
    <OwnerShell
      title="Analytics"
      subtitle="Business intelligence dan insight performa"
      headerRight={headerRight}
      onRefresh={fetchAnalytics}
    >
      <div className="space-y-6">

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 w-fit shadow-sm">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                period === d
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {d} Hari
            </button>
          ))}
        </div>

        {/* Sales Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp size={19} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Sales Trend</h3>
              <p className="text-sm text-gray-500">Revenue selama {period} hari terakhir</p>
            </div>
            {refreshing && (
              <RefreshCw size={16} className="ml-auto text-blue-400 animate-spin" />
            )}
          </div>

          {analyticsData.salesTrend && analyticsData.salesTrend.length > 0 ? (
            <ChartContainer
              config={{ revenue: { label: 'Revenue', color: '#3B82F6' } }}
              className="h-72 w-full"
            >
              <BarChart data={analyticsData.salesTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false} axisLine={false} tickMargin={10}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                />
                <YAxis
                  tickLine={false} axisLine={false} tickMargin={10}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any) => (
                        <span className="font-bold text-blue-600">Rp {Number(value).toLocaleString('id-ID')}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <TrendingUp size={48} className="mx-auto mb-3 text-gray-200" />
                <p>Belum ada data sales</p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* By Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign size={19} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Revenue by Pembayaran</h3>
                <p className="text-sm text-gray-500">Distribusi metode bayar</p>
              </div>
            </div>
            {analyticsData.revenueByMethod ? (
              <div className="space-y-4">
                {Object.entries(analyticsData.revenueByMethod).map(([method, amount], i) => {
                  const total = Object.values(analyticsData.revenueByMethod!).reduce((a, b) => a + b, 0)
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-semibold text-gray-700">{method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">Rp {amount.toLocaleString('id-ID')}</span>
                          <span className="text-xs text-gray-400 ml-2">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Tidak ada data</p>
            )}
          </div>

          {/* By Order Type */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={19} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Revenue by Tipe Order</h3>
                <p className="text-sm text-gray-500">Dine-in vs Takeaway</p>
              </div>
            </div>
            {analyticsData.revenueByOrderType ? (
              <div className="space-y-4">
                {Object.entries(analyticsData.revenueByOrderType).map(([type, amount], i) => {
                  const total = Object.values(analyticsData.revenueByOrderType!).reduce((a, b) => a + b, 0)
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
                  const color = COLORS[(i + 2) % COLORS.length]
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm font-semibold text-gray-700">{type.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">Rp {amount.toLocaleString('id-ID')}</span>
                          <span className="text-xs text-gray-400 ml-2">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Tidak ada data</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package size={19} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Top Selling Products</h3>
              <p className="text-sm text-gray-500">Produk terlaris {period} hari terakhir</p>
            </div>
          </div>

          {analyticsData.topProducts && analyticsData.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rank</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Terjual</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topProducts.map((product, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-orange-50/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-sm ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700 shadow-sm' :
                          i === 1 ? 'bg-gray-100 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-gray-900">{product.name}</td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm font-bold text-gray-900 text-right">{product.quantitySold}</td>
                      <td className="py-3.5 px-5 text-sm font-bold text-blue-700 text-right">
                        Rp {product.totalRevenue.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 text-gray-200" />
              <p>Belum ada data produk</p>
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        {analyticsData.revenueByCategory && Object.keys(analyticsData.revenueByCategory).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">Revenue by Kategori</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analyticsData.revenueByCategory).map(([category, amount], i) => (
                <div key={category} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-semibold text-gray-700">{category}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">Rp {amount.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OwnerShell>
  )
}
