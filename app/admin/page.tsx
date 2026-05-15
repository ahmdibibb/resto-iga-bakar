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
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/80 flex flex-col py-6 z-50 shadow-xl transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 transform transition-transform hover:scale-105">
              <span className="text-xl">🔥</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Resto Iga Bakar</span>
          </div>
          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${activeTab === item.id
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-200 scale-[1.02]'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
                    }`}
                >
                  <div className={`${activeTab === item.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-orange-100'} p-1.5 rounded-lg transition-colors`}>
                    <Icon size={18} className={activeTab === item.id ? 'text-white' : 'text-gray-700 group-hover:text-orange-600'} />
                  </div>
                  <span className="text-sm">{item.label}</span>
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
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="bg-gray-100 group-hover:bg-orange-100 p-1.5 rounded-lg transition-colors">
                    <Icon size={18} className="text-gray-700 group-hover:text-orange-600" />
                  </div>
                  <span className="text-sm">{link.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Settings & Logout */}
        <div className="px-4 space-y-2 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent pt-4 mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md transition-all duration-200 group">
            <div className="bg-gray-100 group-hover:bg-blue-100 p-1.5 rounded-lg transition-colors">
              <Settings size={18} className="group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
              router.push('/login')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="bg-red-50 group-hover:bg-red-100 p-1.5 rounded-lg transition-colors">
              <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-64' : ''}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md group lg:hidden"
              >
                <Menu size={24} className="text-gray-600 group-hover:text-gray-900 transition-colors" />
              </button>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {navItems.find((item) => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md group">
                <Moon size={20} className="text-gray-600 group-hover:text-gray-900 transition-colors" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md relative group">
                <Bell size={20} className="text-gray-600 group-hover:text-gray-900 transition-colors" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 ml-2 border-l border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Admin</span>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-gray-200 hover:ring-orange-300 transition-all duration-200 cursor-pointer hover:scale-105">
                  <User size={20} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 font-semibold">⚠️ {error}</p>
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
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-4xl font-bold text-gray-900">{products?.length || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">Total Menus</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-gray-900" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Orders Today */}
                {todayLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-4xl font-bold text-gray-900">{todayOrders || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">Total Orders Today</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart size={20} className="text-gray-900" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Products Sold Today */}
                {todayLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-4xl font-bold text-gray-900">{todayProductsSold}</p>
                        <p className="text-sm text-gray-500 mt-1">Total Products Sold Today</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-gray-900" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue Today */}
                {todayLoading ? (
                  <DashboardCardSkeleton />
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-4xl font-bold text-gray-900">
                          Rp {(todayRevenue || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Revenue Today</p>
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DollarSign size={20} className="text-gray-900" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Chart */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="flex items-center justify-end mb-4">
                    <div className="flex gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setRevenuePeriod('today')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          revenuePeriod === 'today'
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                      >
                        Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenuePeriod('weekly')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          revenuePeriod === 'weekly'
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenuePeriod('monthly')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          revenuePeriod === 'monthly'
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </div>

                  {statsLoading ? (
                    <div className="h-[360px] animate-pulse rounded-xl bg-gray-100" />
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
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Orders Hari Ini</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View All →
                  </button>
                </div>

                {ordersLoading ? (
                  <TableSkeleton rows={5} />
                ) : recentOrders && recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            ID #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Customer Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                            Status Order
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentOrders.map((order: any, index: number) => (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                              {order.customerName || order.user?.name || 'Guest'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                              {order.orderType === 'DINE_IN'
                                ? `🍽️ Dine-In`
                                : '🥡 Takeaway'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                              Rp {order.totalAmount.toLocaleString('id-ID')}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'READY' ? 'bg-green-100 text-green-800' :
                                    order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${order.status === 'PENDING' ? 'bg-yellow-600' :
                                  order.status === 'CONFIRMED' ? 'bg-blue-600' :
                                    order.status === 'READY' ? 'bg-green-600' :
                                      order.status === 'COMPLETED' ? 'bg-gray-600' :
                                        'bg-gray-600'
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
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No recent orders</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="mb-6 flex justify-between">
                <h2 className="text-2xl font-bold">Products Management</h2>
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
                  className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                >
                  <Plus size={20} />
                  Add Product
                </button>
              </div>

              {showProductForm && (
                <div className="mb-6 rounded-2xl bg-white p-6 border border-gray-200">
                  <h3 className="mb-4 text-xl font-semibold">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <form
                    onSubmit={handleSubmitProduct}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="MAKANAN">Makanan</option>
                        <option value="MINUMAN">Minuman</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700"
                      >
                        {editingProduct ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProductForm(false)
                          setEditingProduct(null)
                        }}
                        className="rounded-xl border border-gray-300 px-6 py-2 hover:bg-gray-50"
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
                <div className="overflow-x-auto rounded-2xl bg-white border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products && products.map((product: any) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 font-medium">
                            {product.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {product.category ? (
                              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                                {product.category}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            Rp {(product.price || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">{product.stock}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={18} />
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
