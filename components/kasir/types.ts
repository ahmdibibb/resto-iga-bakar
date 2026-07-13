/**
 * Shared types untuk komponen Kasir
 * 
 * File ini berisi definisi tipe data yang digunakan
 * di seluruh komponen kasir (OrderCard, ReceiptPrinter, dll.)
 */

export interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
  }
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  payment_status: string
  payment_method: string | null
  orderType: string
  tableNumber: string | null
  customerName: string | null
  notes: string | null
  createdAt: string
  channel?: string
  pickupTime?: string | null
  items: OrderItem[]
  table: {
    name: string
  } | null
  user: {
    name: string
  } | null
}

export interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

export type TabType = 'incoming' | 'history'
export type HistoryFilter = 'today' | 'week'
