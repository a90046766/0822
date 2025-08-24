import type { OrderRepo, Order } from '../../core/repository'
import { supabase } from '../../utils/supabase'

function toDbRow(input: Partial<Order>): any {
  if (!input) return {}
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
  const row: any = {}
  for (const [camel, snake] of Object.entries(map)) {
    if ((input as any)[camel] !== undefined) row[snake] = (input as any)[camel]
  }
  // 直接透傳已是 snake_case 或同名欄位
  const passthrough = ['status','platform','category','channel','used_item_id','canceled_reason']
  for (const key of passthrough) {
    if ((input as any)[key] !== undefined) row[key] = (input as any)[key]
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
    signatureTechnician: r.signatureTechnician || r.signature_technician,
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

const ORDERS_COLUMNS =
  'id, customer_name, customer_phone, customer_address, preferred_date, preferred_time_start, preferred_time_end, platform, referrer_code, member_id, service_items, assigned_technicians, signature_technician, signatures, photos, photos_before, photos_after, payment_method, payment_status, points_used, points_deduct_amount, category, channel, used_item_id, work_started_at, work_completed_at, service_finished_at, canceled_reason, status, created_at, updated_at'

class SupabaseOrderRepo implements OrderRepo {
  async list(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDERS_COLUMNS)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(fromDbRow) as any
  }

  async get(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDERS_COLUMNS)
      .eq('id', id)
      .single()
    if (error) {
      if ((
