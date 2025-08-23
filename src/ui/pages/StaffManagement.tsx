import { useEffect, useState } from 'react'
import { staffRepo } from '../../adapters/local/staff'
import { authRepo } from '../../adapters/local/auth'
import { Navigate } from 'react-router-dom'
import { getPermissionOverride, setPermissionOverride, type Permission } from '../../utils/permissions'

export default function StaffManagementPage() {
  const u = authRepo.getCurrentUser()
  if (u && u.role!=='admin') return <Navigate to="/dispatch" replace />
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any | null>(null)
  const load = async () => setRows(await staffRepo.list())
  useEffect(() => { load() }, [])
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">員工管理</div>
        <button onClick={()=>setEdit({ name:'', email:'', role:'support', status:'active' })} className="rounded-lg bg-brand-500 px-3 py-1 text-white">新增</button>
      </div>
      <AdminSettingsPanel />
      {rows.map(s => (
        <div key={s.id} className="rounded-xl border p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{s.name} <span className="text-xs text-gray-500">{s.refCode || ''}</span></div>
              <div className="text-xs text-gray-500">信箱 {s.email}｜手機 {s.phone||'-'}｜聯絡人手機 {s.contactPhone||'-'}｜員工編號 {s.refCode||'-'}｜{s.role==='support'?'客服':'業務'}｜{s.status==='active'?'啟用':'停用'}｜積分 {s.points||0}</div>
            </div>
            <div className="flex items-center gap-2">
              {s.refCode && <button onClick={()=>navigator.clipboard.writeText(s.refCode)} className="rounded-lg bg-gray-100 px-3 py-1 text-sm">複製編號</button>}
              <button onClick={()=>setEdit(s)} className="rounded-lg bg-gray-900 px-3 py-1 text-white">編輯</button>
              <button onClick={async()=>{ const { confirmTwice } = await import('../kit'); if (await confirmTwice('確認刪除該員工？','刪除後無法復原，仍要刪除？')) { await staffRepo.remove(s.id); load() } }} className="rounded-lg bg-rose-500 px-3 py-1 text-white">刪除</button>
              <button onClick={async()=>{ await staffRepo.resetPassword(s.id); alert('已觸發重設密碼（示意）') }} className="rounded-lg bg-gray-100 px-3 py-1 text-sm">重設密碼</button>
            </div>
          </div>
          <PermissionOverrideEditor email={s.email} />
        </div>
      ))}
      {rows.length===0 && <div className="text-gray-500">尚無員工</div>}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 text-lg font-semibold">{edit.id?'編輯':'新增'}員工</div>
            <div className="space-y-2 text-sm">
              <div>姓名：<input className="w-full rounded border px-2 py-1" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} /></div>
              <div>Email：<input className="w-full rounded border px-2 py-1" value={edit.email} onChange={e=>setEdit({...edit,email:e.target.value})} /></div>
              <div>角色：
                <select className="w-full rounded border px-2 py-1" value={edit.role} onChange={e=>setEdit({...edit,role:e.target.value})}>
                  <option value="support">客服</option>
                  <option value="sales">業務</option>
                </select>
              </div>
              <div>狀態：
                <select className="w-full rounded border px-2 py-1" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
                  <option value="active">啟用</option>
                  <option value="suspended">停用</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>setEdit(null)} className="rounded-lg bg-gray-100 px-3 py-1">取消</button>
              <button onClick={async()=>{ await staffRepo.upsert(edit); setEdit(null); load() }} className="rounded-lg bg-brand-500 px-3 py-1 text-white">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminSettingsPanel(){
  const u = authRepo.getCurrentUser()
  const [enabled, setEnabled] = useState(true)
  const [mins, setMins] = useState(20)
  useEffect(()=>{ (async()=>{ try { const { settingsRepo } = await import('../../adapters/local/settings'); const s = await settingsRepo.get(); setEnabled(!!s.countdownEnabled); setMins(s.countdownMinutes||20) } catch {} })() },[])
  if (!u || u.role!=='admin') return null
  return (
    <div className="rounded-xl border bg-white p-3 text-sm shadow-card">
      <div className="mb-2 font-semibold">系統設定</div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />啟用服務完成冷卻倒數</label>
        <div>分鐘：<input type="number" className="w-20 rounded border px-2 py-1" value={mins} onChange={e=>setMins(Number(e.target.value))} /></div>
        <button onClick={async()=>{ const { settingsRepo } = await import('../../adapters/local/settings'); await settingsRepo.update({ countdownEnabled: enabled, countdownMinutes: Math.max(1, mins|0) }); alert('已儲存設定') }} className="rounded bg-gray-900 px-3 py-1 text-white">儲存</button>
      </div>
    </div>
  )
}


