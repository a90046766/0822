import { useEffect, useState } from 'react'
import { loadAdapters } from '../../adapters'
import { authRepo } from '../../adapters/local/auth'
import { Navigate } from 'react-router-dom'

export default function InventoryPage() {
  const u = authRepo.getCurrentUser()
  if (u && u.role==='technician') return <Navigate to="/dispatch" replace />
  const [rows, setRows] = useState<any[]>([])
  const [repos, setRepos] = useState<any>(null)
  const [edit, setEdit] = useState<any | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const load = async () => { if(!repos) return; setRows(await repos.inventoryRepo.list()) }
  useEffect(() => { (async()=>{ const a = await loadAdapters(); setRepos(a) })() }, [])
  useEffect(() => { if(repos) load() }, [repos])
  useEffect(()=>{ (async()=>{ if(!repos) return; setProducts(await repos.productRepo.list()) })() },[repos])
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">庫存管理（內部用）</div>
      {rows.map(p => (
        <div key={p.id} className={`rounded-xl border p-4 shadow-card ${p.safeStock && p.safeStock>0 && (p.quantity||0) < p.safeStock ? 'border-rose-400' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-gray-500">數量 {p.quantity} {p.productId && (<span className="ml-2 text-gray-400">已綁定產品</span>)}</div>
              {p.safeStock ? <div className="text-xs text-rose-600">安全庫存 {p.safeStock}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setEdit(p)} className="rounded-lg bg-gray-900 px-3 py-1 text-white">編輯</button>
              <button onClick={async()=>{ const { confirmTwice } = await import('../kit'); if(await confirmTwice('確認刪除該庫存品項？','刪除後無法復原，仍要刪除？')){ if(!repos) return; await repos.inventoryRepo.remove(p.id); load() } }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">刪除</button>
            </div>
          </div>
        </div>
      ))}
      {rows.length===0 && <div className="text-gray-500">尚無庫存</div>}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">編輯庫存</div>
            <div className="space-y-2 text-sm">
              <div>名稱：<input className="w-full rounded border px-2 py-1" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} /></div>
              <div>數量：<input type="number" className="w-full rounded border px-2 py-1" value={edit.quantity||0} onChange={e=>setEdit({...edit,quantity:Number(e.target.value)})} /></div>
              <div>安全庫存：<input type="number" className="w-full rounded border px-2 py-1" value={edit.safeStock||0} onChange={e=>setEdit({...edit,safeStock:Number(e.target.value)})} /></div>
              <div>
                <label className="mr-2 text-gray-600">綁定產品</label>
                <select className="w-full rounded border px-2 py-1" value={edit.productId||''} onChange={e=>setEdit({...edit, productId: e.target.value || undefined})}>
                  <option value="">不綁定</option>
                  {products.map((pp:any)=>(<option key={pp.id} value={pp.id}>{pp.name}（{pp.unitPrice}）</option>))}
                </select>
                <div className="mt-1 text-xs text-gray-500">綁定後，完工扣庫會優先依 productId 對應。</div>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setEdit(null)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              <button onClick={async()=>{ if(!repos) return; await repos.inventoryRepo.upsert(edit); setEdit(null); load() }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


