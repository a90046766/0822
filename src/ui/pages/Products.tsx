import { useEffect, useState } from 'react'
import { loadAdapters } from '../../adapters'
import { authRepo } from '../../adapters/local/auth'
import { Navigate } from 'react-router-dom'

export default function ProductsPage() {
  const u = authRepo.getCurrentUser()
  if (u && u.role==='technician') return <Navigate to="/dispatch" replace />
  const [rows, setRows] = useState<any[]>([])
  const [repos, setRepos] = useState<any>(null)
  const [edit, setEdit] = useState<any | null>(null)
  const [img, setImg] = useState<string | null>(null)
  const load = async () => { if(!repos) return; setRows(await repos.productRepo.list()) }
  useEffect(() => { (async()=>{ const a = await loadAdapters(); setRepos(a) })() }, [])
  useEffect(() => { if(repos) load() }, [repos])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">產品管理</div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setEdit({ id:'', name:'', unitPrice:0, groupPrice:undefined, groupMinQty:0, description:'', imageUrls:[], safeStock:0 })} className="rounded-lg bg-brand-500 px-3 py-1 text-white">新增</button>
          {rows.length===0 && (
            <button onClick={async()=>{
              if(!repos) return
              try {
                await repos.productRepo.upsert({ id:'', name:'分離式冷氣清洗', unitPrice:1800, groupPrice:1600, groupMinQty:2, description:'室內外機標準清洗，包含濾網、蒸發器、冷凝器清潔', imageUrls:[], safeStock:20 })
                await repos.productRepo.upsert({ id:'', name:'洗衣機清洗（滾筒）', unitPrice:1999, groupPrice:1799, groupMinQty:2, description:'滾筒式洗衣機拆洗保養，包含內筒、外筒、管路清潔', imageUrls:[], safeStock:20 })
                await repos.productRepo.upsert({ id:'', name:'倒T型抽油煙機清洗', unitPrice:2200, groupPrice:2000, groupMinQty:2, description:'不鏽鋼倒T型抽油煙機，包含內部機械清洗', imageUrls:[], safeStock:20 })
                await repos.productRepo.upsert({ id:'', name:'傳統雙渦輪抽油煙機清洗', unitPrice:1800, groupPrice:1600, groupMinQty:2, description:'傳統型雙渦輪抽油煙機清洗保養', imageUrls:[], safeStock:20 })
                await load()
                alert('預設產品已建立')
              } catch(e:any){ alert(e?.message||'建立失敗') }
            }} className="rounded-lg bg-gray-900 px-3 py-1 text-white">建立預設產品</button>
          )}
        </div>
      </div>
      {rows.map(p => (
        <div key={p.id} className={`rounded-xl border p-4 shadow-card ${p.safeStock && p.safeStock>0 && (p.quantity||0) < p.safeStock ? 'border-amber-400' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-gray-500">單價 {p.unitPrice}｜團購 {p.groupPrice||'-'}（{p.groupMinQty} 件）</div>
              {p.safeStock ? <div className="text-xs text-amber-600">安全庫存 {p.safeStock}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setEdit(p)} className="rounded-lg bg-gray-900 px-3 py-1 text-white">編輯</button>
              <button onClick={async()=>{
                const { confirmTwice } = await import('../kit')
                const ok = await confirmTwice('確認刪除該產品？','刪除後無法復原，仍要刪除？')
                if(!ok) return
                try { if(!repos) return; await repos.productRepo.remove(p.id); load() } catch {}
              }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">刪除</button>
            </div>
          </div>
        </div>
      ))}
      {rows.length===0 && <div className="text-gray-500">尚無產品</div>}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">編輯產品</div>
            <div className="space-y-2 text-sm">
              <div>名稱：<input className="w-full rounded border px-2 py-1" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} /></div>
              <div>單價：<input type="number" className="w-full rounded border px-2 py-1" value={edit.unitPrice} onChange={e=>setEdit({...edit,unitPrice:Number(e.target.value)})} /></div>
              <div>安全庫存：<input type="number" className="w-full rounded border px-2 py-1" value={edit.safeStock||0} onChange={e=>setEdit({...edit,safeStock:Number(e.target.value)})} /></div>
              <div className="text-xs text-gray-500">保存後可於訂單項目引用此產品（帶入單價）。</div>
              <div>
                <label className="mb-1 block">圖片（自動壓縮 ≤200KB）</label>
                <input type="file" accept="image/*" onChange={async (e)=>{
                  const f = e.target.files?.[0]; if(!f) return
                  const { compressImageToDataUrl } = await import('../../utils/image')
                  const dataUrl = await compressImageToDataUrl(f, 200)
                  setImg(dataUrl)
                }} />
                {img && <img src={img} className="mt-2 h-24 w-24 rounded object-cover" />}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setEdit(null)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              {edit.id && (
              <button onClick={async()=>{
                if(!repos) return
                const { confirmTwice } = await import('../kit')
                if (!(await confirmTwice('建立對應庫存？','將建立數量為 0、並綁定此產品。是否繼續？'))) return
                await repos.inventoryRepo.upsert({ id: '', name: edit.name, productId: edit.id, quantity: 0, imageUrls: [], safeStock: edit.safeStock||0 })
                alert('已建立對應庫存並綁定')
              }} className="rounded-lg bg-gray-200 px-3 py-1 text-sm">建立對應庫存</button>
              )}
              <button onClick={async()=>{ if(!repos) return; const payload = { ...edit, imageUrls: img? [img] : (edit.imageUrls||[]) }; await repos.productRepo.upsert(payload); setEdit(null); setImg(null); load() }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


