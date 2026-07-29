export {}

declare global {
  interface MidtransSnapResult {
    order_id?: string
    transaction_id?: string
    transaction_status?: string
    payment_type?: string
    gross_amount?: string
    status_code?: string
    status_message?: string
    [key: string]: unknown
  }

  interface Window {
    snap: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: MidtransSnapResult) => void
          onPending?: (result: MidtransSnapResult) => void
          onError?: (result: MidtransSnapResult) => void
          onClose?: () => void
          language?: 'id' | 'en'
        }
      ) => void
      show: () => void
      hide: () => void
    }
  }
}
