/**
 * Midtrans Snap Payment Gateway Integration
 *
 * Handles:
 * 1. Creating Snap transactions (QRIS-only via enabled_payments)
 * 2. Fetching transaction status from Midtrans
 * 3. Verifying webhook notification signatures
 * 4. Mapping Midtrans statuses to internal PaymentStatus
 */


import { createHash, timingSafeEqual } from 'node:crypto'

// ── Environment ────────────────────────────────────────────────────────────

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? ''
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const SNAP_HOSTNAME = IS_PRODUCTION
  ? 'app.midtrans.com'
  : 'app.sandbox.midtrans.com'

const API_HOSTNAME = IS_PRODUCTION
  ? 'api.midtrans.com'
  : 'api.sandbox.midtrans.com'

function getAuthHeader(): string {
  const encoded = Buffer.from(`${SERVER_KEY}:`).toString('base64')
  return `Basic ${encoded}`
}

/** Helper to make HTTPS requests to Midtrans using fetch + retry */
async function midtransRequest<T>(
  hostname: string,
  path: string,
  method: 'GET' | 'POST',
  payload?: any,
  maxRetries: number = 3
): Promise<{ status: number; data: T }> {
  const url = `https://${hostname}${path}`
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: getAuthHeader(),
  }
  if (payload) {
    headers['Content-Type'] = 'application/json'
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(url, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = (await res.json()) as T
      return { status: res.status, data }
    } catch (error: any) {
      lastError = error
      const isTimeout = error?.name === 'AbortError' || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET'
      console.warn(
        `[MIDTRANS_REQUEST] Attempt ${attempt}/${maxRetries} failed for ${method} ${path}:`,
        error?.message || error
      )

      if (attempt < maxRetries && (isTimeout || error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND' || error?.message?.includes('fetch failed'))) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  throw lastError || new Error('Midtrans request failed after retries')
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface SnapItemDetail {
  id: string
  price: number
  quantity: number
  name: string
}

export interface SnapCustomerDetails {
  first_name: string
  phone?: string
}

export interface CreateSnapTransactionRequest {
  orderId: string
  gatewayOrderId: string
  grossAmount: number
  customerDetails: SnapCustomerDetails
  itemDetails: SnapItemDetail[]
}

export interface CreateSnapTransactionResponse {
  token: string
  redirectUrl: string
}

export interface MidtransTransactionStatus {
  transaction_id: string
  order_id: string
  gross_amount: string
  payment_type: string
  transaction_status: string
  fraud_status?: string
  status_code: string
  status_message: string
  settlement_time?: string
  transaction_time?: string
  [key: string]: unknown
}

export interface MidtransNotificationPayload {
  transaction_type?: string
  transaction_time?: string
  transaction_status: string
  transaction_id: string
  status_message?: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id?: string
  gross_amount: string
  fraud_status?: string
  currency?: string
  [key: string]: unknown
}

/** Internal payment status used by the project */
export type InternalPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED'

export interface CheckPaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'FAILED'
  paid_at: string | null
}

// ── Errors ─────────────────────────────────────────────────────────────────

export class MidtransError extends Error {
  public statusCode: number
  public midtransResponse?: unknown

  constructor(message: string, statusCode: number, midtransResponse?: unknown) {
    super(message)
    this.name = 'MidtransError'
    this.statusCode = statusCode
    this.midtransResponse = midtransResponse
  }
}

// ── Create Snap Transaction ────────────────────────────────────────────────

/**
 * Create a Midtrans Snap transaction.
 *
 * @returns Snap token and redirect URL
 */
export async function createSnapTransaction(
  request: CreateSnapTransactionRequest
): Promise<CreateSnapTransactionResponse> {
  if (!SERVER_KEY) {
    throw new MidtransError('MIDTRANS_SERVER_KEY is not configured', 500)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const payload = {
    transaction_details: {
      order_id: request.gatewayOrderId,
      gross_amount: request.grossAmount,
    },
    customer_details: {
      first_name: request.customerDetails.first_name,
      ...(request.customerDetails.phone
        ? { phone: request.customerDetails.phone }
        : {}),
    },
    item_details: request.itemDetails,
    enabled_payments: ['other_qris'],
    callbacks: {
      finish: `${appUrl}/payment/${request.orderId}`,
    },
  }

  let status: number
  let data: Record<string, unknown>

  try {
    const res = await midtransRequest<Record<string, unknown>>(
      SNAP_HOSTNAME,
      '/snap/v1/transactions',
      'POST',
      payload
    )
    status = res.status
    data = res.data
  } catch (error) {
    console.error('[MIDTRANS_CREATE_TRANSACTION] Network error:', error)
    throw new MidtransError('Failed to connect to Midtrans', 502)
  }

  if (status < 200 || status >= 300 || !data.token) {
    console.error(
      '[MIDTRANS_CREATE_TRANSACTION] Failed:',
      JSON.stringify({ status, error_messages: data.error_messages })
    )
    throw new MidtransError(
      'Failed to create Midtrans Snap transaction',
      status,
      { error_messages: data.error_messages }
    )
  }

  console.log(
    `[MIDTRANS_CREATE_TRANSACTION] Success for gateway order ${request.gatewayOrderId}`
  )

  return {
    token: data.token as string,
    redirectUrl: data.redirect_url as string,
  }
}

// ── Get Transaction Status ─────────────────────────────────────────────────

/**
 * Fetch Midtrans transaction status.
 *
 * @param gatewayOrderId The order_id sent to Midtrans (gateway order id)
 */
export async function getTransactionStatus(
  gatewayOrderId: string
): Promise<MidtransTransactionStatus> {
  if (!SERVER_KEY) {
    throw new MidtransError('MIDTRANS_SERVER_KEY is not configured', 500)
  }

  let status: number
  let data: MidtransTransactionStatus

  try {
    const res = await midtransRequest<MidtransTransactionStatus>(
      API_HOSTNAME,
      `/v2/${encodeURIComponent(gatewayOrderId)}/status`,
      'GET'
    )
    status = res.status
    data = res.data
  } catch (error) {
    console.error('[MIDTRANS_STATUS_CHECK] Network error:', error)
    throw new MidtransError('Failed to connect to Midtrans', 502)
  }

  if (status < 200 || status >= 300) {
    console.error(
      `[MIDTRANS_STATUS_CHECK] Failed for ${gatewayOrderId}: ${data.status_message}`
    )
    throw new MidtransError(
      data.status_message || 'Failed to get transaction status',
      status,
      data
    )
  }

  console.log(
    `[MIDTRANS_STATUS_CHECK] ${gatewayOrderId}: ${data.transaction_status}`
  )

  return data
}

// ── Check Payment Status (adapter for existing frontend interface) ──────────

/**
 * Adapter that returns the same interface the old `checkPaymentStatus`
 * function returned, so existing frontend polling logic keeps working.
 *
 * Source of truth: database status (set by webhook). Falls back to
 * Midtrans Get Transaction Status when the gateway order id is provided.
 */
export async function checkPaymentStatus(
  gatewayOrderId: string
): Promise<CheckPaymentStatusResponse> {
  try {
    const txStatus = await getTransactionStatus(gatewayOrderId)
    const mapped = mapMidtransStatus(
      txStatus.transaction_status,
      txStatus.fraud_status
    )

    return {
      status: mapped === 'UNPAID' ? 'PENDING' : mapped,
      paid_at: txStatus.settlement_time ?? null,
    }
  } catch {
    // If Midtrans is unreachable we return PENDING so the frontend
    // doesn't wrongly display an error — the webhook will finalise status.
    return { status: 'PENDING', paid_at: null }
  }
}

// ── Verify Webhook Signature ───────────────────────────────────────────────

/**
 * Verify the `signature_key` sent in Midtrans notification payload.
 *
 * Formula: SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
 *
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  if (!SERVER_KEY) {
    console.error('[MIDTRANS_INVALID_SIGNATURE] Server key not configured')
    return false
  }

  const raw = `${orderId}${statusCode}${grossAmount}${SERVER_KEY}`
  const expected = createHash('sha512').update(raw).digest('hex')

  try {
    const sigBuffer = Buffer.from(signatureKey, 'utf-8')
    const expectedBuffer = Buffer.from(expected, 'utf-8')

    if (sigBuffer.length !== expectedBuffer.length) {
      console.error('[MIDTRANS_INVALID_SIGNATURE] Signature length mismatch')
      return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    console.error('[MIDTRANS_INVALID_SIGNATURE] Comparison error')
    return false
  }
}

// ── Status Mapping ─────────────────────────────────────────────────────────

/**
 * Map Midtrans `transaction_status` + optional `fraud_status` to
 * the internal PaymentStatus enum: UNPAID | PENDING | PAID | FAILED
 *
 * The project only has these four statuses, so we map conservatively.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): InternalPaymentStatus {
  switch (transactionStatus) {
    case 'settlement':
      return 'PAID'

    case 'capture':
      // capture + accept → PAID, otherwise PENDING
      return fraudStatus === 'accept' ? 'PAID' : 'PENDING'

    case 'pending':
      return 'PENDING'

    case 'deny':
    case 'failure':
    case 'expire':
    case 'cancel':
      return 'FAILED'

    case 'refund':
    case 'partial_refund':
      // Project has no refund status — keep as PAID per business logic
      return 'PAID'

    default:
      return 'PENDING'
  }
}

// ── Snap Script URL helper (for frontend) ──────────────────────────────────

export function getSnapScriptUrl(): string {
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
  return isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
}
