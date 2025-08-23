import type { PayrollRepo, PayrollRecord, User } from '../../core/repository'

class LocalPayrollRepo implements PayrollRepo {
  private readonly key = 'local-payroll'
  private load(): PayrollRecord[] { try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : [] } catch { return [] } }
  private save(rows: PayrollRecord[]) { localStorage.setItem(this.key, JSON.stringify(rows)) }

  async list(user?: User): Promise<PayrollRecord[]> {
    const rows = this.load()
    if (!user) return rows
    return rows.filter(r => r.userEmail.toLowerCase() === user.email.toLowerCase())
  }
  async upsert(record: Omit<PayrollRecord, 'id' | 'updatedAt'> & { id?: string }): Promise<PayrollRecord> {
    const rows = this.load()
    const id = record.id || `PYR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const next: PayrollRecord = { ...record, id, updatedAt: new Date().toISOString() }
    const idx = rows.findIndex(r => r.id === id)
    if (idx >= 0) rows[idx] = next
    else rows.unshift(next)
    this.save(rows)
    return next
  }
  async remove(id: string): Promise<void> { this.save(this.load().filter(r => r.id !== id)) }
}

export const payrollRepo = new LocalPayrollRepo()


