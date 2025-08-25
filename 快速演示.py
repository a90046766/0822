#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sophia AI 對話功能快速演示
"""

import tkinter as tk
from tkinter import messagebox
import os
from pathlib import Path

def create_demo_files():
    """創建示範檔案"""
    # 創建示範薪資數據
    salary_data = """姓名,部門,基本薪資,獎金,總薪資
張小明,業務部,35000,5000,40000
李小華,技術部,45000,3000,48000
王小美,行政部,32000,2000,34000
陳小強,業務部,38000,6000,44000
林小芳,技術部,42000,4000,46000
黃小偉,行政部,30000,1500,31500
劉小玲,業務部,36000,4500,40500
吳小傑,技術部,48000,3500,51500
鄭小雅,行政部,33000,2500,35500
趙小龍,業務部,40000,7000,47000"""
    
    with open('示範薪資表.csv', 'w', encoding='utf-8') as f:
        f.write(salary_data)
    
    print("✅ 已創建示範檔案：示範薪資表.csv")

def show_demo():
    """顯示演示"""
    root = tk.Tk()
    root.withdraw()  # 隱藏主視窗
    
    # 創建示範檔案
    create_demo_files()
    
    # 導入並啟動 Sophia
    from sophia_desktop import SophiaDesktop
    
    print("🚀 啟動 Sophia 桌面助手...")
    app = SophiaDesktop()
    
    # 顯示使用說明
    messagebox.showinfo(
        "Sophia AI 對話演示", 
        "🎉 歡迎使用 Sophia AI 對話功能！\n\n"
        "💡 使用步驟：\n"
        "1. 點擊工具列的「💬 AI對話」按鈕\n"
        "2. 在對話視窗中輸入需求\n\n"
        "🗣️ 試試這些指令：\n"
        "• '幫我打開示範薪資表.csv'\n"
        "• '分析這個薪資數據'\n"
        "• '製作部門薪資比較圖表'\n"
        "• '清理數據並匯出結果'\n\n"
        "🤖 Sophia 會理解您的需求並自動執行！"
    )
    
    # 啟動主程式
    app.run()

if __name__ == "__main__":
    show_demo()
