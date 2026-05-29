'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  TrendingUp,
  Menu,
  Bell,
  Moon,
  User,
  Settings,
  FileText,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Download,
  DollarSign,
  QrCode,
} from 'lucide-react'
import Loading from '@/components/Loading'
import UserManagement from '@/components/admin/UserManagement'
import OrderList from '@/components/admin/OrderList'
import Analytics from '@/components/admin/Analytics'
import OrderDetailModal from '@/components/admin/OrderDetailModal'
import { generateSalesReportPDF } from '@/lib/generateSalesReportPDF'
import { useAdminStats, useTodayStats, useRecentOrders, useProducts } from '@/lib/hooks/useAdminStats'
import { DashboardCardSkeleton, TableSkeleton } from '@/components/admin/LoadingSkeleton'
import { RevenueBarChart } from '@/components/admin/RevenueBarChart'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  productsSold: number
  lowStockProducts: Array<{ id: string; name: string; stock: number }>
  topProducts: Array<{ product: any; quantitySold: number }>
  dailySales: Array<{ date: string; amount: number }>
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  isActive: boolean
  category: string | null
  image: string | null
}

interface SalesReport {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  totalProductsSold: number
  totalRevenue: number
  revenueByMethod: {
    CASH: number
    QRIS: number
  }
  productSales: Array<{
    productId: string
    productName: string
    quantitySold: number
    totalRevenue: number
  }>
  dailyRevenue: Array<{ date: string; amount: number }>
}

