/**
 * ReceiptPrinter — Utility untuk mencetak struk pesanan
 * 
 * Membuka jendela popup baru berisi layout struk thermal 80mm,
 * lalu otomatis memicu dialog print browser. Setelah cetak,
 * jendela popup ditutup secara otomatis.
 * 
 * Fungsi ini juga menandai order sebagai "printed" di backend
 * melalui API endpoint PATCH /api/orders/[id]/print.
 */

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
  try {
    const res = await fetch(`/api/orders/${order.id}/print`, {
      method: 'PATCH',
    })

    if (res.ok && onPrinted) {
      onPrinted()
    }
  } catch (error) {
    console.error('Error marking order as printed:', error)
  }
}
