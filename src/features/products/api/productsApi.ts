import { supabase } from '@/lib/supabase'

export interface Product {
  id: string
  company_id: string
  name: string
  sku: string | null
  barcode: string | null
  unit: string
  purchase_price: number
  sale_price: number
  min_price: number | null
  stock_min: number
  description: string | null
  is_active: boolean
  category_id: string | null
  brand_id: string | null
  category?: { id: string; name: string } | null
  brand?: { id: string; name: string } | null
  product_images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  position: number
}

export interface CreateProductInput {
  company_id: string
  name: string
  sku?: string
  barcode?: string
  unit?: string
  purchase_price?: number
  sale_price?: number
  min_price?: number | null
  stock_min?: number
  description?: string
  is_active?: boolean
  category_id?: string | null
  brand_id?: string | null
}

export interface Category {
  id: string
  company_id: string
  name: string
  parent_id: string | null
}

export interface Brand {
  id: string
  company_id: string
  name: string
}

const BUCKET = 'product-images'

export const productsApi = {
  async list(companyId: string, options?: { includeDeleted?: boolean }): Promise<Product[]> {
    let q = supabase
      .from('products')
      .select(
        `
        id, company_id, name, sku, barcode, unit, purchase_price, sale_price, min_price, stock_min, description, is_active, category_id, brand_id,
        category:categories(id, name),
        brand:brands(id, name)
      `
      )
      .eq('company_id', companyId)
      .order('name')
    if (!options?.includeDeleted) {
      q = q.is('deleted_at', null)
    }
    const { data, error } = await q
    if (error) throw new Error(error.message)
    const products = (data ?? []) as unknown as Product[]
    for (const p of products) {
      p.product_images = await this.getImages(p.id)
    }
    return products
  },

  async get(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id, company_id, name, sku, barcode, unit, purchase_price, sale_price, min_price, stock_min, description, is_active, category_id, brand_id,
        category:categories(id, name),
        brand:brands(id, name)
      `
      )
      .eq('id', id)
      .single()
    if (error) return null
    const p = data as unknown as Product
    if (p) p.product_images = await this.getImages(p.id)
    return p
  },

  async create(input: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        company_id: input.company_id,
        name: input.name,
        sku: input.sku || null,
        barcode: input.barcode || null,
        unit: input.unit ?? 'pce',
        purchase_price: input.purchase_price ?? 0,
        sale_price: input.sale_price ?? 0,
        min_price: null,
        stock_min: input.stock_min ?? 0,
        description: input.description || null,
        is_active: input.is_active ?? true,
        category_id: input.category_id || null,
        brand_id: input.brand_id || null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Product
  },

  async update(id: string, input: Partial<CreateProductInput>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: input.name,
        sku: input.sku ?? undefined,
        barcode: input.barcode ?? undefined,
        unit: input.unit,
        purchase_price: input.purchase_price,
        sale_price: input.sale_price,
        min_price: null,
        stock_min: input.stock_min,
        description: input.description ?? undefined,
        is_active: input.is_active,
        category_id: input.category_id ?? undefined,
        brand_id: input.brand_id ?? undefined,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Product
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async setActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ is_active }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getImages(productId: string): Promise<ProductImage[]> {
    const { data } = await supabase
      .from('product_images')
      .select('id, product_id, url, position')
      .eq('product_id', productId)
      .order('position')
    return (data ?? []) as ProductImage[]
  },

  async addImage(productId: string, file: File): Promise<ProductImage> {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${productId}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) throw new Error(uploadError.message)
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
    const maxPos = await supabase
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1)
      .single()
    const pos = (maxPos.data?.position ?? -1) + 1
    const { data, error } = await supabase
      .from('product_images')
      .insert({ product_id: productId, url: urlData.publicUrl, position: pos })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as ProductImage
  },

  async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase.from('product_images').delete().eq('id', imageId)
    if (error) throw new Error(error.message)
  },

  async categories(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, company_id, name, parent_id')
      .eq('company_id', companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []) as Category[]
  },

  async createCategory(companyId: string, name: string, parentId?: string | null): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({ company_id: companyId, name, parent_id: parentId || null })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Category
  },

  async updateCategory(id: string, name: string): Promise<Category> {
    const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Category
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async brands(companyId: string): Promise<Brand[]> {
    const { data, error } = await supabase
      .from('brands')
      .select('id, company_id, name')
      .eq('company_id', companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []) as Brand[]
  },

  async createBrand(companyId: string, name: string): Promise<Brand> {
    const { data, error } = await supabase
      .from('brands')
      .insert({ company_id: companyId, name })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Brand
  },

  async updateBrand(id: string, name: string): Promise<Brand> {
    const { data, error } = await supabase.from('brands').update({ name }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data as Brand
  },

  async deleteBrand(id: string): Promise<void> {
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async importFromCsv(
    companyId: string,
    rows: Array<{
      name: string
      sku?: string | null
      barcode?: string | null
      unit?: string
      purchase_price?: number
      sale_price?: number
      stock_min?: number
      description?: string | null
      is_active?: boolean
      category?: string | null
      brand?: string | null
    }>
  ): Promise<{ created: number; errors: string[] }> {
    const existingCats = await this.categories(companyId)
    const existingBrands = await this.brands(companyId)
    const catMap = new Map<string, string>(existingCats.map((c) => [c.name.toLowerCase(), c.id]))
    const brandMap = new Map<string, string>(existingBrands.map((b) => [b.name.toLowerCase(), b.id]))
    let created = 0
    const errors: string[] = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        let catId: string | null = null
        if (r.category?.trim()) {
          const key = r.category.trim().toLowerCase()
          catId = catMap.get(key) ?? null
          if (!catId) {
            const c = await this.createCategory(companyId, r.category.trim())
            catMap.set(key, c.id)
            catId = c.id
          }
        }
        let brandId: string | null = null
        if (r.brand?.trim()) {
          const key = r.brand.trim().toLowerCase()
          brandId = brandMap.get(key) ?? null
          if (!brandId) {
            const b = await this.createBrand(companyId, r.brand.trim())
            brandMap.set(key, b.id)
            brandId = b.id
          }
        }
        await this.create({
          company_id: companyId,
          name: r.name,
          sku: r.sku ?? undefined,
          barcode: r.barcode ?? undefined,
          unit: r.unit ?? 'pce',
          purchase_price: r.purchase_price ?? 0,
          sale_price: r.sale_price ?? 0,
          stock_min: r.stock_min ?? 0,
          description: r.description ?? undefined,
          is_active: r.is_active ?? true,
          category_id: catId ?? undefined,
          brand_id: brandId ?? undefined,
        })
        created++
      } catch (e) {
        errors.push(`Ligne ${i + 2}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    return { created, errors }
  },
}
