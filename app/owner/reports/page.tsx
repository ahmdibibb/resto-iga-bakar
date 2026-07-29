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
  Loader2,
  AlertTriangle
} from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'
import { RevenueBarChart } from '@/components/admin/RevenueBarChart'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

interface ReportData {
  summary: {
    totalRevenue: number
    totalOrders: number
    totalProductsSold: number
    averageOrderValue: number
    paymentBreakdown: {
      CASH: number
      QRIS: number
    }
    orderTypeBreakdown: {
      DINE_IN: number
      TAKEAWAY: number
    }
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

export default function OwnerReportsPage() {
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

      const res = await fetch(`/api/owner/reports?${params}`, { credentials: 'include' })
      
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

  const downloadButton = (
    <button
      onClick={handleDownloadPDF}
      disabled={loading || !reportData}
      className="flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-canvas font-bold uppercase tracking-wider text-xs border border-transparent transition-all duration-150 hover:bg-charcoal active:scale-95 disabled:bg-soft-cloud disabled:text-ash cursor-pointer"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Download size={14} />
          Download PDF
        </>
      )}
    </button>
  )

  return (
    <OwnerShell
      title="Reports"
      subtitle="Generate dan download laporan penjualan komprehensif"
      headerRight={downloadButton}
      onRefresh={fetchReport}
    >
      <div className="space-y-6 font-inter text-ink">
        {/* Filter Section */}
        <div className="bg-canvas border border-hairline p-6 rounded-none">
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
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    preset === item.value
                      ? 'bg-ink text-canvas'
                      : 'bg-soft-cloud text-ink hover:bg-hairline-soft'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            {showCustomDate && (
              <div className="flex flex-col gap-4 md:flex-row md:items-end border-t border-hairline pt-4 mt-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-2 font-jakarta">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full rounded-full border border-hairline px-4 py-2.5 focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-semibold transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-2 font-jakarta">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full rounded-full border border-hairline px-4 py-2.5 focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-semibold transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-2 font-jakarta">
                    Periode Grafik
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                    className="w-full rounded-full border border-hairline px-4 py-2.5 focus:border-ink focus:outline-none bg-soft-cloud focus:bg-canvas text-xs font-bold uppercase tracking-wider cursor-pointer"
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

        {/* Error State */}
        {error && (
          <div className="bg-canvas border border-sale p-4 rounded-none font-jakarta flex items-center gap-2">
            <AlertTriangle size={14} className="text-sale flex-shrink-0" />
            <p className="text-sale font-bold text-xs uppercase tracking-wide">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20 font-jakarta">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-ink" />
              <p className="text-xs text-mute font-bold uppercase tracking-widest">Memuat laporan...</p>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
              <div className="bg-soft-cloud p-5 border border-hairline rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={20} className="text-ink" />
                  <TrendingUp size={14} className="text-ink" />
                </div>
                <p className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1 font-jakarta">Total Pendapatan</p>
                <p className="text-lg font-bold text-ink mt-1 font-jakarta tracking-tight">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
              </div>

              <div className="bg-soft-cloud p-5 border border-hairline rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart size={20} className="text-ink" />
                </div>
                <p className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1 font-jakarta">Total Order</p>
                <p className="text-lg font-bold text-ink mt-1 font-jakarta tracking-tight">
                  {reportData.summary.totalOrders}
                </p>
              </div>

              <div className="bg-soft-cloud p-5 border border-hairline rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <Package size={20} className="text-ink" />
                </div>
                <p className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1 font-jakarta">Produk Terjual</p>
                <p className="text-lg font-bold text-ink mt-1 font-jakarta tracking-tight">
                  {reportData.summary.totalProductsSold}
                </p>
              </div>

              <div className="bg-soft-cloud p-5 border border-hairline rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <FileText size={20} className="text-ink" />
                </div>
                <p className="text-[10px] font-bold text-mute uppercase tracking-widest mb-1 font-jakarta">Rata-rata Nilai Order</p>
                <p className="text-lg font-bold text-ink mt-1 font-jakarta tracking-tight">
                  {formatCurrency(reportData.summary.averageOrderValue)}
                </p>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-canvas border border-hairline p-6 rounded-none">
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
            </div>

            {/* Breakdown Methods */}
            {reportData.summary.paymentBreakdown && (
              <div className="bg-canvas border border-hairline p-5 rounded-none font-jakarta">
                <h3 className="font-bold text-ink mb-4 text-xs uppercase tracking-wider">Breakdown Metode Bayar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-inter">
                  {Object.entries(reportData.summary.paymentBreakdown).map(([method, amount]: [string, any]) => (
                    <div key={method} className="p-4 rounded-none border border-hairline bg-soft-cloud">
                      <p className="text-[10px] text-mute font-bold mb-1 uppercase tracking-wider">{method}</p>
                      <p className="text-base font-bold text-ink">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            <div className="bg-canvas border border-hairline rounded-none overflow-hidden font-jakarta">
              <h2 className="text-xs font-bold text-ink mb-4 uppercase tracking-wider p-6 pb-2">Top 5 Produk Terlaris</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-soft-cloud border-b border-hairline">
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Produk</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute text-right">Qty Terjual</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline font-inter">
                    {reportData.topProducts.slice(0, 5).map((product, index) => (
                      <tr key={index} className="hover:bg-soft-cloud/50 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-ink text-xs uppercase tracking-wide">{product.name}</td>
                        <td className="py-3.5 px-6 text-right text-ink text-xs font-bold">{product.quantitySold}</td>
                        <td className="py-3.5 px-6 text-right font-extrabold text-ink text-xs font-jakarta">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-canvas border border-hairline rounded-none overflow-hidden font-jakarta">
              <h2 className="text-xs font-bold text-ink mb-4 uppercase tracking-wider p-6 pb-2">Detail Transaksi</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-soft-cloud border-b border-hairline">
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">No. Order</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Tanggal</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Customer</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Items</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute">Metode</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-mute text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline font-inter">
                    {reportData.transactions.slice(0, 20).map((transaction, index) => (
                      <tr key={index} className="hover:bg-soft-cloud/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs font-bold text-ink">{transaction.orderNumber}</td>
                        <td className="py-3.5 px-6 text-mute text-[10px] font-bold uppercase">
                          {format(new Date(transaction.date), 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="py-3.5 px-6 text-xs font-bold text-ink uppercase tracking-wide">{transaction.customerName}</td>
                        <td className="py-3.5 px-6 text-charcoal text-xs max-w-xs truncate">
                          {transaction.items}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-hairline bg-canvas text-ink">
                            {transaction.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-extrabold text-ink text-xs font-jakarta">
                          {formatCurrency(transaction.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportData.transactions.length > 20 && (
                <p className="text-[10px] text-mute mt-4 mb-4 text-center font-bold uppercase tracking-wider">
                  Menampilkan 20 dari {reportData.transactions.length} transaksi. Download PDF untuk melihat semua data.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </OwnerShell>
  )
}
