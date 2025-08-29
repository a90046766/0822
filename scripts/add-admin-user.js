import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dekopbnpsvqlztabblxg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla29wYm5wc3ZxbHp0YWJibHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzkxMDgsImV4cCI6MjA3MTQ1NTEwOH0.vGeRNxRag5H4UmfuEVcju9Pt5p-i36hwfnOZaCd0x8Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addAdminUser() {
  console.log('🔧 新增管理員帳號到 Supabase...')
  
  const adminData = {
    email: 'a90046766@gmail.com',
    password: 'a123123',
    name: '洗濯',
    role: 'admin',
    phone: '0906190101'
  }
  
  try {
    // 1. 在 Supabase Auth 中建立用戶
    console.log('1. 建立 Auth 用戶...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminData.email,
      password: adminData.password
    })

    if (authError) {
      console.error('❌ Auth 建立失敗:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ 無法建立 Auth 用戶')
      return
    }

    console.log('✅ Auth 用戶建立成功:', authData.user.id)

    // 2. 在 staff 表中新增管理員資料
    console.log('2. 新增 staff 資料...')
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .insert({
        id: authData.user.id,
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        role: adminData.role,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (staffError) {
      console.error('❌ Staff 資料新增失敗:', staffError.message)
      return
    }

    console.log('✅ Staff 資料新增成功')
    console.log('📋 管理員資料:')
    console.log(`   - Email: ${adminData.email}`)
    console.log(`   - 密碼: ${adminData.password}`)
    console.log(`   - 姓名: ${adminData.name}`)
    console.log(`   - 角色: ${adminData.role}`)
    console.log(`   - 電話: ${adminData.phone}`)
    
    console.log('\n🎉 管理員帳號建立完成！')
    console.log('請使用上述帳號密碼登入系統。')
    
  } catch (error) {
    console.error('❌ 建立管理員帳號失敗:', error.message)
  }
}

addAdminUser().catch(console.error)
