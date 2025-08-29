import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabase'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')

    try {
      // 直接使用 Supabase 登入
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (loginError) {
        throw new Error(loginError.message)
      }

      if (!data.user) {
        throw new Error('登入失敗')
      }

      // 取得用戶資料
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', email)
        .single()

      if (staffError || !staffData) {
        throw new Error('找不到用戶資料')
      }

      // 儲存用戶資料到 localStorage
      const user = {
        id: data.user.id,
        email: data.user.email!,
        name: staffData.name,
        role: staffData.role,
        phone: staffData.phone
      }
      localStorage.setItem('current-user', JSON.stringify(user))

      // 導航到主頁
      navigate('/dispatch')
      
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">洗濯派工系統</h1>
          <p className="mt-1 text-sm text-gray-500">簡化版登入</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="請輸入 Email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="請輸入密碼"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="mt-6 w-full rounded-xl bg-brand-500 py-3 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? '登入中...' : '登入'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          測試帳號：a90046766@gmail.com<br/>
          密碼：a123123
        </div>
      </form>
    </div>
  )
}
