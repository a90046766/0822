import { useEffect, useMemo, useState } from 'react'
import { loadAdapters } from '../../adapters'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authRepo } from '../../adapters/local/auth'
import Calendar from '../components/Calendar'
import { overlaps } from '../../utils/time'

export default function TechnicianSchedulePage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [techs, setTechs] = useState<any[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [works, setWorks] = useState<any[]>([])
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)
  const start = searchParams.get('start') || '09:00'
  const end = searchParams.get('end') || '12:00'
  const user = authRepo.getCurrentUser()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportDate, setSupportDate] = useState(date)
  const [supportSlot, setSupportSlot] = useState<'am' | 'pm' | 'full'>('am')
  const [supportType, setSupportType] = useState<'排休' | '特休' | '事假' | '婚假' | '病假' | '喪假'>('排休')
  const [supportShifts, setSupportShifts] = useState<any[]>([])
  const [workMarkers, setWorkMarkers] = useState<Record<string, number>>({})
  const [emphasisMarkers, setEmphasisMarkers] = useState<Record<string, 'warn' | 'danger'>>({})
  const [dayTooltips, setDayTooltips] = useState<Record<string, string>>({})
  const [skillFilter, setSkillFilter] = useState<Record<string, boolean>>({})
  const [skillMode, setSkillMode] = useState<'all'|'any'>('all')
  const SKILLS: Array<[string,string]> = [
    ['acStandard','分離式冷氣'],
    ['washerStandard','直立洗衣機'],
    ['acSpecial','特殊分離式'],
    ['hoodStandard','一般抽油煙機'],
    ['hoodHidden','隱藏抽油煙機'],
    ['stainlessTank','不鏽鋼水塔'],
    ['concreteTank','水泥水塔'],
    ['concealedAC','吊隱式冷氣'],
    ['concealedACSpecial','吊隱特殊'],
    ['pipe','管路施工'],
    ['washerDrum','滾筒洗衣機'],
  ]
  const [techLeaveOpen, setTechLeaveOpen] = useState(false)
  const [techLeaveDate, setTechLeaveDate] = useState(date)
  const [techLeaveSlot, setTechLeaveSlot] = useState<'am' | 'pm' | 'full'>('am')
  const [techLeaveType, setTechLeaveType] = useState<'排休' | '特休' | '事假' | '婚假' | '病假' | '喪假'>('排休')
  const [techLeaveEmail, setTechLeaveEmail] = useState('')

  const navigate = useNavigate()
  const [hoverDate, setHoverDate] = useState<string>('')
  const [hoverOrders, setHoverOrders] = useState<Record<string, any>>({})

  const [repos, setRepos] = useState<any>(null)
  useEffect(()=>{ (async()=>{ const a = await loadAdapters(); setRepos(a) })() },[])
  useEffect(() => {
    if(!repos) return
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 30)
    const s = start.toISOString().slice(0, 10)
    const e = end.toISOString().slice(0, 10)
    repos.scheduleRepo.listTechnicianLeaves({ start: s, end: e }).then((rows:any[])=>{
      if (user?.role==='technician') {
        const emailLc = (user.email||'').toLowerCase(); setLeaves(rows.filter((r:any) => (r.technicianEmail||'').toLowerCase()===emailLc))
      } else {
        setLeaves(rows)
      }
    })
    repos.technicianRepo.list().then((rows:any[])=>{
      if (user?.role==='technician') setTechs(rows.filter((t:any) => (t.email||'').toLowerCase()===(user.email||'').toLowerCase()))
      else setTechs(rows)
    })
  }, [repos])

  // 依月份載入工單占用，並建立月曆徽章
  useEffect(() => {
    const yymm = date.slice(0, 7)
    const startMonth = `${yymm}-01`
    const endMonth = `${yymm}-31`
    if(!repos) return
    Promise.all([
      repos.scheduleRepo.listWork({ start: startMonth, end: endMonth }),
      repos.scheduleRepo.listTechnicianLeaves({ start: startMonth, end: endMonth })
    ]).then(([ws, ls]: any[]) => {
      setWorks(ws)
      const map: Record<string, number> = {}
      const overlapCount: Record<string, number> = {}
      const leaveCount: Record<string, number> = {}
      for (const w of ws) {
        map[w.date] = (map[w.date] || 0) + 1
        if (overlaps(w.startTime, w.endTime, start, end)) overlapCount[w.date] = (overlapCount[w.date] || 0) + 1
      }
      for (const l of ls) leaveCount[l.date] = (leaveCount[l.date] || 0) + 1
      const emph: Record<string, 'warn' | 'danger'> = {}
      Object.keys(overlapCount).forEach(d => { const c = overlapCount[d]; emph[d] = c >= 5 ? 'danger' : 'warn' })
      const tips: Record<string, string> = {}
      const days = new Set([...Object.keys(map), ...Object.keys(leaveCount)])
      days.forEach(d => { const w = map[d] || 0; const l = leaveCount[d] || 0; tips[d] = `工單 ${w}、請假 ${l}` })
      setWorkMarkers(map)
      setEmphasisMarkers(emph)
      setDayTooltips(tips)
    })
  }, [date, start, end, repos])

  // 當 hoverDate 變更時，補取當日工單細節（數量用）
  useEffect(() => {
    (async () => {
      if (!repos || !hoverDate) return
      const ids = Array.from(new Set(works.filter(w=>w.date===hoverDate).map(w=>w.orderId))).filter(Boolean)
      const miss = ids.filter(id => !hoverOrders[id])
      if (miss.length === 0) return
      const pairs = await Promise.all(miss.map(async (id) => { try { const o = await repos.orderRepo.get(id); return [id, o] as const } catch { return [id, null] as const } }))
      const next = { ...hoverOrders }
      for (const [id, o] of pairs) if (o) next[id] = o
      setHoverOrders(next)
    })()
  }, [hoverDate, works, repos])

  useEffect(() => {
    // Admin 檢視全部；其他僅看自己
    if (!user) return
    if(!repos) return
    repos.scheduleRepo.listSupport().then((rows:any[]) => {
      if (user.role === 'admin') setSupportShifts(rows)
      else {
        const mine = rows.filter((r:any) => r.supportEmail && r.supportEmail.toLowerCase() === user.email.toLowerCase())
        setSupportShifts(mine)
      }
    })
  }, [user, supportDate])

  const assignable = useMemo(() => {
    // 可用性：無請假且無工單重疊
    const selectedKeys = Object.keys(skillFilter).filter(k => skillFilter[k])
    return techs.filter(t => {
      const emailLc = (t.email || '').toLowerCase()
      const hasLeave = leaves.some(l => (l.technicianEmail || '').toLowerCase() === emailLc && l.date === date)
      if (hasLeave) return false
      const hasOverlap = works.some(w => ((w.technicianEmail || '').toLowerCase() === emailLc) && w.date === date && overlaps(w.startTime, w.endTime, start, end))
      if (hasOverlap) return false
      if (selectedKeys.length > 0) {
        const skills = t.skills || {}
        if (skillMode === 'all') {
          for (const key of selectedKeys) if (!skills[key]) return false
        } else {
          let ok = false
          for (const key of selectedKeys) if (skills[key]) { ok = true; break }
          if (!ok) return false
        }
      }
      return true
    })
  }, [techs, leaves, works, date, start, end, skillFilter, skillMode])

  const unavailable = useMemo(() => {
    return techs
      .map(t => {
        const emailLc = (t.email || '').toLowerCase()
        const leave = leaves.find(l => (l.technicianEmail || '').toLowerCase() === emailLc && l.date === date)
        if (leave) return { t, reason: '請假' }
        const conflicts = works.filter(w => ((w.technicianEmail || '').toLowerCase() === emailLc) && w.date === date && overlaps(w.startTime, w.endTime, start, end))
        if (conflicts.length > 0) {
          const first = conflicts[0]
          return { t, reason: `重疊 ${first.startTime}~${first.endTime}` }
        }
        return { t, reason: '' }
      })
      .filter(x => x.reason && !assignable.find(a => a.id === x.t.id))
  }, [techs, leaves, works, date, start, end, assignable])

  const toggleSelect = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }))
  const emailToTech = useMemo(()=>{
    const map: Record<string, any> = {}
    for (const t of techs) map[(t.email||'').toLowerCase()] = t
    return map
  }, [techs])

  const confirmAssign = async () => {
    if (!orderId) return
    const chosen = assignable.filter(t => selected[t.id])
    const names = chosen.map(t => t.name)
    if(!repos) return
    await repos.orderRepo.update(orderId, { assignedTechnicians: names, preferredDate: date, preferredTimeStart: start, preferredTimeEnd: end })
    alert('已指派，返回訂單選擇簽名技師')
    navigate(`/orders/${orderId}`)
  }

  return (
    <div className="space-y-6">
      {user?.role!=='technician' && (<div className="text-lg font-semibold">指派技師</div>)}
      {user?.role!=='technician' && (<div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setView('month')} className={`rounded-lg px-2 py-1 text-sm ${view==='month'?'bg-brand-500 text-white':'bg-gray-100 text-gray-700'}`}>月</button>
          <button onClick={() => setView('week')} className={`rounded-lg px-2 py-1 text-sm ${view==='week'?'bg-brand-500 text-white':'bg-gray-100 text-gray-700'}`}>週</button>
        </div>
        <div className="text-sm text-gray-500">{date} {start}~{end}</div>
      </div>)}
      {user?.role!=='technician' && (view==='month' ? (
        <Calendar
          value={date}
          onChange={async (d) => { try { if (orderId && repos) { await repos.orderRepo.update(orderId, { preferredDate: d }); navigate(`/orders/${orderId}`) } else { navigate(`/schedule?date=${d}&start=${start}&end=${end}`, { replace: true }) } } catch {} }}
          markers={workMarkers}
          emphasis={emphasisMarkers}
          tooltips={dayTooltips}
          onMonthChange={async (y, m) => {
            const mm = String(m + 1).padStart(2, '0')
            const startMonth = `${y}-${mm}-01`
            const endMonth = `${y}-${mm}-31`
            if(!repos) return
            const [ws, ls] = await Promise.all([
              repos.scheduleRepo.listWork({ start: startMonth, end: endMonth }),
              repos.scheduleRepo.listTechnicianLeaves({ start: startMonth, end: endMonth })
            ])
            setWorks(ws)
            const map: Record<string, number> = {}
            const overlapCount: Record<string, number> = {}
            const leaveCount: Record<string, number> = {}
            for (const w of ws) { map[w.date] = (map[w.date] || 0) + 1; if (overlaps(w.startTime, w.endTime, start, end)) overlapCount[w.date] = (overlapCount[w.date] || 0) + 1 }
            for (const l of ls) leaveCount[l.date] = (leaveCount[l.date] || 0) + 1
            const emph: Record<string, 'warn' | 'danger'> = {}
            Object.keys(overlapCount).forEach(d => { const c = overlapCount[d]; emph[d] = c >= 5 ? 'danger' : 'warn' })
            const tips: Record<string, string> = {}
            const days = new Set([...Object.keys(map), ...Object.keys(leaveCount)])
            days.forEach(d => { const w = map[d] || 0; const l = leaveCount[d] || 0; tips[d] = `工單 ${w}、請假 ${l}` })
            setWorkMarkers(map); setEmphasisMarkers(emph); setDayTooltips(tips)
          }}
          onDayHover={(ds) => setHoverDate(ds)}
          onDayLeave={() => setHoverDate('')}
        />
      ) : (
        <div className="rounded-2xl bg-white p-3 shadow-card">
          <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-700">
            {(() => {
              const base = new Date(date)
              const day = base.getUTCDay() || 7
              const monday = new Date(base)
              monday.setUTCDate(base.getUTCDate() - day + 1)
              const days = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(monday)
                d.setUTCDate(monday.getUTCDate() + i)
                return d
              })
              return days.map((d, i) => {
                const ds = d.toISOString().slice(0,10)
                const isSel = ds === date
                return (
                  <button key={i} onClick={async () => { try { if (orderId && repos) { await repos.orderRepo.update(orderId, { preferredDate: ds }); navigate(`/orders/${orderId}`) } else { navigate(`/schedule?date=${ds}&start=${start}&end=${end}`, { replace: true }) } } catch {} }} className={`h-8 rounded-md ${isSel? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{String(d.getUTCDate())}</button>
                )
              })
            })()}
          </div>
        </div>
      ))}

      {hoverDate && (
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="text-sm font-semibold">當日概覽 {hoverDate}</div>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-gray-500">已排班</div>
              <div className="space-y-1 text-xs">
                {works.filter(w=>w.date===hoverDate).map((w,i)=>{
                  const t = emailToTech[(w.technicianEmail||'').toLowerCase()]
                  const oi = hoverOrders[w.orderId]
                  const qty = oi? (oi.serviceItems||[]).reduce((s:any,it:any)=>s+(it.quantity||0),0) : '-'
                  return (
                    <div key={i} className="flex items-center justify-between rounded border px-2 py-1">
                      <div className="truncate">#{w.orderId} · {w.startTime}~{w.endTime}</div>
                      <div className="text-gray-500">{t? (t.region==='all'?'全區':t.region):''} · 數量 {qty}</div>
                    </div>
                  )
                })}
                {works.filter(w=>w.date===hoverDate).length===0 && <div className="text-gray-500">無</div>}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-500">可排單技師（點擊勾選，稍後按確認指派）</div>
              <div className="space-y-1 text-xs">
                {techs.filter(t=>{
                  const emailLc = (t.email||'').toLowerCase()
                  const hasLeave = leaves.some(l => (l.technicianEmail || '').toLowerCase() === emailLc && l.date === hoverDate)
                  const hasOverlap = works.some(w => ((w.technicianEmail || '').toLowerCase() === emailLc) && w.date === hoverDate && overlaps(w.startTime, w.endTime, start, end))
                  return !hasLeave && !hasOverlap
                }).map(t => (
                  <label key={t.id} className={`flex items-center justify-between rounded border px-2 py-1 ${selected[t.id]?'border-brand-400':''}`}>
                    <span className="truncate">{t.shortName||t.name}（{t.code}） · {t.region==='all'?'全區':t.region}</span>
                    <input type="checkbox" checked={!!selected[t.id]} onChange={()=>toggleSelect(t.id)} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 當日工作清單（可點擊跳轉訂單） */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="text-sm font-semibold">當日工作清單</div>
        <div className="mt-2 space-y-1 text-xs">
          {works.filter(w=>w.date===date).map((w,i)=>{
            const t = emailToTech[(w.technicianEmail||'').toLowerCase()]
            return (
              <div key={i} className="flex items-center justify-between border-b py-1">
                <div className="min-w-0 truncate">
                  {t ? `${t.shortName||t.name}（${t.code}｜${t.region==='all'?'全區':t.region}）` : w.technicianEmail}
                </div>
                <div className="flex items-center gap-2">
                  <span>{w.startTime}~{w.endTime}</span>
                  <Link to={`/orders/${w.orderId}`} className="rounded bg-gray-100 px-2 py-0.5">訂單 {w.orderId}</Link>
                </div>
              </div>
            )
          })}
          {works.filter(w=>w.date===date).length===0 && <div className="text-gray-500">無</div>}
        </div>
      </div>
      {user?.role!=='technician' && (
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="text-sm text-gray-500">以下為未在該時段請假的可用技師。可依技能篩選；選擇多人後，回訂單頁指定簽名技師。</div>
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs">
          <div className="mb-2 font-semibold">技能篩選</div>
          <div className="mb-2 flex items-center gap-3">
            <label className="flex items-center gap-1"><input type="radio" name="mode" checked={skillMode==='all'} onChange={()=>setSkillMode('all')} />全部符合</label>
            <label className="flex items-center gap-1"><input type="radio" name="mode" checked={skillMode==='any'} onChange={()=>setSkillMode('any')} />至少一項</label>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {SKILLS.map(([key,label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={!!skillFilter[key]} onChange={e=>setSkillFilter(s=>({ ...s, [key]: e.target.checked }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-2">
            <button onClick={()=>setSkillFilter({})} className="rounded bg-gray-200 px-2 py-1">清除</button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {assignable.map(t => {
            const selectedKeys = Object.keys(skillFilter).filter(k => skillFilter[k])
            return (
              <label key={t.id} className={`flex flex-col gap-1 rounded-xl border p-3 ${selected[t.id] ? 'border-brand-400' : ''}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!selected[t.id]} onChange={() => toggleSelect(t.id)} />
                  <div>
                    <div className="font-semibold">{t.shortName || t.name}</div>
                    <div className="text-xs text-gray-400">{t.code}</div>
                    <div className="text-xs text-gray-500">{t.region === 'all' ? '全區' : `${t.region}區`} · {t.email}</div>
                  </div>
                </div>
                {selectedKeys.length>0 && (
                  <div className="ml-7 flex flex-wrap gap-1">
                    {selectedKeys.map(key=>{
                      const has = (t.skills||{})[key]
                      const label = (SKILLS.find(s=>s[0]===key)?.[1]) || key
                      return <span key={key} className={`rounded-full px-2 py-0.5 text-[10px] ${has? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{label}{has?'✓':'×'}</span>
                    })}
                  </div>
                )}
              </label>
            )
          })}
        </div>
        {unavailable.length>0 && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            <div className="mb-1 font-semibold">不可指派（重疊/請假）</div>
            <div className="space-y-1">
              {unavailable.map(({t, reason}) => (
                <div key={t.id} className="flex items-center justify-between border-b border-amber-100 pb-1">
                  <div className="truncate">{t.name} <span className="text-gray-400">{t.code}</span></div>
                  <div>{reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <div className="mb-1 font-semibold">當日占用</div>
          {works.filter(w=>w.date===date).map((w,i)=>{
            const conflict = overlaps(w.startTime, w.endTime, start, end)
            const t = emailToTech[(w.technicianEmail||'').toLowerCase()]
            return (
              <div key={i} className={`flex items-center justify-between border-b py-1 ${conflict? 'text-rose-600' : ''}`} title={conflict? '與選定時段重疊' : ''}>
                <div className="truncate">{t ? `${t.shortName||t.name} (${t.code})` : w.technicianEmail} <span className="text-gray-400">#{w.orderId}</span></div>
                <div>{w.startTime}~{w.endTime}</div>
              </div>
            )
          })}
          {works.filter(w=>w.date===date).length===0 && <div>無</div>}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={confirmAssign} className="rounded-xl bg-brand-500 px-4 py-2 text-white">確認指派</button>
          <Link to={`/orders/${orderId || 'O01958'}`} className="rounded-xl bg-gray-900 px-4 py-2 text-white">返回訂單</Link>
        </div>
      </div>
      )}

      {user?.role!=='technician' && (
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">客服排班</div>
          <button onClick={() => setSupportOpen(o => !o)} className="rounded-lg bg-gray-100 px-3 py-1 text-sm">{supportOpen ? '收起' : '展開'}</button>
        </div>
        {supportOpen && (
          <div className="mt-3 space-y-3">
            <Calendar value={supportDate} onChange={setSupportDate} header="選擇日期" />
            <div className="flex items-center gap-3 text-sm">
              <div>
                <label className="mr-2 text-gray-600">時段</label>
                <select className="rounded-lg border px-2 py-1" value={supportSlot} onChange={(e) => setSupportSlot(e.target.value as any)}>
                  <option value="am">上午</option>
                  <option value="pm">下午</option>
                  <option value="full">全天</option>
                </select>
              </div>
              <div>
                <label className="mr-2 text-gray-600">假別</label>
                <select className="rounded-lg border px-2 py-1" value={supportType} onChange={(e) => setSupportType(e.target.value as any)}>
                  <option value="排休">排休</option>
                  <option value="特休">特休</option>
                  <option value="事假">事假</option>
                  <option value="婚假">婚假</option>
                  <option value="病假">病假</option>
                  <option value="喪假">喪假</option>
                </select>
              </div>
              <button onClick={async () => {
                if (!user) return
                const color = (type: string) => type==='排休'||type==='特休'? '#FEF3C7' : type==='事假'? '#DBEAFE' : type==='婚假'? '#FCE7F3' : type==='病假'? '#E5E7EB' : '#9CA3AF'
                if(!repos) return
                await repos.scheduleRepo.saveSupportShift({ supportEmail: user.email, date: supportDate, slot: supportSlot, reason: supportType, color: color(supportType) })
                const rows = await repos.scheduleRepo.listSupport()
                setSupportShifts(rows.filter((r:any) => r.supportEmail && r.supportEmail.toLowerCase() === user.email.toLowerCase()))
              }} className="rounded-xl bg-brand-500 px-4 py-2 text-white">新增</button>
            </div>
            <div className="space-y-2">
              {supportShifts.filter(s => (s.date || '').startsWith(supportDate.slice(0,7))).map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.color || '#E5E7EB' }} />
                    <div>{s.date} · {s.slot === 'full' ? '全天' : (s.slot === 'am' ? '上午' : '下午')} · {s.reason}</div>
                  </div>
                </div>
              ))}
              {supportShifts.length === 0 && <div className="text-gray-500">目前無排班資料</div>}
            </div>
          </div>
        )}
      </div>
      )}

      <div className="text-lg font-semibold">技師排班（休假）</div>
      <div className="rounded-2xl bg-white p-3 text-xs text-gray-600 shadow-card">
        <div className="mb-2 font-semibold">圖例</div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded" style={{background:'#FEF3C7'}}/>排休/特休</span>
          <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded" style={{background:'#DBEAFE'}}/>事假</span>
          <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded" style={{background:'#FCE7F3'}}/>婚假</span>
          <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded" style={{background:'#E5E7EB'}}/>病假</span>
          <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded" style={{background:'#9CA3AF'}}/>喪假</span>
        </div>
      </div>
      {leaves.map((l) => (
        <div key={l.id} className="rounded-xl border bg-white p-4 shadow-card">
          <div className="text-sm text-gray-600">{l.date} {l.fullDay ? '全天' : `${l.startTime || ''} ~ ${l.endTime || ''}`}</div>
          <div className="mt-1 text-base">{emailToTech[(l.technicianEmail||'').toLowerCase()]?.name || l.technicianEmail}</div>
          {l.reason && <div className="text-sm text-gray-500">{l.reason}</div>}
        </div>
      ))}
      {leaves.length === 0 && <div className="text-gray-500">近期無資料</div>}

      <div className="pt-2">
        <Link to={`/orders/${orderId || 'O01958'}`} className="inline-block rounded-xl bg-gray-900 px-4 py-2 text-white">返回訂單</Link>
      </div>
    </div>
  )
}


