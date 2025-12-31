"use client"

import { useState, useEffect, useRef } from "react"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function StoreManagementPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const supabase = getSupabase()
    const { data: productsData } = await supabase.from("store_products").select("*")
    const { data: categoriesData } = await supabase.from("store_categories").select("*")
    setProducts(productsData || [])
    setCategories(categoriesData || [])
    setLoading(false)
  }

  async function handleAddProduct(e: any) {
    e.preventDefault()
    if (!name || !price || !selectedCategoryId) {
      alert('يرجى تعبئة جميع الحقول واختيار الفئة')
      return
    }
    setLoading(true)
    let imageUrl = null
    try {
      if (imageFile) {
        const supabase = getSupabase()
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { data, error } = await supabase.storage.from('store-products').upload(fileName, imageFile)
        if (error) {
          alert('فشل رفع الصورة: ' + error.message)
          setLoading(false)
          return
        }
        imageUrl = supabase.storage.from('store-products').getPublicUrl(fileName).data.publicUrl
      }
      const supabase = getSupabase()
      const { error: insertError } = await supabase.from("store_products").insert({ name, price: Number(price), category_id: selectedCategoryId, image_url: imageUrl })
      if (insertError) {
        console.error('Insert error:', insertError)
        alert('فشل إضافة المنتج: ' + insertError.message)
        setLoading(false)
        return
      }
      alert('تمت إضافة المنتج بنجاح')
      setName("")
      setPrice("")
      setSelectedCategoryId("")
      setImageFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchData()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('حدث خطأ غير متوقع، راجع الكونسول')
    }
    setLoading(false)
  }

  async function handleAddCategory(e: any) {
    e.preventDefault()
    if (!newCategory) return
    setLoading(true)
    const supabase = getSupabase()
    await supabase.from("store_categories").insert({ name: newCategory })
    setNewCategory("")
    fetchData()
  }

  async function handleDeleteProduct(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setLoading(true);
    const supabase = getSupabase();
    await supabase.from("store_products").delete().eq("id", id);
    fetchData();
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm('سيتم حذف الفئة وكل المنتجات المرتبطة بها. هل أنت متأكد؟')) return;
    setLoading(true);
    const supabase = getSupabase();
    await supabase.from("store_categories").delete().eq("id", id);
    fetchData();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] to-white py-10 px-2 md:px-0">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1a2332] text-center">إدارة المتجر</h1>
        <div className="flex justify-center mb-6">
          <a href="/admin/store-orders" className="bg-[#d8a355] hover:bg-[#c99347] text-white font-bold px-6 py-2 rounded-lg text-lg">طلبات الطلاب</a>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-8 border border-[#D4AF37]/30">
          <h2 className="text-xl font-bold mb-4 text-[#d8a355]">إضافة منتج جديد</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2">
            <Input placeholder="اسم المنتج" value={name} onChange={e => setName(e.target.value)} className="col-span-1" />
            <Input placeholder="السعر" type="number" value={price} onChange={e => setPrice(e.target.value)} className="col-span-1" />
            <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="col-span-1 border rounded px-2 py-2 focus:ring-2 focus:ring-[#D4AF37]">
              <option value="">اختر الفئة</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
              className="col-span-1 border rounded px-2 py-2"
            />
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#023232] font-bold">إضافة منتج</Button>
          </form>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-8 border border-[#D4AF37]/30">
          <h2 className="text-xl font-bold mb-4 text-[#d8a355]">إضافة فئة جديدة</h2>
          <form onSubmit={handleAddCategory} className="flex gap-3 mb-2">
            <Input placeholder="اسم الفئة الجديدة" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#023232] font-bold">إضافة فئة</Button>
          </form>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-8 border border-[#D4AF37]/30">
          <h2 className="text-xl font-bold mb-4 text-[#1a2332]">المنتجات</h2>
          {products.length === 0 ? (
            <div className="text-gray-500 text-center">لا توجد منتجات بعد</div>
          ) : (
            <div className="grid gap-3">
              {products.map(prod => (
                <Card key={prod.id} className="border border-[#D4AF37]/40 shadow-sm">
                  <CardContent className="flex items-center justify-between py-4 px-2 gap-2">
                    <div>
                      <span className="font-bold text-[#d8a355]">{prod.name}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-[#1a2332]">{prod.price} نقطة</span>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(prod.id)} disabled={loading}>حذف</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-[#D4AF37]/30">
          <h2 className="text-xl font-bold mb-4 text-[#1a2332]">الفئات</h2>
          {categories.length === 0 ? (
            <div className="text-gray-500 text-center">لا توجد فئات بعد</div>
          ) : (
            <div className="grid gap-3">
              {categories.map(cat => (
                <Card key={cat.id} className="border border-[#D4AF37]/40 shadow-sm">
                  <CardContent className="flex items-center justify-between py-3 px-2">
                    <span className="font-bold text-[#d8a355]">{cat.name}</span>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(cat.id)} disabled={loading}>حذف</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
