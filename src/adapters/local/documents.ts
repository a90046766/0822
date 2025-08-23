import type { DocumentsRepo, DocumentItem } from '../../core/repository'

class LocalDocumentsRepo implements DocumentsRepo {
  private readonly key = 'local-documents'
  private load(): DocumentItem[] { try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : [] } catch { return [] } }
  private save(rows: DocumentItem[]) { localStorage.setItem(this.key, JSON.stringify(rows)) }

  async list(): Promise<DocumentItem[]> { return this.load() }
  async upsert(item: Omit<DocumentItem, 'updatedAt'>): Promise<DocumentItem> {
    const rows = this.load()
    const now = new Date().toISOString()
    const idx = rows.findIndex(r => r.id === item.id)
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...item, updatedAt: now }
      this.save(rows)
      return rows[idx]
    }
    const id = (item as any).id || `DOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const obj: DocumentItem = { ...(item as any), id, updatedAt: now }
    this.save([obj, ...rows])
    return obj
  }
  async remove(id: string): Promise<void> { this.save(this.load().filter(r => r.id !== id)) }
}

export const documentsRepo = new LocalDocumentsRepo()


