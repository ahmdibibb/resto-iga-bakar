'use client'

import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

interface CartItem {
    productId: string
    name: string
    price: number
    quantity: number
}

interface CartSidebarProps {
    cart: CartItem[]
    onUpdateQuantity: (productId: string, quantity: number) => void
    onRemoveItem: (productId: string) => void
    onCheckout: () => void
}

export default function CartSidebar({ cart, onUpdateQuantity, onRemoveItem, onCheckout }: CartSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0)
    }

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0)
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-canvas border border-hairline transition-all duration-200 hover:bg-charcoal lg:hidden cursor-pointer shadow-lg"
            >
                {isOpen ? <X size={20} /> : <ShoppingCart size={20} />}
                {cart.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-sale text-[10px] font-bold text-canvas">
                        {getTotalItems()}
                    </span>
                )}
            </button>

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full bg-canvas border-l border-hairline transition-transform duration-300 lg:left-0 lg:top-0 lg:h-screen lg:w-96 lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="flex h-full flex-col font-inter">
                    {/* Header */}
                    <div className="border-b border-hairline bg-ink p-6 font-jakarta">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="text-canvas" size={20} />
                                <h2 className="text-lg font-bold uppercase tracking-wider text-canvas">Pesanan</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-canvas hover:text-soft-cloud lg:hidden cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {cart.length > 0 && (
                            <p className="mt-2 text-xs uppercase tracking-wide text-stone-brand">
                                {getTotalItems()} ITEM DALAM KERANJANG
                            </p>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center font-jakarta">
                                <ShoppingCart size={48} className="mb-4 text-ash" />
                                <p className="text-sm font-bold uppercase tracking-wide text-ink">
                                    Keranjang Kosong
                                </p>
                                <p className="mt-1 text-xs text-mute">
                                    Silakan pilih hidangan di menu
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="bg-soft-cloud border border-hairline p-4 rounded-none"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 pr-2">
                                                <h3 className="font-bold text-sm text-ink font-jakarta tracking-tight line-clamp-1">
                                                    {item.name}
                                                </h3>
                                                <p className="mt-1 text-xs font-bold text-ink">
                                                    Rp {item.price.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => onRemoveItem(item.productId)}
                                                className="text-sale hover:text-ink transition-colors cursor-pointer"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink border border-hairline transition-all hover:bg-soft-cloud active:scale-90 cursor-pointer"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold text-ink">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink border border-hairline transition-all hover:bg-soft-cloud active:scale-90 cursor-pointer"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-extrabold text-ink font-jakarta">
                                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer - Total & Checkout */}
                    {cart.length > 0 && (
                        <div className="border-t border-hairline bg-canvas p-6">
                            <div className="mb-4 flex items-center justify-between font-jakarta">
                                <span className="text-xs font-bold uppercase tracking-wider text-mute">Total Bayar</span>
                                <span className="text-xl font-extrabold text-ink">
                                    Rp {getTotalPrice().toLocaleString('id-ID')}
                                </span>
                            </div>
                            <button
                                onClick={onCheckout}
                                className="w-full rounded-full bg-ink py-3.5 text-xs font-bold uppercase tracking-widest text-canvas border border-transparent transition-all duration-200 hover:bg-charcoal active:scale-95 cursor-pointer font-jakarta"
                            >
                                Selesaikan Pesanan ({getTotalItems()} item)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-35 bg-ink/50 backdrop-blur-sm lg:hidden"
                />
            )}
        </>
    )
}
