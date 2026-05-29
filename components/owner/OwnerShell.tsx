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
  { id: 'orders', label: 'Orders', icon: ShoppingCart, route: '/owner/orders' },
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
    <div className="flex min-h-screen bg-canvas font-inter text-ink">

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 bg-ink border-r border-hairline font-jakarta`}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-hairline/25">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-soft-cloud rounded-none flex items-center justify-center flex-shrink-0">
              <span className="text-sm">👔</span>
            </div>
            <div>
              <p className="text-canvas font-bold text-sm leading-tight tracking-wider uppercase font-jakarta">Iga Bakar</p>
              <p className="text-stone-brand text-[10px] uppercase font-semibold tracking-wider font-jakarta mt-0.5">Owner Portal</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-full text-stone-brand hover:text-canvas hover:bg-soft-cloud/10 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-none bg-soft-cloud/10 border border-hairline/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-soft-cloud flex items-center justify-center text-ink font-bold text-xs flex-shrink-0">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="text-canvas text-sm font-semibold truncate">{userName}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-stone-brand text-xs">Owner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          <p className="text-stone-brand/50 text-[10px] font-bold uppercase tracking-widest px-3 py-2">Menu</p>
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-none transition-all duration-150 group relative cursor-pointer ${
                  isActive
                    ? 'bg-soft-cloud/15 text-canvas'
                    : 'text-stone-brand hover:text-canvas hover:bg-soft-cloud/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-canvas" />
                )}
                <div className="p-1 rounded-none flex-shrink-0">
                  <Icon size={15} className={isActive ? 'text-canvas' : 'text-stone-brand group-hover:text-canvas'} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-canvas/10 text-canvas flex items-center gap-0.5">
                    <Eye size={8} />
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 pt-2 border-t border-hairline/25">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-none text-sale hover:text-red-400 hover:bg-sale/10 transition-all duration-150 group cursor-pointer"
          >
            <div className="p-1 rounded-none flex-shrink-0">
              <LogOut size={15} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-64' : ''} flex flex-col min-h-screen`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
          <div className="flex items-center justify-between px-6 py-3 font-jakarta">
            {/* Left: Hamburger + Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink lg:hidden cursor-pointer"
              >
                <Menu size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-ink uppercase tracking-wider">{title}</h1>
                  {activeRoute?.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-soft-cloud text-ink border border-hairline">
                      <Eye size={10} />
                      View Only
                    </span>
                  )}
                </div>
                {subtitle && <p className="text-[10px] text-mute uppercase tracking-wider mt-0.5">{subtitle}</p>}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {headerRight}
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink disabled:opacity-50 cursor-pointer"
                  title="Refresh data"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin text-ink' : ''} />
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-1.5 rounded-full border border-hairline hover:bg-soft-cloud transition-colors text-ink cursor-pointer"
                >
                  <Bell size={15} />
                </button>
              </div>
              <div className="pl-3 ml-1 border-l border-hairline flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-ink leading-tight">{userName}</p>
                  <p className="text-[10px] text-mute uppercase tracking-widest mt-0.5">Owner</p>
                </div>
                <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center text-canvas font-bold text-xs cursor-pointer hover:bg-charcoal transition-colors">
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
