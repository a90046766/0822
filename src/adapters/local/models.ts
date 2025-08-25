import type { ModelsRepo, ModelItem } from '../../core/repository'

class LocalModelsRepo implements ModelsRepo {
  private readonly key = 'local-models'
  
  private load(): ModelItem[] { 
    try { 
      const s = localStorage.getItem(this.key); 
      return s ? JSON.parse(s) : this.getInitialData() 
    } catch { 
      return this.getInitialData() 
    } 
  }
  
  private save(rows: ModelItem[]) { localStorage.setItem(this.key, JSON.stringify(rows)) }

  private getInitialData(): ModelItem[] {
    return [
      {
        id: 'MOD-001',
        category: 'aircon',
        brand: '大金',
        model: 'S22YT2',
        notes: '分離式冷氣，適用於小坪數房間',
        blacklist: false,
        attention: '安裝時需注意室外機位置，建議定期清洗濾網',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-002',
        category: 'aircon',
        brand: '日立',
        model: 'RAS-25NB',
        notes: '變頻分離式冷氣，節能環保',
        blacklist: false,
        attention: '使用R32冷媒，維修時需特別注意安全',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-003',
        category: 'washer',
        brand: '國際',
        model: 'NA-V130GB',
        notes: '滾筒式洗衣機，容量13公斤',
        blacklist: false,
        attention: '門鎖容易故障，維修時需檢查門鎖機構',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-004',
        category: 'hood',
        brand: '櫻花',
        model: 'R-7600',
        notes: '歐化抽油煙機，排風量強勁',
        blacklist: false,
        attention: '濾網需定期清洗，馬達保固期較短',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-005',
        category: 'tv',
        brand: '國際',
        model: 'TH-43GX750W',
        notes: '43吋4K電視，支援HDR',
        blacklist: false,
        attention: '面板故障率較高，維修成本昂貴',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-006',
        category: 'fridge',
        brand: '日立',
        model: 'R-SF47EMJ',
        notes: '雙門冰箱，容量470公升',
        blacklist: false,
        attention: '除霜系統容易故障，需定期檢查',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-007',
        category: 'aircon',
        brand: '格力',
        model: 'KFR-25GW',
        notes: '舊款定頻冷氣',
        blacklist: true,
        attention: '已停產，零件取得困難，建議不承接',
        updatedAt: new Date().toISOString()
      }
    ]
  }

  async list(): Promise<ModelItem[]> { return this.load() }
  
  async upsert(item: Omit<ModelItem, 'updatedAt'>): Promise<ModelItem> {
    const rows = this.load()
    const now = new Date().toISOString()
    const idx = rows.findIndex(r => r.id === item.id)
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...item, updatedAt: now }
      this.save(rows)
      return rows[idx]
    }
    const id = (item as any).id || `MOD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const obj: ModelItem = { 
      ...(item as any), 
      id, 
      category: item.category || 'aircon',
      blacklist: item.blacklist || false,
      updatedAt: now 
    }
    this.save([obj, ...rows])
    return obj
  }
  
  async remove(id: string): Promise<void> { this.save(this.load().filter(r => r.id !== id)) }
}

export const modelsRepo = new LocalModelsRepo()


