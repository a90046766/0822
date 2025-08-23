import type { AuthRepo, User } from '../../core/repository'

// 本機種子帳號
const SEED_USERS: Array<{ email: string; password: string; name: string; role: User['role']; phone?: string }> = [
  { email: 'a90046766@gmail.com', password: 'a123123', name: '洗濯', role: 'admin', phone: '0906190101' },
  { email: 'xiaofu888@yahoo.com.tw', password: 'a123123', name: '洗小濯', role: 'support', phone: '0986985725' },
  { email: 'jason660628@yahoo.com.tw', password: 'a123123', name: '楊小飛', role: 'technician', phone: '0913788051' },
]

class LocalAuthRepo implements AuthRepo {
  private currentUser: User | null = null
  private readonly storageKey = 'local-auth-user'
  private readonly rememberKey = 'local-auth-remember'

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
    const normalizedEmail = email.trim().toLowerCase()
    const user = SEED_USERS.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password)
    
    if (!user) {
      throw new Error('帳號或密碼錯誤')
    }

    this.currentUser = {
      id: `USER-${user.role.toUpperCase()}-${Date.now()}`,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      passwordSet: user.role==='admin' // admin 預設已設；其他視為首次需變更
    }

    // 保存登入狀態
    localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser))
    
    return this.currentUser
  }

  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem(this.storageKey)
  }

  async resetPassword(newPassword: string): Promise<void> {
    if (!this.currentUser) throw new Error('未登入')
    
    // 本機模式：僅更新 passwordSet 狀態
    this.currentUser.passwordSet = true
    localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser))
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  // 記住帳號功能
  rememberEmail(email: string): void {
    localStorage.setItem(this.rememberKey, email)
  }

  getRememberedEmail(): string | null {
    return localStorage.getItem(this.rememberKey)
  }

  forgetEmail(): void {
    localStorage.removeItem(this.rememberKey)
  }
}

export const authRepo = new LocalAuthRepo()
