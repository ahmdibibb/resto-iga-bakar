'use client'

/**
 * AdminDashboard — Halaman utama dashboard Admin
 * 
 * Halaman ini mengelola:
 * - Tab Dashboard: statistik harian, grafik revenue, daftar order
 * - Tab Products: CRUD produk (menggunakan ProductForm & ProductTable)
 * - Tab Orders: daftar pesanan (menggunakan OrderList)
 * - Tab Users: manajemen user/staff (menggunakan UserManagement)
 * - Tab Analytics: visualisasi data (menggunakan Analytics)
 * - Link QR Generator: navigasi ke halaman QR
 * 
 * Komponen UI telah diekstrak ke:
 * - @/components/admin/ProductForm   → Form tambah/edit produk
 * - @/components/admin/ProductTable  → Tabel daftar produk
 * - @/components/admin/OrderList     → Daftar pesanan
 * - @/components/admin/UserManagement → Kelola staff (Admin, Kasir)
 * - @/components/admin/Analytics     → Visualisasi laporan
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  TrendingUp,
  Plus,
  DollarSign,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import UserManagement from '@/components/admin/UserManagement'
import OrderList from '@/components/admin/OrderList'
import Analytics from '@/components/admin/Analytics'
import BannerManagement from '@/components/admin/BannerManagement'
import OrderDetailModal from '@/components/admin/OrderDetailModal'
import ProductForm from '@/components/admin/ProductForm'
import ProductTable from '@/components/admin/ProductTable'

import { useAdminStats, useTodayStats, useRecentOrders, useProducts } from '@/lib/hooks/useAdminStats'
import { DashboardCardSkeleton, TableSkeleton } from '@/components/admin/LoadingSkeleton'
import { RevenueBarChart } from '@/components/admin/RevenueBarChart'



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



type Tab = 'dashboard' | 'products' | 'orders' | 'users' | 'analytics' | 'banners' | 'qr'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revenuePeriod, setRevenuePeriod] = useState('monthly')
  const [orderPeriod, setOrderPeriod] = useState('weekly')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [productToDelete, setProductToDelete] = useState<{id: string; name: string} | null>(null)
  const [deleteResult, setDeleteResult] = useState<{show: boolean; success: boolean; title: string; message: string}>({show: false, success: false, title: '', message: ''})
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

  // Parse URL search parameters on load to support direct tab linking (e.g. ?tab=products)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab') as Tab
      if (tabParam && ['dashboard', 'products', 'orders', 'users', 'analytics', 'banners'].includes(tabParam)) {
        setActiveTab(tabParam)
      }
    }
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



  const handleSubmitProduct = async (formData: { name: string; description: string; price: string; stock: string; image: string; category: string }) => {
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
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (id: string) => {
    const product = products?.find((p: any) => p.id === id)
    setProductToDelete({ id, name: product?.name || 'this product' })
  }

  const executeDelete = async () => {
    if (!productToDelete) return
    const { id, name } = productToDelete
    setProductToDelete(null)

    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        const data = await res.json()
        
        if (data.softDelete) {
          setDeleteResult({
            show: true,
            success: true,
            title: 'Product Deactivated',
            message: `"${name}" has ${data.orderCount} order(s) in history.\n\nThe product was deactivated to preserve order records. You can reactivate it anytime by editing the product.`
          })
        } else {
          setDeleteResult({
            show: true,
            success: true,
            title: 'Product Deleted',
            message: `"${name}" has been permanently removed.`
          })
        }
        
        mutateProducts() // Revalidate products data
        setError(null)
      } else {
        const errorData = await res.json()
        setDeleteResult({
          show: true,
          success: false,
          title: 'Error',
          message: errorData.error || 'Failed to delete product'
        })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setDeleteResult({
        show: true,
        success: false,
        title: 'Error',
        message: 'Network error. Please try again.'
      })
    }
  }
  return (
    <AdminShell activeTab={activeTab} onTabChange={setActiveTab}>
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
                          <span className="inline-flex items-center gap-1">
                            {order.orderType === 'DINE_IN'
                              ? <><UtensilsCrossed size={12} /> Dine-In</>
                              : <><ShoppingBag size={12} /> Takeaway</>}
                          </span>
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
                setShowProductForm(true)
              }}
              className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-canvas hover:bg-charcoal text-xs font-semibold uppercase tracking-wider transition-all duration-150"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          {showProductForm && (
            <ProductForm
              editingProduct={editingProduct}
              onSubmit={handleSubmitProduct}
              onCancel={() => {
                setShowProductForm(false)
                setEditingProduct(null)
              }}
            />
          )}

          {productsLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            products && <ProductTable
              products={products}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
          )}
        </div>
      )}

      {activeTab === 'orders' && <OrderList />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'banners' && <BannerManagement />}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-canvas border border-hairline p-6 max-w-sm w-full mx-4 shadow-lg animate-scaleIn">
            <h3 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-4">Hapus Produk?</h3>
            <p className="text-charcoal mb-4">
              Apakah Anda yakin ingin menghapus <strong>"{productToDelete.name}"</strong>?
            </p>
            <p className="text-xs text-charcoal/80 mb-6 p-3 bg-soft-cloud border border-hairline">
              <strong>Catatan:</strong> Jika produk ini memiliki riwayat pesanan, produk akan dinonaktifkan alih-alih dihapus permanen.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-5 py-2.5 rounded-full bg-soft-cloud text-ink font-semibold hover:bg-hairline-soft transition-all border border-hairline"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-full bg-sale text-canvas font-semibold hover:bg-sale/90 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Result Modal */}
      {deleteResult.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-canvas border border-hairline p-6 max-w-sm w-full mx-4 shadow-lg animate-scaleIn text-center">
            <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${deleteResult.success ? 'bg-success/20 text-success' : 'bg-sale/20 text-sale'}`}>
              <span className="text-2xl font-bold">{deleteResult.success ? '✓' : '!'}</span>
            </div>
            <h3 className="text-xl font-bold font-jakarta uppercase tracking-tight text-ink mb-2">
              {deleteResult.title}
            </h3>
            <p className="text-charcoal mb-6 whitespace-pre-wrap text-sm">
              {deleteResult.message}
            </p>
            <button
              onClick={() => setDeleteResult({ ...deleteResult, show: false })}
              className="px-8 py-2.5 rounded-full bg-ink text-canvas font-semibold hover:bg-ink/90 transition-all w-full"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
