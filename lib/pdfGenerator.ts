import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

export async function generatePDF(
  data: ReportData,
  startDate: Date,
  endDate: Date
) {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
        return true
      }
      return false
    }

    // Header
    doc.setFillColor(249, 115, 22) // Orange
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('RESTO IGA BAKAR', pageWidth / 2, 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Laporan Penjualan', pageWidth / 2, 25, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(
      `Periode: ${format(startDate, 'dd MMMM yyyy', { locale: id })} - ${format(endDate, 'dd MMMM yyyy', { locale: id })}`,
      pageWidth / 2,
      32,
      { align: 'center' }
    )

    yPosition = 50

    // Summary Section
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Ringkasan', 14, yPosition)
    yPosition += 10

    // Summary boxes
    const summaryData = [
      { label: 'Total Pendapatan', value: formatCurrency(data.summary.totalRevenue) },
      { label: 'Total Order', value: data.summary.totalOrders.toString() },
      { label: 'Produk Terjual', value: data.summary.totalProductsSold.toString() },
      { label: 'Rata-rata Nilai Order', value: formatCurrency(data.summary.averageOrderValue) }
    ]

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    summaryData.forEach((item, index) => {
      const x = 14 + (index % 2) * 90
      const y = yPosition + Math.floor(index / 2) * 25
      
      // Box
      doc.setFillColor(249, 250, 251)
      doc.setDrawColor(229, 231, 235)
      doc.roundedRect(x, y, 85, 20, 3, 3, 'FD')
      
      // Label
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(9)
      doc.text(item.label, x + 5, y + 8)
      
      // Value
      doc.setTextColor(249, 115, 22)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(item.value, x + 5, y + 16)
      doc.setFont('helvetica', 'normal')
    })

    yPosition += 60

    // Top Products Section
    checkPageBreak(60)
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Top 5 Produk Terlaris', 14, yPosition)
    yPosition += 5

    autoTable(doc, {
      startY: yPosition,
      head: [['Produk', 'Qty Terjual', 'Total Revenue']],
      body: data.topProducts.map(product => [
        product.name,
        product.quantitySold.toString(),
        formatCurrency(product.totalRevenue)
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 45, halign: 'right' }
      }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 15

    // Transactions Section - New Page
    doc.addPage()
    yPosition = 20

    // Header for transactions page
    doc.setFillColor(249, 115, 22)
    doc.rect(0, 0, pageWidth, 30, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Detail Transaksi', pageWidth / 2, 20, { align: 'center' })

    yPosition = 40

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Daftar Transaksi', 14, yPosition)
    yPosition += 5

    autoTable(doc, {
      startY: yPosition,
      head: [['No. Order', 'Tanggal', 'Customer', 'Items', 'Metode', 'Total']],
      body: data.transactions.map(transaction => [
        transaction.orderNumber,
        format(new Date(transaction.date), 'dd/MM/yy HH:mm'),
        transaction.customerName,
        transaction.items.length > 40 ? transaction.items.substring(0, 37) + '...' : transaction.items,
        transaction.paymentMethod,
        formatCurrency(transaction.total)
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { top: 40 }
    })

    // Footer on all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      
      // Footer line
      doc.setDrawColor(229, 231, 235)
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15)
      
      // Footer text
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Resto Iga Bakar - Laporan Penjualan', pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' })
      doc.text(
        `Dicetak: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`,
        14,
        pageHeight - 10
      )
    }

    // Save PDF
    const filename = `Laporan-Penjualan-${format(startDate, 'dd-MM-yyyy')}-${format(endDate, 'dd-MM-yyyy')}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
