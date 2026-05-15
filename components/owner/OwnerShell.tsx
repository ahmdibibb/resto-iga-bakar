'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  TrendingUp,
  Menu,
  Bell,
  User,
  LogOut,
  FileText,
  Eye,
  RefreshCw,
  X,
  ChevronRight,
} from 'lucide-react'
import Loading from '@/components/Loading'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  route: string
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/owner' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, route: '/owner/analytics' },
  { id: 'reports', label: 'Reports', icon: FileText, route: '/owner/reports' },
  { id: 'products', label: 'Products', icon: Package, route: '/owner/products', badge: 'View' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, route: '/owner/orders', badge: 'View' },
  { id: 'users', label: 'Users', icon: UsersIcon, route: '/owner/users', badge: 'View' },
]

interface OwnerShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  headerRight?: React.ReactNode
  onRefresh?: () => Promise<void>
}

export default function OwnerShell({
  children,
  title,
  subtitle,
  headerRight,
  onRefresh,
}: OwnerShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState('Owner')
  const [userInitial, setUserInitial] = useState('O')
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) { router.push('/login'); return }
      const data = await res.json()
      if (data.user?.role !== 'OWNER') { router.push('/login'); return }
      setUserName(data.user.name || 'Owner')
      setUserInitial((data.user.name || 'O').charAt(0).toUpperCase())
      setLoading(false)
    } catch {
      router.push('/login')
    }
  }

  const handleRefresh = async () => {
    if (!onRefresh) return
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/login')
  }

  const activeRoute = navItems.find(item =>
    item.route === '/owner'
      ? pathname === '/owner'
      : pathname.startsWith(item.route)
  )

  if (loading) return <Loading />

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          background: 'linear-gradient(180deg, #1e3a5f 0%, #1a3356 40%, #162b47 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 flex-shrink-0">
              <span className="text-lg">👔</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Iga Bakar</p>
              <p className="text-blue-300 text-xs">Owner Portal</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-white/8 border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-blue-300 text-xs">Owner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          <p className="text-blue-400/60 text-xs font-semibold uppercase tracking-wider px-3 py-2">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.route === '/owner'
              ? pathname === '/owner'
              : pathname.startsWith(item.route)
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.route)
                  if (isMobile) setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-blue-200/70 hover:text-white hover:bg-white/8'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                )}
                <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isActive ? 'bg-blue-500/30' : 'group-hover:bg-white/10'
                }`}>
                  <Icon size={16} className={isActive ? 'text-blue-300' : 'text-blue-300/60 group-hover:text-blue-200'} />
                </div>
                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 flex items-center gap-0.5">
                    <Eye size={9} />
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-blue-400 flex-shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 pt-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <LogOut size={16} />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-64' : ''} flex flex-col min-h-screen`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3.5">
            {/* Left: Hamburger + Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                  {activeRoute?.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      <Eye size={11} />
                      View Only
                    </span>
                  )}
                </div>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {headerRight}
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw size={18} className={refreshing ? 'animate-spin text-blue-600' : ''} />
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 relative"
                >
                  <Bell size={18} />
                </button>
              </div>
              <div className="pl-3 ml-1 border-l border-gray-200 flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform">
                  {userInitial}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
