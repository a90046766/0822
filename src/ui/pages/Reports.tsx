import { useEffect, useState } from 'react'
import { reportsRepo } from '../../adapters/local/reports'
import { computeMonthlyPayroll } from '../../services/payroll'

export default function ReportsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7))
  const [payroll, setPayroll] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [scheme, setScheme] = useState<string>('')
  const [region, setRegion] = useState<string>('')
  const [platform, setPlatform] = useState<string>('')
  const [summary, setSummary] = useState<{ revenue: number; orders: number }>({ revenue: 0, orders: 0 })
  const load = async () => setRows(await reportsRepo.list())
  useEffect(() => { load() }, [])
  useEffect(() => { computeMonthlyPayroll(month).then(setPayroll) }, [month])
  useEffect(() => {
    (async()=>{
      const { orderRepo } = await import('../../adapters/local/orders')
      const list = await orderRepo.list()
      const done = list.filter((o:any)=>o.status==='completed' && (o.workCompletedAt||o.createdAt||'').slice(0,7)===month)
      const revenue = done.reduce((s:number,o:any)=> s + (o.serviceItems||[]).reduce((ss:number,it:any)=>ss+it.unitPrice*it.quantity,0), 0)
      setSummary({ revenue, orders: done.length })
    })()
  }, [month])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-semibold">報表 / 回報管理</div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="rounded border px-2 py-1 text-sm" />
          <input placeholder="搜尋姓名/編碼" value={q} onChange={e=>setQ(e.target.value)} className="rounded border px-2 py-1 text-sm" />
          <select className="rounded border px-2 py-1 text-sm" value={scheme} onChange={e=>setScheme(e.target.value)}>
            <option value="">全部方案</option>
            <option value="pure70">純70</option>
            <option value="pure72">純72</option>
            <option value="pure73">純73</option>
            <option value="pure75">純75</option>
            <option value="pure80">純80</option>
            <option value="base1">保1</option>
            <option value="base2">保2</option>
            <option value="base3">保3</option>
          </select>
          <select className="rounded border px-2 py-1 text-sm" value={region} onChange={e=>setRegion(e.target.value)}>
            <option value="">全部區域</option>
            <option value="north">北</option>
            <option value="central">中</option>
            <option value="south">南</option>
            <option value="all">全區</option>
          </select>
          <select className="rounded border px-2 py-1 text-sm" value={platform} onChange={e=>setPlatform(e.target.value)}>
            <option value="">全部平台</option>
            <option value="日">日</option>
            <option value="同">同</option>
            <option value="黃">黃</option>
            <option value="今">今</option>
          </select>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="mb-2 grid grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="rounded-lg bg-gray-50 p-2">本月完成訂單：<span className="font-semibold">{summary.orders}</span></div>
          <div className="rounded-lg bg-gray-50 p-2">本月營收：<span className="font-semibold">{summary.revenue}</span></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">當月分潤概覽</div>
          <div className="text-xs text-gray-500">可臨時調整方案後重算</div>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {payroll.filter((p:any)=>{
            const code = (p.technician as any).code || ''
            const hit = !q || p.technician.name.includes(q) || code.includes(q)
            const byScheme = !scheme || p.scheme===scheme
            const byRegion = !region || (p.technician.region===region)
            const byPlatform = !platform || ((p.orders||[]).some((o:any)=>o.platform===platform))
            return hit && byScheme && byRegion && byPlatform
          }).map((p:any, idx:number) => (
            <div key={p.technician.id} className="flex items-center justify-between gap-3 border-b pb-2">
              <div className="min-w-0 flex-1 truncate">{p.technician.name} <span className="text-xs text-gray-500">{(p.technician as any).code || ''}</span> {(p.technician as any).code && <button onClick={()=>navigator.clipboard.writeText((p.technician as any).code)} className="ml-1 rounded bg-gray-100 px-2 py-0.5 text-[10px]">複製</button>}</div>
              <select className="rounded border px-2 py-1 text-xs" value={p.scheme} onChange={e=>{
                const next = [...payroll]; next[idx] = { ...p, scheme: e.target.value } as any; setPayroll(next as any)
              }}>
                <option value="pure70">純70</option>
                <option value="pure72">純72</option>
                <option value="pure73">純73</option>
                <option value="pure75">純75</option>
                <option value="pure80">純80</option>
                <option value="base1">保1</option>
                <option value="base2">保2</option>
                <option value="base3">保3</option>
              </select>
              <div className="text-gray-700">合計 {p.total}（底薪 {p.baseSalary}＋獎金 {p.bonus}）</div>
            </div>
          ))}
          {payroll.length===0 && <div className="text-gray-500">尚無資料</div>}
        </div>
        {payroll.length>0 && (
          <div className="mt-3 text-right">
            <button onClick={()=>{
              const header = ['名稱','編碼','區域','方案','個人額','底薪','獎金','合計']
              const lines = payroll.map((p:any)=>[
                p.technician.name,(p.technician as any).code||'',p.technician.region||'',p.scheme,p.perTechTotal,p.baseSalary,p.bonus,p.total
              ].join(','))
              const csv = [header.join(','),...lines].join('\n')
              const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `payroll-${month}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }} className="rounded-lg bg-gray-900 px-3 py-1 text-sm text-white">匯出分潤 CSV</button>
            <button onClick={()=>{
              // 簡易 xlsx：用 HTML table 下載 xls for Excel 開啟
              const header = ['名稱','編碼','區域','方案','個人額','底薪','獎金','合計']
              const rowsHtml = payroll.map((p:any)=>`<tr><td>${p.technician.name}</td><td>${(p.technician as any).code||''}</td><td>${p.technician.region||''}</td><td>${p.scheme}</td><td>${p.perTechTotal}</td><td>${p.baseSalary}</td><td>${p.bonus}</td><td>${p.total}</td></tr>`).join('')
              const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr>${header.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`
              const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `payroll-${month}.xls`
              a.click(); URL.revokeObjectURL(url)
            }} className="ml-2 rounded-lg bg-brand-600 px-3 py-1 text-sm text-white">匯出 Excel</button>
            <button onClick={async()=>{
              const { orderRepo } = await import('../../adapters/local/orders')
              const orders = (await orderRepo.list()).filter((o:any)=>o.status==='completed' && (o.workCompletedAt||o.createdAt||'').slice(0,7)===month)
              const header = ['ID','平台','客戶','時間','金額','推薦碼']
              const lines = orders.map((o:any)=>{
                const amt = (o.serviceItems||[]).reduce((s:number,it:any)=>s+it.unitPrice*it.quantity,0)
                return [o.id,o.platform||'',o.customerName,`${(o.preferredDate||'')} ${o.preferredTimeStart}~${o.preferredTimeEnd}`,amt,o.referrerCode||''].join(',')
              })
              const csv = [header.join(','),...lines].join('\n')
              const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `orders-${month}.csv`
              a.click(); URL.revokeObjectURL(url)
            }} className="ml-2 rounded-lg bg-gray-700 px-3 py-1 text-sm text-white">匯出完成訂單</button>
            <button onClick={async()=>{
              const { orderRepo } = await import('../../adapters/local/orders')
              const orders = (await orderRepo.list()).filter((o:any)=>o.status==='completed' && (o.workCompletedAt||o.createdAt||'').slice(0,7)===month)
              const header = ['ID','平台','客戶','時間','金額','推薦碼']
              const rowsHtml = orders.map((o:any)=>{
                const amt = (o.serviceItems||[]).reduce((s:number,it:any)=>s+it.unitPrice*it.quantity,0)
                return `<tr><td>${o.id}</td><td>${o.platform||''}</td><td>${o.customerName}</td><td>${(o.preferredDate||'')} ${o.preferredTimeStart}~${o.preferredTimeEnd}</td><td>${amt}</td><td>${o.referrerCode||''}</td></tr>`
              }).join('')
              const html = `<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body><table><thead><tr>${header.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`
              const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `orders-${month}.xls`
              a.click(); URL.revokeObjectURL(url)
            }} className="ml-2 rounded-lg bg-brand-600 px-3 py-1 text-sm text-white">完成訂單 Excel</button>
            <button onClick={async()=>{
              const { memberRepo } = await import('../../adapters/local/members')
              const { staffRepo } = await import('../../adapters/local/staff')
              const { technicianRepo } = await import('../../adapters/local/technicians')
              const members = await memberRepo.list(); const staffs = await staffRepo.list(); const techs = await technicianRepo.list()
              const header = ['類型','名稱','編碼/Email','積分']
              const lines:string[] = []
              lines.push(...members.map((m:any)=>['member',m.name,m.code,m.points||0].join(',')))
              lines.push(...staffs.map((s:any)=>['staff',s.name,s.refCode||s.email,s.points||0].join(',')))
              lines.push(...techs.map((t:any)=>['technician',t.name,t.code||t.email,t.points||0].join(',')))
              const csv = [header.join(','),...lines].join('\n')
              const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `points.csv`
              a.click(); URL.revokeObjectURL(url)
            }} className="ml-2 rounded-lg bg-gray-700 px-3 py-1 text-sm text-white">匯出積分</button>
            <button onClick={async()=>{
              const { memberRepo } = await import('../../adapters/local/members')
              const { staffRepo } = await import('../../adapters/local/staff')
              const { technicianRepo } = await import('../../adapters/local/technicians')
              const members = await memberRepo.list(); const staffs = await staffRepo.list(); const techs = await technicianRepo.list()
              const header = ['類型','名稱','編碼/Email','積分']
              const rowsHtml = [
                ...members.map((m:any)=>`<tr><td>member</td><td>${m.name}</td><td>${m.code}</td><td>${m.points||0}</td></tr>`),
                ...staffs.map((s:any)=>`<tr><td>staff</td><td>${s.name}</td><td>${s.refCode||s.email}</td><td>${s.points||0}</td></tr>`),
                ...techs.map((t:any)=>`<tr><td>technician</td><td>${t.name}</td><td>${t.code||t.email}</td><td>${t.points||0}</td></tr>`)
              ].join('')
              const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr>${header.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`
              const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `points.xls`
              a.click(); URL.revokeObjectURL(url)
            }} className="ml-2 rounded-lg bg-brand-600 px-3 py-1 text-sm text-white">積分 Excel</button>
          </div>
        )}
      </div>
      <ReportThreads />
    </div>
  )
}


function ReportThreads(){
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({ subject:'', category:'other', level:'normal', target:'all' })
  const [active, setActive] = useState<any|null>(null)
  const [msg, setMsg] = useState('')
  const load = async()=> setRows(await reportsRepo.list())
  useEffect(()=>{ load() },[])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">回報管理</div>
        <button onClick={()=>setOpen(true)} className="rounded-lg bg-brand-500 px-3 py-1 text-white">新增回報</button>
      </div>
      {rows.map(t=> (
        <div key={t.id} className="rounded-xl border bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.subject}</div>
              <div className="text-xs text-gray-500">{t.category} · {t.level} · {t.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setActive(t)} className="rounded-lg bg-gray-900 px-3 py-1 text-white">查看</button>
              {t.status==='open' && <button onClick={async()=>{ await reportsRepo.close(t.id); load() }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">結案</button>}
              <button onClick={async()=>{ const { confirmTwice } = await import('../kit'); if(!(await confirmTwice('刪除此回報？','刪除後無法復原，仍要刪除？'))) return; await reportsRepo.removeThread(t.id); load() }} className="rounded-lg bg-gray-100 px-3 py-1 text-gray-700">刪除</button>
            </div>
          </div>
        </div>
      ))}
      {rows.length===0 && <div className="text-gray-500">目前沒有回報紀錄</div>}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">新增回報</div>
            <div className="space-y-2 text-sm">
              <input className="w-full rounded border px-2 py-1" placeholder="主旨" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
              <select className="w-full rounded border px-2 py-1" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="complaint">客訴</option>
                <option value="announce">布達</option>
                <option value="reminder">提醒</option>
                <option value="other">其他</option>
              </select>
              <select className="w-full rounded border px-2 py-1" value={form.level} onChange={e=>setForm({...form,level:e.target.value})}>
                <option value="normal">普通</option>
                <option value="urgent">急件</option>
                <option value="critical">緊急</option>
              </select>
              <select className="w-full rounded border px-2 py-1" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}>
                <option value="all">全員</option>
                <option value="tech">技師</option>
                <option value="support">客服</option>
                <option value="subset">部分名單（Email）</option>
              </select>
              {form.target==='subset' && (
                <textarea className="w-full rounded border px-2 py-1" placeholder="多位 Email，逗號或換行分隔" value={(form as any).emails||''} onChange={e=>setForm({...form, emails: e.target.value})} />
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setOpen(false)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              <button onClick={async()=>{ const payload:any={...form}; if(form.target==='subset'){ payload.target='subset'; payload.targetEmails=(form as any).emails?.split(/[,\n]/).map((s:string)=>s.trim()).filter(Boolean) } await reportsRepo.create(payload); setOpen(false); setForm({ subject:'', category:'other', level:'normal', target:'all' } as any); load() }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">建立</button>
            </div>
          </div>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">{active.subject}</div>
            <div className="max-h-72 space-y-2 overflow-auto rounded-lg bg-gray-50 p-2 text-sm">
              {(active.messages||[]).map((m:any)=>(
                <div key={m.id} className="flex items-start justify-between rounded bg-white p-2 shadow">
                  <div>
                    <div className="text-gray-700">{m.body}</div>
                    <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString('zh-TW')}</div>
                  </div>
                  <button onClick={async()=>{ const { confirmTwice } = await import('../kit'); if(!(await confirmTwice('刪除此訊息？','刪除後無法復原，仍要刪除？'))) return; await reportsRepo.removeMessage(active.id, m.id); const t=await reportsRepo.get(active.id); setActive(t) }} className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs">刪</button>
                </div>
              ))}
              {(active.status==='closed') && <div className="text-center text-xs text-gray-500">已結案</div>}
            </div>
            {active.status==='open' && (
              <div className="mt-2 flex gap-2">
                <input className="flex-1 rounded border px-2 py-1 text-sm" placeholder="輸入訊息" value={msg} onChange={e=>setMsg(e.target.value)} />
                <button onClick={async()=>{ if(!msg.trim()) return; await reportsRepo.appendMessage(active.id, { authorEmail:'system@local', body: msg }); setMsg(''); const t=await reportsRepo.get(active.id); setActive(t) }} className="rounded bg-gray-900 px-3 py-1 text-sm text-white">送出</button>
              </div>
            )}
            <div className="mt-3 text-right"><button onClick={()=>setActive(null)} className="rounded bg-gray-100 px-3 py-1">關閉</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

