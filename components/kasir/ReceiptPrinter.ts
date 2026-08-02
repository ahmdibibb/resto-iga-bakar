/**
 * ReceiptPrinter — Utility untuk mencetak struk pesanan
 * 
 * Mendukung 3 metode print:
 * 1. Bluetooth Thermal Printer (via Web Bluetooth API + ESC/POS)
 * 2. WiFi Network Thermal Printer (via HTTP/ESC/POS)
 * 3. Browser Print Dialog (fallback untuk printer USB/Network)
 * 
 * Fungsi ini juga menandai order sebagai "printed" di backend
 * melalui API endpoint PATCH /api/orders/[id]/print.
 */

import { getThermalPrinter } from '@/lib/thermalPrinter'
import { getWiFiPrinter } from '@/lib/wifiPrinter'
import type { Order } from './types'

/**
 * Mencetak struk pesanan ke printer thermal dan menandai order sebagai dicetak.
 * 
 * @param order - Data order yang akan dicetak struknya
 * @param onPrinted - Callback setelah order berhasil ditandai sebagai dicetak
 */
export async function printReceipt(
  order: Order,
  onPrinted?: () => void
): Promise<void> {
  // Check connection type preference
  const connectionType = localStorage.getItem('printerConnectionType') as 'bluetooth' | 'wifi' | null

  // Prepare receipt data
  const receiptData = {
    orderNumber: order.orderNumber,
    customerName: order.customerName || order.user?.name || null,
    tableName: order.table?.name || null,
    orderType: order.orderType,
    paymentMethod: order.payment_method || null,
    items: order.items,
    notes: order.notes,
    createdAt: order.createdAt
  }

  // Method 1: Print via WiFi Network Printer
  if (connectionType === 'wifi') {
    const wifiPrinter = getWiFiPrinter()
    
    if (wifiPrinter.isConfigured()) {
      try {
        await wifiPrinter.printReceipt(receiptData)

        // Mark order as printed
        await markOrderAsPrinted(order.id)

        if (onPrinted) {
          onPrinted()
        }

        return
      } catch (error) {
        console.error('Error printing via WiFi:', error)
        
        // Ask user if want to retry or use browser print
        const retry = confirm(
          'Gagal print via WiFi printer.\n\n' +
          'Klik OK untuk coba lagi, atau Cancel untuk print via browser.'
        )

        if (retry) {
          return printReceipt(order, onPrinted)
        }
        // Fall through to browser print method
      }
    }
  }

  // Method 2: Print via Bluetooth Thermal Printer
  if (connectionType === 'bluetooth' || !connectionType) {
    const printer = getThermalPrinter()
    const pairedPrinter = printer.getPairedPrinterInfo()

    if (pairedPrinter && navigator.bluetooth) {
      try {
        // Connect jika belum connected
        if (!printer.getConnectionStatus()) {
          await printer.connect()
        }

        // Print receipt
        await printer.printReceipt(receiptData)

        // Mark order as printed
        await markOrderAsPrinted(order.id)

        if (onPrinted) {
          onPrinted()
        }

        return
      } catch (error) {
        console.error('Error printing via Bluetooth:', error)
        
        // Ask user if want to retry or use browser print
        const retry = confirm(
          'Gagal print via Bluetooth printer.\n\n' +
          'Klik OK untuk coba lagi, atau Cancel untuk print via browser.'
        )

        if (retry) {
          return printReceipt(order, onPrinted)
        }
        // Fall through to browser print method
      }
    }
  }

  // Method 3: Browser Print Dialog (fallback)
  printViaBrowser(order, onPrinted)
}

/**
 * Print via browser print dialog (fallback method)
 */
function printViaBrowser(order: Order, onPrinted?: () => void): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print receipt')
    return
  }

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Pesanan - ${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          width: 80mm;
          margin: 0 auto;
          padding: 10px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
        }
        .order-info {
          margin: 10px 0;
          font-size: 12px;
        }
        .items {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 12px;
        }
        .notes {
          margin: 10px 0;
          padding: 5px;
          background: #f0f0f0;
          font-size: 11px;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 11px;
        }
        @media print {
          body { width: 80mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">RESTO IGA BAKAR</div>
        <div>Struk Pesanan Kitchen</div>
      </div>
      
      <div class="order-info">
        <div><strong>No. Pesanan:</strong> ${order.orderNumber}</div>
        <div><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</div>
        <div><strong>Customer:</strong> ${order.customerName || order.user?.name || 'Guest'}</div>
        ${order.table ? `<div><strong>Meja:</strong> ${order.table.name}</div>` : ''}
        ${order.orderType === 'TAKEAWAY' ? '<div><strong>Tipe:</strong> Takeaway</div>' : ''}
        <div><strong>Pembayaran:</strong> ${order.payment_method || 'N/A'}</div>
      </div>
      
      <div class="items">
        <div style="font-weight: bold; margin-bottom: 5px;">PESANAN:</div>
        ${order.items.map(item => `
          <div class="item">
            <span>${item.quantity}x ${item.product.name}</span>
          </div>
        `).join('')}
      </div>
      
      ${order.notes ? `
        <div class="notes">
          <strong>Catatan:</strong><br/>
          ${order.notes}
        </div>
      ` : ''}
      
      <div class="footer">
        <div>Terima kasih!</div>
        <div style="margin-top: 10px;">---</div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          }
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(receiptHTML)
  printWindow.document.close()

  // Mark order as printed after print dialog
  markOrderAsPrinted(order.id).then(() => {
    if (onPrinted) {
      onPrinted()
    }
  })
}

/**
 * Mark order as printed via API
 */
async function markOrderAsPrinted(orderId: string): Promise<void> {
  try {
    const res = await fetch(`/api/orders/${orderId}/print`, {
      method: 'PATCH',
    })

    if (!res.ok) {
      console.error('Failed to mark order as printed')
    }
  } catch (error) {
    console.error('Error marking order as printed:', error)
  }
}
