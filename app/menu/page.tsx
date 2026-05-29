'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, AlertCircle } from 'lucide-react'
import CustomerNavbar from '@/components/navbar/CustomerNavbar'
import CategoryNavbar from '@/components/navbar/CategoryNavbar'
import CartSidebar from '@/components/CartSidebar'
import Loading from '@/components/Loading'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  category: string | null
  stock: number
  isActive: boolean
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

type Category = 'ALL' | 'MAKANAN' | 'MINUMAN'

function MenuPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category>('ALL')
  const [error, setError] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<{ id: string; name: string } | null>(null)

  // Get table ID and token from QR code URL params
  const tableIdFromQR = searchParams.get('table')
  const tokenFromQR = searchParams.get('token')
  const isTakeawayFromQR = searchParams.get('takeaway') === 'true'

  useEffect(() => {
    const initializePage = async () => {
      // Generate or retrieve session_id
      let sessionId = localStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem('session_id', sessionId)
      }

      console.log('=== MENU PAGE INIT ===')
      console.log('URL params:', { tableIdFromQR, tokenFromQR, isTakeawayFromQR })

      // Handle TAKEAWAY QR code
      if (isTakeawayFromQR && tokenFromQR) {
        console.log('✅ TAKEAWAY QR detected')
        
        // For takeaway, we need to find the TAKEAWAY table by name
        const validationResult = await validateTakeawayByToken(tokenFromQR)
        
        if (!validationResult.valid) {
          setError(validationResult.error || 'QR Code takeaway tidak valid')
          setLoading(false)
          return
        }

        // Set takeaway mode - COMPLETELY INDEPENDENT, NO TABLE
        localStorage.setItem('orderType', 'TAKEAWAY')
        localStorage.setItem('qr_token', tokenFromQR)
        
        // CRITICAL: Remove ALL table-related data for TAKEAWAY
        localStorage.removeItem('tableNumber')
        localStorage.removeItem('table_id')
        
        console.log('✅ TAKEAWAY mode set - NO table data')
        console.log('localStorage after TAKEAWAY set:', {
          orderType: localStorage.getItem('orderType'),
          tableNumber: localStorage.getItem('tableNumber'),
          table_id: localStorage.getItem('table_id')
        })
      }
      // Handle Table QR code
      else if (tableIdFromQR && tokenFromQR) {
        console.log('✅ DINE_IN QR detected')
        
        // Validate table and token
        const validationResult = await validateTable(tableIdFromQR, tokenFromQR)
        
        if (!validationResult.valid) {
          setError(validationResult.error || 'QR Code tidak valid')
          setLoading(false)
          return
        }

        // Store table information
        if (validationResult.table) {
          setTableInfo(validationResult.table)
          localStorage.setItem('table_id', validationResult.table.id)
          localStorage.setItem('tableNumber', validationResult.table.name)
          localStorage.setItem('qr_token', tokenFromQR)
          localStorage.setItem('orderType', 'DINE_IN')
          
          console.log('✅ DINE_IN mode set with table:', validationResult.table.name)
        }
      }

      // Load products and cart
      await fetchProducts()
      loadCart()
    }

    initializePage()
  }, [tableIdFromQR, tokenFromQR, isTakeawayFromQR])

  const validateTakeawayByToken = async (token: string) => {
    try {
      // For TAKEAWAY, we don't need to find the table first
      // Just validate directly with a special marker
      // The backend will handle TAKEAWAY table lookup
      
      const validationResponse = await fetch('/api/tables/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tableId: 'TAKEAWAY_MARKER', // Special marker for backend
          qr_token: token,
          isTakeaway: true // Flag to indicate this is takeaway validation
        }),
      })

      const data = await validationResponse.json()
      
      // CRITICAL: For TAKEAWAY, do NOT return table info
      if (data.valid) {
        return {
          valid: true,
          // Do NOT include table info for TAKEAWAY
        }
      }
      
      return data
    } catch (error) {
      console.error('Error validating takeaway:', error)
      return {
        valid: false,
        error: 'Terjadi kesalahan. Silakan coba lagi.',
      }
    }
  }

  const validateTable = async (tableId: string, token: string) => {
    try {
      const response = await fetch('/api/tables/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId, qr_token: token }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error validating table:', error)
      return {
        valid: false,
        error: 'Terjadi kesalahan. Silakan coba lagi.',
      }
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?isActive=true')
      const data = await res.json()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(
        products.filter(
          (product) => product.category?.toUpperCase() === selectedCategory
        )
      )
    }
  }, [selectedCategory, products])

  // Get placeholder image based on category
  // Override with NEXT_PUBLIC_PLACEHOLDER_IMAGE_FOOD / _DRINK / _DEFAULT in .env
  const getPlaceholderImage = (category: string | null, _name: string) => {
    if (category?.toUpperCase() === 'MAKANAN') {
      return (
        process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_FOOD ||
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop&q=80'
      )
    }
    if (category?.toUpperCase() === 'MINUMAN') {
      return (
        process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_DRINK ||
        'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&h=300&fit=crop&q=80'
      )
    }
    return (
      process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE_DEFAULT ||
      'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=400&h=300&fit=crop&q=80'
    )
  }

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Produk habis')
      return
    }

    const existingItem = cart.find((item) => item.productId === product.id)
    let newCart: CartItem[]

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Stok tidak cukup')
        return
      }
      newCart = cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      newCart = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]
    }

    saveCart(newCart)
  }

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.productId !== productId)
    saveCart(newCart)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && quantity > product.stock) {
      alert('Stok tidak cukup')
      return
    }

    const newCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    )
    saveCart(newCart)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong')
      return
    }
    router.push('/checkout')
  }

  if (loading) {
    return <Loading message="Memuat menu..." />
  }

  // Display error if table validation failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500" size={32} />
            <h2 className="text-xl font-bold text-gray-900">Terjadi Kesalahan</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  // Determine table info from state or localStorage
  const savedTable = typeof window !== 'undefined' ? localStorage.getItem('tableNumber') : null
  const savedOrderType = typeof window !== 'undefined' ? localStorage.getItem('orderType') : null
  
  // For TAKEAWAY, do NOT use any table info
  const displayTable = savedOrderType === 'TAKEAWAY' ? null : (tableInfo?.name || savedTable)
  const isTakeaway = isTakeawayFromQR || savedOrderType === 'TAKEAWAY'

  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      <CustomerNavbar
        tableNumber={displayTable}
        isTakeaway={isTakeaway}
        sticky={true}
      />
      <CategoryNavbar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Content - 2 Column Layout */}
      <div className="flex min-h-[calc(100vh-144px)]">
        {/* Left Side - Cart Sidebar (Desktop) */}
        <div className="hidden lg:block lg:w-96 flex-shrink-0 border-r border-hairline bg-canvas">
          <CartSidebar
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
          />
        </div>

        {/* Right Side - Products Grid */}
        <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 bg-canvas">
          <div className="mx-auto max-w-7xl">
            
            {/* Hero Campaign Banner */}
            <div className="relative mb-12 aspect-[16/9] w-full overflow-hidden bg-soft-cloud border border-hairline">
              <img
                src="/iga_bakar_hero.png"
                alt="Iga Bakar Campaign"
                className="h-full w-full object-cover brightness-[0.75]"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent">
                <span className="text-xs font-bold tracking-widest text-canvas/80 uppercase font-jakarta mb-2">
                  Spesial Akhir Pekan
                </span>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-canvas font-bebas leading-[0.9] uppercase mb-4 max-w-2xl">
                  IGA BAKAR MERAPI: THE RITUAL OF SMOKE
                </h2>
                <div className="flex">
                  <button
                    onClick={() => {
                      const merapiProduct = products.find(p => p.name.toLowerCase().includes('merapi'));
                      if (merapiProduct) {
                        addToCart(merapiProduct);
                      } else {
                        const gridElement = document.getElementById('menu-grid');
                        gridElement?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="rounded-full bg-canvas text-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:bg-soft-cloud active:scale-95 cursor-pointer font-jakarta"
                  >
                    Pesan Sekarang
                  </button>
                </div>
              </div>
            </div>

            <div id="menu-grid" className="mb-8 flex items-end justify-between border-b border-hairline pb-4">
              <h2 className="text-xl font-bold text-ink lg:text-2xl font-jakarta uppercase tracking-tight">
                {selectedCategory === 'ALL'
                  ? 'Semua Menu'
                  : selectedCategory === 'MAKANAN'
                    ? 'Makanan'
                    : 'Minuman'}
              </h2>
              <p className="text-xs uppercase tracking-wider text-ash font-jakarta">
                {filteredProducts.length} pilihan
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-soft-cloud border border-hairline">
                <p className="text-sm font-medium text-charcoal font-jakarta uppercase tracking-wide">
                  Tidak ada produk tersedia untuk kategori ini
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="group relative flex flex-col bg-canvas border border-transparent rounded-none"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-soft-cloud border border-hairline">
                      <img
                        src={product.image || getPlaceholderImage(product.category, product.name)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/75">
                          <span className="bg-sale text-canvas px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
                            Habis
                          </span>
                        </div>
                      )}
                      {product.stock > 0 && product.stock <= 5 && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className="bg-canvas border border-hairline text-sale px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Stok: {product.stock}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col flex-1 pt-4 pb-2">
                      <span className="text-[10px] font-semibold text-mute uppercase tracking-widest mb-1.5 block">
                        {product.category || 'MENU'}
                      </span>
                      
                      <h3 className="mb-1 text-base font-bold text-ink tracking-tight font-jakarta line-clamp-1">
                        {product.name}
                      </h3>

                      {product.name.toLowerCase().match(/(pedas|merapi|ricarica|ricang)/) && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-sale" />
                          <span className="h-1.5 w-1.5 rounded-full bg-sale" />
                          <span className="h-1.5 w-1.5 rounded-full bg-sale" />
                          <span className="text-[9px] font-bold text-sale uppercase tracking-wider ml-1">Spicy</span>
                        </div>
                      )}

                      {product.description && (
                        <p className="mb-3 text-xs text-charcoal font-inter line-clamp-2 min-h-[2rem] leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      {/* Price */}
                      <div className="mt-auto">
                        <p className="mb-3 text-base font-extrabold text-ink font-jakarta">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className="w-full flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-canvas transition-all duration-200 hover:bg-charcoal active:scale-95 disabled:cursor-not-allowed disabled:bg-soft-cloud disabled:text-ash border border-transparent cursor-pointer font-jakarta"
                        >
                          <ShoppingCart size={13} />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cart Sidebar */}
        <div className="lg:hidden">
          <CartSidebar
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<Loading message="Memuat menu..." />}>
      <MenuPageContent />
    </Suspense>
  )
}
