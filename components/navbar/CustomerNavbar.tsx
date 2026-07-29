'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { MapPin, ShoppingBag } from 'lucide-react'

interface CustomerNavbarProps {
  tableNumber?: string | null
  isTakeaway?: boolean
  sticky?: boolean
}

export default function CustomerNavbar({
  tableNumber,
  isTakeaway = false,
  sticky = true
}: CustomerNavbarProps) {
  const [logoUrl, setLogoUrl] = useState('/logo-v3.png')
  const [restaurantName, setRestaurantName] = useState('iga bakar om benk')

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.logo_url) setLogoUrl(data.logo_url)
        if (data.restaurant_name) setRestaurantName(data.restaurant_name)
      })
      .catch(() => {})
  }, [])

  const navClassName = sticky
    ? "sticky top-0 z-50 bg-canvas border-b border-hairline font-jakarta h-16 flex items-center"
    : "bg-canvas border-b border-hairline font-jakarta h-16 flex items-center"

  return (
    <nav className={navClassName}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex h-14 items-center justify-between">
          {/* Logo + Brand Name */}
          <div className="flex items-center gap-3">
            <Image
              src={logoUrl}
              alt={restaurantName}
              width={64}
              height={64}
              className="object-contain h-14 w-auto"
              priority
            />
            <span className="text-base font-bold text-ink tracking-tight font-jakarta uppercase">
              {restaurantName}
            </span>
          </div>

          {/* Table / Takeaway Badge */}
          {(tableNumber || isTakeaway) && (
            <div className="flex items-center gap-2 rounded-full border border-hairline bg-soft-cloud px-4 py-1.5">
              {isTakeaway ? (
                <>
                  <ShoppingBag size={16} className="text-ink" />
                  <span className="text-xs sm:text-sm font-semibold text-ink uppercase tracking-wider">Takeaway</span>
                </>
              ) : (
                <>
                  <MapPin size={16} className="text-ink" />
                  <span className="text-xs sm:text-sm font-semibold text-ink uppercase tracking-wider">Meja {tableNumber}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
