import type { PayrollRepo, PayrollRecord, User } from '../../core/repository'
import { supabase } from '../../utils/supabase'

function fromRow(r: any): PayrollRecord {
  return {
    id: r.id,
    userEmail: r.user_email,
    month: r.month,
    baseSalary: r.base_salary ?? undefined,
    bonus: r.bonus ?? undefined,
    revenueShareRate: r.revenue_share_rate ?? undefined,
    total: r.total ?? undefined,
    breakdown: r.breakdown ?? undefined,
    updatedAt: r.updated_at || new Date().toISOString(),
  }
}

function toRow(p: Partial<PayrollRecord>): any {
  const r: any = { ...p }
  if ('userEmail' in r) r.user_email = (r as any).userEmail
  if ('baseSalary' in r) r.base_salary = (r as any).baseSalary
  if ('revenueShareRate' in r) r.revenue_share_rate = (r as any).revenueShareRate
  if ('updatedAt' in r) delete (r as any).updatedAt
  return r
}

class SupabasePayrollRepo implements PayrollRepo {
  async list(user?: User): Promise<PayrollRecord[]> {
    let query = supabase.from('payroll_records').select('*')
    if (user && user.role !== 'admin') query = query.eq('user_email', user.email)
    const { data, error } = await query.order('month', { ascending: false })
    if (error) throw error
    return (data || []).map(fromRow)
  }

  async upsert(record: Omit<PayrollRecord, 'id' | 'updatedAt'> & { id?: string }): Promise<PayrollRecord> {
    const now = new Date().toISOString()
    if (record.id) {
      const { data, error } = await supabase
        .from('payroll_records')
        .update({ ...toRow(record), updated_at: now })
        .eq('id', record.id)
        .select()
        .single()
      if (error) throw error
      return fromRow(data)
    }
    const { data, error } = await supabase
      .from('payroll_records')
      .insert({ ...toRow(record), updated_at: now })
      .select()
      .single()
    if (error) throw error
    return fromRow(data)
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('payroll_records').delete().eq('id', id)
    if (error) throw error
  }
}

export const payrollRepo: PayrollRepo = new SupabasePayrollRepo()


