import type { InventoryRepo, InventoryItem } from '../../core/repository'
import { supabase } from '../../utils/supabase'

function toDbRow(item: Partial<InventoryItem>): any {
  const r: any = { ...item }
  const map: Record<string, string> = {
    productId: 'product_id',
    imageUrls: 'image_urls',
    safeStock: 'safe_stock',
  }
  for (const [camel, snake] of Object.entries(map)) {
    if (camel in r) r[snake] = (r as any)[camel]
  }
  return r
}

function fromDbRow(row: any): InventoryItem {
  const r = row || {}
  return {
    id: r.id,
    name: r.name || '',
    productId: r.product_id ?? r.productId,
    quantity: r.quantity ?? 0,
    description: r.description || '',
    imageUrls: r.image_urls ?? r.imageUrls ?? [],
    safeStock: r.safe_stock ?? r.safeStock,
    updatedAt: r.updated_at ?? new Date().toISOString(),
  }
}

class SupabaseInventoryRepo implements InventoryRepo {
  async list(): Promise<InventoryItem[]> {
    const { data, error } = await supabase.from('inventory').select('*').order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(fromDbRow)
  }

  async upsert(item: Omit<InventoryItem, 'updatedAt'>): Promise<InventoryItem> {
    const now = new Date().toISOString()
    const row: any = { ...toDbRow(item), updated_at: now }
    if (!row.id || row.id === '') {
      row.id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}`
    }
    const { data, error } = await supabase.from('inventory').upsert(row).select().single()
    if (error) throw error
    return fromDbRow(data)
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) throw error
  }
}

export const inventoryRepo: InventoryRepo = new SupabaseInventoryRepo()


