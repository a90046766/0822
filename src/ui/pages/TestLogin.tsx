import { useState } from 'react'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')

  const testLogin = () => {
    // 直接測試本地登入邏輯
    const SEED_USERS = [
      { email: 'a90046766@gmail.com', password: 'a123123', name: '洗濯', role: 'admin', phone: '0906190101' }
    ]
    
    const user = SEED_USERS.find(u => u.email === email && u.password === password)
    
    if (user) {
      const userData = {
        id: `USER-${user.role.toUpperCase()}-${Date.now()}`,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        passwordSet: true
      }
      
      localStorage.setItem('local-auth-user', JSON.stringify(userData))
      setResult(`✅ 登入成功！用戶：${user.name} (${user.role})`)
    } else {
      setResult('❌ 帳號或密碼錯誤')
    }
  }

  const checkCurrentUser = () => {
    const saved = localStorage.getItem('local-auth-user')
    if (saved) {
      const user = JSON.parse(saved)
      setResult(`✅ 當前用戶：${user.name} (${user.role})`)
    } else {
      setResult('❌ 沒有登入用戶')
    }
  }

  const clearUser = () => {
    localStorage.removeItem('local-auth-user')
    setResult('✅ 已清除登入狀態')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold text-center mb-6">測試登入</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="a90046766@gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="a123123"
            />
          </div>
          
          <button
            onClick={testLogin}
            className="w-full rounded-xl bg-blue-500 py-3 text-white font-medium"
          >
            測試登入
          </button>
          
          <button
            onClick={checkCurrentUser}
            className="w-full rounded-xl bg-green-500 py-3 text-white font-medium"
          >
            檢查當前用戶
          </button>
          
          <button
            onClick={clearUser}
            className="w-full rounded-xl bg-red-500 py-3 text-white font-medium"
          >
            清除登入狀態
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-3 rounded-lg bg-gray-100">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          測試帳號：a90046766@gmail.com<br/>
          密碼：a123123
        </div>
      </div>
    </div>
  )
}
