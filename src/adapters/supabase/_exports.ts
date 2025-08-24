  // 臨時：orders 先用本機，避免部署卡住
  export { orderRepo } from '../local/orders'
  // export { orderRepo } from './orders' // 先註解
export { authRepo } from '../local/auth'
// 產品改用雲端，提供購物車商品與安全庫存提醒
export { productRepo } from './products'
export { inventoryRepo } from './inventory'
export { memberRepo } from './members'
export { technicianRepo, technicianApplicationRepo } from './technicians'
export { scheduleRepo } from './schedule'
export { staffRepo, staffApplicationRepo } from './staff'
export { memberApplicationRepo } from './members'
// 後續逐步補上：technicians, staff, members, schedule, ...
// 臨時：settings 以本機實作提供（雲端模式亦可用）
export { settingsRepo } from './settings'
// 回報中心、薪資、預約先沿用本機，等雲端接完再切
export { reportsRepo } from './reports'
export { payrollRepo } from './payroll'
export { reservationsRepo } from './reservations'
export { usedItemsRepo } from './used_items'
export { customerRepo } from './customers'
export { documentsRepo } from './documents'
export { modelsRepo } from './models'
export { promotionsRepo } from './promotions'
export { notificationRepo } from './notifications'


