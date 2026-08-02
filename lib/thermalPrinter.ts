/**
 * Thermal Printer Library
 * 
 * Library untuk koneksi dan print ke thermal printer via Web Bluetooth API
 * Support ESC/POS commands untuk printer thermal 58mm/80mm
 */

export interface PrinterDevice {
  id: string
  name: string
  device: BluetoothDevice
}

export interface ThermalPrinterService {
  device: BluetoothDevice | null
  characteristic: BluetoothRemoteGATTCharacteristic | null
  isConnected: boolean
}

// ESC/POS Commands
const ESC = '\x1B'
const GS = '\x1D'

export class ThermalPrinter {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private isConnected: boolean = false

  // UUID untuk Serial Port Service (umum untuk thermal printer)
  private readonly SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'
  private readonly CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'

  // Alternative UUIDs jika yang pertama tidak work
  private readonly ALTERNATIVE_UUIDS = [
    { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
    { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
    { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff01-0000-1000-8000-00805f9b34fb' },
  ]

  /**
   * Scan dan pair dengan printer Bluetooth
   */
  async pair(): Promise<BluetoothDevice> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API tidak support di browser ini. Gunakan Chrome, Edge, atau Opera.')
      }

      // Request device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] },
          { namePrefix: '58' },
          { namePrefix: 'BT' },
          { namePrefix: 'Printer' },
          { namePrefix: 'TP' },
        ],
        optionalServices: this.ALTERNATIVE_UUIDS.map(u => u.service)
      })

      this.device = device
      
      // Save to localStorage
      if (device.id) {
        localStorage.setItem('pairedPrinterId', device.id)
        localStorage.setItem('pairedPrinterName', device.name || 'Unknown Printer')
      }

      return device
    } catch (error) {
      console.error('Error pairing printer:', error)
      throw new Error('Gagal melakukan pairing dengan printer. Pastikan Bluetooth aktif dan printer dalam mode pairing.')
    }
  }

  /**
   * Connect ke printer yang sudah di-pair
   */
  async connect(device?: BluetoothDevice): Promise<boolean> {
    try {
      const targetDevice = device || this.device

      if (!targetDevice) {
        throw new Error('Tidak ada printer yang di-pair. Silakan pair terlebih dahulu.')
      }

      // Connect GATT Server
      const server = await targetDevice.gatt?.connect()
      if (!server) {
        throw new Error('Gagal connect ke GATT server')
      }

      // Try to get service and characteristic with multiple UUID attempts
      let service: BluetoothRemoteGATTService | null = null
      let characteristic: BluetoothRemoteGATTCharacteristic | null = null

      for (const uuid of this.ALTERNATIVE_UUIDS) {
        try {
          service = await server.getPrimaryService(uuid.service)
          characteristic = await service.getCharacteristic(uuid.char)
          if (characteristic) {
            console.log(`Connected using UUID: ${uuid.service}`)
            break
          }
        } catch (e) {
          // Try next UUID
          continue
        }
      }

      if (!characteristic) {
        throw new Error('Gagal mendapatkan characteristic dari printer')
      }

      this.device = targetDevice
      this.characteristic = characteristic
      this.isConnected = true

      return true
    } catch (error) {
      console.error('Error connecting to printer:', error)
      this.isConnected = false
      throw new Error('Gagal connect ke printer. Pastikan printer menyala dan Bluetooth aktif.')
    }
  }

  /**
   * Disconnect dari printer
   */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      await this.device.gatt.disconnect()
    }
    this.device = null
    this.characteristic = null
    this.isConnected = false
  }

  /**
   * Check apakah sudah connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.device?.gatt?.connected === true
  }

  /**
   * Get paired printer info dari localStorage
   */
  getPairedPrinterInfo(): { id: string; name: string } | null {
    const id = localStorage.getItem('pairedPrinterId')
    const name = localStorage.getItem('pairedPrinterName')
    
    if (id && name) {
      return { id, name }
    }
    return null
  }

  /**
   * Remove paired printer
   */
  unpair(): void {
    localStorage.removeItem('pairedPrinterId')
    localStorage.removeItem('pairedPrinterName')
    this.disconnect()
  }

  /**
   * Send raw data ke printer
   */
  private async sendData(data: string | Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer belum connected')
    }

    try {
      const bytes = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data

      // Send in chunks (max 512 bytes per write for BLE)
      const chunkSize = 512
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length))
        await this.characteristic.writeValue(chunk)
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    } catch (error) {
      console.error('Error sending data to printer:', error)
      throw new Error('Gagal mengirim data ke printer')
    }
  }

  /**
   * Initialize printer
   */
  private async initialize(): Promise<void> {
    await this.sendData(`${ESC}@`) // Initialize printer
  }

  /**
   * Set text alignment
   */
  private async setAlign(align: 'left' | 'center' | 'right'): Promise<void> {
    const alignCodes = { left: 0, center: 1, right: 2 }
    await this.sendData(`${ESC}a${String.fromCharCode(alignCodes[align])}`)
  }

  /**
   * Set text size
   */
  private async setTextSize(width: number, height: number): Promise<void> {
    const size = ((width - 1) << 4) | (height - 1)
    await this.sendData(`${GS}!${String.fromCharCode(size)}`)
  }

  /**
   * Set text bold
   */
  private async setBold(bold: boolean): Promise<void> {
    await this.sendData(`${ESC}E${String.fromCharCode(bold ? 1 : 0)}`)
  }

  /**
   * Print text
   */
  private async printText(text: string): Promise<void> {
    await this.sendData(text)
  }

  /**
   * Line feed
   */
  private async lineFeed(lines: number = 1): Promise<void> {
    await this.sendData('\n'.repeat(lines))
  }

  /**
   * Print separator line
   */
  private async printSeparator(char: string = '-'): Promise<void> {
    await this.printText(char.repeat(32)) // 32 chars untuk 58mm printer
    await this.lineFeed()
  }

  /**
   * Cut paper
   */
  private async cutPaper(): Promise<void> {
    await this.sendData(`${GS}V${String.fromCharCode(66)}${String.fromCharCode(0)}`)
  }

  /**
   * Print receipt untuk order
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
    try {
      // Initialize
      await this.initialize()

      // Header - Restaurant Name
      await this.setAlign('center')
      await this.setTextSize(2, 2)
      await this.setBold(true)
      await this.printText('RESTO IGA BAKAR')
      await this.lineFeed(1)

      await this.setTextSize(1, 1)
      await this.setBold(false)
      await this.printText('Struk Pesanan Kitchen')
      await this.lineFeed(2)

      // Order Info
      await this.setAlign('left')
      await this.printSeparator('=')
      
      await this.setBold(true)
      await this.printText(`No: ${orderData.orderNumber}`)
      await this.lineFeed()
      await this.setBold(false)

      const date = new Date(orderData.createdAt).toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
      await this.printText(`Tgl: ${date}`)
      await this.lineFeed()

      if (orderData.customerName) {
        await this.printText(`Customer: ${orderData.customerName}`)
        await this.lineFeed()
      }

      if (orderData.tableName) {
        await this.printText(`Meja: ${orderData.tableName}`)
        await this.lineFeed()
      }

      if (orderData.orderType === 'TAKEAWAY') {
        await this.setBold(true)
        await this.printText('Tipe: TAKEAWAY')
        await this.lineFeed()
        await this.setBold(false)
      }

      if (orderData.paymentMethod) {
        await this.printText(`Bayar: ${orderData.paymentMethod}`)
        await this.lineFeed()
      }

      // Items
      await this.printSeparator('=')
      await this.setBold(true)
      await this.printText('PESANAN:')
      await this.lineFeed()
      await this.setBold(false)

      for (const item of orderData.items) {
        const line = `${item.quantity}x ${item.product.name}`
        await this.printText(line)
        await this.lineFeed()
      }

      // Notes
      if (orderData.notes) {
        await this.printSeparator('-')
        await this.setBold(true)
        await this.printText('Catatan:')
        await this.lineFeed()
        await this.setBold(false)
        await this.printText(orderData.notes)
        await this.lineFeed()
      }

      // Footer
      await this.printSeparator('=')
      await this.setAlign('center')
      await this.printText('Terima kasih!')
      await this.lineFeed(3)

      // Cut paper
      await this.cutPaper()

    } catch (error) {
      console.error('Error printing receipt:', error)
      throw new Error('Gagal mencetak struk. Silakan coba lagi.')
    }
  }
}

// Singleton instance
let printerInstance: ThermalPrinter | null = null

export function getThermalPrinter(): ThermalPrinter {
  if (!printerInstance) {
    printerInstance = new ThermalPrinter()
  }
  return printerInstance
}
