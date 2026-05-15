'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Download, Printer, QrCode, UtensilsCrossed, ShoppingBag, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import html2canvas from 'html2canvas'

interface Table {
  id: string
  name: string
  qr_token: string
  status: 'AVAILABLE' | 'OCCUPIED'
  createdAt: string
  updatedAt: string
}

interface QRData {
  table: {
    id: string
    name: string
    qr_token: string
    qr_url: string
    status: 'AVAILABLE' | 'OCCUPIED'
  }
}

export default function QRGeneratorPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)
  const [qrData, setQrData] = useState<Record<string, QRData>>({})
  const [baseUrl, setBaseUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  )

  // Fetch all tables on page load
  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/tables')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables')
      }

      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error('Error fetching tables:', error)
      alert('Gagal memuat data meja. Silakan refresh halaman.')
    } finally {
      setLoading(false)
    }
  }

  // Separate tables and takeaway
  const regularTables = tables.filter(table => table.name !== 'TAKEAWAY')
  const takeawayTable = tables.find(table => table.name === 'TAKEAWAY')

  const handleGenerateQR = async (tableId: string) => {
    try {
      setGeneratingQR(tableId)
      const response = await fetch('/api/admin/tables/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableId })
      })

      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data: QRData = await response.json()
      setQrData(prev => ({
        ...prev,
        [tableId]: data
      }))
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Gagal generate QR code. Silakan coba lagi.')
    } finally {
      setGeneratingQR(null)
    }
  }

  const handleDownloadQR = async (tableId: string, tableName: string) => {
    try {
      const qrElement = document.getElementById(`qr-${tableId}`)
      if (!qrElement) {
        alert('QR code tidak ditemukan. Silakan generate QR code terlebih dahulu.')
        return
      }

      // Use html2canvas to convert QR code to image
      const canvas = await html2canvas(qrElement, {
        backgroundColor: '#ffffff',
        scale: 2 // Higher quality
      })

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr-${tableName.replace(/\s+/g, '-')}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Gagal download QR code. Silakan coba lagi.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Kembali</span>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                QR Code Generator
              </h1>
            </div>
            <button
              onClick={fetchTables}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data meja...</p>
        </div>
      )}

      {/* Tables List */}
      {!loading && tables.length === 0 && (
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Tidak ada meja yang tersedia.</p>
          <p className="text-gray-500 text-sm mt-2">Silakan tambahkan meja terlebih dahulu.</p>
        </div>
      )}

      {!loading && tables.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* TAKEAWAY QR Code Section */}
          {takeawayTable && (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ShoppingBag size={24} className="text-purple-600" />
                  QR Code Takeaway
                </h2>
                <p className="text-gray-600 text-sm">
                  QR code khusus untuk pesanan takeaway (dibawa pulang).
                </p>
              </div>

              <div className="max-w-md">
                {(() => {
                  const table = takeawayTable
                  const hasQR = qrData[table.id]
                  const qrUrl = hasQR ? qrData[table.id].table.qr_url : `${baseUrl}/menu?takeaway=true&token=${table.qr_token}`

                  return (
                    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg border-2 border-purple-200">
                      {/* QR Code Preview */}
                      {hasQR ? (
                        <div className="mb-4">
                          <div id={`qr-${table.id}`} className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border-2 border-purple-300">
                            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
                              <ShoppingBag size={14} className="text-purple-600" />
                              <span className="text-xs font-bold text-purple-700">TAKEAWAY</span>
                            </div>
                            <QRCodeSVG
                              value={qrUrl}
                              size={200}
                              level="H"
                              includeMargin={true}
                              fgColor="#9333ea"
                            />
                            <p className="text-sm font-bold text-gray-900 mt-2">Takeaway Order</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 break-all">{qrUrl}</p>
                        </div>
                      ) : (
                        <div className="mb-4 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-purple-300 h-64">
                          <div className="text-center">
                            <QrCode size={48} className="mx-auto text-purple-400 mb-2" />
                            <p className="text-gray-500 text-sm">QR Code belum di-generate</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!hasQR ? (
                          <button
                            onClick={() => handleGenerateQR(table.id)}
                            disabled={generatingQR === table.id}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
                          >
                            {generatingQR === table.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <QrCode size={18} />
                                Generate QR
                              </>
                            )}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDownloadQR(table.id, 'TAKEAWAY')}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                            >
                              <Download size={18} />
                              Download QR Code
                            </button>
                            <button
                              onClick={() => handleGenerateQR(table.id)}
                              disabled={generatingQR === table.id}
                              className="px-4 py-3 rounded-xl bg-white text-purple-700 font-semibold hover:bg-purple-50 transition-all border-2 border-purple-200"
                              title="Regenerate QR"
                            >
                              <RefreshCw size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Regular Tables Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <UtensilsCrossed size={24} className="text-orange-600" />
              Daftar Meja ({regularTables.length} meja)
            </h2>
            <p className="text-gray-600 text-sm">
              Klik "Generate QR" untuk membuat QR code, lalu klik "Download QR Code" untuk menyimpan sebagai gambar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularTables.map((table) => {
              const hasQR = qrData[table.id]
              const qrUrl = hasQR ? qrData[table.id].table.qr_url : `${baseUrl}/menu?table=${table.id}&token=${table.qr_token}`

              return (
                <div
                  key={table.id}
                  className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100"
                >
                  {/* Table Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <UtensilsCrossed size={20} className="text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900">{table.name}</h3>
                  </div>

                  {/* QR Code Preview */}
                  {hasQR ? (
                    <div className="mb-4">
                      <div id={`qr-${table.id}`} className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border-2 border-gray-200">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1">
                          <UtensilsCrossed size={14} className="text-orange-600" />
                          <span className="text-xs font-bold text-orange-700">{table.name}</span>
                        </div>
                        <QRCodeSVG
                          value={qrUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                          fgColor="#ea580c"
                        />
                        <p className="text-sm font-bold text-gray-900 mt-2">{table.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 break-all">{qrUrl}</p>
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 h-64">
                      <div className="text-center">
                        <QrCode size={48} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">QR Code belum di-generate</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!hasQR ? (
                      <button
                        onClick={() => handleGenerateQR(table.id)}
                        disabled={generatingQR === table.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50"
                      >
                        {generatingQR === table.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <QrCode size={18} />
                            Generate QR
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDownloadQR(table.id, table.name)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                        >
                          <Download size={18} />
                          Download QR Code
                        </button>
                        <button
                          onClick={() => handleGenerateQR(table.id)}
                          disabled={generatingQR === table.id}
                          className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
                          title="Regenerate QR"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
