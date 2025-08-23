#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sophia AI 對話功能測試
測試自然語言理解和回應功能
"""

import sys
from sophia_ai_chat import SophiaAIChat

def test_ai_understanding():
    """測試AI理解能力"""
    print("🧠 測試 Sophia AI 理解能力")
    print("=" * 50)
    
    # 創建AI助手
    ai = SophiaAIChat()
    
    # 測試用例
    test_cases = [
        "你好",
        "幫我開啟Excel檔案",
        "分析這個薪資表的各部門平均薪資",
        "製作業績趨勢圖表",
        "清理重複資料並生成報表",
        "比較本月與上月的銷售數據",
        "我的檔案打不開怎麼辦",
        "如何製作圓餅圖",
        "預測未來三個月的銷售趨勢",
        "幫我處理這個複雜的數據分析工作"
    ]
    
    print("🗣️ 測試對話樣例：\n")
    
    for i, test_input in enumerate(test_cases, 1):
        print(f"【測試 {i}】")
        print(f"👤 用戶：{test_input}")
        
        # 理解用戶意圖
        understanding = ai.understand_intent(test_input)
        print(f"🧠 理解：意圖={understanding['intent']}, 信心度={understanding['confidence']:.2f}")
        
        if understanding['entities']:
            print(f"🔍 識別實體：{understanding['entities']}")
        
        # 生成回應
        response = ai.generate_response(test_input)
        print(f"🤖 Sophia：{response[:100]}...")
        
        print("-" * 60)
        print()
    
    print("✅ AI理解測試完成！")

def interactive_chat():
    """互動式聊天測試"""
    print("\n💬 Sophia AI 互動式聊天測試")
    print("=" * 50)
    print("輸入 'exit' 或 'quit' 結束對話\n")
    
    ai = SophiaAIChat()
    
    print("🤖 Sophia：您好！我是 Sophia，您的專業數據分析助手。")
    print("我可以理解自然語言並幫您處理複雜的工作需求。")
    print("請告訴我您需要什麼幫助？\n")
    
    conversation_count = 0
    
    while True:
        try:
            # 獲取用戶輸入
            user_input = input("👤 您：").strip()
            
            if user_input.lower() in ['exit', 'quit', '退出', '結束']:
                print("\n🤖 Sophia：感謝您的使用！再見！👋")
                break
            
            if not user_input:
                continue
            
            # 生成AI回應
            response = ai.generate_response(user_input)
            print(f"\n🤖 Sophia：\n{response}\n")
            
            conversation_count += 1
            
            # 每5次對話顯示一次統計
            if conversation_count % 5 == 0:
                print(f"📊 對話統計：已進行 {conversation_count} 次互動")
                print("💡 提示：您可以問更複雜的問題，例如：")
                print("  '分析薪資數據並找出異常值'")
                print("  '製作部門業績比較圖表'")
                print("  '預測下季度的銷售趨勢'\n")
        
        except KeyboardInterrupt:
            print("\n\n🤖 Sophia：對話被中斷。再見！")
            break
        except Exception as e:
            print(f"\n❌ 錯誤：{e}")
            print("請再試一次\n")

def main():
    """主程式"""
    print("🚀 Sophia AI 對話功能測試程式")
    print("=" * 60)
    
    try:
        while True:
            print("\n請選擇測試模式：")
            print("1. 🧠 理解能力測試")
            print("2. 💬 互動式聊天")
            print("3. 🚪 退出程式")
            
            choice = input("\n請輸入選項 (1-3)：").strip()
            
            if choice == '1':
                test_ai_understanding()
            elif choice == '2':
                interactive_chat()
            elif choice == '3':
                print("👋 感謝使用！")
                break
            else:
                print("❌ 無效選項，請重新選擇")
    
    except KeyboardInterrupt:
        print("\n\n👋 程式被中斷，再見！")
    except Exception as e:
        print(f"\n❌ 程式錯誤：{e}")

if __name__ == "__main__":
    main()
