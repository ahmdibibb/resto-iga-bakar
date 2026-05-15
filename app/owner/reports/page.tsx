'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, Calendar, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react'
import OwnerShell from '@/components/owner/OwnerShell'

export default function OwnerReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) fetchReport()
  }, [startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/owner/reports?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' })
      if (res.ok) {
        setReportData(await res.json())
        setError(null)
      } else {
        setError('Gagal memuat laporan')
      }
    } catch {
      setError('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/owner/reports/pdf?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `laporan-${startDate}-sd-${endDate}.pdf`
        document.body.appendChild(a); a.click()
        window.URL.revokeObjectURL(url); document.body.removeChild(a)
      } else {
        alert('Gagal download PDF')
      }
    } catch {
      alert('Gagal download PDF')
    }
  }

  const headerRight = (
    <button
      onClick={handleDownloadPDF}
      disabled={!reportData}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={15} />
      Download PDF
    </button>
  )

  const summaryCards = reportData ? [
    { label: 'Total Revenue', value: `Rp ${(reportData.totalRevenue || 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-900' },
    { label: 'Total Orders', value: reportData.totalOrders || 0, icon: ShoppingCart, color: 'from-emerald-500 to-emerald-600', bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', text: 'text-emerald-900' },
    { label: 'Produk Terjual', value: reportData.totalProductsSold || 0, icon: Package, color: 'from-violet-500 to-violet-600', bg: 'from-violet-50 to-violet-100', border: 'border-violet-200', text: 'text-violet-900' },
    { label: 'Avg Order Value', value: `Rp ${(reportData.averageOrderValue || 0).toLocaleString('id-ID')}`, icon: TrendingUp, color: 'from-orange-500 to-orange-600', bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-900' },
  ] : []

  return (
    <OwnerShell
      title="Reports"
      subtitle="Generate dan download laporan penjualan"
      headerRight={headerRight}
      onRefresh={fetchReport}
    >
      <div className="space-y-5">

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Date Range */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Calendar size={17} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Pilih Rentang Tanggal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal Akhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Memuat laporan...</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {reportData && !loading && (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {summaryCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className={`bg-gradient-to-br ${card.bg} rounded-2xl p-5 border ${card.border} shadow-sm`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">{card.label}</p>
                        <p className={`text-xl font-black ${card.text}`}>{card.value}</p>
                      </div>
                      <div className={`w-9 h-9 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon size={17} className="text-white" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Payment Method Breakdown */}
            {reportData.revenueByMethod && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">Breakdown Metode Bayar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(reportData.revenueByMethod).map(([method, amount]: [string, any]) => (
                    <div key={method} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-500 font-medium mb-1">{method}</p>
                      <p className="text-xl font-bold text-gray-900">Rp {amount.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Revenue */}
            {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Revenue Harian</h3>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                        <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                        <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.dailyRevenue.map((day: any) => (
                        <tr key={day.date} className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors">
                          <td className="py-3 px-5 text-sm text-gray-900">
                            {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-5 text-sm font-bold text-gray-900 text-right">
                            Rp {day.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-5 text-sm text-gray-600 text-right">{day.orders || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Sales */}
            {reportData.productSales && reportData.productSales.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Penjualan per Produk</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                        <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.productSales.map((product: any) => (
                        <tr key={product.productId} className="border-t border-gray-50 hover:bg-blue-50/20 transition-colors">
                          <td className="py-3 px-5 text-sm font-medium text-gray-900">{product.productName}</td>
                          <td className="py-3 px-5 text-sm text-gray-700 text-right font-semibold">{product.quantitySold}</td>
                          <td className="py-3 px-5 text-sm font-bold text-blue-700 text-right">
                            Rp {product.totalRevenue.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!reportData && !loading && !error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-blue-400" />
            </div>
            <p className="text-gray-700 font-semibold">Pilih rentang tanggal untuk generate laporan</p>
            <p className="text-sm text-gray-400 mt-1">Laporan akan muncul secara otomatis</p>
          </div>
        )}
      </div>
    </OwnerShell>
  )
}
