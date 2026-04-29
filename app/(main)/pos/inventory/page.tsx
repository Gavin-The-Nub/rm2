"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit2, PackagePlus, ArrowLeft, Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react"
import { supabase } from "@/utils/supabase/client"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { toast } from "sonner"

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock_count: number | null
  total_sold: number
  image_url: string | null
  is_archived: boolean
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Drinks",
    price: "",
    stock_count: "0",
    image_url: ""
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name")
    
    if (data) setProducts(data)
    if (error) console.error("Error fetching products:", error)
    setLoading(false)
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category || "Drinks",
        price: product.price.toString(),
        stock_count: product.stock_count !== null ? product.stock_count.toString() : "",
        image_url: product.image_url || ""
      })
    } else {
      setEditingProduct(null)
      setFormData({ name: "", category: "Drinks", price: "", stock_count: "0", image_url: "" })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in all required fields")
      return
    }

    const parsedStock = formData.stock_count.trim().toUpperCase() === "NA" || formData.stock_count.trim() === "" 
      ? null 
      : parseInt(formData.stock_count, 10);

    const payload = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock_count: parsedStock,
      image_url: formData.image_url || null
    }

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id)
      
      if (error) toast.error("Error updating product: " + error.message)
      else {
        toast.success("Product updated successfully")
        fetchProducts()
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert([payload])
      
      if (error) toast.error("Error creating product: " + error.message)
      else {
        toast.success("Product created successfully")
        fetchProducts()
      }
    }

    handleCloseModal()
  }

  const handleArchive = async () => {
    if (!editingProduct) return
    
    const confirmed = confirm(`Are you sure you want to archive "${editingProduct.name}"? It will no longer appear in the POS.`)
    if (!confirmed) return

    const { error } = await supabase
      .from("products")
      .update({ is_archived: true })
      .eq("id", editingProduct.id)

    if (error) {
      toast.error("Error archiving product: " + error.message)
    } else {
      toast.success("Product archived successfully")
      fetchProducts()
      handleCloseModal()
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message)
    } finally {
      setUploading(false)
    }
  }


  const filteredProducts = products.filter(p => 
    !p.is_archived && 
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/pos" className="text-white/50 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Inventory Management</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm ml-8">View and modify store products</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add Product
        </Button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[20px] border border-white/10 shadow-lg flex-1 overflow-hidden flex flex-col relative">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search inventory..."
              className="w-full bg-[var(--bg-input)] border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#0A84FF]/50 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[var(--bg-card)] z-10 box-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/10">Product Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/10">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/10">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/10">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/10">Sold</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-white/[0.05] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/50">Loading inventory...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/50">No products found. Add your first product!</td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-white/[0.02] border-b border-white/[0.05] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <PackagePlus className="w-5 h-5 text-white/20" />
                          )}
                        </div>
                        <div className="text-sm font-medium text-white">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-white">₱{product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-mono font-bold ${product.stock_count === null ? 'text-white/60' : product.stock_count < 5 ? 'text-[#F59E0B]' : 'text-white'}`}>
                        {product.stock_count === null ? "N/A" : product.stock_count}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono font-bold text-white">
                        {product.total_sold || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="text-[var(--text-secondary)] hover:text-[#0A84FF] transition-colors p-2 opacity-50 group-hover:opacity-100"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-white/20 shadow-2xl rounded-[24px] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#0A84FF]/10 text-[#0A84FF]">
                <PackagePlus size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Product Name</label>
                <input 
                  type="text" 
                  className="w-full bg-[var(--bg-input)] border border-white/[0.08] hover:border-white/20 focus:border-[#0A84FF] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Bottled Water"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Category</label>
                <select 
                  className="w-full bg-[var(--bg-input)] border border-white/[0.08] hover:border-white/20 focus:border-[#0A84FF] rounded-xl px-4 py-3 text-white text-sm outline-none transition-all appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Drinks">Drinks</option>
                  <option value="Supplements">Supplements</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Merchandise">Merchandise</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Price (₱)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-[var(--bg-input)] border border-white/[0.08] hover:border-white/20 focus:border-[#0A84FF] rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-all"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Stock Count (Leave empty for N/A)</label>
                  <input 
                    type="text" 
                    className="w-full bg-[var(--bg-input)] border border-white/[0.08] hover:border-white/20 focus:border-[#0A84FF] rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-all"
                    value={formData.stock_count}
                    onChange={e => setFormData({...formData, stock_count: e.target.value})}
                    placeholder="e.g. 10 or empty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Product Image</label>
                
                {formData.image_url ? (
                  <div className="relative group aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setFormData({...formData, image_url: ""})}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2
                      ${dragActive 
                        ? 'border-[#0A84FF] bg-[#0A84FF]/5' 
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                    
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-[#0A84FF] animate-spin" />
                        <span className="text-xs font-medium text-white/40">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-white/5 text-white/40">
                          <Upload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-white">Click or drag image here</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-5 bg-white/[0.02] border-t border-white/10 flex gap-3 justify-between items-center">
              <div>
                {editingProduct && (
                  <Button 
                    onClick={handleArchive} 
                    variant="ghost" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <ImageIcon size={18} className="mr-2" />
                    Archive Product
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCloseModal} variant="ghost" className="opacity-80 hover:opacity-100">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white min-w-[100px]">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
