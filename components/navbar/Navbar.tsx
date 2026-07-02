'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, ShoppingCart, User } from 'lucide-react'

interface CartItem {
  productId: string
  quantity: number
}

interface NavbarProps {
  title: string
  showCart?: boolean
  cart?: CartItem[]
  cartHref?: string
  sticky?: boolean
}

export default function Navbar({
  title,
  showCart = false,
  cart = [],
  cartHref = '/cart',
  sticky = false
}: NavbarProps) {
  const router = useRouter()



  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/login')
  }

  const navClassName = sticky
    ? "sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-hairline-soft"
    : "bg-canvas border-b border-hairline"

  return (
    <nav className={navClassName}>
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Image
              src="/logo-v3.png"
              alt="Iga Bakar"
              width={110}
              height={52}
              className="object-contain h-13 w-auto"
              priority
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">


            {/* Cart Button (if showCart is true) */}
            {showCart && (
              <Link
                href={cartHref}
                className="group relative flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-canvas transition-all duration-200 hover:bg-ink/90 active:scale-95"
              >
                <ShoppingCart size={20} className="transition-transform group-hover:scale-110" />
                <span className="font-medium">Cart ({cart.length})</span>
                {cart.length > 0 && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-canvas ring-2 ring-canvas">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </Link>
            )}

            {/* Profile Button */}
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 rounded-full border border-hairline bg-soft-cloud px-5 py-2.5 transition-all duration-200 hover:bg-hairline-soft hover:border-hairline active:scale-95 w-full md:w-auto group"
            >
              <User size={20} className="text-ink transition-colors" />
              <span className="font-medium text-ink transition-colors">Profile</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-full border border-hairline bg-soft-cloud px-5 py-2.5 transition-all duration-200 hover:bg-sale hover:border-sale hover:text-canvas active:scale-95 w-full md:w-auto group"
            >
              <LogOut size={20} className="text-ink group-hover:text-canvas transition-colors" />
              <span className="font-medium text-ink group-hover:text-canvas transition-colors">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

