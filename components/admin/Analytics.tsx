'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Package, DollarSign, Calendar, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'

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

export default function Analytics() {
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
                fetch(`/api/admin/analytics?days=${days}&type=overview`, { credentials: 'include' }),
                fetch(`/api/admin/analytics?days=${days}&type=top-products`, { credentials: 'include' }),
                fetch(`/api/admin/analytics?days=${days}&type=revenue-breakdown`, { credentials: 'include' }),
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 text-ink font-inter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingUp className="text-ink" size={20} />
                    <h2 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Sales Analytics</h2>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="bg-soft-cloud text-ink border border-hairline rounded-full px-4 py-2 focus:bg-canvas focus:border-ink focus:outline-none text-xs font-bold uppercase tracking-wider appearance-none"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Overview Stats */}
            {overview && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-mute">Total Orders</p>
                                <p className="text-3xl font-bold text-ink mt-2">{overview.totalOrders}</p>
                            </div>
                            <Package size={20} className="text-ink" />
                        </div>
                    </div>
                    <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-mute">Total Revenue</p>
                                <p className="text-2xl font-bold text-ink mt-2">
                                    Rp {overview.totalRevenue.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <DollarSign size={20} className="text-ink" />
                        </div>
                    </div>
                    <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-mute">Avg Order Value</p>
                                <p className="text-2xl font-bold text-ink mt-2">
                                    Rp {Math.round(overview.averageOrderValue).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <TrendingUp size={20} className="text-ink" />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {/* Top Products Bar Chart */}
                <div className="bg-canvas border border-hairline p-6 rounded-none">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-soft-cloud border border-hairline rounded-none flex items-center justify-center">
                                <Package size={16} className="text-ink" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Top 10 Products</h3>
                                <p className="text-xs text-charcoal mt-0.5">Best selling items by quantity</p>
                            </div>
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
                                    color: "#8A8077",
                                },
                            }}
                            className="h-96 w-full"
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
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#D2C9BF" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
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
                                            className="w-56 bg-canvas border border-hairline rounded-none shadow-none text-ink text-xs"
                                            formatter={(value: any, name: any, props: any) => (
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-bold text-ink mb-1">
                                                        {props.payload.name}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-mute font-medium">Quantity:</span>
                                                        <span className="font-bold text-ink">
                                                            {props.payload.quantity} sold
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-mute font-medium">Revenue:</span>
                                                        <span className="font-bold text-ink">
                                                            Rp {Number(props.payload.revenue).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-mute font-medium">Category:</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-hairline bg-soft-cloud font-bold">
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
                                    maxBarSize={60}
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-mute">
                            <div className="w-16 h-16 bg-soft-cloud border border-hairline rounded-none flex items-center justify-center mb-4">
                                <Package size={24} className="text-ink" />
                            </div>
                            <p className="font-bold text-ink text-sm uppercase tracking-wider">No product data available</p>
                            <p className="text-xs mt-1 text-charcoal">Start selling to see top products</p>
                        </div>
                    )}
                </div>

                {/* Revenue by Category Horizontal Bar Chart */}
                <div className="bg-canvas border border-hairline p-6 rounded-none">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-soft-cloud border border-hairline rounded-none flex items-center justify-center">
                                <DollarSign size={16} className="text-ink" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Revenue by Category</h3>
                                <p className="text-xs text-charcoal mt-0.5">Compare food vs drinks performance</p>
                            </div>
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
                                    color: "#8A8077",
                                },
                            }}
                            className="h-48 w-full"
                        >
                            <BarChart
                                accessibilityLayer
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
                                        { category: 'Food', revenue: foodRevenue, quantity: foodQty, fill: '#15110F' },
                                        { category: 'Drinks', revenue: drinkRevenue, quantity: drinkQty, fill: '#8A8077' }
                                    ]
                                })()}
                                layout="vertical"
                                margin={{ left: 20, right: 20 }}
                            >
                                <XAxis 
                                    type="number" 
                                    dataKey="revenue" 
                                    hide 
                                />
                                <YAxis
                                    dataKey="category"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    width={60}
                                    tick={{ fill: '#15110F', fontSize: 13, fontWeight: 700 }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent 
                                            hideLabel
                                            className="w-48 bg-canvas border border-hairline rounded-none shadow-none text-ink text-xs"
                                            formatter={(value: any, name: any, props: any) => (
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-bold text-ink mb-1">
                                                        {props.payload.category}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-mute font-medium">Revenue:</span>
                                                        <span className="font-bold text-ink">
                                                            Rp {Number(props.payload.revenue).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-mute font-medium">Quantity:</span>
                                                        <span className="font-bold text-ink">
                                                            {props.payload.quantity} items
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Bar 
                                    dataKey="revenue" 
                                    radius={0}
                                >
                                    {[
                                        { category: 'Food', revenue: 0, quantity: 0, fill: '#15110F' },
                                        { category: 'Drinks', revenue: 0, quantity: 0, fill: '#8A8077' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-mute">
                            <div className="w-16 h-16 bg-soft-cloud border border-hairline rounded-none flex items-center justify-center mb-3">
                                <DollarSign size={24} className="text-ink" />
                            </div>
                            <p className="font-bold text-ink text-xs uppercase tracking-wider">No category data available</p>
                            <p className="text-xs mt-1 text-charcoal">Start selling to see category breakdown</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Products */}
                <div className="bg-canvas border border-hairline p-6 rounded-none">
                    <h3 className="mb-6 text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Top Products</h3>

                    {/* Foods */}
                    {foodProducts.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-mute uppercase tracking-wider mb-3">🍽️ Foods</h4>
                            <div className="space-y-2">
                                {foodProducts.slice(0, 5).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between bg-soft-cloud/40 p-4 border-b border-hairline last:border-b-0">
                                        <div className="flex-1">
                                            <p className="font-semibold text-xs text-ink">{item.product.name}</p>
                                            <p className="text-[10px] text-charcoal mt-0.5">{item.quantitySold} sold</p>
                                        </div>
                                        <p className="font-bold text-xs text-ink">
                                            Rp {item.totalRevenue.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Drinks */}
                    {drinkProducts.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-mute uppercase tracking-wider mb-3">🥤 Drinks</h4>
                            <div className="space-y-2">
                                {drinkProducts.slice(0, 5).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between bg-soft-cloud/40 p-4 border-b border-hairline last:border-b-0">
                                        <div className="flex-1">
                                            <p className="font-semibold text-xs text-ink">{item.product.name}</p>
                                            <p className="text-[10px] text-charcoal mt-0.5">{item.quantitySold} sold</p>
                                        </div>
                                        <p className="font-bold text-xs text-ink">
                                            Rp {item.totalRevenue.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {topProducts.length === 0 && (
                        <p className="text-center text-mute py-8 text-xs font-semibold uppercase tracking-wider">No product data available</p>
                    )}
                </div>

                {/* Revenue Breakdown */}
                {revenue && (
                    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
                        <h3 className="mb-6 text-xl font-bold text-gray-900">Revenue Breakdown</h3>

                        <div className="space-y-8">
                            {/* By Payment Method - Pie Chart */}
                            <div>
                                <h4 className="mb-4 text-lg font-semibold text-gray-800 text-center">By Payment Method</h4>
                                <ChartContainer
                                    config={{
                                        revenue: {
                                            label: "Revenue",
                                        },
                                        CASH: {
                                            label: "Cash",
                                            color: "#10b981",
                                        },
                                        QRIS: {
                                            label: "QRIS",
                                            color: "#a855f7",
                                        },
                                    }}
                                    className="mx-auto aspect-square max-h-[300px]"
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    formatter={(value: any, name: any) => (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">{name}:</span>
                                                            <span className="font-bold">
                                                                Rp {Number(value).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    )}
                                                />
                                            }
                                        />
                                        <Pie
                                            data={[
                                                { method: "CASH", revenue: revenue.revenueByMethod.CASH, fill: "#10b981" },
                                                { method: "QRIS", revenue: revenue.revenueByMethod.QRIS, fill: "#a855f7" },
                                            ]}
                                            dataKey="revenue"
                                            nameKey="method"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                        />
                                    </PieChart>
                                </ChartContainer>
                                
                                {/* Legend */}
                                <div className="mt-4 flex justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-gray-700">Cash</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            Rp {revenue.revenueByMethod.CASH.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm text-gray-700">QRIS</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            Rp {revenue.revenueByMethod.QRIS.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* By Order Type - Pie Chart */}
                            <div>
                                <h4 className="mb-4 text-lg font-semibold text-gray-800 text-center">By Order Type</h4>
                                <ChartContainer
                                    config={{
                                        revenue: {
                                            label: "Revenue",
                                        },
                                        DINE_IN: {
                                            label: "Dine-In",
                                            color: "#f97316",
                                        },
                                        TAKEAWAY: {
                                            label: "Takeaway",
                                            color: "#eab308",
                                        },
                                    }}
                                    className="mx-auto aspect-square max-h-[300px]"
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    formatter={(value: any, name: any) => (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">{name}:</span>
                                                            <span className="font-bold">
                                                                Rp {Number(value).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    )}
                                                />
                                            }
                                        />
                                        <Pie
                                            data={[
                                                { type: "Dine-In", revenue: revenue.revenueByOrderType.DINE_IN, fill: "#f97316" },
                                                { type: "Takeaway", revenue: revenue.revenueByOrderType.TAKEAWAY, fill: "#eab308" },
                                            ]}
                                            dataKey="revenue"
                                            nameKey="type"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                        />
                                    </PieChart>
                                </ChartContainer>
                                
                                {/* Legend */}
                                <div className="mt-4 flex justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                        <span className="text-sm text-gray-700">Dine-In</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            Rp {revenue.revenueByOrderType.DINE_IN.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm text-gray-700">Takeaway</span>
                                        <span className="text-sm font-semibold text-gray-900">
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
    )
}
