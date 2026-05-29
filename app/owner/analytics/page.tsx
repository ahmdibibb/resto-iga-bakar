'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Package, DollarSign, Calendar, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import OwnerShell from '@/components/owner/OwnerShell'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  newCustomers: number
}

interface TopProduct {
  product: {
    name: string
    category: string
  }
  quantitySold: number
  totalRevenue: number
}

interface RevenueBreakdown {
  revenueByMethod: {
    CASH: number
    QRIS: number
  }
  revenueByOrderType: {
    DINE_IN: number
    TAKEAWAY: number
  }
}

export default function OwnerAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [overview, setOverview] = useState<AnalyticsData | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [revenue, setRevenue] = useState<RevenueBreakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [overviewRes, productsRes, revenueRes] = await Promise.all([
        fetch(`/api/owner/analytics?days=${days}&type=overview`, { credentials: 'include' }),
        fetch(`/api/owner/analytics?days=${days}&type=top-products`, { credentials: 'include' }),
        fetch(`/api/owner/analytics?days=${days}&type=revenue-breakdown`, { credentials: 'include' }),
      ])

      const [overviewData, productsData, revenueData] = await Promise.all([
        overviewRes.json(),
        productsRes.json(),
        revenueRes.json(),
      ])

      setOverview(overviewData)
      setTopProducts(productsData.topProducts || [])
      setRevenue(revenueData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const foodProducts = topProducts.filter(p => p.product.category === 'MAKANAN')
  const drinkProducts = topProducts.filter(p => p.product.category === 'MINUMAN')

  const headerRight = (
    <select
      value={days}
      onChange={(e) => setDays(parseInt(e.target.value))}
      className="rounded-full border border-hairline bg-canvas px-4 py-2 focus:border-ink focus:outline-none text-xs font-bold uppercase tracking-wider cursor-pointer"
    >
      <option value={7}>7 Hari Terakhir</option>
      <option value={30}>30 Hari Terakhir</option>
      <option value={90}>90 Hari Terakhir</option>
    </select>
  )

  if (loading) {
    return (
      <OwnerShell title="Analytics" subtitle="Business intelligence dan insight performa" headerRight={headerRight} onRefresh={fetchAnalytics}>
        <div className="flex items-center justify-center py-24 font-jakarta">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-ink border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-mute font-bold uppercase tracking-widest">Memuat data analytics...</p>
          </div>
        </div>
      </OwnerShell>
    )
  }

  return (
    <OwnerShell
      title="Analytics"
      subtitle="Business intelligence dan insight performa"
      headerRight={headerRight}
      onRefresh={fetchAnalytics}
    >
      <div className="space-y-6 font-inter text-ink">
        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="bg-soft-cloud p-6 border border-hairline rounded-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-mute font-jakarta">Total Orders</p>
                  <p className="text-3xl font-bold text-ink mt-2 font-jakarta tracking-tight">{overview.totalOrders}</p>
                </div>
                <div className="w-10 h-10 bg-ink rounded-full flex items-center justify-center text-canvas">
                  <Package size={18} />
                </div>
              </div>
            </div>
            <div className="bg-soft-cloud p-6 border border-hairline rounded-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-mute font-jakarta">Total Revenue</p>
                  <p className="text-3xl font-bold text-ink mt-2 font-jakarta tracking-tight">
                    Rp {overview.totalRevenue.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-ink rounded-full flex items-center justify-center text-canvas">
                  <DollarSign size={18} />
                </div>
              </div>
            </div>
            <div className="bg-soft-cloud p-6 border border-hairline rounded-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-mute font-jakarta">Avg Order Value</p>
                  <p className="text-3xl font-bold text-ink mt-2 font-jakarta tracking-tight">
                    Rp {Math.round(overview.averageOrderValue).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-ink rounded-full flex items-center justify-center text-canvas">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Top Products Bar Chart */}
          <div className="bg-canvas border border-hairline p-6 rounded-none">
            <div className="flex items-center gap-3 mb-6 font-jakarta">
              <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
                <Package size={15} className="text-canvas" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Top 10 Products</h3>
                <p className="text-[10px] text-mute uppercase tracking-widest mt-0.5">Best selling items by quantity sold</p>
              </div>
            </div>

            {topProducts.length > 0 ? (
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity Sold",
                    color: "#15110F",
                  },
                  revenue: {
                    label: "Revenue",
                    color: "#C0392B",
                  },
                }}
                className="h-96 w-full font-inter"
              >
                <BarChart
                  data={topProducts.slice(0, 10).map(item => ({
                    name: item.product.name.length > 15 
                      ? item.product.name.substring(0, 15) + '...' 
                      : item.product.name,
                    quantity: item.quantitySold,
                    revenue: item.totalRevenue,
                    category: item.product.category
                  }))}
                  margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBE5DC" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#8A8077', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: '#8A8077', fontSize: 10, fontWeight: 600 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-56 bg-canvas border border-hairline font-inter"
                        formatter={(value: any, name: any, props: any) => (
                          <div className="flex flex-col gap-1 text-ink">
                            <div className="font-bold text-xs uppercase tracking-wide border-b border-hairline pb-1 mb-1 font-jakarta">
                              {props.payload.name}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] text-mute uppercase font-semibold">Quantity:</span>
                              <span className="font-bold text-xs text-ink">
                                {props.payload.quantity} sold
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] text-mute uppercase font-semibold">Revenue:</span>
                              <span className="font-bold text-xs text-sale">
                                Rp {Number(props.payload.revenue).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-hairline/50">
                              <span className="text-[10px] text-mute uppercase font-semibold">Category:</span>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-soft-cloud border border-hairline text-ink font-bold uppercase">
                                {props.payload.category}
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#15110F"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-mute font-jakarta">
                <Package size={40} className="mb-2 text-hairline" />
                <p className="text-xs font-bold uppercase tracking-wider">No product data available</p>
              </div>
            )}
          </div>

          {/* Revenue by Category Horizontal Bar Chart */}
          <div className="bg-canvas border border-hairline p-6 rounded-none">
            <div className="flex items-center gap-3 mb-6 font-jakarta">
              <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
                <DollarSign size={15} className="text-canvas" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Revenue by Category</h3>
                <p className="text-[10px] text-mute uppercase tracking-widest mt-0.5">Compare food vs drinks performance</p>
              </div>
            </div>

            {topProducts.length > 0 ? (
              <ChartContainer
                config={{
                  Food: {
                    label: "Food",
                    color: "#15110F",
                  },
                  Drinks: {
                    label: "Drinks",
                    color: "#C0392B",
                  },
                }}
                className="h-44 w-full"
              >
                <BarChart
                  data={(() => {
                    const foodRevenue = topProducts
                      .filter(p => p.product.category === 'MAKANAN')
                      .reduce((sum, p) => sum + p.totalRevenue, 0)
                    const drinkRevenue = topProducts
                      .filter(p => p.product.category === 'MINUMAN')
                      .reduce((sum, p) => sum + p.totalRevenue, 0)
                    const foodQty = topProducts
                      .filter(p => p.product.category === 'MAKANAN')
                      .reduce((sum, p) => sum + p.quantitySold, 0)
                    const drinkQty = topProducts
                      .filter(p => p.product.category === 'MINUMAN')
                      .reduce((sum, p) => sum + p.quantitySold, 0)
                    
                    return [
                      { category: 'Makanan', revenue: foodRevenue, quantity: foodQty, fill: '#15110F' },
                      { category: 'Minuman', revenue: drinkRevenue, quantity: drinkQty, fill: '#D35400' }
                    ]
                  })()}
                  layout="vertical"
                  margin={{ left: 10, right: 10 }}
                >
                  <XAxis type="number" dataKey="revenue" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={80}
                    tick={{ fill: '#15110F', fontSize: 11, fontWeight: 700 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        className="w-48 bg-canvas border border-hairline"
                        formatter={(value: any, name: any, props: any) => (
                          <div className="flex flex-col gap-1 text-ink font-inter">
                            <div className="font-bold text-xs uppercase tracking-wider font-jakarta border-b border-hairline pb-1 mb-1">
                              {props.payload.category}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] text-mute uppercase font-semibold">Revenue:</span>
                              <span className="font-bold text-xs text-ink">
                                Rp {Number(props.payload.revenue).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] text-mute uppercase font-semibold">Quantity:</span>
                              <span className="font-bold text-xs text-mute">
                                {props.payload.quantity} items sold
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 0, 0, 0]}>
                    {[
                      { category: 'Makanan', fill: '#15110F' },
                      { category: 'Minuman', fill: '#D35400' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-mute font-jakarta">
                <p className="text-xs font-bold uppercase tracking-wider">No category data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products Lists */}
          <div className="bg-canvas border border-hairline p-6 rounded-none font-jakarta">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-ink border-b border-hairline pb-3">Top Products</h3>

            {/* Foods */}
            {foodProducts.length > 0 && (
              <div className="mb-6 font-inter">
                <h4 className="text-xs font-bold text-mute uppercase tracking-widest mb-3">🍽️ Makanan</h4>
                <div className="space-y-2">
                  {foodProducts.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-soft-cloud p-3.5 border border-hairline rounded-none">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-ink text-xs uppercase tracking-wide">{item.product.name}</p>
                        <p className="text-[10px] text-mute mt-0.5 font-bold uppercase tracking-wider">{item.quantitySold} terjual</p>
                      </div>
                      <p className="font-bold text-ink text-xs font-jakarta">
                        Rp {item.totalRevenue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drinks */}
            {drinkProducts.length > 0 && (
              <div className="font-inter">
                <h4 className="text-xs font-bold text-mute uppercase tracking-widest mb-3">🥤 Minuman</h4>
                <div className="space-y-2">
                  {drinkProducts.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-soft-cloud p-3.5 border border-hairline rounded-none">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-ink text-xs uppercase tracking-wide">{item.product.name}</p>
                        <p className="text-[10px] text-mute mt-0.5 font-bold uppercase tracking-wider">{item.quantitySold} terjual</p>
                      </div>
                      <p className="font-bold text-ink text-xs font-jakarta">
                        Rp {item.totalRevenue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topProducts.length === 0 && (
              <p className="text-center text-mute py-8 text-xs font-bold uppercase tracking-wider">No product data available</p>
            )}
          </div>

          {/* Revenue Breakdown */}
          {revenue && (
            <div className="bg-canvas border border-hairline p-6 rounded-none font-jakarta">
              <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-ink border-b border-hairline pb-3">Revenue Breakdown</h3>

              <div className="space-y-6">
                {/* By Payment Method */}
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-mute text-center">By Payment Method</h4>
                  <ChartContainer
                    config={{
                      CASH: { label: "Cash", color: "#15110F" },
                      QRIS: { label: "QRIS", color: "#D35400" }
                    }}
                    className="mx-auto aspect-square max-h-[200px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="bg-canvas border border-hairline font-inter"
                            formatter={(value: any, name: any) => (
                              <div className="flex items-center justify-between gap-4 text-ink">
                                <span className="text-[10px] text-mute uppercase font-semibold">{name}:</span>
                                <span className="font-bold text-xs">
                                  Rp {Number(value).toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={[
                          { method: "CASH", revenue: revenue.revenueByMethod.CASH, fill: "#15110F" },
                          { method: "QRIS", revenue: revenue.revenueByMethod.QRIS, fill: "#D35400" },
                        ]}
                        dataKey="revenue"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                      />
                    </PieChart>
                  </ChartContainer>

                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-2 font-inter">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-ink rounded-none"></div>
                      <span className="text-[10px] text-mute uppercase font-semibold">Cash:</span>
                      <span className="text-xs font-bold text-ink">
                        Rp {revenue.revenueByMethod.CASH.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-[#D35400] rounded-none"></div>
                      <span className="text-[10px] text-mute uppercase font-semibold">QRIS:</span>
                      <span className="text-xs font-bold text-ink">
                        Rp {revenue.revenueByMethod.QRIS.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* By Order Type */}
                <div className="pt-4 border-t border-hairline font-jakarta">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-mute text-center">By Order Type</h4>
                  <ChartContainer
                    config={{
                      DINE_IN: { label: "Dine-In", color: "#15110F" },
                      TAKEAWAY: { label: "Takeaway", color: "#C0392B" }
                    }}
                    className="mx-auto aspect-square max-h-[200px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="bg-canvas border border-hairline font-inter"
                            formatter={(value: any, name: any) => (
                              <div className="flex items-center justify-between gap-4 text-ink">
                                <span className="text-[10px] text-mute uppercase font-semibold">{name}:</span>
                                <span className="font-bold text-xs">
                                  Rp {Number(value).toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={[
                          { type: "Dine-In", revenue: revenue.revenueByOrderType.DINE_IN, fill: "#15110F" },
                          { type: "Takeaway", revenue: revenue.revenueByOrderType.TAKEAWAY, fill: "#C0392B" },
                        ]}
                        dataKey="revenue"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                      />
                    </PieChart>
                  </ChartContainer>

                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-2 font-inter">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-ink rounded-none"></div>
                      <span className="text-[10px] text-mute uppercase font-semibold">Dine-In:</span>
                      <span className="text-xs font-bold text-ink">
                        Rp {revenue.revenueByOrderType.DINE_IN.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-sale rounded-none"></div>
                      <span className="text-[10px] text-mute uppercase font-semibold">Takeaway:</span>
                      <span className="text-xs font-bold text-ink">
                        Rp {revenue.revenueByOrderType.TAKEAWAY.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
