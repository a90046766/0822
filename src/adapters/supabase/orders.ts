import type { OrderRepo, Order } from '../../core/repository'
import { supabase } from '../../utils/supabase'

function toDbRow(input: Partial<Order>): any {
  if (!input) return {}
  const row: any = { ...input }
  // 雙寫 camelCase 與 snake_case，兼容不同建表命名
  const map: Record<string, string> = {
    customerName: 'customer_name',
    customerPhone: 'customer_phone',
    customerAddress: 'customer_address',
    preferredDate: 'preferred_date',
    preferredTimeStart: 'preferred_time_start',
    preferredTimeEnd: 'preferred_time_end',
    referrerCode: 'referrer_code',
    memberId: 'member_id',
    assignedTechnicians: 'assigned_technicians',
    serviceItems: 'service_items',
    signatures: 'signatures',
    photos: 'photos',
    photosBefore: 'photos_before',
    photosAfter: 'photos_after',
    paymentMethod: 'payment_method',
    paymentStatus: 'payment_status',
    pointsUsed: 'points_used',
    pointsDeductAmount: 'points_deduct_amount',
    workStartedAt: 'work_started_at',
    workCompletedAt: 'work_completed_at',
    serviceFinishedAt: 'service_finished_at',
  }
  for (const [camel, snake] of Object.entries(map)) {
    if (camel in row) row[snake] = (row as any)[camel]
  }
  return row
}

function fromDbRow(row: any): Order {
  const r = row || {}
  const pick = (a: string, b: string) => (r[a] ?? r[b])
  return {
    id: r.id,
    memberId: pick('memberId', 'member_id'),
    customerName: pick('customerName', 'customer_name') || '',
    customerPhone: pick('customerPhone', 'customer_phone') || '',
    customerAddress: pick('customerAddress', 'customer_address') || '',
    preferredDate: pick('preferredDate', 'preferred_date') || '',
    preferredTimeStart: pick('preferredTimeStart', 'preferred_time_start') || '09:00',
    preferredTimeEnd: pick('preferredTimeEnd', 'preferred_time_end') || '12:00',
    referrerCode: pick('referrerCode', 'referrer_code') || '',
    paymentMethod: pick('paymentMethod', 'payment_method'),
    paymentStatus: pick('paymentStatus', 'payment_status'),
    pointsUsed: pick('pointsUsed', 'points_used') ?? 0,
    pointsDeductAmount: pick('pointsDeductAmount', 'points_deduct_amount') ?? 0,
    serviceItems: pick('serviceItems', 'service_items') || [],
    assignedTechnicians: pick('assignedTechnicians', 'assigned_technicians') || [],
    signatureTechnician: r.signatureTechnician,
    status: r.status || 'draft',
    platform: r.platform || '日',
    photos: r.photos || [],
    photosBefore: pick('photosBefore', 'photos_before') || [],
    photosAfter: pick('photosAfter', 'photos_after') || [],
    signatures: r.signatures || {},
    workStartedAt: pick('workStartedAt', 'work_started_at'),
    workCompletedAt: pick('workCompletedAt', 'work_completed_at'),
    serviceFinishedAt: pick('serviceFinishedAt', 'service_finished_at'),
    canceledReason: pick('canceledReason', 'canceled_reason'),
    closedAt: pick('closedAt', 'closed_at'),
    createdAt: pick('createdAt', 'created_at') || new Date().toISOString(),
    updatedAt: pick('updatedAt', 'updated_at') || new Date().toISOString(),
  }
}

class SupabaseOrderRepo implements OrderRepo {
  async list(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(fromDbRow) as any
  }

  async get(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      // PGRST116: No rows found
      if ((error as any).code === 'PGRST116') return null
      throw error
    }
    return data ? fromDbRow(data) as any : null
  }

  async create(draft: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const now = new Date().toISOString()
    const row: any = { ...toDbRow(draft), created_at: now, updated_at: now }
    const { data, error } = await supabase.from('orders').insert(row).select().single()
    if (error) throw error
    return fromDbRow(data)
  }

  async update(id: string, patch: Partial<Order>): Promise<void> {
    const row: any = { ...toDbRow(patch), updated_at: new Date().toISOString() }
    const { error } = await supabase.from('orders').update(row).eq('id', id)
    if (error) throw error
  }

  async delete(id: string, reason: string): Promise<void> {
    // 僅允許刪除草稿；否則請使用 cancel
    const { data, error } = await supabase.from('orders').select('status').eq('id', id).single()
    if (error) throw error
    if (!data) throw new Error('訂單不存在')
    if ((data as any).status !== 'draft') throw new Error('僅草稿可刪除')
    const { error: e2 } = await supabase.from('orders').delete().eq('id', id)
    if (e2) throw e2
  }

  async cancel(id: string, reason: string): Promise<void> {
    const { error } = await supabase.from('orders').update({ status: 'canceled', canceled_reason: reason, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }

  async confirm(id: string): Promise<void> {
    const { error } = await supabase.from('orders').update({ status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }

  async startWork(id: string, at: string): Promise<void> {
    const { error } = await supabase.from('orders').update({ status: 'in_progress', work_started_at: at, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }

  async finishWork(id: string, at: string): Promise<void> {
    // 先讀訂單以便計算積分與扣庫
    const one = await this.get(id)
    const { error } = await supabase.from('orders').update({ status: 'completed', work_completed_at: at, service_finished_at: at, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    try {
      if (one) {
        const sum = (one.serviceItems || []).reduce((s, it: any) => s + (it.unitPrice || 0) * (it.quantity || 0), 0)
        const net = Math.max(0, sum - (one.pointsDeductAmount || 0))
        // 會員加點（100 元 = 1 點）
        if (one.memberId) {
          const { data: m, error: me } = await supabase.from('members').select('*').eq('id', one.memberId).single()
          if (!me && m) {
            const pts = (m.points || 0) + Math.floor(net / 100)
            await supabase.from('members').update({ points: pts, updated_at: new Date().toISOString() }).eq('id', one.memberId)
          }
        }
        // 完工扣庫：優先 productId
        if (Array.isArray(one.serviceItems)) {
          for (const it of one.serviceItems) {
            if (it.productId) {
              const { data: inv } = await supabase.from('inventory').select('*').eq('product_id', it.productId).limit(1).maybeSingle()
              if (inv) {
                const qty = Math.max(0, (inv.quantity || 0) - (it.quantity || 0))
                await supabase.from('inventory').update({ quantity: qty, updated_at: new Date().toISOString() }).eq('id', inv.id)
              }
            }
          }
        }
      }
    } catch {}
  }
}

export const orderRepo = new SupabaseOrderRepo()


