import { useEffect, useState } from 'react'
import { loadAdapters } from '../../adapters'
import { getActivePercent } from '../../utils/promotions'

export default function ReservationsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [repos, setRepos] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<any>({ customerName:'', customerPhone:'', items:[{ productId:'', name:'服務', unitPrice:1000, quantity:1 }] })
  const [products, setProducts] = useState<any[]>([])
  useEffect(()=>{ (async()=>{ const a = await loadAdapters(); setRepos(a) })() },[])
  useEffect(()=>{ (async()=>{ if(!repos) return; setProducts(await repos.productRepo.list()) })() },[repos])
  const load = async () => { if(!repos) return; setRows(await repos.reservationsRepo.list()) }
  useEffect(()=>{ if(repos) load() },[repos])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">預約訂單</div>
        <button onClick={()=>setCreating(true)} className="rounded-lg bg-brand-500 px-3 py-1 text-white">新增預約</button>
      </div>
      <div className="rounded-2xl bg-white p-2 shadow-card">
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between border-b p-3 text-sm">
            <div>
              <div className="font-semibold">{r.customerName}</div>
              <div className="text-xs text-gray-500">{(r.items||[]).length} 項｜狀態 {r.status}</div>
              <ActivePromoHint />
            </div>
            <div className="flex gap-2">
              <button onClick={async()=>{
                const { confirmTwice } = await import('../kit')
                if(!(await confirmTwice('取消此預約？','取消後狀態將改為 canceled，仍要取消？'))) return
                if(!repos) return; await repos.reservationsRepo.update(r.id, { status: 'canceled' })
                load()
              }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">取消</button>
              <button onClick={async()=>{
                const { confirmTwice } = await import('../kit')
                if(!(await confirmTwice('轉為正式訂單？','轉單後請至訂單管理完成指派與確認，仍要轉單？'))) return
                const percent = await getActivePercent()
                if(!repos) return; await repos.orderRepo.create({
                  customerName: r.customerName,
                  customerPhone: r.customerPhone,
                  customerAddress: '—',
                  preferredDate: '', preferredTimeStart:'09:00', preferredTimeEnd:'12:00',
                  serviceItems: (r.items||[]).map((it:any)=>({
                    productId: it.productId||'',
                    name:it.name,
                    quantity:it.quantity,
                    unitPrice: percent>0 ? Math.round(it.unitPrice * (1 - percent/100)) : it.unitPrice
                  })),
                  assignedTechnicians: [], platform:'日', photos:[], signatures:{}, status:'draft'
                } as any)
                alert('已轉單，請至訂單管理查看')
              }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">轉單</button>
            </div>
          </div>
        ))}
        {rows.length===0 && <div className="p-4 text-center text-gray-500">沒有預約單</div>}
      </div>
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">新增預約</div>
            <div className="space-y-2 text-sm">
              <input className="w-full rounded border px-2 py-1" placeholder="姓名" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} />
              <input className="w-full rounded border px-2 py-1" placeholder="手機" value={form.customerPhone} onChange={e=>setForm({...form,customerPhone:e.target.value})} />
              <div className="grid grid-cols-3 gap-2">
                <select className="rounded border px-2 py-1" value={form.items[0].productId||''} onChange={e=>{
                  const val=e.target.value; const it=form.items[0]; if(!val){ setForm({...form,items:[{...it, productId:'', name: it.name}]}); return }
                  const p = products.find((x:any)=>x.id===val); setForm({...form,items:[{...it, productId: val, name: p?.name || it.name, unitPrice: p?.unitPrice || it.unitPrice}]})
                }}>
                  <option value="">自訂</option>
                  {products.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}（{p.unitPrice}）</option>))}
                </select>
                <input className="col-span-2 rounded border px-2 py-1" placeholder="項目" value={form.items[0].name} onChange={e=>setForm({...form,items:[{...form.items[0],name:e.target.value}]})} />
                <input type="number" className="w-24 rounded border px-2 py-1" placeholder="單價" value={form.items[0].unitPrice} onChange={e=>setForm({...form,items:[{...form.items[0],unitPrice:Number(e.target.value)}]})} />
                <input type="number" className="w-24 rounded border px-2 py-1" placeholder="數量" value={form.items[0].quantity} onChange={e=>setForm({...form,items:[{...form.items[0],quantity:Number(e.target.value)}]})} />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setCreating(false)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              <button onClick={async()=>{ if(!repos) return; await repos.reservationsRepo.create(form); setCreating(false); setForm({ customerName:'', customerPhone:'', items:[{ name:'服務', unitPrice:1000, quantity:1 }] }); load() }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActivePromoHint() {
  const [p, setP] = useState<number>(0)
  useEffect(()=>{ getActivePercent().then(setP) },[])
  if (p<=0) return null
  return <div className="text-[11px] text-amber-600">目前活動折扣 {p}%</div>
}


