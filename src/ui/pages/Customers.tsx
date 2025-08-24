import { useEffect, useState } from 'react'
import { loadAdapters } from '../../adapters'

export default function CustomersPage() {
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any | null>(null)
  const [repos, setRepos] = useState<any>(null)
  useEffect(() => { (async()=>{ const a = await loadAdapters(); setRepos(a); setRows(await (a as any).customerRepo.list()) })() }, [])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">客戶管理</div>
        <button onClick={()=>setEdit({ name:'', phone:'', email:'', addresses:[], blacklisted:false })} className="rounded-lg bg-brand-500 px-3 py-1 text-white">新增</button>
      </div>
      {rows.map(c => (
        <div key={c.id} className="rounded-xl border bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-semibold ${c.blacklisted? 'text-rose-600' : ''}`}>{c.name}{c.blacklisted && <span className="ml-2 rounded bg-rose-100 px-1.5 text-xs text-rose-700">黑名單</span>}</div>
              <div className="text-sm text-gray-600">{c.phone} · {c.email}</div>
              {c.addresses?.length > 0 && <div className="text-xs text-gray-500">{c.addresses.map((a:any) => a.address).join(' / ')}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setEdit(c)} className="rounded-lg bg-gray-900 px-3 py-1 text-white">編輯</button>
              <button onClick={()=>{ const last6 = String(c.phone||'').replace(/\D/g,'').slice(-6); alert(`已重設為手機後六碼：${last6||'（無手機）'}（示意）`) }} className="rounded-lg bg-gray-100 px-3 py-1 text-sm">重設密碼</button>
              <button onClick={async()=>{ const { confirmTwice } = await import('../kit'); if(await confirmTwice('確認刪除該客戶？','刪除後無法復原，仍要刪除？')){ await (repos as any).customerRepo.remove(c.id); setRows(await (repos as any).customerRepo.list()) } }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">刪除</button>
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="text-gray-500">尚無客戶資料</div>}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">{edit.id?'編輯':'新增'}客戶</div>
            <div className="space-y-2 text-sm">
              <input className="w-full rounded border px-2 py-1" placeholder="姓名" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} />
              <input className="w-full rounded border px-2 py-1" placeholder="手機" value={edit.phone||''} onChange={e=>setEdit({...edit,phone:e.target.value})} />
              <input className="w-full rounded border px-2 py-1" placeholder="Email" value={edit.email||''} onChange={e=>setEdit({...edit,email:e.target.value})} />
              <div className="flex items-center gap-2"><input type="checkbox" checked={!!edit.blacklisted} onChange={e=>setEdit({...edit,blacklisted:e.target.checked})} /><span>黑名單</span></div>
              <div>
                <div className="mb-1 font-semibold">地址</div>
                {(edit.addresses||[]).map((a:any, idx:number)=>(
                  <div key={idx} className="mb-1 flex gap-2">
                    <input className="flex-1 rounded border px-2 py-1" value={a.address} onChange={e=>{ const arr=[...edit.addresses]; arr[idx]={...arr[idx],address:e.target.value}; setEdit({...edit,addresses:arr}) }} />
                    <button onClick={()=>{ const arr=[...edit.addresses]; arr.splice(idx,1); setEdit({...edit,addresses:arr}) }} className="rounded bg-gray-100 px-2">刪</button>
                  </div>
                ))}
                <button onClick={()=>setEdit({...edit,addresses:[...(edit.addresses||[]),{ id:`ADDR-${Math.random().toString(36).slice(2,8)}`, address:'' }]})} className="rounded bg-gray-100 px-2 py-1 text-xs">新增地址</button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setEdit(null)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              <button onClick={async()=>{ await (repos as any).customerRepo.upsert(edit); setEdit(null); setRows(await (repos as any).customerRepo.list()) }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


