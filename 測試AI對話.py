#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
測試 Sophia AI 對話功能
"""

import tkinter as tk
from tkinter import messagebox

def test_ai_chat():
    """測試 AI 對話功能"""
    print("🧪 開始測試 AI 對話功能...")
    
    # 測試 1: 檢查模組載入
    try:
        from sophia_ai_chat import create_ai_chat_window, SophiaAIChat
        print("✅ AI 對話模組載入成功")
    except Exception as e:
        print(f"❌ AI 對話模組載入失敗: {e}")
        return False
    
    # 測試 2: 檢查 SophiaAIChat 類別
    try:
        ai_chat = SophiaAIChat()
        print("✅ SophiaAIChat 實例化成功")
    except Exception as e:
        print(f"❌ SophiaAIChat 實例化失敗: {e}")
        return False
    
    # 測試 3: 測試意圖理解
    test_inputs = [
        "幫我打開七月薪資表",
        "分析這個數據",
        "製作圖表",
        "清理數據"
    ]
    
    for test_input in test_inputs:
        try:
            understanding = ai_chat.understand_intent(test_input)
            actions = ai_chat.plan_actions(test_input)
            print(f"✅ 測試輸入: '{test_input}'")
            print(f"   意圖: {understanding['intent']}")
            print(f"   動作: {len(actions)} 個")
        except Exception as e:
            print(f"❌ 測試輸入 '{test_input}' 失敗: {e}")
            return False
    
    # 測試 4: 測試回應生成
    try:
        response = ai_chat.generate_response("你好")
        print(f"✅ 回應生成測試: {response[:50]}...")
    except Exception as e:
        print(f"❌ 回應生成失敗: {e}")
        return False
    
    print("🎉 所有測試通過！AI 對話功能正常")
    return True

def test_desktop_integration():
    """測試桌面應用整合"""
    print("\n🧪 測試桌面應用整合...")
    
    try:
        from sophia_desktop import SophiaDesktop
        print("✅ SophiaDesktop 模組載入成功")
        
        # 創建一個簡單的測試實例
        root = tk.Tk()
        root.withdraw()  # 隱藏主視窗
        
        app = SophiaDesktop()
        print("✅ SophiaDesktop 實例化成功")
        
        # 測試 AI 對話按鈕是否存在
        if hasattr(app, 'open_ai_chat'):
            print("✅ open_ai_chat 方法存在")
        else:
            print("❌ open_ai_chat 方法不存在")
            return False
        
        root.destroy()
        return True
        
    except Exception as e:
        print(f"❌ 桌面應用整合測試失敗: {e}")
        return False

if __name__ == "__main__":
    print("🚀 開始測試 Sophia AI 對話系統...")
    
    # 執行測試
    ai_test_passed = test_ai_chat()
    desktop_test_passed = test_desktop_integration()
    
    print("\n📊 測試結果:")
    print(f"AI 對話功能: {'✅ 通過' if ai_test_passed else '❌ 失敗'}")
    print(f"桌面整合: {'✅ 通過' if desktop_test_passed else '❌ 失敗'}")
    
    if ai_test_passed and desktop_test_passed:
        print("\n🎉 所有測試通過！系統應該可以正常使用")
        print("\n💡 使用說明:")
        print("1. 執行 python sophia_desktop.py")
        print("2. 點擊工具列的「💬 AI對話」按鈕")
        print("3. 在對話視窗中輸入需求，例如：")
        print("   - '幫我打開七月薪資表'")
        print("   - '分析這個數據並製作圖表'")
        print("   - '清理數據並匯出結果'")
    else:
        print("\n⚠️ 部分測試失敗，請檢查錯誤訊息")
