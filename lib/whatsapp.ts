/**
 * WhatsApp Notification via Fonnte
 * 
 * Layanan WA Gateway Indonesia — https://fonnte.com
 * 
 * Setup:
 * 1. Daftar di fonnte.com
 * 2. Hubungkan nomor WhatsApp bisnis Anda
 * 3. Salin token dari dashboard Fonnte
 * 4. Tambahkan ke .env: FONNTE_TOKEN=token_anda
 */

const FONNTE_TOKEN = process.env.FONNTE_TOKEN || ''
const FONNTE_API_URL = 'https://api.fonnte.com/send'

export interface WhatsAppResult {
  success: boolean
  message: string
}

/**
 * Kirim pesan WhatsApp ke nomor pelanggan
 * @param phone - Nomor HP pelanggan (format: 08xxx atau 628xxx)
 * @param message - Pesan yang akan dikirim
 */
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<WhatsAppResult> {
  if (!FONNTE_TOKEN) {
    console.warn('[WHATSAPP] FONNTE_TOKEN not set. Skipping WA notification.')
    return { success: false, message: 'Token Fonnte belum dikonfigurasi' }
  }

  // Normalize phone number (08xxx → 628xxx)
  const normalizedPhone = normalizePhoneNumber(phone)

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: FONNTE_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        target: normalizedPhone,
        message: message,
        countryCode: '62', // Indonesia
      }),
    })

    const result = await response.json()

    if (result.status === true) {
      console.log(`[WHATSAPP] Notifikasi terkirim ke ${normalizedPhone}`)
      return { success: true, message: 'Notifikasi WhatsApp berhasil dikirim' }
    } else {
      console.error('[WHATSAPP] Gagal kirim:', result)
      return { success: false, message: result.reason || 'Gagal mengirim notifikasi' }
    }
  } catch (error) {
    console.error('[WHATSAPP] Error:', error)
    return { success: false, message: 'Koneksi ke Fonnte gagal' }
  }
}

/**
 * Template pesan: Pesanan Selesai (Pre-Order siap diambil)
 */
export function buildOrderReadyMessage(params: {
  customerName: string
  orderNumber: string
  pickupTime?: Date | null
  totalAmount: number
}): string {
  const { customerName, orderNumber, pickupTime, totalAmount } = params

  const pickupInfo = pickupTime
    ? `Jam Ambil: *${pickupTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB*`
    : ''

  const total = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(totalAmount)

  return (
    `Halo *${customerName}*! 🎉\n\n` +
    `Pesanan Anda sudah *SIAP DIAMBIL* di Resto Iga Bakar Ombenk!\n\n` +
    `📋 No. Pesanan: *${orderNumber}*\n` +
    `💰 Total: *${total}*\n` +
    `${pickupInfo ? pickupInfo + '\n' : ''}` +
    `\nSilakan datang ke restoran untuk mengambil pesanan Anda.\n\n` +
    `Terima kasih telah memesan di Resto Iga Bakar Ombenk! 😊`
  )
}

/**
 * Normalisasi format nomor HP Indonesia
 * 08xxx → 628xxx
 * +628xxx → 628xxx
 */
function normalizePhoneNumber(phone: string): string {
  // Hapus semua karakter selain angka
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('62')) {
    return digits
  } else if (digits.startsWith('0')) {
    return '62' + digits.slice(1)
  } else {
    return '62' + digits
  }
}
