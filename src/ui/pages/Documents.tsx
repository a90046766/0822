import { useEffect, useState } from 'react'
import { loadAdapters } from '../../adapters'
import { authRepo } from '../../adapters/local/auth'
import { Navigate } from 'react-router-dom'

export default function DocumentsPage() {
  const u = authRepo.getCurrentUser()
  if (u && u.role==='technician') return <Navigate to="/dispatch" replace />
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any | null>(null)
  const [repos, setRepos] = useState<any>(null)
  useEffect(() => { (async()=>{ const a = await loadAdapters(); setRepos(a); setRows(await (a as any).documentsRepo.list()) })() }, [])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">文件管理</div>
        <button onClick={()=>setEdit({ title:'', url:'', tags:[] })} className="rounded-lg bg-brand-500 px-3 py-1 text-white">新增</button>
      </div>
      {rows.map(d => (
        <div key={d.id} className="rounded-xl border p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{d.title}</div>
              <div className="text-xs text-gray-500">{d.url}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setEdit(d)} className="rounded-lg bg-gray-900 px-3 py-1 text-white">編輯</button>
              <button onClick={async()=>{ const { confirmTwice } = await import('../kit'); if(await confirmTwice('確認刪除？','刪除後無法復原，仍要刪除？')){ await (repos as any).documentsRepo.remove(d.id); setRows(await (repos as any).documentsRepo.list()) } }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">刪除</button>
            </div>
          </div>
        </div>
      ))}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">{edit.id?'編輯':'新增'}文件</div>
            <div className="space-y-2 text-sm">
              <input className="w-full rounded border px-2 py-1" placeholder="標題" value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})} />
              <input className="w-full rounded border px-2 py-1" placeholder="URL" value={edit.url} onChange={e=>setEdit({...edit,url:e.target.value})} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setEdit(null)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              <button onClick={async()=>{ await (repos as any).documentsRepo.upsert(edit); setEdit(null); setRows(await (repos as any).documentsRepo.list()) }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