function PermissionOverrideEditor({ email }: { email: string }){
  const [open, setOpen] = useState(false)
  const [allow, setAllow] = useState<string[]>([])
  const [deny, setDeny] = useState<string[]>([])
  useEffect(()=>{
    const ov = getPermissionOverride(email || '')
    setAllow(ov?.allow || []); setDeny(ov?.deny || [])
  }, [email])
  const toggle = (list: string[], val: string) => list.includes(val) ? list.filter(v=>v!==val) : [...list, val]
  const ALL: Permission[] = ['orders.list','orders.create','orders.update','orders.delete','orders.cancel','reservations.manage','customers.manage','technicians.manage','technicians.schedule.view','technicians.schedule.edit','support.schedule.view','support.schedule.edit','staff.manage','products.manage','inventory.manage','promotions.manage','documents.manage','models.manage','notifications.send','approvals.manage','payroll.view','payroll.edit','reports.view','reports.manage']
  const labelMap: Record<string, string> = {
    'orders.list':'訂單-檢視', 'orders.read':'訂單-讀取', 'orders.create':'訂單-新增', 'orders.update':'訂單-編輯', 'orders.delete':'訂單-刪除', 'orders.cancel':'訂單-取消',
    'reservations.manage':'預約-管理', 'customers.manage':'客戶-管理', 'technicians.manage':'技師-管理', 'technicians.schedule.view':'技師排班-檢視', 'technicians.schedule.edit':'技師排班-編輯', 'support.schedule.view':'客服排班-檢視', 'support.schedule.edit':'客服排班-編輯', 'staff.manage':'員工-管理', 'products.manage':'產品-管理', 'inventory.manage':'庫存-管理', 'promotions.manage':'活動-管理', 'documents.manage':'文件-管理', 'models.manage':'機型-管理', 'notifications.send':'通知-發送', 'approvals.manage':'審核-管理', 'payroll.view':'薪資-檢視', 'payroll.edit':'薪資-編輯', 'reports.view':'報表-檢視', 'reports.manage':'報表-管理'
  }
  const label = (p: string) => labelMap[p] || p
  const applyPreset = async (preset: 'support'|'sales'|'technician') => {
    // 預設：依角色常用權限
    const presets: Record<string, string[]> = {
      support: ['orders.list','orders.read','orders.create','orders.update','orders.cancel','reservations.manage','customers.manage','technicians.schedule.view','support.schedule.view','support.schedule.edit','notifications.send','approvals.manage','reports.view','payroll.view'],
      sales: ['customers.manage','promotions.manage','documents.manage','models.manage','notifications.send','reports.view'],
      technician: ['orders.list','orders.read','orders.update','technicians.schedule.view','notifications.read' as any]
    }
    setAllow(presets[preset] as any); setDeny([])
  }
  return (
    <div className="mt-2">
      <button onClick={()=>setOpen(o=>!o)} className="rounded bg-gray-100 px-2 py-1 text-xs">{open?'收起權限覆蓋':'編輯權限覆蓋'}</button>
      {open && (
        <div className="mt-2 rounded border p-2">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="text-gray-600">快速套用：</span>
            <button onClick={()=>applyPreset('support')} className="rounded bg-gray-100 px-2 py-1">客服預設</button>
            <button onClick={()=>applyPreset('sales')} className="rounded bg-gray-100 px-2 py-1">業務預設</button>
            <button onClick={()=>applyPreset('technician')} className="rounded bg-gray-100 px-2 py-1">技師預設</button>
          </div>
          <div className="text-xs text-gray-600">允許</div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {ALL.map(p => (
              <label key={`a-${p}`} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={allow.includes(p)} onChange={e=>setAllow(toggle(allow, p))} />{label(p)}</label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-600">拒絕</div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {ALL.map(p => (
              <label key={`d-${p}`} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={deny.includes(p)} onChange={e=>setDeny(toggle(deny, p))} />{label(p)}</label>
            ))}
          </div>
          <div className="mt-2 text-right"><button onClick={()=>{ setPermissionOverride(email, { allow: allow as any, deny: deny as any }); alert('已儲存覆蓋') }} className="rounded bg-brand-500 px-3 py-1 text-xs text-white">儲存覆蓋</button></div>
        </div>
      )}
    </div>
  )
}

