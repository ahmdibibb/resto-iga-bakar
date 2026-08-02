/**
 * WiFi Printer Library
 * 
 * Library untuk print ke network thermal printer via HTTP/Raw Socket
 * Support ESC/POS commands untuk printer thermal 58mm/80mm
 */

// ESC/POS Commands
const ESC = '\x1B'
const GS = '\x1D'

export interface WiFiPrinterConfig {
  ip: string
  port: string
}

export class WiFiPrinter {
  private config: WiFiPrinterConfig | null = null

  /**
   * Load printer config from localStorage
   */
  loadConfig(): WiFiPrinterConfig | null {
    const ip = localStorage.getItem('wifiPrinterIP')
    const port = localStorage.getItem('wifiPrinterPort')
    
    if (ip && port) {
      this.config = { ip, port }
      return this.config
    }
    return null
  }

  /**
   * Check if WiFi printer is configured
   */
  isConfigured(): boolean {
    return this.loadConfig() !== null
  }

  /**
   * Build ESC/POS command string for receipt
   */
  private buildReceiptCommands(orderData: {
    orderNumber: string
    customerName: string | null
    tableName: string | null
    orderType: string
    paymentMethod: string | null
    items: Array<{
      quantity: number
      product: { name: string }
    }>
    notes: string | null
    createdAt: string
  }): string {
    let commands = ''

    // Initialize
    commands += `${ESC}@`

    // Header - Restaurant Name
    commands += `${ESC}a${String.fromCharCode(1)}` // Center align
    commands += `${GS}!${String.fromCharCode(0x11)}` // Double size
    commands += `${ESC}E${String.fromCharCode(1)}` // Bold
    commands += 'RESTO IGA BAKAR\n'
    
    commands += `${GS}!${String.fromCharCode(0)}` // Normal size
    commands += `${ESC}E${String.fromCharCode(0)}` // Not bold
    commands += 'Struk Pesanan Kitchen\n\n'

    // Order Info
    commands += `${ESC}a${String.fromCharCode(0)}` // Left align
    commands += '================================\n'
    
    commands += `${ESC}E${String.fromCharCode(1)}` // Bold
    commands += `No: ${orderData.orderNumber}\n`
    commands += `${ESC}E${String.fromCharCode(0)}` // Not bold

    const date = new Date(orderData.createdAt).toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
    commands += `Tgl: ${date}\n`

    if (orderData.customerName) {
      commands += `Customer: ${orderData.customerName}\n`
    }

    if (orderData.tableName) {
      commands += `Meja: ${orderData.tableName}\n`
    }

    if (orderData.orderType === 'TAKEAWAY') {
      commands += `${ESC}E${String.fromCharCode(1)}` // Bold
      commands += 'Tipe: TAKEAWAY\n'
      commands += `${ESC}E${String.fromCharCode(0)}` // Not bold
    }

    if (orderData.paymentMethod) {
      commands += `Bayar: ${orderData.paymentMethod}\n`
    }

    // Items
    commands += '================================\n'
    commands += `${ESC}E${String.fromCharCode(1)}` // Bold
    commands += 'PESANAN:\n'
    commands += `${ESC}E${String.fromCharCode(0)}` // Not bold

    for (const item of orderData.items) {
      commands += `${item.quantity}x ${item.product.name}\n`
    }

    // Notes
    if (orderData.notes) {
      commands += '--------------------------------\n'
      commands += `${ESC}E${String.fromCharCode(1)}` // Bold
      commands += 'Catatan:\n'
      commands += `${ESC}E${String.fromCharCode(0)}` // Not bold
      commands += `${orderData.notes}\n`
    }

    // Footer
    commands += '================================\n'
    commands += `${ESC}a${String.fromCharCode(1)}` // Center align
    commands += 'Terima kasih!\n\n\n'

    // Cut paper
    commands += `${GS}V${String.fromCharCode(66)}${String.fromCharCode(0)}`

    return commands
  }

  /**
   * Print receipt via HTTP POST to printer server
   * 
   * Note: Ini memerlukan backend proxy karena browser tidak bisa langsung
   * connect ke raw socket printer. Alternative: gunakan print server software
   * di komputer yang terkoneksi dengan printer.
   */
  async printReceipt(orderData: {
    orderNumber: string
    customerName: string | null
    tableName: string | null
    orderType: string
    paymentMethod: string | null
    items: Array<{
      quantity: number
      product: { name: string }
    }>
    notes: string | null
    createdAt: string
  }): Promise<void> {
    const config = this.loadConfig()
    if (!config) {
      throw new Error('WiFi printer belum dikonfigurasi')
    }

    try {
      const commands = this.buildReceiptCommands(orderData)
      
      // Method 1: Try to send via backend proxy (if exists)
      // You need to create an API endpoint that forwards to the printer
      const response = await fetch('/api/print/wifi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP: config.ip,
          printerPort: config.port,
          commands: commands
        })
      })

      if (!response.ok) {
        throw new Error('Gagal mengirim print command ke printer')
      }

    } catch (error) {
      console.error('Error printing via WiFi:', error)
      
      // Fallback: Open print dialog dengan HTML
      // Ini akan menggunakan browser print ke network printer
      this.printViaHTMLFallback(orderData)
    }
  }

  /**
   * Fallback: Print via browser print dialog
   */
  private printViaHTMLFallback(orderData: {
    orderNumber: string
    customerName: string | null
    tableName: string | null
    orderType: string
    paymentMethod: string | null
    items: Array<{
      quantity: number
      product: { name: string }
    }>
    notes: string | null
    createdAt: string
  }): void {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print receipt')
      return
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pesanan - ${orderData.orderNumber}</title>
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
          <div><strong>No. Pesanan:</strong> ${orderData.orderNumber}</div>
          <div><strong>Tanggal:</strong> ${new Date(orderData.createdAt).toLocaleString('id-ID')}</div>
          <div><strong>Customer:</strong> ${orderData.customerName || 'Guest'}</div>
          ${orderData.tableName ? `<div><strong>Meja:</strong> ${orderData.tableName}</div>` : ''}
          ${orderData.orderType === 'TAKEAWAY' ? '<div><strong>Tipe:</strong> Takeaway</div>' : ''}
          <div><strong>Pembayaran:</strong> ${orderData.paymentMethod || 'N/A'}</div>
        </div>
        
        <div class="items">
          <div style="font-weight: bold; margin-bottom: 5px;">PESANAN:</div>
          ${orderData.items.map(item => `
            <div class="item">
              ${item.quantity}x ${item.product.name}
            </div>
          `).join('')}
        </div>
        
        ${orderData.notes ? `
          <div class="notes">
            <strong>Catatan:</strong><br/>
            ${orderData.notes}
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
  }
}

// Singleton instance
let wifiPrinterInstance: WiFiPrinter | null = null

export function getWiFiPrinter(): WiFiPrinter {
  if (!wifiPrinterInstance) {
    wifiPrinterInstance = new WiFiPrinter()
  }
  return wifiPrinterInstance
}
