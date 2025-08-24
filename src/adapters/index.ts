const RAW = String(import.meta.env.VITE_USE_SUPABASE || '').toLowerCase()
const WANT_SUPABASE = RAW === '1' || RAW === 'true'
const HAS_SUPABASE_KEYS = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
const USE_SUPABASE = WANT_SUPABASE && HAS_SUPABASE_KEYS
export async function loadAdapters() {
  if (USE_SUPABASE) {
    try {
      const a = await import('./supabase/_exports')
      // 連線探測 + 首次種子，失敗則自動回退至本地模式
      try {
        const list = await a.productRepo.list()
        if (!list || list.length === 0) {
          await a.productRepo.upsert({ id: '', name: '分離式冷氣清洗', unitPrice: 1800, groupPrice: 1600, groupMinQty: 2, description: '室內外機標準清洗，包含濾網、蒸發器、冷凝器清潔', imageUrls: [], safeStock: 20 } as any)
          await a.productRepo.upsert({ id: '', name: '洗衣機清洗（滾筒）', unitPrice: 1999, groupPrice: 1799, groupMinQty: 2, description: '滾筒式洗衣機拆洗保養，包含內筒、外筒、管路清潔', imageUrls: [], safeStock: 20 } as any)
          await a.productRepo.upsert({ id: '', name: '倒T型抽油煙機清洗', unitPrice: 2200, groupPrice: 2000, groupMinQty: 2, description: '不鏽鋼倒T型抽油煙機，包含內部機械清洗', imageUrls: [], safeStock: 20 } as any)
          await a.productRepo.upsert({ id: '', name: '傳統雙渦輪抽油煙機清洗', unitPrice: 1800, groupPrice: 1600, groupMinQty: 2, description: '傳統型雙渦輪抽油煙機清洗保養', imageUrls: [], safeStock: 20 } as any)
        }
        // 首次技師資料（空表時種子兩名預設技師）
        try {
          const techs = await (a as any).technicianRepo?.list?.()
          if (Array.isArray(techs) && techs.length === 0) {
            await (a as any).technicianRepo.upsert({ name: '楊小飛', shortName: '小飛', email: 'jason660628@yahoo.com.tw', phone: '0913788051', region: 'north', status: 'active' })
            await (a as any).technicianRepo.upsert({ name: '洗小濯', shortName: '小濯', email: 'xiaofu888@yahoo.com.tw', phone: '0986985725', region: 'north', status: 'active' })
          }
        } catch {}
      } catch {
        // 任一 API 失敗 → 回退本地
        return await import('./local/_exports')
      }
      return a
    } catch {
      // import 失敗 → 回退本地
      return await import('./local/_exports')
    }
  }
  // 預設本地模式
  return await import('./local/_exports')
}


