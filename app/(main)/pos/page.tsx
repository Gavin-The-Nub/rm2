"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Minus, Search, ShoppingCart } from "lucide-react"
import { supabase } from "@/utils/supabase/client"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock_count: number | null
  image_url: string | null
}

type CartItem = Product & { cart_quantity: number }

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", false)
      .order("name")
    
    if (data) setProducts(data)
    if (error) console.error("Error fetching products:", error)
    setLoading(false)
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (product.stock_count !== null && existing.cart_quantity >= product.stock_count) return prev 
        return prev.map(item => 
          item.id === product.id ? { ...item, cart_quantity: item.cart_quantity + 1 } : item
        )
      }
      if (product.stock_count === null || product.stock_count > 0) {
        return [...prev, { ...product, cart_quantity: 1 }]
      }
      return prev
    })
  }

  const decrementCart = (productId: string) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, cart_quantity: item.cart_quantity - 1 } : item
    ).filter(item => item.cart_quantity > 0))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const total = cart.reduce((acc, item) => acc + item.price * item.cart_quantity, 0)
  
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setCheckingOut(true)

    const salesData = cart.map(item => ({
      product_id: item.id,
      quantity: item.cart_quantity,
      total_price: item.price * item.cart_quantity,
    }))

    const { error } = await supabase.from("sales").insert(salesData)
    
    if (error) {
      toast.error("Checkout failed: " + error.message)
      setCheckingOut(false)
      return
    }

    setCart([])
    await fetchProducts()
    setCheckingOut(false)
    toast.success("Checkout successful!")
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 pt-4 px-2">
      {/* Product Grid - Left Pane */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-card)] rounded-[20px] border border-white/[0.1] p-6 shadow-lg relative overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-[28px] font-bold text-white tracking-tight">Point of Sale</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm font-medium">Tap items to add to cart</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search products..."
                className="w-full bg-[var(--bg-input)] border border-white/20 hover:border-white/30 rounded-[14px] pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#0A84FF]/50 transition-colors shadow-inner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link 
              href="/pos/inventory"
              className="hidden sm:flex items-center justify-center h-11 px-4 rounded-xl border border-white/20 bg-white/[0.02] hover:bg-white/[0.04] text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Inventory
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white/[0.03] rounded-[16px] h-[140px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
              {filteredProducts.map(product => {
                const isLowStock = product.stock_count !== null && product.stock_count > 0 && product.stock_count < 5
                const isOutOfStock = product.stock_count !== null && product.stock_count === 0
                return (
                  <button 
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`relative text-left p-5 rounded-[16px] border transition-all duration-200 
                      ${isOutOfStock 
                        ? 'bg-white/[0.02] border-white/[0.02] opacity-40 cursor-not-allowed grayscale' 
                        : 'bg-[var(--bg-input)] border-white/[0.1] hover:border-[#0A84FF]/40 hover:bg-white/[0.06] hover:-translate-y-1 active:scale-95 shadow-sm'
                      }
                      ${isLowStock ? 'ring-1 ring-[#F59E0B]/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}`}
                  >
                    {isLowStock && (
                      <span className="absolute top-3 right-3 flex items-center justify-center bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-[#F59E0B]/20">
                        Low Stock
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-3 right-3 flex items-center justify-center bg-red-500/10 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-red-500/20">
                        Sold Out
                      </span>
                    )}
                    <div className="h-32 w-full rounded-[12px] bg-white/5 mb-4 flex items-center justify-center border border-white/[0.1] overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingCart className="text-white/20 h-6 w-6" />
                      )}
                    </div>
                    <div className="font-semibold text-white leading-tight mb-2 text-[15px]">
                      {product.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#0A84FF] font-bold">₱{product.price.toFixed(2)}</span>
                      {product.stock_count !== null && (
                        <span className="text-[11px] text-[var(--text-muted)] font-medium bg-black/20 px-2 py-1 rounded-md border border-white/[0.02]">
                          {product.stock_count} <span className="opacity-50">rem</span>
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
              {filteredProducts.length === 0 && !loading && (
                <div className="col-span-full h-40 flex items-center justify-center text-white/30 text-sm">
                  No products found. Add products in the Inventory menu.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart - Right Pane */}
      <div className="w-[380px] shrink-0 bg-[var(--bg-card)] rounded-[20px] border border-white/[0.1] shadow-lg flex flex-col relative overflow-hidden">
        <div className="p-6 border-b border-white/[0.1] shrink-0 bg-white/[0.01]">
          <div className="flex justify-between items-center">
            <h2 className="text-[18px] font-bold text-white flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF]">
                <ShoppingCart className="h-4 w-4" />
              </div>
              Current Order
            </h2>
            <span className="bg-white/[0.08] text-white/90 font-semibold px-3 py-1 rounded-full text-xs font-mono">
              {cart.reduce((a,c) => a + c.cart_quantity, 0)} ITEMS
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-4">
              <div className="h-20 w-20 rounded-full border border-dashed border-white/10 flex items-center justify-center bg-white/5">
                <ShoppingCart size={28} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex flex-col bg-black/20 hover:bg-black/30 rounded-[14px] p-4 border border-white/10 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-white font-medium text-[14px] leading-tight pr-4">{item.name}</span>
                    <span className="text-white font-bold text-[14px] shrink-0 font-mono tracking-tight">
                      ₱{(item.price * item.cart_quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-secondary)] font-mono">₱{item.price.toFixed(2)} <span className="opacity-50">ea</span></span>
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-[10px] p-1 border border-white/[0.04]">
                      <button 
                        onClick={() => decrementCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-[14px] text-white font-mono">
                        {item.cart_quantity}
                      </span>
                      <button 
                        onClick={() => addToCart(item)}
                        disabled={item.stock_count !== null && item.cart_quantity >= item.stock_count}
                        className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-[#000000]/30 border-t border-white/[0.1] shrink-0 backdrop-blur-xl">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)] font-medium">Subtotal</span>
              <span className="text-white font-mono">₱{total.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/[0.05] my-2" />
            <div className="flex justify-between items-end">
              <span className="text-[15px] text-[var(--text-secondary)] font-medium mb-1">Total</span>
              <span className="text-[32px] font-bold text-white tracking-tight leading-none font-mono">₱{total.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-14 text-[16px] font-bold bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-[0_4px_20px_rgba(10,132,255,0.3)] transition-all hover:shadow-[0_8px_25px_rgba(10,132,255,0.4)] disabled:opacity-50 disabled:hover:shadow-none rounded-[14px]"
            disabled={cart.length === 0 || checkingOut}
            onClick={handleCheckout}
          >
            {checkingOut ? "Processing..." : "Complete Checkout"}
          </Button>
        </div>
      </div>
    </div>
  )
}
