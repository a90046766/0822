export { orderRepo } from './orders'
// 暫以 local auth 供路由保護使用；等 Supabase Auth 接上後再切換
export { authRepo } from '../local/auth'
// 產品改用雲端，提供購物車商品與安全庫存提醒
export { productRepo } from './products'
export { inventoryRepo } from './inventory'
export { memberRepo } from './members'
// 後續逐步補上：technicians, staff, members, schedule, ...
// 臨時：settings 以本機實作提供（雲端模式亦可用）
export { settingsRepo } from '../local/settings'


