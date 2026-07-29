/**
 * WhatsApp Notification via Meta WhatsApp Cloud API
 *
 * API Resmi Meta — Bebas ban, server Meta, tidak butuh HP terhubung.
 * Dokumentasi: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || ''
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || ''
const WA_API_VERSION = 'v20.0'
const WA_API_URL = `https://graph.facebook.com/${WA_API_VERSION}/${WA_PHONE_NUMBER_ID}/messages`

export interface WhatsAppResult {
  success: boolean
  message: string
}

/**
 * Kirim template pesan WhatsApp ke nomor pelanggan via Meta Cloud API
 * @param phone - Nomor HP pelanggan (format: 08xxx atau 628xxx)
 * @param templateName - Nama template yang disetujui di Meta (contoh: 'pesanan_siap')
 * @param parameters - Variabel isi untuk template [{{1}}, {{2}}, {{3}}]
 * @param languageCode - Kode bahasa (default: 'id' untuk Indonesia)
 */
export async function sendWhatsAppTemplateNotification(
  phone: string,
  templateName: string,
  parameters: string[],
  languageCode: string = 'id'
): Promise<WhatsAppResult> {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
    console.warn('[WHATSAPP] WA_PHONE_NUMBER_ID atau WA_ACCESS_TOKEN belum diset di .env')
    return { success: false, message: 'Konfigurasi WhatsApp Cloud API belum lengkap' }
  }

  // Normalize phone number (08xxx → 628xxx)
  const normalizedPhone = normalizePhoneNumber(phone)

  // Hanya sertakan komponen body jika terdapat parameter
  const components = parameters.length > 0 
    ? [
        {
          type: 'body',
          parameters: parameters.map((param) => ({
            type: 'text',
            text: param,
          })),
        },
      ]
    : undefined

  try {
    const response = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      }),
    })

    const result = await response.json()

    if (response.ok && result.messages?.[0]?.id) {
      console.log(`[WHATSAPP] ✅ Template "${templateName}" terkirim ke ${normalizedPhone} | ID: ${result.messages[0].id}`)
      return { success: true, message: 'Notifikasi WhatsApp berhasil dikirim' }
    } else {
      const errMsg = result.error?.message || JSON.stringify(result)
      console.error('[WHATSAPP] ❌ Gagal kirim template:', errMsg)
      return { success: false, message: errMsg }
    }
  } catch (error) {
    console.error('[WHATSAPP] Error koneksi:', error)
    return { success: false, message: 'Koneksi ke WhatsApp Cloud API gagal' }
  }
}

/**
 * Normalisasi format nomor HP Indonesia
 * 08xxx → 628xxx
 * +628xxx → 628xxx
 */
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('62')) {
    return digits
  } else if (digits.startsWith('0')) {
    return '62' + digits.slice(1)
  } else {
    return '62' + digits
  }
}
