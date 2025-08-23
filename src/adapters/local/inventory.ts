import type { InventoryRepo, InventoryItem } from '../../core/repository'

class LocalInventoryRepo implements InventoryRepo {
  private readonly key = 'local-inventory'
  private load(): InventoryItem[] { try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : [] } catch { return [] } }
  private save(rows: InventoryItem[]) { localStorage.setItem(this.key, JSON.stringify(rows)) }

  async list(): Promise<InventoryItem[]> { return this.load() }
  async upsert(item: Omit<InventoryItem, 'updatedAt'>): Promise<InventoryItem> {
    const rows = this.load()
    const now = new Date().toISOString()
    const idx = rows.findIndex(r => r.id === item.id)
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...item, updatedAt: now }
      this.save(rows)
      return rows[idx]
    }
    const id = (item as any).id || `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const obj: InventoryItem = { ...(item as any), id, updatedAt: now }
    this.save([obj, ...rows])
    return obj
  }
  async remove(id: string): Promise<void> { this.save(this.load().filter(r => r.id !== id)) }
}

export const inventoryRepo = new LocalInventoryRepo()


