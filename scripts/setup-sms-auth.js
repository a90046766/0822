import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dekopbnpsvqlztabblxg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla29wYm5wc3ZxbHp0YWJibHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzkxMDgsImV4cCI6MjA3MTQ1NTEwOH0.vGeRNxRag5H4UmfuEVcju9Pt5p-i36hwfnOZaCd0x8Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupSMSAuth() {
  console.log('🔧 設定手機簡訊認證...')
  
  try {
    // 測試手機簡訊認證
    const phone = '+886906190101' // 您的電話號碼，加上台灣國碼
    
    console.log('1. 發送簡訊驗證碼...')
    const { data: smsData, error: smsError } = await supabase.auth.signInWithOtp({
      phone: phone
    })
    
    if (smsError) {
      console.error('❌ 簡訊發送失敗:', smsError.message)
      console.log('\n💡 解決方案:')
      console.log('1. 在 Supabase Dashboard 中啟用手機認證')
      console.log('2. 設定 Twilio 或其他簡訊服務')
      console.log('3. 或者暫時使用 Email 認證')
      return
    }
    
    console.log('✅ 簡訊發送成功！')
    console.log('請檢查您的手機簡訊')
    
  } catch (error) {
    console.error('❌ 設定失敗:', error.message)
  }
}

setupSMSAuth().catch(console.error)
