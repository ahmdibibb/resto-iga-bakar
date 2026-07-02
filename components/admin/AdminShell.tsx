'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  TrendingUp,
  Menu,
  Bell,
  Moon,
  Settings,
  FileText,
  LogOut,
  QrCode,
  X,
} from 'lucide-react'
import Loading from '@/components/Loading'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  route: string
  isTab: boolean
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/admin', isTab: true },
  { id: 'products', label: 'Products', icon: Package, route: '/admin?tab=products', isTab: true },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, route: '/admin?tab=orders', isTab: true },
  { id: 'users', label: 'Users', icon: UsersIcon, route: '/admin?tab=users', isTab: true },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, route: '/admin?tab=analytics', isTab: true },
  { id: 'qr', label: 'QR Generator', icon: QrCode, route: '/admin/qr-generator', isTab: false },
  { id: 'reports', label: 'Reports', icon: FileText, route: '/admin/reports', isTab: false },
]

interface AdminShellProps {
  children: React.ReactNode
  activeTab: string
  onTabChange?: (tab: any) => void
  title?: string
}

export default function AdminShell({
  children,
  activeTab,
  onTabChange,
  title,
}: AdminShellProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [userName, setUserName] = useState('Admin')
  const [userInitial, setUserInitial] = useState('A')

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check user role authentication
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!res.ok) {
        router.push('/login')
        return
      }

      const data = await res.json()
      if (data.user?.role !== 'ADMIN') {
        router.push('/login')
        return
      }

      setUserName(data.user.name || 'Admin')
      setUserInitial((data.user.name || 'A').charAt(0).toUpperCase())
      setLoading(false)
    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/login')
    }
  }

  const handleItemClick = (item: NavItem) => {
    if (isMobile) {
      setSidebarOpen(false)
    }

    if (item.isTab && onTabChange) {
      // If we are already on the admin page, trigger local tab change
      onTabChange(item.id)
    } else {
      // Otherwise, perform router navigation
      router.push(item.route)
    }
  }

  const displayTitle = title || navItems.find((item) => item.id === activeTab)?.label || 'Dashboard'

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex min-h-screen bg-canvas font-inter text-ink">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-ink border-r border-hairline flex flex-col py-6 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 font-jakarta`}
      >
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center justify-between border-b border-hairline/25 pb-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-v3.png"
              alt="Iga Bakar Ombenk"
              width={40}
              height={40}
              className="object-contain w-10 h-10 flex-shrink-0"
            />
            <div>
              <p className="text-canvas font-bold text-xs leading-tight tracking-wider uppercase">Iga Bakar Ombenk</p>
              <p className="text-stone-brand text-[10px] uppercase font-semibold tracking-wider mt-0.5">Admin Portal</p>
            </div>
          </div>
          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-full text-stone-brand hover:text-canvas hover:bg-soft-cloud/10"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-stone-brand/50 text-[10px] font-bold uppercase tracking-widest px-4 py-2">Menu</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-none transition-all duration-150 group cursor-pointer ${isActive
                    ? 'bg-soft-cloud/15 text-canvas'
                    : 'text-stone-brand hover:text-canvas hover:bg-soft-cloud/5'
                    }`}
                >
                  <div className="p-1 rounded-none flex-shrink-0">
                    <Icon size={15} className={isActive ? 'text-canvas' : 'text-stone-brand group-hover:text-canvas'} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Settings & Logout */}
        <div className="px-4 space-y-1 border-t border-hairline/25 pt-4 mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-none text-stone-brand hover:text-canvas hover:bg-soft-cloud/5 transition-all duration-150 group cursor-pointer">
            <div className="p-1 rounded-none flex-shrink-0">
              <Settings size={15} className="group-hover:text-canvas transition-colors" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">Settings</span>
          </button>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
              router.push('/login')
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-none text-sale hover:text-red-400 hover:bg-sale/10 transition-all duration-150 group cursor-pointer"
          >
            <div className="p-1 rounded-none flex-shrink-0">
              <LogOut size={15} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-64' : ''} flex flex-col min-h-screen`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-canvas border-b border-hairline px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink lg:hidden cursor-pointer"
              >
                <Menu size={16} />
              </button>

              <h1 className="text-lg font-bold text-ink uppercase tracking-wider font-jakarta">
                {displayTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink cursor-pointer">
                <Moon size={15} />
              </button>
              <button className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink relative cursor-pointer">
                <Bell size={15} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-sale rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 pl-3 ml-1 border-l border-hairline">
                <span className="text-xs font-bold text-ink hidden sm:block">{userName}</span>
                <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center text-canvas font-bold text-xs cursor-pointer hover:bg-charcoal transition-colors">
                  {userInitial}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
