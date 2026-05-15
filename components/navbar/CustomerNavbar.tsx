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
    ? "sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-lg"
    : "bg-white shadow-md"

  return (
    <nav className={navClassName}>
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Restaurant Name */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Resto Iga Bakar
          </h1>

          {/* Table / Takeaway Badge */}
          {(tableNumber || isTakeaway) && (
            <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 ${
              isTakeaway 
                ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' 
                : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
            }`}>
              {isTakeaway ? (
                <>
                  <ShoppingBag size={18} className="text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">Takeaway</span>
                </>
              ) : (
                <>
                  <MapPin size={18} className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Meja {tableNumber}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
