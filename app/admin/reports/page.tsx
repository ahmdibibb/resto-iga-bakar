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
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Laporan Penjualan" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header & Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
              <p className="text-sm text-gray-600 mt-1">
                Analisis lengkap transaksi dan performa penjualan
              </p>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={loading || !reportData}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-6 rounded-xl bg-white p-6 shadow-md border border-gray-100">
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
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      preset === item.value
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={format(startDate, 'yyyy-MM-dd')}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={format(endDate, 'yyyy-MM-dd')}
                      onChange={(e) => setEndDate(new Date(e.target.value))}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Periode Grafik
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PeriodType)}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
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
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={48} className="animate-spin text-orange-600" />
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} />
                  <TrendingUp size={20} />
                </div>
                <p className="text-sm opacity-90">Total Pendapatan</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart size={32} />
                </div>
                <p className="text-sm opacity-90">Total Order</p>
                <p className="text-2xl font-bold mt-1">
                  {reportData.summary.totalOrders}
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Package size={32} />
                </div>
                <p className="text-sm opacity-90">Produk Terjual</p>
                <p className="text-2xl font-bold mt-1">
                  {reportData.summary.totalProductsSold}
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <FileText size={32} />
                </div>
                <p className="text-sm opacity-90">Rata-rata Nilai Order</p>
                <p className="text-2xl font-bold mt-1">
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
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Produk Terlaris</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Produk</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty Terjual</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{product.quantitySold}</td>
                        <td className="py-3 px-4 text-right font-semibold text-orange-600">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detail Transaksi</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">No. Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Metode</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.slice(0, 20).map((transaction, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{transaction.orderNumber}</td>
                        <td className="py-3 px-4 text-gray-700 text-sm">
                          {format(new Date(transaction.date), 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{transaction.customerName}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">
                          {transaction.items}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            transaction.paymentMethod === 'QRIS' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {transaction.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-orange-600">
                          {formatCurrency(transaction.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportData.transactions.length > 20 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
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
