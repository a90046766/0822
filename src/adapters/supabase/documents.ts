import type { DocumentsRepo, DocumentItem } from '../../core/repository'
import { supabase } from '../../utils/supabase'

function fromRow(r: any): DocumentItem {
  return { id: r.id, title: r.title, url: r.url, tags: r.tags || [], updatedAt: r.updated_at || new Date().toISOString() }
}

class SupabaseDocumentsRepo implements DocumentsRepo {
  async list(): Promise<DocumentItem[]> {
    const { data, error } = await supabase.from('documents').select('*').order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(fromRow)
  }
  async upsert(item: Omit<DocumentItem, 'updatedAt'>): Promise<DocumentItem> {
    const now = new Date().toISOString()
    const row: any = { id: (item as any).id, title: item.title, url: item.url, tags: item.tags || [], updated_at: now }
    const { data, error } = await supabase.from('documents').upsert(row).select().single()
    if (error) throw error
    return fromRow(data)
  }
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) throw error
  }
}

export const documentsRepo: DocumentsRepo = new SupabaseDocumentsRepo()


