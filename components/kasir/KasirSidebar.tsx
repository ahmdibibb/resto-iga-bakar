'use client'

/**
 * KasirSidebar Component
 * Sidebar khusus untuk halaman kasir dengan menu navigasi, profile, dan logout
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Inbox, 
  History, 
  User, 
  LogOut, 
  Printer
} from 'lucide-react'
import Image from 'next/image'

interface KasirSidebarProps {
  activeTab: 'incoming' | 'history'
  onTabChange: (tab: 'incoming' | 'history') => void
  onOpenPrinterSettings: () => void
  incomingCount: number
  sidebarOpen: boolean
  onCloseSidebar: () => void
}

export default function KasirSidebar({ 
  activeTab, 
  onTabChange, 
  onOpenPrinterSettings,
  incomingCount,
  sidebarOpen,
  onCloseSidebar
}: KasirSidebarProps) {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Fetch user info
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar - Match Admin Style */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-ink border-r border-hairline/25 flex flex-col py-6 z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 font-jakarta`}
      >
        {/* Logo & Brand - Match Admin */}
        <div className="px-6 mb-8 flex items-center justify-between border-b border-hairline/25 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/logo-v3.png"
                alt="Kasir Dashboard"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-canvas font-bold text-xs leading-tight tracking-wider uppercase">
                IGA BAKAR OMBENK
              </p>
              <p className="text-stone-brand text-[10px] uppercase font-semibold tracking-wider mt-0.5">
                Kasir Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Match Admin */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-stone-brand/50 text-[10px] font-bold uppercase tracking-widest px-4 py-2">
            Menu
          </p>
          <div className="space-y-1">
            {/* Pesanan Masuk */}
            <button
              onClick={() => {
                onTabChange('incoming')
                if (isMobile) onCloseSidebar()
              }}
              className={`relative w-full flex items-center gap-3 px-4 py-2 rounded-none transition-all duration-150 group cursor-pointer ${
                activeTab === 'incoming'
                  ? 'bg-soft-cloud/15 text-canvas'
                  : 'text-stone-brand hover:text-canvas hover:bg-soft-cloud/5'
              }`}
            >
              <div className="p-1 rounded-none flex-shrink-0">
                <Inbox
                  size={15}
                  className={activeTab === 'incoming' ? 'text-canvas' : 'text-stone-brand group-hover:text-canvas'}
                />
              </div>
              <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                Pesanan Masuk
              </span>
              {incomingCount > 0 && (
                <span className="bg-sale text-canvas px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {incomingCount}
                </span>
              )}
            </button>

            {/* History Pesanan */}
            <button
              onClick={() => {
                onTabChange('history')
                if (isMobile) onCloseSidebar()
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-none transition-all duration-150 group cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-soft-cloud/15 text-canvas'
                  : 'text-stone-brand hover:text-canvas hover:bg-soft-cloud/5'
              }`}
            >
              <div className="p-1 rounded-none flex-shrink-0">
                <History
                  size={15}
                  className={activeTab === 'history' ? 'text-canvas' : 'text-stone-brand group-hover:text-canvas'}
                />
              </div>
              <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                History
              </span>
            </button>
          </div>
        </nav>

        {/* Settings & Logout - Match Admin */}
        <div className="px-4 space-y-1 border-t border-hairline/25 pt-4 mt-4">
          {/* Pengaturan Printer */}
          <button
            onClick={() => {
              onOpenPrinterSettings()
              if (isMobile) onCloseSidebar()
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-none text-stone-brand hover:text-canvas hover:bg-soft-cloud/5 transition-all duration-150 group cursor-pointer"
          >
            <div className="p-1 rounded-none flex-shrink-0">
              <Printer size={15} className="group-hover:text-canvas transition-colors" />
            </div>
            <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
              Printer
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-none text-sale hover:text-red-400 hover:bg-sale/10 transition-all duration-150 group cursor-pointer"
          >
            <div className="p-1 rounded-none flex-shrink-0">
              <LogOut size={15} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
