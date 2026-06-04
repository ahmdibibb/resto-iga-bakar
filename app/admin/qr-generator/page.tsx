'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Printer, QrCode, UtensilsCrossed, ShoppingBag, RefreshCw } from 'lucide-react'
import html2canvas from 'html2canvas'
import AdminShell from '@/components/admin/AdminShell'

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
    <AdminShell activeTab="qr" title="QR Code Generator">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-charcoal font-medium">
          Kelola dan cetak QR Code untuk setiap meja di restoran.
        </p>
        <button
          onClick={fetchTables}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-canvas text-xs font-semibold hover:bg-charcoal active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-ink border-t-transparent"></div>
          <p className="mt-4 text-charcoal font-medium">Memuat data meja...</p>
        </div>
      )}

      {/* Tables List */}
      {!loading && tables.length === 0 && (
        <div className="py-12 text-center bg-soft-cloud border border-hairline">
          <QrCode size={64} className="mx-auto text-charcoal mb-4" />
          <p className="text-ink text-lg font-bold font-jakarta uppercase tracking-tight">Tidak ada meja yang tersedia.</p>
          <p className="text-charcoal text-sm mt-2">Silakan tambahkan meja terlebih dahulu.</p>
        </div>
      )}

      {!loading && tables.length > 0 && (
        <div>
          {/* TAKEAWAY QR Code Section */}
          {takeawayTable && (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-2 flex items-center gap-2">
                  <ShoppingBag size={24} className="text-ink" />
                  QR Code Takeaway
                </h2>
                <p className="text-charcoal text-sm">
                  QR code khusus untuk pesanan takeaway (dibawa pulang).
                </p>
              </div>

              <div className="max-w-md">
                {(() => {
                  const table = takeawayTable
                  const hasQR = qrData[table.id]
                  const qrUrl = hasQR ? qrData[table.id].table.qr_url : `${baseUrl}/menu?takeaway=true&token=${table.qr_token}`

                  return (
                    <div className="rounded-none bg-soft-cloud p-6 border border-hairline shadow-none">
                      {/* QR Code Preview */}
                      {hasQR ? (
                        <div className="mb-4">
                          <div id={`qr-${table.id}`} className="flex flex-col items-center justify-center bg-canvas p-4 rounded-none border border-hairline">
                            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-canvas">
                              <ShoppingBag size={14} className="text-canvas" />
                              <span className="text-xs font-bold uppercase tracking-wider font-jakarta">TAKEAWAY</span>
                            </div>
                            <QRCodeSVG
                              value={qrUrl}
                              size={200}
                              level="H"
                              includeMargin={true}
                              fgColor="#15110F"
                            />
                            <p className="text-sm font-bold font-jakarta uppercase tracking-tight text-ink mt-2">Takeaway Order</p>
                          </div>
                          <p className="text-xs text-charcoal mt-2 break-all font-medium">{qrUrl}</p>
                        </div>
                      ) : (
                        <div className="mb-4 flex items-center justify-center bg-canvas rounded-none border border-dashed border-hairline h-64">
                          <div className="text-center">
                            <QrCode size={48} className="mx-auto text-charcoal mb-2" />
                            <p className="text-charcoal text-sm font-medium">QR Code belum di-generate</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!hasQR ? (
                          <button
                            onClick={() => handleGenerateQR(table.id)}
                            disabled={generatingQR === table.id}
                            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {generatingQR === table.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-canvas border-t-transparent"></div>
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
                              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
                            >
                              <Download size={18} />
                              Download QR Code
                            </button>
                            <button
                              onClick={() => handleGenerateQR(table.id)}
                              disabled={generatingQR === table.id}
                              className="px-4 py-3 rounded-full bg-soft-cloud text-ink font-semibold hover:bg-hairline-soft transition-all border border-hairline active:scale-95"
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
          <div className="mb-6 border-t border-hairline pt-8">
            <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-2 flex items-center gap-2">
              <UtensilsCrossed size={24} className="text-ink" />
              Daftar Meja ({regularTables.length} meja)
            </h2>
            <p className="text-charcoal text-sm">
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
                  className="rounded-none bg-canvas p-6 border border-hairline shadow-none"
                >
                  {/* Table Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <UtensilsCrossed size={20} className="text-ink" />
                    <h3 className="text-lg font-bold font-jakarta text-ink">{table.name}</h3>
                  </div>

                  {/* QR Code Preview */}
                  {hasQR ? (
                    <div className="mb-4">
                      <div id={`qr-${table.id}`} className="flex flex-col items-center justify-center bg-canvas p-4 rounded-none border border-hairline">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-canvas">
                          <UtensilsCrossed size={14} className="text-canvas" />
                          <span className="text-xs font-bold font-jakarta uppercase tracking-wider">{table.name}</span>
                        </div>
                        <QRCodeSVG
                          value={qrUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                          fgColor="#15110F"
                        />
                        <p className="text-sm font-bold font-jakarta uppercase tracking-tight text-ink mt-2">{table.name}</p>
                      </div>
                      <p className="text-xs text-charcoal mt-2 break-all font-medium">{qrUrl}</p>
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center justify-center bg-soft-cloud rounded-none border border-dashed border-hairline h-64">
                      <div className="text-center">
                        <QrCode size={48} className="mx-auto text-charcoal mb-2" />
                        <p className="text-charcoal text-sm font-medium">QR Code belum di-generate</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!hasQR ? (
                      <button
                        onClick={() => handleGenerateQR(table.id)}
                        disabled={generatingQR === table.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {generatingQR === table.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-canvas border-t-transparent"></div>
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
                          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-canvas font-semibold hover:bg-ink/90 active:scale-95 transition-all"
                        >
                          <Download size={18} />
                          Download QR Code
                        </button>
                        <button
                          onClick={() => handleGenerateQR(table.id)}
                          disabled={generatingQR === table.id}
                          className="px-4 py-3 rounded-full bg-soft-cloud text-ink font-semibold hover:bg-hairline-soft border border-hairline active:scale-95 transition-all"
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
    </AdminShell>
  )
}
