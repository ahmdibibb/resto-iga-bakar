'use client'

/**
 * PrinterSettings Component
 * 
 * Komponen untuk manage pairing dan koneksi thermal printer
 * via Web Bluetooth API
 */

import { useState, useEffect } from 'react'
import { Bluetooth, Printer, Check, X, Loader2 } from 'lucide-react'
import { getThermalPrinter } from '@/lib/thermalPrinter'

interface PrinterSettingsProps {
  onClose?: () => void
}

export default function PrinterSettings({ onClose }: PrinterSettingsProps) {
  const [connectionType, setConnectionType] = useState<'bluetooth' | 'wifi'>('bluetooth')
  const [pairedPrinter, setPairedPrinter] = useState<{ id: string; name: string } | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // WiFi printer settings
  const [printerIP, setPrinterIP] = useState('')
  const [printerPort, setPrinterPort] = useState('9100')

  const printer = getThermalPrinter()

  useEffect(() => {
    // Load connection type
    const savedType = localStorage.getItem('printerConnectionType') as 'bluetooth' | 'wifi' | null
    if (savedType) {
      setConnectionType(savedType)
    }

    // Load paired printer info (Bluetooth)
    const info = printer.getPairedPrinterInfo()
    setPairedPrinter(info)
    setIsConnected(printer.getConnectionStatus())

    // Load WiFi printer settings
    const savedIP = localStorage.getItem('wifiPrinterIP')
    const savedPort = localStorage.getItem('wifiPrinterPort')
    if (savedIP) setPrinterIP(savedIP)
    if (savedPort) setPrinterPort(savedPort)
  }, [])

  const handlePair = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const device = await printer.pair()
      await printer.connect(device)

      const info = printer.getPairedPrinterInfo()
      setPairedPrinter(info)
      setIsConnected(true)
      setSuccess('Printer berhasil di-pair dan connected!')
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan pairing')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await printer.connect()
      setIsConnected(true)
      setSuccess('Berhasil connect ke printer!')
    } catch (err: any) {
      setError(err.message || 'Gagal connect ke printer')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await printer.disconnect()
      setIsConnected(false)
      setSuccess('Printer disconnected')
    } catch (err: any) {
      setError(err.message || 'Gagal disconnect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnpair = () => {
    printer.unpair()
    setPairedPrinter(null)
    setIsConnected(false)
    setSuccess('Printer unpaired')
  }

  const handleSaveWiFiPrinter = () => {
    if (!printerIP) {
      setError('IP Address harus diisi')
      return
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(printerIP)) {
      setError('Format IP Address tidak valid (contoh: 192.168.1.100)')
      return
    }

    // Save to localStorage
    localStorage.setItem('wifiPrinterIP', printerIP)
    localStorage.setItem('wifiPrinterPort', printerPort)
    localStorage.setItem('printerConnectionType', 'wifi')
    
    setConnectionType('wifi')
    setSuccess('Printer WiFi berhasil disimpan!')
    setError(null)
  }

  const handleTestWiFiPrinter = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Test connection to printer
      const response = await fetch(`http://${printerIP}:${printerPort}`, {
        method: 'HEAD',
        mode: 'no-cors'
      })
      
      setSuccess('Koneksi ke printer berhasil! (Test mode)')
      setIsLoading(false)
    } catch (err) {
      setError('Gagal connect ke printer. Pastikan IP dan Port benar, dan printer menyala.')
      setIsLoading(false)
    }
  }

  const handleRemoveWiFiPrinter = () => {
    localStorage.removeItem('wifiPrinterIP')
    localStorage.removeItem('wifiPrinterPort')
    setPrinterIP('')
    setPrinterPort('9100')
    setSuccess('Printer WiFi dihapus')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="bg-canvas border-2 border-hairline w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="border-b border-hairline px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer className="text-ink" size={24} />
            <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink">
              Pengaturan Printer
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-charcoal hover:text-ink transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Connection Type Tabs */}
          <div className="flex gap-2 bg-soft-cloud p-1 rounded-full border border-hairline">
            <button
              onClick={() => setConnectionType('bluetooth')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold uppercase text-xs tracking-wider transition-all ${
                connectionType === 'bluetooth'
                  ? 'bg-ink text-canvas'
                  : 'text-charcoal hover:text-ink'
              }`}
            >
              <Bluetooth size={14} />
              <span>Bluetooth</span>
            </button>
            <button
              onClick={() => setConnectionType('wifi')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold uppercase text-xs tracking-wider transition-all ${
                connectionType === 'wifi'
                  ? 'bg-ink text-canvas'
                  : 'text-charcoal hover:text-ink'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13a10 10 0 0 1 14 0"></path>
                <path d="M8.5 16.5a5 5 0 0 1 7 0"></path>
                <path d="M2 8.82a15 15 0 0 1 20 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
              <span>WiFi</span>
            </button>
          </div>

          {/* Bluetooth Settings */}
          {connectionType === 'bluetooth' && (
            <>
          {/* Status Section */}
          <div className="bg-soft-cloud border border-hairline p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bluetooth className="text-ink" size={20} />
              <h3 className="font-bold font-jakarta uppercase text-sm text-ink">
                Status Koneksi
              </h3>
            </div>

            {pairedPrinter ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal">Printer:</span>
                  <span className="text-sm font-semibold text-ink">{pairedPrinter.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal">Status:</span>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-semibold text-green-700">Connected</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-ash" />
                        <span className="text-sm font-semibold text-charcoal">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-charcoal">
                Belum ada printer yang di-pair
              </p>
            )}
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-4 flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Browser Support Check */}
          {typeof window !== 'undefined' && !navigator.bluetooth && (
            <div className="bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Perhatian:</strong> Browser Anda tidak mendukung Web Bluetooth API. 
                Gunakan Chrome, Edge, atau Opera untuk fitur ini.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-charcoal space-y-2">
            <p className="font-semibold text-ink">Cara Pairing:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Nyalakan printer dan aktifkan mode Bluetooth</li>
              <li>Klik tombol "Pair Printer Baru"</li>
              <li>Pilih printer dari daftar yang muncul</li>
              <li>Setelah paired, printer akan otomatis connect</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!pairedPrinter ? (
              <button
                onClick={handlePair}
                disabled={isLoading || (typeof window !== 'undefined' && !navigator.bluetooth)}
                className="w-full flex items-center justify-center gap-2 bg-ink text-canvas px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-charcoal disabled:bg-ash disabled:cursor-not-allowed border border-ink disabled:border-ash"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Pairing...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth size={18} />
                    <span>Pair Printer Baru</span>
                  </>
                )}
              </button>
            ) : (
              <>
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-green-700 disabled:bg-ash disabled:cursor-not-allowed border border-green-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Bluetooth size={18} />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-charcoal text-canvas px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-ash disabled:bg-ash disabled:cursor-not-allowed border border-charcoal"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Disconnecting...</span>
                      </>
                    ) : (
                      <span>Disconnect</span>
                    )}
                  </button>
                )}

                <button
                  onClick={handleUnpair}
                  disabled={isLoading}
                  className="w-full bg-canvas text-sale border border-sale px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unpair Printer
                </button>
              </>
            )}
          </div>
            </>
          )}

          {/* WiFi Settings */}
          {connectionType === 'wifi' && (
            <>
              {/* WiFi Printer Form */}
              <div className="bg-soft-cloud border border-hairline p-4 space-y-4">
                <h3 className="font-bold font-jakarta uppercase text-sm text-ink">
                  Network Printer Settings
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1 uppercase tracking-wide">
                      IP Address *
                    </label>
                    <input
                      type="text"
                      value={printerIP}
                      onChange={(e) => setPrinterIP(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 border border-hairline bg-canvas text-ink text-sm focus:outline-none focus:border-ink"
                    />
                    <p className="text-xs text-charcoal mt-1">
                      Masukkan IP Address printer di network
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1 uppercase tracking-wide">
                      Port
                    </label>
                    <input
                      type="text"
                      value={printerPort}
                      onChange={(e) => setPrinterPort(e.target.value)}
                      placeholder="9100"
                      className="w-full px-3 py-2 border border-hairline bg-canvas text-ink text-sm focus:outline-none focus:border-ink"
                    />
                    <p className="text-xs text-charcoal mt-1">
                      Default: 9100 (RAW printing)
                    </p>
                  </div>
                </div>

                {printerIP && (
                  <div className="pt-2 border-t border-hairline">
                    <p className="text-xs text-charcoal">
                      <strong>Printer URL:</strong> {printerIP}:{printerPort}
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-sm text-charcoal space-y-2">
                <p className="font-semibold text-ink">Cara Setup WiFi Printer:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Connect printer ke WiFi network yang sama</li>
                  <li>Cari IP Address printer (cek di printer settings atau print test page)</li>
                  <li>Masukkan IP Address di form atas</li>
                  <li>Test koneksi, lalu simpan</li>
                </ol>
              </div>

              {/* WiFi Action Buttons */}
              <div className="space-y-3">
                {!localStorage.getItem('wifiPrinterIP') || printerIP !== localStorage.getItem('wifiPrinterIP') ? (
                  <>
                    <button
                      onClick={handleTestWiFiPrinter}
                      disabled={!printerIP || isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-canvas text-ink border-2 border-ink px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-soft-cloud disabled:bg-ash disabled:border-ash disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Test Connection</span>
                      )}
                    </button>
                    <button
                      onClick={handleSaveWiFiPrinter}
                      disabled={!printerIP || isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-ink text-canvas px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-charcoal disabled:bg-ash disabled:cursor-not-allowed border border-ink disabled:border-ash"
                    >
                      <span>Simpan Printer</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleRemoveWiFiPrinter}
                    disabled={isLoading}
                    className="w-full bg-canvas text-sale border border-sale px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hapus Printer WiFi
                  </button>
                )}
              </div>
            </>
          )}

          {/* Alert Messages - Always visible */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-4 flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
