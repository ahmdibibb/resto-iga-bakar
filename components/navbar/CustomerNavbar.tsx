'use client'

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
  const navClassName = sticky
    ? "sticky top-0 z-50 bg-canvas border-b border-hairline font-jakarta"
    : "bg-canvas border-b border-hairline font-jakarta"

  return (
    <nav className={navClassName}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Restaurant Name */}
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            RESTO IGA BAKAR
          </h1>

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