type Tab = 'dashboard' | 'products' | 'orders' | 'users' | 'analytics' | 'qr'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showSalesReport, setShowSalesReport] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [revenuePeriod, setRevenuePeriod] = useState('monthly')
  const [orderPeriod, setOrderPeriod] = useState('weekly')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    category: '',
  })

  // SWR hooks for real-time data with auto-refresh
  const { chartData, isLoading: statsLoading, isError: statsError } = useAdminStats(revenuePeriod)
  const {
    todayOrders,
    todayRevenue,
    todayProductsSold,
    isLoading: todayLoading,
    isError: todayError,
  } = useTodayStats()
  const { orders: recentOrders, isLoading: ordersLoading, isError: ordersError } = useRecentOrders()
  const { products, isLoading: productsLoading, isError: productsError, mutate: mutateProducts } = useProducts()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    checkUserRole()
  }, [])

  // Combine all errors
  useEffect(() => {
    const errors = [statsError, todayError, ordersError, productsError].filter(Boolean)
    if (errors.length > 0) {
      setError('Gagal memuat beberapa data. Silakan refresh halaman.')
    } else {
      setError(null)
    }
  }, [statsError, todayError, ordersError, productsError])

  const checkUserRole = async () => {
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
        setError('Access denied. Admin privileges required.')
        setLoading(false)
        setIsAuthenticated(false)
        return
      }

      // Clear any previous errors and mark as authenticated
      setError(null)
      setIsAuthenticated(true)
      setLoading(false)
    } catch (error) {
      console.error('Error checking user role:', error)
      setLoading(false)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }

  const fetchSalesReport = async () => {
    try {
      const res = await fetch('/api/dashboard/sales-report', {
        credentials: 'include',
      })

      if (!res.ok) {
        setSalesReport(null)
        return
      }

      const data = await res.json()
      setSalesReport(data)
    } catch (error) {
      console.error('Error fetching sales report:', error)
      setSalesReport(null)
    }
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      })

      if (res.ok) {
        setShowProductForm(false)
        setEditingProduct(null)
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          image: '',
          category: '',
        })
        mutateProducts() // Revalidate products data
        setError(null)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image || '',
      category: product.category || '',
    })
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (id: string) => {
    const product = products?.find((p: any) => p.id === id)
    const productName = product?.name || 'this product'
    
    if (!confirm(`Are you sure you want to delete "${productName}"?\n\nNote: If this product has order history, it will be deactivated instead of deleted.`)) return

    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        const data = await res.json()
        
        if (data.softDelete) {
          // Product was deactivated (has order history)
          alert(`✓ Product deactivated successfully!\n\n"${productName}" has ${data.orderCount} order(s) in history.\n\nThe product was deactivated to preserve order records. You can reactivate it anytime by editing the product.`)
        } else {
          // Product was permanently deleted
          alert(`✓ Product deleted successfully!\n\n"${productName}" has been permanently removed.`)
        }
        
        mutateProducts() // Revalidate products data
        setError(null)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to delete product')
        alert(`❌ Error: ${errorData.error || 'Failed to delete product'}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setError('Network error. Please try again.')
      alert('❌ Network error. Please try again.')
    }
  }

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as Tab, label: 'Products', icon: Package },
    { id: 'orders' as Tab, label: 'Orders', icon: ShoppingCart },
    { id: 'users' as Tab, label: 'Users', icon: UsersIcon },
    { id: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
    { id: 'qr' as Tab, label: 'QR Generator', icon: QrCode },
  ]

  const externalLinks = [
    { label: 'Reports', icon: FileText, href: '/admin/reports' },
  ]

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
      <div className={`fixed left-0 top-0 h-full w-64 bg-ink border-r border-hairline flex flex-col py-6 z-50 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 font-jakarta`}>
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center justify-between border-b border-hairline/25 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-soft-cloud rounded-none flex items-center justify-center">
              <span className="text-sm">🔥</span>
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-canvas">Admin Portal</span>
          </div>
          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-full text-stone-brand hover:text-canvas hover:bg-soft-cloud/10"
            >
              <svg className="w-5 h-5 text-stone-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="text-stone-brand/50 text-[10px] font-bold uppercase tracking-widest px-4 py-2">Menu</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'qr') {
                      router.push('/admin/qr-generator')
                    } else {
                      setActiveTab(item.id)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-none transition-all duration-150 group cursor-pointer ${
                    isActive
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
            
            {/* External Links */}
            {externalLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-none transition-all duration-150 group text-stone-brand hover:text-canvas hover:bg-soft-cloud/5 cursor-pointer"
                >
                  <div className="p-1 rounded-none flex-shrink-0">
                    <Icon size={15} className="text-stone-brand group-hover:text-canvas" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider">{link.label}</span>
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
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-64' : ''}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-canvas border-b border-hairline px-8 py-4">
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
                {navItems.find((item) => item.id === activeTab)?.label || 'Dashboard'}
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
                <span className="text-xs font-bold text-ink hidden sm:block">Admin</span>
                <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center text-canvas font-bold text-xs cursor-pointer hover:bg-charcoal transition-colors">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-none bg-soft-cloud border border-hairline p-4">
              <p className="text-sm text-sale font-semibold">⚠️ {error}</p>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Menus */}
                {productsLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-bold text-ink">{products?.length || 0}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-mute mt-1">Total Menus</p>
                      </div>
                      <div className="w-9 h-9 bg-canvas border border-hairline rounded-none flex items-center justify-center">
                        <Package size={16} className="text-ink" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Orders Today */}
                {todayLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-bold text-ink">{todayOrders || 0}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-mute mt-1">Total Orders Today</p>
                      </div>
                      <div className="w-9 h-9 bg-canvas border border-hairline rounded-none flex items-center justify-center">
                        <ShoppingCart size={16} className="text-ink" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Products Sold Today */}
                {todayLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-bold text-ink">{todayProductsSold}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-mute mt-1">Total Products Sold Today</p>
                      </div>
                      <div className="w-9 h-9 bg-canvas border border-hairline rounded-none flex items-center justify-center">
                        <Package size={16} className="text-ink" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue Today */}
                {todayLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-soft-cloud border border-hairline p-6 rounded-none">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl font-bold text-ink">
                          Rp {(todayRevenue || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-mute mt-1">Revenue Today</p>
                      </div>
                      <div className="w-9 h-9 bg-canvas border border-hairline rounded-none flex items-center justify-center">
                        <DollarSign size={16} className="text-ink" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Chart */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="flex items-center justify-end mb-4">
                    <div className="flex gap-1 bg-soft-cloud rounded-full p-1 border border-hairline">
                      <button
                        type="button"
                        onClick={() => setRevenuePeriod('today')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-150 ${
                          revenuePeriod === 'today'
                            ? 'bg-ink text-canvas'
                            : 'text-ink hover:bg-canvas/50'
                        }`}
                      >
                        Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenuePeriod('weekly')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-150 ${
                          revenuePeriod === 'weekly'
                            ? 'bg-ink text-canvas'
                            : 'text-ink hover:bg-canvas/50'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenuePeriod('monthly')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-150 ${
                          revenuePeriod === 'monthly'
                            ? 'bg-ink text-canvas'
                            : 'text-ink hover:bg-canvas/50'
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </div>

                  {statsLoading ? (
                    <div className="h-[360px] animate-pulse rounded-none bg-soft-cloud border border-hairline" />
                  ) : (
                    <RevenueBarChart
                      data={chartData}
                      title="Revenue Overview"
                      description="Pantau performa penjualan resto"
                      period={
                        revenuePeriod === 'today'
                          ? 'today'
                          : revenuePeriod === 'weekly'
                            ? 'week'
                            : 'month'
                      }
                    />
                  )}
                </div>
              </div>

              {/* Order List Preview */}
              <div className="bg-canvas border border-hairline p-6 rounded-none">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Orders Hari Ini</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-ink hover:underline uppercase tracking-wider"
                  >
                    View All →
                  </button>
                </div>

                {ordersLoading ? (
                  <TableSkeleton rows={5} />
                ) : recentOrders && recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-soft-cloud border-b border-hairline">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            ID #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            Customer Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-ink">
                            Status Order
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {recentOrders.map((order: any, index: number) => (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="hover:bg-soft-cloud/40 cursor-pointer transition-colors"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-charcoal">
                              {index + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-bold text-ink">
                              #{order.orderNumber}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-charcoal">
                              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-ink">
                              {order.customerName || order.user?.name || 'Guest'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-charcoal">
                              {order.orderType === 'DINE_IN'
                                ? `🍽️ Dine-In`
                                : '🥡 Takeaway'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-ink">
                              Rp {order.totalAmount.toLocaleString('id-ID')}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${order.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  order.status === 'READY' ? 'bg-green-50 text-green-800 border-green-200' :
                                    order.status === 'COMPLETED' ? 'bg-soft-cloud text-ink border-hairline' :
                                      'bg-soft-cloud text-ink border-hairline'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'PENDING' ? 'bg-amber-600' :
                                  order.status === 'CONFIRMED' ? 'bg-blue-600' :
                                    order.status === 'READY' ? 'bg-green-600' :
                                      order.status === 'COMPLETED' ? 'bg-ink' :
                                        'bg-ink'
                                  }`}></span>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-mute">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-semibold uppercase tracking-wider">No recent orders</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="mb-6 flex justify-between">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider font-jakarta">Products Management</h2>
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      stock: '',
                      image: '',
                      category: '',
                    })
                    setShowProductForm(true)
                  }}
                  className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider transition-all duration-150"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              {showProductForm && (
                <div className="mb-6 bg-soft-cloud p-6 border border-hairline rounded-none">
                  <h3 className="mb-4 text-sm font-bold text-ink uppercase tracking-wider font-jakarta">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <form
                    onSubmit={handleSubmitProduct}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                        className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        required
                        className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="MAKANAN">Makanan</option>
                        <option value="MINUMAN">Minuman</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full bg-canvas text-ink border border-hairline rounded-2xl px-4 py-2 focus:border-ink focus:outline-none text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                        className="w-full bg-canvas text-ink border border-hairline rounded-full px-4 py-2 focus:border-ink focus:outline-none text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        className="rounded-full bg-ink px-6 py-2.5 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider"
                      >
                        {editingProduct ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProductForm(false)
                          setEditingProduct(null)
                        }}
                        className="rounded-full border border-hairline px-6 py-2.5 text-ink hover:bg-soft-cloud text-xs font-semibold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {productsLoading ? (
                <TableSkeleton rows={10} />
              ) : (
                <div className="overflow-x-auto rounded-none bg-canvas border border-hairline">
                  <table className="w-full">
                    <thead className="bg-soft-cloud border-b border-hairline">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-ink">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {products && products.map((product: any) => (
                        <tr key={product.id} className="hover:bg-soft-cloud/40 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-xs text-ink">
                            {product.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {product.category ? (
                              <span className="border border-hairline bg-soft-cloud text-ink rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                                {product.category}
                              </span>
                            ) : (
                              <span className="text-mute text-xs">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">
                            Rp {(product.price || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-charcoal">{product.stock}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${product.isActive
                                ? 'border-green-200 bg-green-50 text-green-800'
                                : 'border-red-200 bg-red-50 text-red-800'
                                }`}
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-ink hover:text-charcoal p-1"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-sale hover:text-sale-deep p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && <OrderList />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'analytics' && <Analytics />}
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  )
}
