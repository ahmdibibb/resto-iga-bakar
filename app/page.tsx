import Link from 'next/link'
import Image from 'next/image'
import { UtensilsCrossed, Clock, QrCode, ShoppingBag, MapPin, Phone } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Resto Iga Bakar Ombenk — Pesan Online',
  description:
    'Nikmati iga bakar terbaik! Pesan langsung via QR di meja atau pre-order online dan ambil sendiri. Buka setiap hari 11.00–22.00 WIB.',
}

export default async function LandingPage() {
  const settings = await prisma.systemSetting.findMany()
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)

  const restaurantName = settingsMap['restaurant_name'] || 'Iga Bakar Ombenk'
  const logoUrl = settingsMap['logo_url'] || '/logo-v3.png'
  const backgroundUrl = settingsMap['background_url'] || '/restaurant-bg.jpg'

  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      {/* Hero Section */}
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-canvas">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
           <Image
            src={backgroundUrl}
            alt={`${restaurantName} Background`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        {/* Logo / Brand */}
        <div className="relative z-10 mb-6 flex flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-20">
            <Image
              src={logoUrl}
              alt={`Logo ${restaurantName}`}
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-canvas/80">
              Restoran
            </p>
            <h1 className="text-3xl font-bold font-jakarta uppercase tracking-tight text-canvas">
              {restaurantName}
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <p className="relative z-10 mb-3 text-center text-4xl font-bold font-jakarta uppercase tracking-tight text-canvas md:text-5xl lg:text-6xl">
          Lezat, Segar,
          <br />
          <span className="text-canvas/80">Langsung di Piring.</span>
        </p>
        <p className="relative z-10 mb-10 max-w-md text-center text-sm text-canvas/70">
          Iga bakar pilihan dengan bumbu rahasia khas Ombenk. Dine-in atau pre-order — kami siap
          melayani Anda.
        </p>

        {/* CTA Buttons */}
        <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
          {/* Pre-Order Button */}
          <Link
            href="/menu?mode=preorder"
            className="group flex items-center justify-between rounded-none border-2 border-canvas bg-canvas px-6 py-4 text-ink transition-all hover:bg-canvas/90 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={22} className="text-ink" />
              <div className="text-left">
                <p className="text-sm font-bold uppercase tracking-wider font-jakarta">
                  Pre-Order Online
                </p>
                <p className="text-xs text-ink/60">Pesan dari rumah, ambil di restoran</p>
              </div>
            </div>
            <span className="text-xl font-light text-ink/40 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          {/* QR Code Info */}
          <div className="flex items-center justify-center gap-3 rounded-none border border-canvas/30 bg-black/30 backdrop-blur-sm px-6 py-3">
            <QrCode size={16} className="text-canvas/70" />
            <p className="text-xs text-canvas/75">
              Sudah di restoran?{' '}
              <span className="text-canvas font-medium">Scan QR di meja Anda</span>
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold font-jakarta uppercase tracking-tight text-ink">
          Informasi Restoran
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-none border border-hairline p-6 text-center">
            <Clock size={24} className="text-ink" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink font-jakarta">
                Jam Buka
              </p>
              <p className="mt-1 text-sm text-charcoal">Setiap Hari</p>
              <p className="text-sm font-semibold text-ink">11.00 – 22.00 WIB</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-none border border-hairline p-6 text-center">
            <MapPin size={24} className="text-ink" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink font-jakarta">
                Lokasi
              </p>
              <p className="mt-1 text-sm text-charcoal">Resto Iga Bakar</p>
              <p className="text-sm font-semibold text-ink">Ombenk, Indonesia</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-none border border-hairline p-6 text-center">
            <Phone size={24} className="text-ink" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink font-jakarta">
                Kontak
              </p>
              <p className="mt-1 text-sm text-charcoal">WhatsApp / Telepon</p>
              <p className="text-sm font-semibold text-ink">Hubungi Kami</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
