import { useEffect, useState } from 'react'
import { authRepo } from '../../adapters/local/auth'
import { computeMonthlyPayroll, getPayoutDates } from '../../services/payroll'

export default function PayrollPage() {
  const [rows, setRows] = useState<any[]>([])
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7))
  const user = authRepo.getCurrentUser()
  useEffect(() => {
    computeMonthlyPayroll(month).then(rs => {
      // 權限：技師/客服僅看自己；管理員可看全部
      if (user?.role === 'technician' || user?.role === 'support') {
        const email = (user.email||'').toLowerCase()
        setRows(rs.filter((r:any)=> ((r.technician?.email||'').toLowerCase() === email)))
      } else {
        setRows(rs)
      }
    })
  }, [month])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">薪資管理</div>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </div>
      {user?.role==='admin' && (
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-2 text-sm font-semibold">人工登錄/調整</div>
          <AdminManualPayroll month={month} onSaved={()=>computeMonthlyPayroll(month).then(setRows)} />
        </div>
      )}
      {rows.map((r: any) => {
        const { salaryDate, bonusDate } = getPayoutDates(month)
        return (
          <div key={r.technician.id} className="rounded-xl border bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.technician.name} <span className="text-xs text-gray-500">{(r.technician as any).code || ''}</span></div>
                <div className="text-xs text-gray-500">方案：{r.scheme}｜當月服務金額（個人）：{r.perTechTotal}</div>
              </div>
              <div className="text-right text-sm text-gray-700">
                <div>底薪：{r.baseSalary}</div>
                <div>獎金：{r.bonus}</div>
                <div className="font-semibold">合計：{r.total}</div>
                <div className="text-xs text-gray-500">薪資發放：{salaryDate}；獎金發放：{bonusDate}</div>
              </div>
            </div>
          </div>
        )
      })}
      {rows.length === 0 && <div className="text-gray-500">尚無資料</div>}
    </div>
  )
}

function AdminManualPayroll({ month, onSaved }: { month: string; onSaved: ()=>void }){
  const [email, setEmail] = useState('')
  const [base, setBase] = useState<number>(0)
  const [bonus, setBonus] = useState<number>(0)
  return (
    <div className="flex flex-wrap items-end gap-2 text-sm">
      <input className="w-48 rounded border px-2 py-1" placeholder="技師 Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="number" className="w-28 rounded border px-2 py-1" placeholder="底薪" value={base} onChange={e=>setBase(Number(e.target.value))} />
      <input type="number" className="w-28 rounded border px-2 py-1" placeholder="獎金" value={bonus} onChange={e=>setBonus(Number(e.target.value))} />
      <button onClick={async()=>{ if(!email) return; const { payrollRepo } = await import('../../adapters/local/payroll'); await payrollRepo.upsert({ userEmail: email, month, baseSalary: base, bonus, total: base+bonus }); onSaved() }} className="rounded bg-gray-900 px-3 py-1 text-white">儲存</button>
    </div>
  )
}


