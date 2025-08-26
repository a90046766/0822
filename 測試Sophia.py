#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sophia 桌面助手 - 功能測試腳本
測試所有核心功能是否正常運作
"""

import sys
import os
from pathlib import Path
import pandas as pd

def test_imports():
    """測試所有必要套件是否可以正常匯入"""
    print("🔍 測試套件匯入...")
    
    packages = {
        'tkinter': 'GUI框架',
        'pandas': '資料處理',
        'openpyxl': 'Excel支援',
        'matplotlib': '圖表生成',
        'seaborn': '進階視覺化'
    }
    
    all_ok = True
    for package, description in packages.items():
        try:
            __import__(package)
            print(f"  ✅ {package} - {description}")
        except ImportError as e:
            print(f"  ❌ {package} - {description} (匯入失敗: {e})")
            all_ok = False
    
    return all_ok

def test_file_operations():
    """測試檔案操作功能"""
    print("\n📁 測試檔案操作...")
    
    # 測試CSV讀取
    csv_file = Path('示例薪資數據.csv')
    if csv_file.exists():
        try:
            df = pd.read_csv(csv_file, encoding='utf-8')
            print(f"  ✅ CSV讀取成功 - {len(df)} 行 × {len(df.columns)} 欄")
            
            # 測試基本數據分析
            numeric_cols = df.select_dtypes(include=['number']).columns
            print(f"  ✅ 數值欄位檢測 - 發現 {len(numeric_cols)} 個數值欄位")
            
            # 測試統計計算
            if len(numeric_cols) > 0:
                stats = df[numeric_cols].describe()
                print(f"  ✅ 統計計算成功")
            
            # 測試缺失值檢測
            missing = df.isnull().sum().sum()
            print(f"  ✅ 缺失值檢測 - 發現 {missing} 個缺失值")
            
            return True
            
        except Exception as e:
            print(f"  ❌ CSV處理失敗: {e}")
            return False
    else:
        print(f"  ⚠️ 測試檔案不存在: {csv_file}")
        return False

def test_data_analysis():
    """測試數據分析功能"""
    print("\n📊 測試數據分析功能...")
    
    try:
        # 創建測試數據
        import numpy as np
        np.random.seed(42)
        
        test_data = pd.DataFrame({
            '數值1': np.random.normal(100, 15, 100),
            '數值2': np.random.normal(50, 8, 100),
            '分類1': np.random.choice(['A', 'B', 'C'], 100),
            '分類2': np.random.choice(['類型1', '類型2', '類型3'], 100)
        })
        
        # 測試描述性統計
        desc = test_data.describe()
        print(f"  ✅ 描述性統計計算成功")
        
        # 測試相關性分析
        numeric_cols = test_data.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 1:
            corr = test_data[numeric_cols].corr()
            print(f"  ✅ 相關性分析成功")
        
        # 測試異常值檢測
        for col in numeric_cols:
            Q1 = test_data[col].quantile(0.25)
            Q3 = test_data[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((test_data[col] < (Q1 - 1.5 * IQR)) | 
                       (test_data[col] > (Q3 + 1.5 * IQR))).sum()
            
        print(f"  ✅ 異常值檢測成功")
        
        return True
        
    except Exception as e:
        print(f"  ❌ 數據分析測試失敗: {e}")
        return False

def test_visualization():
    """測試視覺化功能"""
    print("\n📈 測試視覺化功能...")
    
    try:
        import matplotlib.pyplot as plt
        import numpy as np
        
        # 設置中文字體
        plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'Arial Unicode MS', 'SimHei']
        plt.rcParams['axes.unicode_minus'] = False
        
        # 創建測試圖表
        fig, ax = plt.subplots(1, 1, figsize=(6, 4))
        
        # 測試數據
        x = np.random.normal(0, 1, 100)
        
        # 繪製直方圖
        ax.hist(x, bins=20, alpha=0.7, color='skyblue', edgecolor='black')
        ax.set_title('測試直方圖')
        ax.set_xlabel('數值')
        ax.set_ylabel('頻率')
        
        # 不實際顯示圖表，只測試繪製功能
        plt.close(fig)
        print(f"  ✅ 基本圖表繪製成功")
        
        # 測試seaborn
        import seaborn as sns
        print(f"  ✅ Seaborn載入成功")
        
        return True
        
    except Exception as e:
        print(f"  ❌ 視覺化測試失敗: {e}")
        return False

def test_file_export():
    """測試檔案匯出功能"""
    print("\n💾 測試檔案匯出功能...")
    
    try:
        # 創建測試數據
        test_df = pd.DataFrame({
            'A': [1, 2, 3, 4, 5],
            'B': ['a', 'b', 'c', 'd', 'e'],
            'C': [1.1, 2.2, 3.3, 4.4, 5.5]
        })
        
        # 測試Excel匯出
        excel_file = 'test_export.xlsx'
        test_df.to_excel(excel_file, index=False, engine='openpyxl')
        print(f"  ✅ Excel匯出成功")
        
        # 清理測試檔案
        if os.path.exists(excel_file):
            os.remove(excel_file)
            print(f"  ✅ 測試檔案清理完成")
        
        # 測試CSV匯出
        csv_file = 'test_export.csv'
        test_df.to_csv(csv_file, index=False, encoding='utf-8-sig')
        print(f"  ✅ CSV匯出成功")
        
        # 清理測試檔案
        if os.path.exists(csv_file):
            os.remove(csv_file)
        
        return True
        
    except Exception as e:
        print(f"  ❌ 檔案匯出測試失敗: {e}")
        return False

def test_gui_components():
    """測試GUI組件"""
    print("\n🖥️ 測試GUI組件...")
    
    try:
        import tkinter as tk
        from tkinter import ttk
        
        # 創建測試視窗（不顯示）
        root = tk.Tk()
        root.withdraw()  # 隱藏視窗
        
        # 測試基本組件
        frame = ttk.Frame(root)
        label = ttk.Label(frame, text="測試標籤")
        button = ttk.Button(frame, text="測試按鈕")
        entry = ttk.Entry(frame)
        
        print(f"  ✅ 基本GUI組件創建成功")
        
        # 測試Treeview（用於數據顯示）
        tree = ttk.Treeview(frame, columns=('col1', 'col2'), show='headings')
        tree.heading('col1', text='欄位1')
        tree.heading('col2', text='欄位2')
        
        print(f"  ✅ Treeview組件創建成功")
        
        # 清理
        root.destroy()
        
        return True
        
    except Exception as e:
        print(f"  ❌ GUI組件測試失敗: {e}")
        return False

def main():
    """主要測試程序"""
    print("🧪 Sophia 桌面助手 - 功能測試")
    print("=" * 50)
    
    tests = [
        ("套件匯入", test_imports),
        ("檔案操作", test_file_operations),
        ("數據分析", test_data_analysis),
        ("視覺化功能", test_visualization),
        ("檔案匯出", test_file_export),
        ("GUI組件", test_gui_components)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"  ❌ {test_name} 測試執行錯誤: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 測試結果:")
    print(f"  ✅ 通過: {passed}/{total}")
    print(f"  ❌ 失敗: {total - passed}/{total}")
    
    if passed == total:
        print(f"\n🎉 恭喜！所有功能測試通過！")
        print(f"🚀 Sophia 桌面助手已準備就緒，可以正常使用。")
        return True
    else:
        print(f"\n⚠️ 部分功能測試失敗")
        print(f"💡 請檢查失敗的項目並安裝相關套件")
        print(f"🔧 建議執行: python install_requirements.py")
        return False

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            input("\n按 Enter 鍵退出...")
    except KeyboardInterrupt:
        print("\n\n❌ 測試被使用者中斷")
    except Exception as e:
        print(f"\n\n❌ 測試程序錯誤: {e}")
        input("按 Enter 鍵退出...")


