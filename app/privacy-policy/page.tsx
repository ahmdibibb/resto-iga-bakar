import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - Resto Iga Bakar Ombenk',
  description: 'Kebijakan Privasi Resto Iga Bakar Ombenk mengenai pengumpulan, penggunaan, dan perlindungan data pelanggan.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      {/* Header */}
      <div className="border-b border-hairline bg-canvas">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="text-3xl font-bold font-jakarta uppercase tracking-tight text-ink">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-sm text-charcoal">
            Terakhir diperbarui: 14 Juli 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Intro */}
        <section>
          <p className="text-charcoal leading-relaxed">
            Resto Iga Bakar Ombenk (&quot;kami&quot;, &quot;restoran&quot;) menghargai privasi Anda. Kebijakan Privasi ini menjelaskan
            bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat Anda menggunakan
            layanan pemesanan online kami melalui website dan notifikasi WhatsApp.
          </p>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            1. Informasi yang Kami Kumpulkan
          </h2>
          <p className="text-charcoal leading-relaxed mb-3">
            Saat Anda melakukan pemesanan melalui website kami, kami mengumpulkan informasi berikut:
          </p>
          <ul className="list-disc list-inside space-y-2 text-charcoal ml-4">
            <li><strong>Nama</strong> — untuk mengidentifikasi pesanan Anda.</li>
            <li><strong>Nomor Telepon / WhatsApp</strong> — untuk mengirimkan notifikasi status pesanan Anda (khusus pre-order).</li>
            <li><strong>Detail Pesanan</strong> — item yang dipesan, jumlah, dan total pembayaran.</li>
            <li><strong>Tipe Pesanan</strong> — Dine-in atau Takeaway.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            2. Penggunaan Informasi
          </h2>
          <p className="text-charcoal leading-relaxed mb-3">
            Informasi yang kami kumpulkan digunakan secara terbatas untuk tujuan berikut:
          </p>
          <ul className="list-disc list-inside space-y-2 text-charcoal ml-4">
            <li>Memproses dan mengelola pesanan Anda.</li>
            <li>Mengirimkan notifikasi status pesanan melalui WhatsApp (misalnya: pesanan siap diambil).</li>
            <li>Mencetak struk/bukti pembayaran.</li>
            <li>Meningkatkan kualitas layanan kami.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            3. Notifikasi WhatsApp
          </h2>
          <p className="text-charcoal leading-relaxed">
            Kami menggunakan layanan WhatsApp Business API resmi dari Meta untuk mengirimkan notifikasi terkait
            pesanan Anda. Nomor telepon Anda hanya digunakan untuk mengirimkan pemberitahuan status pesanan dan
            tidak akan digunakan untuk tujuan pemasaran tanpa persetujuan Anda. Anda dapat menghubungi kami
            kapan saja untuk meminta penghapusan data Anda.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            4. Penyimpanan dan Keamanan Data
          </h2>
          <p className="text-charcoal leading-relaxed">
            Data pesanan Anda disimpan secara aman di server kami dan hanya dapat diakses oleh staf restoran
            yang berwenang (kasir dan administrator). Kami menerapkan langkah-langkah keamanan yang wajar untuk
            melindungi informasi pribadi Anda dari akses yang tidak sah, pengungkapan, atau penyalahgunaan.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            5. Berbagi Informasi dengan Pihak Ketiga
          </h2>
          <p className="text-charcoal leading-relaxed">
            Kami <strong>tidak menjual, memperdagangkan, atau menyewakan</strong> informasi pribadi Anda kepada
            pihak ketiga mana pun. Informasi Anda hanya dibagikan dengan layanan pihak ketiga berikut sejauh
            yang diperlukan untuk memproses pesanan Anda:
          </p>
          <ul className="list-disc list-inside space-y-2 text-charcoal ml-4 mt-3">
            <li><strong>Meta (WhatsApp Business API)</strong> — untuk pengiriman notifikasi status pesanan.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            6. Hak Anda
          </h2>
          <p className="text-charcoal leading-relaxed mb-3">
            Anda memiliki hak untuk:
          </p>
          <ul className="list-disc list-inside space-y-2 text-charcoal ml-4">
            <li>Mengetahui data apa saja yang kami simpan tentang Anda.</li>
            <li>Meminta penghapusan data pribadi Anda dari sistem kami.</li>
            <li>Menolak menerima notifikasi WhatsApp dari kami.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            7. Perubahan Kebijakan
          </h2>
          <p className="text-charcoal leading-relaxed">
            Kami berhak untuk memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan akan berlaku efektif
            segera setelah diposting di halaman ini. Kami menyarankan Anda untuk meninjau halaman ini secara
            berkala.
          </p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-3">
            8. Hubungi Kami
          </h2>
          <p className="text-charcoal leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami melalui
            WhatsApp di nomor <strong>085894057990</strong>.
          </p>
        </section>

        {/* Footer */}
        <div className="border-t border-hairline pt-8 mt-12">
          <p className="text-center text-sm text-charcoal">
            &copy; {new Date().getFullYear()} Resto Iga Bakar Ombenk. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </div>
  )
}
