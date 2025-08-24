import { useEffect, useMemo, useState } from 'react'
import { authRepo } from '../../adapters/local/auth'
import { computeMonthlyPayroll, getPayoutDates } from '../../services/payroll'

export default function PayrollPage() {
  const [rows, setRows] = useState<any[]>([])
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7))
  const user = authRepo.getCurrentUser()
  useEffect(() => {
    computeMonthlyPayroll(month).then(rs => {
      if (user?.role === 'technician' || user?.role === 'support') {
        const email = (user.email||'').toLowerCase()
        setRows(rs.filter((r:any)=> ((r.technician?.email||'').toLowerCase() === email)))
      } else {
        setRows(rs)
      }
    })
  }, [month])

  const isSupport = user?.role === 'support'
  const myRecord = useMemo(()=> rows.find((r:any)=> (r.technician?.email||'').toLowerCase()===(user?.email||'').toLowerCase()), [rows])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">薪資管理</div>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </div>

      {/* 客服薪資表（僅客服本人與管理員可見） */}
      {(isSupport || user?.role==='admin') && (
        <SupportPayrollCard month={month} viewEmail={isSupport? user?.email||'': ''} />
      )}

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

function SupportPayrollCard({ month, viewEmail }: { month: string; viewEmail?: string }){
  const [form, setForm] = useState<any>({ baseSalary: 0, dutyAllowance: 0, overtimePay: 0, bonus: 0, otherPlus: 0, laborInsurance: 0, healthInsurance: 0, attendanceDeduct: 0, otherDeduct1: 0, otherDeduct2: 0, otherDeduct3: 0 })
  const [loaded, setLoaded] = useState(false)
  const [history, setHistory] = useState<Array<{ label: string; value: number }>>([])
  const user = authRepo.getCurrentUser()
  const email = (viewEmail && viewEmail.length>0) ? viewEmail : (user?.email||'')

  useEffect(()=>{ (async()=>{
    try{
      const { payrollRepo } = await import('../../adapters/local/payroll')
      const all = await payrollRepo.list(user!)
      const mine = all.filter(r=> r.userEmail?.toLowerCase() === email.toLowerCase() && r.month===month)
      const rec = mine[mine.length-1]
      if (rec?.breakdown) setForm({ ...form, ...rec.breakdown })
      setLoaded(true)
      // 最近六個月淨發（net）趨勢
      const months = Array.from({length:6}).map((_,i)=>{
        const d = new Date(month+'-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth()- (5-i)); return d.toISOString().slice(0,7)
      })
      const byMonth = months.map(m=>{
        const r = all.find(x=> x.userEmail?.toLowerCase()===email.toLowerCase() && x.month===m)
        const net = (r?.breakdown?.net)|| (r?.total)||0
        return { label: m, value: net }
      })
      setHistory(byMonth)
    }catch{}
  })() },[month, email])

  const gross = (form.baseSalary||0) + (form.dutyAllowance||0) + (form.overtimePay||0) + (form.bonus||0) + (form.otherPlus||0)
  const totalDeduct = (form.laborInsurance||0) + (form.healthInsurance||0) + (form.attendanceDeduct||0) + (form.otherDeduct1||0) + (form.otherDeduct2||0) + (form.otherDeduct3||0)
  const net = Math.max(0, gross - totalDeduct)

  const save = async()=>{
    const { payrollRepo } = await import('../../adapters/local/payroll')
    await payrollRepo.upsert({ userEmail: email, month, breakdown: { ...form, gross, net }, total: net })
    alert('已儲存客服薪資表')
  }

  const maxVal = Math.max(1, ...history.map(h=>h.value))

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-3 text-sm font-semibold">客服薪資表</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="mb-1 text-xs text-gray-500">底薪</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.baseSalary} onChange={e=>setForm({...form, baseSalary: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">值班津貼</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.dutyAllowance} onChange={e=>setForm({...form, dutyAllowance: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">加班費</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.overtimePay} onChange={e=>setForm({...form, overtimePay: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">獎金</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.bonus} onChange={e=>setForm({...form, bonus: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">其他加項</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.otherPlus} onChange={e=>setForm({...form, otherPlus: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">勞保扣款</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.laborInsurance} onChange={e=>setForm({...form, laborInsurance: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">健保扣款</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.healthInsurance} onChange={e=>setForm({...form, healthInsurance: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">考勤扣款</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.attendanceDeduct} onChange={e=>setForm({...form, attendanceDeduct: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">其他扣1</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.otherDeduct1} onChange={e=>setForm({...form, otherDeduct1: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">其他扣2</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.otherDeduct2} onChange={e=>setForm({...form, otherDeduct2: Number(e.target.value)||0})} />
        </div>
        <div>
          <div className="mb-1 text-xs text-gray-500">其他扣3</div>
          <input type="number" className="w-full rounded border px-2 py-1" value={form.otherDeduct3} onChange={e=>setForm({...form, otherDeduct3: Number(e.target.value)||0})} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-gray-50 p-2">應領（毛）：<span className="font-semibold">{gross}</span></div>
        <div className="rounded-lg bg-gray-50 p-2">扣款合計：<span className="font-semibold">{totalDeduct}</span></div>
        <div className="rounded-lg bg-gray-50 p-2">實發（淨）：<span className="font-semibold text-brand-600">{net}</span></div>
      </div>

      {/* 簡易折線圖（最近六個月實發） */}
      <div className="mt-3 rounded-lg border p-3">
        <div className="mb-1 text-xs text-gray-600">最近六個月實發趨勢</div>
        <svg viewBox="0 0 300 120" className="h-28 w-full">
          {/* 軸線 */}
          <line x1="10" y1="110" x2="290" y2="110" stroke="#e5e7eb" />
          <line x1="10" y1="10" x2="10" y2="110" stroke="#e5e7eb" />
          {/* 折線 */}
          {history.length>0 && (
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              points={history.map((h,i)=>{
                const x = 10 + (i*(280/Math.max(1,history.length-1)))
                const y = 110 - (h.value/maxVal)*90
                return `${x},${y}`
              }).join(' ')}
            />
          )}
          {/* 節點 */}
          {history.map((h,i)=>{
            const x = 10 + (i*(280/Math.max(1,history.length-1)))
            const y = 110 - (h.value/maxVal)*90
            return <circle key={i} cx={x} cy={y} r={3} fill="#2563eb" />
          })}
          {/* 標籤 */}
          {history.map((h,i)=>{
            const x = 10 + (i*(280/Math.max(1,history.length-1)))
            return <text key={i} x={x} y={118} fontSize="10" textAnchor="middle" fill="#6b7280">{h.label.slice(5)}</text>
          })}
        </svg>
      </div>

      <div className="mt-3 text-right">
        <button onClick={save} className="rounded bg-gray-900 px-3 py-1 text-white">儲存客服薪資</button>
      </div>
    </div>
  )
}


