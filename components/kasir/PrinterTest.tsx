'use client'

/**
 * PrinterTest Component
 * 
 * Komponen untuk testing koneksi dan print thermal printer
 * Useful untuk debugging dan validation
 */

import { useState } from 'react'
import { Printer, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getThermalPrinter } from '@/lib/thermalPrinter'

export default function PrinterTest() {
  const [status, setStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Array<{ test: string; result: 'pass' | 'fail' | 'pending' }>>([])

  const printer = getThermalPrinter()

  const addTestResult = (test: string, result: 'pass' | 'fail') => {
    setTestResults(prev => [...prev, { test, result }])
  }

  const runFullTest = async () => {
    setIsLoading(true)
    setTestResults([])
    setStatus('Starting tests...')

    try {
      // Test 1: Check Web Bluetooth support
      setStatus('Test 1/5: Checking Web Bluetooth support...')
      if (!navigator.bluetooth) {
        addTestResult('Web Bluetooth API Support', 'fail')
        setStatus('❌ Browser does not support Web Bluetooth API')
        setIsLoading(false)
        return
      }
      addTestResult('Web Bluetooth API Support', 'pass')

      // Test 2: Check paired printer
      setStatus('Test 2/5: Checking paired printer...')
      const pairedInfo = printer.getPairedPrinterInfo()
      if (!pairedInfo) {
        addTestResult('Paired Printer Found', 'fail')
        setStatus('❌ No paired printer. Please pair first.')
        setIsLoading(false)
        return
      }
      addTestResult('Paired Printer Found', 'pass')
      setStatus(`Found: ${pairedInfo.name}`)

      // Test 3: Connect to printer
      setStatus('Test 3/5: Connecting to printer...')
      try {
        await printer.connect()
        addTestResult('Printer Connection', 'pass')
      } catch (err) {
        addTestResult('Printer Connection', 'fail')
        setStatus('❌ Failed to connect to printer')
        setIsLoading(false)
        return
      }

      // Test 4: Check connection status
      setStatus('Test 4/5: Verifying connection...')
      const isConnected = printer.getConnectionStatus()
      if (isConnected) {
        addTestResult('Connection Status', 'pass')
      } else {
        addTestResult('Connection Status', 'fail')
        setStatus('❌ Connection verification failed')
        setIsLoading(false)
        return
      }

      // Test 5: Test print
      setStatus('Test 5/5: Sending test print...')
      try {
        await printer.printReceipt({
          orderNumber: 'TEST-001',
          customerName: 'Test Customer',
          tableName: 'Test Table',
          orderType: 'DINE_IN',
          paymentMethod: 'CASH',
          items: [
            { quantity: 1, product: { name: 'Test Item 1' } },
            { quantity: 2, product: { name: 'Test Item 2' } },
          ],
          notes: 'This is a test print',
          createdAt: new Date().toISOString()
        })
        addTestResult('Test Print', 'pass')
        setStatus('✅ All tests passed! Printer is working correctly.')
      } catch (err) {
        addTestResult('Test Print', 'fail')
        setStatus('❌ Test print failed')
      }

    } catch (error) {
      console.error('Test error:', error)
      setStatus('❌ Test failed with error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-canvas border-2 border-hairline p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6 border-b border-hairline pb-4">
        <Printer className="text-ink" size={28} />
        <div>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink">
            Printer Test Suite
          </h2>
          <p className="text-xs text-charcoal mt-1">
            Diagnostic tool untuk testing koneksi printer
          </p>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mb-6 p-4 border ${
          status.includes('❌') 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : status.includes('✅')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <p className="text-sm font-semibold">{status}</p>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-bold font-jakarta uppercase text-ink mb-3">Test Results:</h3>
          {testResults.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-soft-cloud border border-hairline"
            >
              <span className="text-sm text-charcoal">{result.test}</span>
              {result.result === 'pass' ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={runFullTest}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-ink text-canvas px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all hover:bg-charcoal disabled:bg-ash disabled:cursor-not-allowed border border-ink"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <Printer size={18} />
              <span>Run Full Test</span>
            </>
          )}
        </button>

        <div className="bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Test akan melakukan print test ke printer. 
            Pastikan printer menyala dan sudah di-pair sebelum run test.
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 pt-6 border-t border-hairline">
        <h4 className="text-xs font-bold font-jakarta uppercase text-ink mb-2">Test Checklist:</h4>
        <ul className="text-xs text-charcoal space-y-1">
          <li>✓ Web Bluetooth API support</li>
          <li>✓ Printer pairing status</li>
          <li>✓ Bluetooth connection</li>
          <li>✓ Connection verification</li>
          <li>✓ Test print output</li>
        </ul>
      </div>
    </div>
  )
}
