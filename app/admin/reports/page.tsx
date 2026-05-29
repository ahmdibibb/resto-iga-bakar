'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
  FileText,
  Loader2
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import { RevenueBarChart } from '@/components/admin/RevenueBarChart'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

interface ReportData {
  summary: {
    totalRevenue: number
    totalOrders: number
    totalProductsSold: number
    averageOrderValue: number
  }
  transactions: Array<{
    orderNumber: string
    date: string
    items: string
    total: number
    paymentMethod: string
    customerName: string
  }>
  topProducts: Array<{
    name: string
    quantitySold: number
    totalRevenue: number
  }>
  revenueChart: Array<{
    period: string
    revenue: number
    orders: number
  }>
  dateRange: {
    startDate: string
    endDate: string
  }
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly'
type PresetType = 'today' | 'week' | 'month' | 'year' | 'custom'

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [preset, setPreset] = useState<PresetType>('month')
  const [period, setPeriod] = useState<PeriodType>('daily')
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [showCustomDate, setShowCustomDate] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate, period])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: period
      })

      const res = await fetch(`/api/admin/reports?${params}`)
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch report')
      }

      const data = await res.json()
      setReportData(data)
    } catch (err) {
      console.error('Error fetching report:', err)
      setError('Gagal memuat laporan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetChange = (newPreset: PresetType) => {
    setPreset(newPreset)
    const now = new Date()

    switch (newPreset) {
      case 'today':
        setStartDate(new Date(now.setHours(0, 0, 0, 0)))
        setEndDate(new Date(now.setHours(23, 59, 59, 999)))
        setPeriod('daily')
        setShowCustomDate(false)
        break
      case 'week':
        setStartDate(subDays(now, 7))
        setEndDate(new Date())
        setPeriod('daily')
        setShowCustomDate(false)
        break
      case 'month':
        setStartDate(startOfMonth(now))
        setEndDate(endOfMonth(now))
        setPeriod('daily')
        setShowCustomDate(false)
        break
      case 'year':
        setStartDate(startOfYear(now))
        setEndDate(endOfYear(now))
        setPeriod('monthly')
        setShowCustomDate(false)
        break
      case 'custom':
        setShowCustomDate(true)
        break
    }
  }

  const handleDownloadPDF = async () => {
    if (!reportData) return

    try {
      // Dynamic import to avoid SSR issues
      const { generatePDF } = await import('@/lib/pdfGenerator')
      await generatePDF(reportData, startDate, endDate)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal generate PDF. Silakan coba lagi.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      <Navbar title="Laporan Penjualan" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header & Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-jakarta text-ink uppercase tracking-tight">Laporan Penjualan</h1>
              <p className="text-sm text-charcoal mt-1">
                Analisis lengkap transaksi dan performa penjualan
              </p>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={loading || !reportData}
              className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Download PDF
                </>
              )}
            </button>
          </div>

          {/* Filter Section */}
          <div className="mt-6 rounded-none bg-soft-cloud p-6 border border-hairline shadow-none">
            <div className="flex flex-col gap-4">
              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'today', label: 'Hari Ini' },
                  { value: 'week', label: 'Minggu Ini' },
                  { value: 'month', label: 'Bulan Ini' },
                  { value: 'year', label: 'Tahun Ini' },
                  { value: 'custom', label: 'Custom' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handlePresetChange(item.value as PresetType)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all text-sm border ${
                      preset === item.value
                        ? 'bg-ink text-canvas border-ink'
                        : 'bg-canvas text-ink border-hairline hover:bg-soft-cloud'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {showCustomDate && (
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={format(startDate, 'yyyy-MM-dd')}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                      className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-2 focus:outline-none focus:ring-1 focus:ring-ink font-medium"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={format(endDate, 'yyyy-MM-dd')}
                      onChange={(e) => setEndDate(new Date(e.target.value))}
                      className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-2 focus:outline-none focus:ring-1 focus:ring-ink font-medium"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-charcoal mb-2 font-jakarta">
                      Periode Grafik
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PeriodType)}
                      className="w-full rounded-full border border-hairline bg-canvas text-ink px-4 py-2 focus:outline-none focus:ring-1 focus:ring-ink font-medium"
                    >
                      <option value="daily">Harian</option>
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                      <option value="yearly">Tahunan</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-none bg-sale/10 border border-sale/20 p-4">
            <p className="text-sale font-semibold">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={48} className="animate-spin text-ink" />
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-none bg-soft-cloud p-6 text-ink border border-hairline shadow-none">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} className="text-ink" />
                  <TrendingUp size={20} className="text-ink" />
                </div>
                <p className="text-sm text-charcoal font-medium">Total Pendapatan</p>
                <p className="text-2xl font-bold font-jakarta mt-1 text-ink">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
              </div>

              <div className="rounded-none bg-soft-cloud p-6 text-ink border border-hairline shadow-none">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart size={32} className="text-ink" />
                </div>
                <p className="text-sm text-charcoal font-medium">Total Order</p>
                <p className="text-2xl font-bold font-jakarta mt-1 text-ink">
                  {reportData.summary.totalOrders}
                </p>
              </div>

              <div className="rounded-none bg-soft-cloud p-6 text-ink border border-hairline shadow-none">
                <div className="flex items-center justify-between mb-2">
                  <Package size={32} className="text-ink" />
                </div>
                <p className="text-sm text-charcoal font-medium">Produk Terjual</p>
                <p className="text-2xl font-bold font-jakarta mt-1 text-ink">
                  {reportData.summary.totalProductsSold}
                </p>
              </div>

              <div className="rounded-none bg-soft-cloud p-6 text-ink border border-hairline shadow-none">
                <div className="flex items-center justify-between mb-2">
                  <FileText size={32} className="text-ink" />
                </div>
                <p className="text-sm text-charcoal font-medium">Rata-rata Nilai Order</p>
                <p className="text-2xl font-bold font-jakarta mt-1 text-ink">
                  {formatCurrency(reportData.summary.averageOrderValue)}
                </p>
              </div>
            </div>

            <RevenueBarChart
              data={reportData.revenueChart.map((point) => ({
                date: point.period,
                revenue: point.revenue,
                orders: point.orders,
              }))}
              title="Grafik Pendapatan"
              description="Tren pendapatan dan jumlah order pada periode terpilih"
              period={
                preset === 'today' ? 'today' : preset === 'week' ? 'week' : 'month'
              }
            />

            {/* Top Products */}
            <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-4">Top 5 Produk Terlaris</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Produk</th>
                      <th className="text-right py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Qty Terjual</th>
                      <th className="text-right py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-hairline-soft hover:bg-soft-cloud/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-ink">{product.name}</td>
                        <td className="py-3 px-4 text-right text-charcoal">{product.quantitySold}</td>
                        <td className="py-3 px-4 text-right font-bold text-ink">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-none bg-canvas p-6 border border-hairline shadow-none">
              <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-4">Detail Transaksi</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">No. Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Items</th>
                      <th className="text-left py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Metode</th>
                      <th className="text-right py-3 px-4 font-semibold text-charcoal font-jakarta text-xs uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.slice(0, 20).map((transaction, index) => (
                      <tr key={index} className="border-b border-hairline-soft hover:bg-soft-cloud/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-ink">{transaction.orderNumber}</td>
                        <td className="py-3 px-4 text-charcoal text-sm font-medium">
                          {format(new Date(transaction.date), 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="py-3 px-4 text-charcoal">{transaction.customerName}</td>
                        <td className="py-3 px-4 text-charcoal text-sm max-w-xs truncate">
                          {transaction.items}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            transaction.paymentMethod === 'QRIS' 
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-soft-cloud text-ink border-hairline'
                          }`}>
                            {transaction.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-ink">
                          {formatCurrency(transaction.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportData.transactions.length > 20 && (
                <p className="text-sm text-ash mt-4 text-center font-medium">
                  Menampilkan 20 dari {reportData.transactions.length} transaksi. Download PDF untuk melihat semua data.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
