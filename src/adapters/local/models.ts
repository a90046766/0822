import type { ModelsRepo, ModelItem } from '../../core/repository'

class LocalModelsRepo implements ModelsRepo {
  private readonly key = 'local-models'
  private load(): ModelItem[] { try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : [] } catch { return [] } }
  private save(rows: ModelItem[]) { localStorage.setItem(this.key, JSON.stringify(rows)) }

  async list(): Promise<ModelItem[]> { return this.load() }
  async upsert(item: Omit<ModelItem, 'updatedAt'>): Promise<ModelItem> {
    const rows = this.load()
    const now = new Date().toISOString()
    const idx = rows.findIndex(r => r.id === item.id)
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...item, updatedAt: now }
      this.save(rows)
      return rows[idx]
    }
    const id = (item as any).id || `MOD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const obj: ModelItem = { ...(item as any), id, updatedAt: now }
    this.save([obj, ...rows])
    return obj
  }
  async remove(id: string): Promise<void> { this.save(this.load().filter(r => r.id !== id)) }
}

export const modelsRepo = new LocalModelsRepo()


