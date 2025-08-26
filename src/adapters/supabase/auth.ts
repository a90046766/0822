import { createClient } from '@supabase/supabase-js'
import type { AuthRepo, User } from '../../core/repository'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

class SupabaseAuthRepo implements AuthRepo {
  private currentUser: User | null = null
  private readonly storageKey = 'supabase-auth-user'

  constructor() {
    // 恢復登入狀態
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        this.currentUser = JSON.parse(saved)
      }
    } catch {}
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(error.message || '登入失敗')
    }

    if (!data.user) {
      throw new Error('登入失敗：無法取得使用者資料')
    }

    // 從 staff 表取得詳細資料
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .single()

    if (staffError || !staffData) {
      throw new Error('找不到對應的員工資料')
    }

    this.currentUser = {
      id: data.user.id,
      email: data.user.email!,
      name: staffData.name,
      role: staffData.role,
      phone: staffData.phone,
      passwordSet: true // Supabase 用戶已設定密碼
    }

    // 保存登入狀態
    localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser))
    
    return this.currentUser
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut()
    this.currentUser = null
    localStorage.removeItem(this.storageKey)
  }

  async resetPassword(newPassword: string): Promise<void> {
    if (!this.currentUser) throw new Error('未登入')
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message || '密碼更新失敗')
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  // 新增客服/業務帳號（支援預設密碼 a123123）
  async createStaffAccount(staffData: {
    name: string
    email: string
    phone: string
    role: 'support' | 'sales' // 只允許客服和業務
    password?: string // 設為可選，預設使用 a123123
  }): Promise<User> {
    const password = staffData.password || 'a123123' // 預設密碼
    
    // 1. 在 Supabase Auth 中建立用戶
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: staffData.email,
      password: password
    })

    if (authError) {
      throw new Error(authError.message || '建立用戶失敗')
    }

    if (!authData.user) {
      throw new Error('無法建立用戶')
    }

    // 2. 在 staff 表中新增員工資料
    const { data: staffInsertData, error: staffError } = await supabase
      .from('staff')
      .insert({
        id: authData.user.id,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone,
        role: staffData.role,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (staffError) {
      // 如果 staff 表插入失敗，刪除剛建立的 auth 用戶
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(staffError.message || '建立員工資料失敗')
    }

    return {
      id: authData.user.id,
      email: staffData.email,
      name: staffData.name,
      role: staffData.role,
      phone: staffData.phone,
      passwordSet: true
    }
  }

  // 取得所有員工列表
  async getStaffList(): Promise<User[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message || '取得員工列表失敗')
    }

    return data.map(staff => ({
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      passwordSet: true
    }))
  }

  // 更新員工資料
  async updateStaff(staffId: string, updates: Partial<{
    name: string
    phone: string
    role: 'support' | 'sales' // 只允許客服和業務
    status: 'active' | 'inactive'
  }>): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)

    if (error) {
      throw new Error(error.message || '更新員工資料失敗')
    }
  }

  // 刪除員工帳號
  async deleteStaff(staffId: string): Promise<void> {
    // 1. 從 staff 表刪除
    const { error: staffError } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId)

    if (staffError) {
      throw new Error(staffError.message || '刪除員工資料失敗')
    }

    // 2. 從 auth 刪除用戶（需要管理員權限）
    try {
      await supabase.auth.admin.deleteUser(staffId)
    } catch (error) {
      console.warn('無法刪除 auth 用戶，可能需要管理員權限')
    }
  }
}

export const authRepo = new SupabaseAuthRepo()
