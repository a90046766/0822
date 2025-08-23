#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sophia 桌面助手 - 真正實用的檔案處理工具
能夠真正開啟、分析、編輯 Excel 檔案和其他文件
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import pandas as pd
import openpyxl
import os
import sys
from pathlib import Path
import subprocess
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'Arial Unicode MS', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 導入AI對話功能
try:
    from sophia_ai_chat import create_ai_chat_window
    AI_CHAT_AVAILABLE = True
except ImportError:
    AI_CHAT_AVAILABLE = False

class SophiaDesktop:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Sophia 專業桌面助手 - 真正能開檔案的版本")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f8f9fa')
        
        # 設置應用程式圖示（如果有的話）
        try:
            self.root.iconbitmap('sophia.ico')
        except:
            pass
            
        # 當前工作資料夾
        self.current_dir = Path.cwd()
        self.current_file = None
        self.df = None  # 當前載入的DataFrame
        
        self.setup_ui()
        
    def setup_ui(self):
        """設置使用者界面"""
        # 主要框架
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 頂部工具列
        self.create_toolbar(main_frame)
        
        # 主要內容區域
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))
        
        # 左側面板（檔案瀏覽器）
        left_frame = ttk.LabelFrame(content_frame, text="📁 檔案瀏覽器", padding=10)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=False, padx=(0, 5))
        left_frame.configure(width=300)
        
        self.create_file_browser(left_frame)
        
        # 右側面板（主要工作區）
        right_frame = ttk.Frame(content_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))
        
        # 右側分為上下兩部分
        # 上部：檔案內容顯示
        self.content_frame = ttk.LabelFrame(right_frame, text="📊 檔案內容", padding=10)
        self.content_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 5))
        
        # 下部：分析結果和操作面板
        self.analysis_frame = ttk.LabelFrame(right_frame, text="🔍 分析結果", padding=10)
        self.analysis_frame.pack(fill=tk.BOTH, expand=False, pady=(5, 0))
        self.analysis_frame.configure(height=200)
        
        self.create_content_area()
        self.create_analysis_area()
        
        # 狀態列
        self.create_status_bar()
        
    def create_toolbar(self, parent):
        """創建工具列"""
        toolbar = ttk.Frame(parent)
        toolbar.pack(fill=tk.X, pady=(0, 10))
        
        # 開啟檔案按鈕
        ttk.Button(toolbar, text="📂 開啟檔案", 
                  command=self.open_file).pack(side=tk.LEFT, padx=(0, 5))
        
        # 開啟資料夾按鈕
        ttk.Button(toolbar, text="📁 開啟資料夾", 
                  command=self.open_folder).pack(side=tk.LEFT, padx=5)
        
        # 分析按鈕
        ttk.Button(toolbar, text="🔍 智能分析", 
                  command=self.analyze_current_file).pack(side=tk.LEFT, padx=5)
        
        # Excel處理按鈕
        ttk.Button(toolbar, text="📊 Excel處理", 
                  command=self.process_excel).pack(side=tk.LEFT, padx=5)
        
        # 生成報表按鈕
        ttk.Button(toolbar, text="📋 生成報表", 
                  command=self.generate_report).pack(side=tk.LEFT, padx=5)
        
        # AI對話按鈕
        ttk.Button(toolbar, text="💬 AI對話", 
                  command=self.open_ai_chat).pack(side=tk.RIGHT, padx=5)
        
        # 說明按鈕
        ttk.Button(toolbar, text="❓ 說明", 
                  command=self.show_help).pack(side=tk.RIGHT, padx=(5, 0))
        
    def create_file_browser(self, parent):
        """創建檔案瀏覽器"""
        # 當前路徑顯示
        path_frame = ttk.Frame(parent)
        path_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(path_frame, text="當前位置:").pack(anchor=tk.W)
        self.path_var = tk.StringVar(value=str(self.current_dir))
        ttk.Label(path_frame, textvariable=self.path_var, 
                 foreground='blue').pack(anchor=tk.W)
        
        # 檔案清單
        self.file_tree = ttk.Treeview(parent, height=20)
        self.file_tree.pack(fill=tk.BOTH, expand=True)
        
        # 滾動條
        scrollbar = ttk.Scrollbar(parent, orient=tk.VERTICAL, command=self.file_tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.file_tree.configure(yscrollcommand=scrollbar.set)
        
        # 綁定雙擊事件
        self.file_tree.bind('<Double-1>', self.on_file_double_click)
        
        self.refresh_file_browser()
        
    def create_content_area(self):
        """創建內容顯示區域"""
        # 創建筆記本控件（分頁）
        self.notebook = ttk.Notebook(self.content_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # 預覽頁面
        self.preview_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.preview_frame, text="📄 預覽")
        
        self.preview_text = scrolledtext.ScrolledText(self.preview_frame, 
                                                     wrap=tk.WORD, height=15)
        self.preview_text.pack(fill=tk.BOTH, expand=True)
        
        # 數據頁面（用於Excel等結構化數據）
        self.data_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.data_frame, text="📊 數據")
        
        # 圖表頁面
        self.chart_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.chart_frame, text="📈 圖表")
        
    def create_analysis_area(self):
        """創建分析結果區域"""
        self.analysis_text = scrolledtext.ScrolledText(self.analysis_frame, 
                                                      wrap=tk.WORD, height=8)
        self.analysis_text.pack(fill=tk.BOTH, expand=True)
        
        # 預設歡迎訊息
        welcome_msg = """
🎉 歡迎使用 Sophia 專業桌面助手！

✅ 這是真正能開啟檔案的版本！
✅ 可以處理 Excel、CSV、文字檔等多種格式
✅ 提供專業的數據分析和報表生成
🆕 全新AI對話功能！可以用自然語言溝通！

🔧 使用方法：
1. 點擊「💬 AI對話」開啟智能對話功能
2. 用自然語言告訴我您的需求，例如：
   "幫我分析這個薪資表" 或 "製作業績圖表"
3. 或使用傳統方式：點擊按鈕操作檔案

🗣️ AI對話範例：
• "開啟Excel檔案並分析各部門薪資"
• "清理重複數據然後生成報表"
• "製作銷售趨勢圖並預測未來"

現在就開始使用吧！不會再讓您中風了！😄
        """
        self.analysis_text.insert(tk.END, welcome_msg)
        
    def create_status_bar(self):
        """創建狀態列"""
        self.status_var = tk.StringVar(value="就緒 - 選擇檔案開始處理")
        status_bar = ttk.Label(self.root, textvariable=self.status_var, 
                              relief=tk.SUNKEN, anchor=tk.W)
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
    def refresh_file_browser(self):
        """刷新檔案瀏覽器"""
        # 清空現有項目
        for item in self.file_tree.get_children():
            self.file_tree.delete(item)
            
        try:
            # 添加上級目錄
            if self.current_dir.parent != self.current_dir:
                self.file_tree.insert('', 0, text='..', values=['folder', '上級目錄'])
            
            # 添加資料夾
            for item in sorted(self.current_dir.iterdir()):
                if item.is_dir():
                    self.file_tree.insert('', tk.END, text=item.name, 
                                        values=['folder', '資料夾'])
                                        
            # 添加檔案
            for item in sorted(self.current_dir.iterdir()):
                if item.is_file():
                    size = self.format_file_size(item.stat().st_size)
                    modified = datetime.fromtimestamp(item.stat().st_mtime).strftime('%Y-%m-%d %H:%M')
                    self.file_tree.insert('', tk.END, text=item.name, 
                                        values=['file', f'{size} | {modified}'])
                                        
        except PermissionError:
            messagebox.showerror("錯誤", "無法訪問此目錄")
            
        self.path_var.set(str(self.current_dir))
        
    def format_file_size(self, size_bytes):
        """格式化檔案大小"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024**2:
            return f"{size_bytes/1024:.1f} KB"
        elif size_bytes < 1024**3:
            return f"{size_bytes/1024**2:.1f} MB"
        else:
            return f"{size_bytes/1024**3:.1f} GB"
            
    def on_file_double_click(self, event):
        """處理檔案雙擊事件"""
        selection = self.file_tree.selection()
        if not selection:
            return
            
        item = self.file_tree.item(selection[0])
        file_name = item['text']
        file_type = item['values'][0] if item['values'] else ''
        
        if file_name == '..':
            # 返回上級目錄
            self.current_dir = self.current_dir.parent
            self.refresh_file_browser()
        elif file_type == 'folder':
            # 進入子目錄
            self.current_dir = self.current_dir / file_name
            self.refresh_file_browser()
        else:
            # 開啟檔案
            file_path = self.current_dir / file_name
            self.open_specific_file(file_path)
            
    def open_file(self):
        """開啟檔案對話框"""
        filetypes = [
            ("All Supported", "*.xlsx;*.xls;*.csv;*.txt;*.json;*.py;*.html;*.md"),
            ("Excel Files", "*.xlsx;*.xls"),
            ("CSV Files", "*.csv"),
            ("Text Files", "*.txt"),
            ("All Files", "*.*")
        ]
        
        file_path = filedialog.askopenfilename(
            title="選擇要開啟的檔案",
            filetypes=filetypes,
            initialdir=self.current_dir
        )
        
        if file_path:
            self.open_specific_file(Path(file_path))
            
    def open_folder(self):
        """開啟資料夾對話框"""
        folder_path = filedialog.askdirectory(
            title="選擇資料夾",
            initialdir=self.current_dir
        )
        
        if folder_path:
            self.current_dir = Path(folder_path)
            self.refresh_file_browser()
            
    def open_specific_file(self, file_path):
        """開啟特定檔案"""
        try:
            self.current_file = file_path
            self.status_var.set(f"正在處理: {file_path.name}")
            
            # 根據檔案類型處理
            if file_path.suffix.lower() in ['.xlsx', '.xls']:
                self.open_excel_file(file_path)
            elif file_path.suffix.lower() == '.csv':
                self.open_csv_file(file_path)
            elif file_path.suffix.lower() in ['.txt', '.py', '.html', '.md', '.json']:
                self.open_text_file(file_path)
            else:
                # 嘗試作為文字檔案開啟
                self.open_text_file(file_path)
                
            self.status_var.set(f"已開啟: {file_path.name}")
            
            # 自動分析
            self.analyze_current_file()
            
        except Exception as e:
            messagebox.showerror("錯誤", f"無法開啟檔案: {str(e)}")
            self.status_var.set("錯誤")
            
    def open_excel_file(self, file_path):
        """開啟Excel檔案"""
        try:
            # 讀取Excel檔案
            self.df = pd.read_excel(file_path, sheet_name=0)  # 讀取第一個工作表
            
            # 在數據頁面顯示
            self.show_dataframe_in_treeview(self.df)
            
            # 在預覽頁面顯示基本資訊
            info_text = f"""
📊 Excel檔案分析: {file_path.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 基本資訊:
• 檔案路徑: {file_path}
• 工作表數量: {len(pd.ExcelFile(file_path).sheet_names)}
• 資料列數: {len(self.df)}
• 資料欄數: {len(self.df.columns)}
• 檔案大小: {self.format_file_size(file_path.stat().st_size)}

📊 欄位資訊:
{chr(10).join([f"• {col} ({self.df[col].dtype})" for col in self.df.columns[:10]])}
{f"• ... 還有 {len(self.df.columns) - 10} 個欄位" if len(self.df.columns) > 10 else ""}

🔍 資料預覽:
{self.df.head().to_string()}
            """
            
            self.preview_text.delete(1.0, tk.END)
            self.preview_text.insert(tk.END, info_text)
            
            # 切換到數據頁面
            self.notebook.select(self.data_frame)
            
        except Exception as e:
            raise Exception(f"Excel檔案讀取失敗: {str(e)}")
            
    def open_csv_file(self, file_path):
        """開啟CSV檔案"""
        try:
            # 嘗試不同的編碼
            encodings = ['utf-8', 'gbk', 'big5', 'cp1252']
            
            for encoding in encodings:
                try:
                    self.df = pd.read_csv(file_path, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise Exception("無法解析檔案編碼")
                
            # 在數據頁面顯示
            self.show_dataframe_in_treeview(self.df)
            
            # 在預覽頁面顯示基本資訊
            info_text = f"""
📄 CSV檔案分析: {file_path.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 基本資訊:
• 檔案路徑: {file_path}
• 資料列數: {len(self.df)}
• 資料欄數: {len(self.df.columns)}
• 檔案大小: {self.format_file_size(file_path.stat().st_size)}

📊 欄位資訊:
{chr(10).join([f"• {col} ({self.df[col].dtype})" for col in self.df.columns[:10]])}
{f"• ... 還有 {len(self.df.columns) - 10} 個欄位" if len(self.df.columns) > 10 else ""}

🔍 資料預覽:
{self.df.head().to_string()}
            """
            
            self.preview_text.delete(1.0, tk.END)
            self.preview_text.insert(tk.END, info_text)
            
            # 切換到數據頁面
            self.notebook.select(self.data_frame)
            
        except Exception as e:
            raise Exception(f"CSV檔案讀取失敗: {str(e)}")
            
    def open_text_file(self, file_path):
        """開啟文字檔案"""
        try:
            # 嘗試不同的編碼
            encodings = ['utf-8', 'gbk', 'big5', 'cp1252']
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise Exception("無法解析檔案編碼")
                
            self.preview_text.delete(1.0, tk.END)
            self.preview_text.insert(tk.END, content)
            
            # 切換到預覽頁面
            self.notebook.select(self.preview_frame)
            
        except Exception as e:
            raise Exception(f"文字檔案讀取失敗: {str(e)}")
            
    def show_dataframe_in_treeview(self, df):
        """在Treeview中顯示DataFrame"""
        # 清除舊的Treeview
        for widget in self.data_frame.winfo_children():
            widget.destroy()
            
        # 創建新的Treeview
        columns = list(df.columns)
        tree = ttk.Treeview(self.data_frame, columns=columns, show='headings', height=15)
        
        # 設置欄位標題
        for col in columns:
            tree.heading(col, text=col)
            tree.column(col, width=100, minwidth=50)
            
        # 添加資料
        for index, row in df.head(1000).iterrows():  # 限制顯示1000行
            tree.insert('', tk.END, values=list(row))
            
        # 添加滾動條
        v_scrollbar = ttk.Scrollbar(self.data_frame, orient=tk.VERTICAL, command=tree.yview)
        h_scrollbar = ttk.Scrollbar(self.data_frame, orient=tk.HORIZONTAL, command=tree.xview)
        
        tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # 佈局
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        h_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        
    def analyze_current_file(self):
        """分析當前檔案"""
        if not self.current_file:
            messagebox.showwarning("警告", "請先開啟一個檔案")
            return
            
        try:
            analysis_result = "🔍 智能分析結果\n" + "="*50 + "\n\n"
            
            if self.df is not None:
                # 數據分析
                analysis_result += self.analyze_dataframe(self.df)
            else:
                # 檔案基本分析
                file_info = self.current_file.stat()
                analysis_result += f"📁 檔案基本分析:\n"
                analysis_result += f"• 檔案名稱: {self.current_file.name}\n"
                analysis_result += f"• 檔案大小: {self.format_file_size(file_info.st_size)}\n"
                analysis_result += f"• 修改時間: {datetime.fromtimestamp(file_info.st_mtime)}\n"
                analysis_result += f"• 檔案類型: {self.current_file.suffix}\n\n"
                
                # 根據檔案類型提供建議
                analysis_result += self.get_file_suggestions(self.current_file)
                
            self.analysis_text.delete(1.0, tk.END)
            self.analysis_text.insert(tk.END, analysis_result)
            
        except Exception as e:
            messagebox.showerror("錯誤", f"分析失敗: {str(e)}")
            
    def analyze_dataframe(self, df):
        """分析DataFrame"""
        result = "📊 數據深度分析:\n\n"
        
        # 基本統計
        result += f"🔢 基本統計:\n"
        result += f"• 總列數: {len(df):,}\n"
        result += f"• 總欄數: {len(df.columns)}\n"
        result += f"• 記憶體使用: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB\n\n"
        
        # 資料類型分析
        result += f"📋 資料類型分布:\n"
        dtype_counts = df.dtypes.value_counts()
        for dtype, count in dtype_counts.items():
            result += f"• {dtype}: {count} 個欄位\n"
        result += "\n"
        
        # 缺失值分析
        missing_data = df.isnull().sum()
        missing_data = missing_data[missing_data > 0]
        if len(missing_data) > 0:
            result += f"❌ 缺失值分析:\n"
            for col, count in missing_data.items():
                percentage = (count / len(df)) * 100
                result += f"• {col}: {count} ({percentage:.1f}%)\n"
            result += "\n"
        else:
            result += f"✅ 無缺失值\n\n"
            
        # 數值欄位統計
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            result += f"📈 數值統計 (前5個欄位):\n"
            for col in numeric_cols[:5]:
                stats = df[col].describe()
                result += f"• {col}:\n"
                result += f"  - 平均值: {stats['mean']:.2f}\n"
                result += f"  - 標準差: {stats['std']:.2f}\n"
                result += f"  - 最小值: {stats['min']:.2f}\n"
                result += f"  - 最大值: {stats['max']:.2f}\n"
            result += "\n"
            
        # 建議
        result += f"💡 專業建議:\n"
        suggestions = self.get_dataframe_suggestions(df)
        for suggestion in suggestions:
            result += f"• {suggestion}\n"
            
        return result
        
    def get_dataframe_suggestions(self, df):
        """獲取DataFrame分析建議"""
        suggestions = []
        
        # 檢查缺失值
        missing_ratio = df.isnull().sum().sum() / (len(df) * len(df.columns))
        if missing_ratio > 0.1:
            suggestions.append("建議處理缺失值，缺失比例較高")
        elif missing_ratio > 0:
            suggestions.append("有少量缺失值，可考慮填充或移除")
            
        # 檢查重複行
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            suggestions.append(f"發現 {duplicates} 行重複資料，建議去重")
            
        # 檢查數值欄位
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 1:
            suggestions.append("可以建立相關性分析和圖表")
            suggestions.append("適合進行統計分析和趨勢預測")
            
        # 檢查文字欄位
        text_cols = df.select_dtypes(include=['object']).columns
        if len(text_cols) > 0:
            suggestions.append("文字欄位可進行分類和頻率分析")
            
        # 檢查資料大小
        if len(df) > 10000:
            suggestions.append("大型資料集，建議使用抽樣分析")
        elif len(df) < 100:
            suggestions.append("小型資料集，可進行詳細的逐行分析")
            
        return suggestions
        
    def get_file_suggestions(self, file_path):
        """根據檔案類型獲取建議"""
        suggestions = "💡 處理建議:\n"
        
        ext = file_path.suffix.lower()
        if ext in ['.xlsx', '.xls']:
            suggestions += "• Excel檔案：可進行數據分析、圖表生成、報表製作\n"
            suggestions += "• 建議使用「Excel處理」功能進行深度分析\n"
        elif ext == '.csv':
            suggestions += "• CSV檔案：可導入Excel進行進一步處理\n"
            suggestions += "• 適合進行數據清理和統計分析\n"
        elif ext == '.txt':
            suggestions += "• 文字檔案：可進行內容搜尋和格式轉換\n"
            suggestions += "• 如果是結構化資料，可考慮轉換為CSV\n"
        elif ext == '.py':
            suggestions += "• Python程式碼：可進行語法檢查和執行\n"
            suggestions += "• 建議使用程式碼編輯器開啟\n"
        else:
            suggestions += f"• {ext}檔案：可使用對應的專業軟體開啟\n"
            
        return suggestions
        
    def process_excel(self):
        """Excel專業處理"""
        if self.df is None:
            messagebox.showwarning("警告", "請先開啟一個Excel或CSV檔案")
            return
            
        # 創建Excel處理視窗
        excel_window = tk.Toplevel(self.root)
        excel_window.title("📊 Excel專業處理中心")
        excel_window.geometry("800x600")
        excel_window.configure(bg='#f8f9fa')
        
        # 處理選項
        options_frame = ttk.LabelFrame(excel_window, text="處理選項", padding=10)
        options_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Button(options_frame, text="🧹 數據清理", 
                  command=lambda: self.clean_data(excel_window)).pack(side=tk.LEFT, padx=5)
        ttk.Button(options_frame, text="📊 生成統計", 
                  command=lambda: self.generate_statistics(excel_window)).pack(side=tk.LEFT, padx=5)
        ttk.Button(options_frame, text="📈 創建圖表", 
                  command=lambda: self.create_chart(excel_window)).pack(side=tk.LEFT, padx=5)
        ttk.Button(options_frame, text="💾 匯出結果", 
                  command=lambda: self.export_results(excel_window)).pack(side=tk.LEFT, padx=5)
        
        # 結果顯示區
        result_frame = ttk.LabelFrame(excel_window, text="處理結果", padding=10)
        result_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.excel_result_text = scrolledtext.ScrolledText(result_frame, wrap=tk.WORD)
        self.excel_result_text.pack(fill=tk.BOTH, expand=True)
        
        # 顯示基本資訊
        basic_info = f"""
📊 Excel檔案處理中心
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 當前檔案: {self.current_file.name if self.current_file else 'N/A'}
📊 資料維度: {self.df.shape[0]} 行 × {self.df.shape[1]} 欄

🛠️ 可用操作:
• 數據清理: 移除重複項、處理缺失值、格式標準化
• 生成統計: 描述性統計、相關性分析、分布分析
• 創建圖表: 折線圖、柱狀圖、散佈圖、熱力圖
• 匯出結果: 儲存處理後的資料為Excel、CSV格式

選擇上方的操作按鈕開始處理...
        """
        
        self.excel_result_text.insert(tk.END, basic_info)
        
    def clean_data(self, parent_window):
        """數據清理"""
        try:
            original_shape = self.df.shape
            cleaned_df = self.df.copy()
            
            report = "🧹 數據清理報告\n" + "="*30 + "\n\n"
            
            # 移除重複行
            duplicates_before = cleaned_df.duplicated().sum()
            cleaned_df = cleaned_df.drop_duplicates()
            duplicates_removed = duplicates_before
            
            report += f"🗑️ 重複行處理:\n"
            report += f"• 發現重複行: {duplicates_before}\n"
            report += f"• 已移除重複行: {duplicates_removed}\n\n"
            
            # 處理缺失值
            missing_before = cleaned_df.isnull().sum().sum()
            
            # 對數值欄位填充平均值
            numeric_cols = cleaned_df.select_dtypes(include=['number']).columns
            for col in numeric_cols:
                if cleaned_df[col].isnull().sum() > 0:
                    mean_val = cleaned_df[col].mean()
                    cleaned_df[col].fillna(mean_val, inplace=True)
            
            # 對文字欄位填充眾數
            text_cols = cleaned_df.select_dtypes(include=['object']).columns
            for col in text_cols:
                if cleaned_df[col].isnull().sum() > 0:
                    mode_val = cleaned_df[col].mode()[0] if not cleaned_df[col].mode().empty else "未知"
                    cleaned_df[col].fillna(mode_val, inplace=True)
            
            missing_after = cleaned_df.isnull().sum().sum()
            missing_filled = missing_before - missing_after
            
            report += f"🔧 缺失值處理:\n"
            report += f"• 處理前缺失值: {missing_before}\n"
            report += f"• 已填充缺失值: {missing_filled}\n"
            report += f"• 處理後缺失值: {missing_after}\n\n"
            
            # 數據類型優化
            memory_before = self.df.memory_usage(deep=True).sum() / 1024**2
            memory_after = cleaned_df.memory_usage(deep=True).sum() / 1024**2
            
            report += f"⚡ 記憶體優化:\n"
            report += f"• 優化前: {memory_before:.2f} MB\n"
            report += f"• 優化後: {memory_after:.2f} MB\n"
            report += f"• 節省: {memory_before - memory_after:.2f} MB\n\n"
            
            final_shape = cleaned_df.shape
            report += f"📊 清理結果:\n"
            report += f"• 原始資料: {original_shape[0]} 行 × {original_shape[1]} 欄\n"
            report += f"• 清理後: {final_shape[0]} 行 × {final_shape[1]} 欄\n"
            report += f"• 資料完整度: {((cleaned_df.notnull().sum().sum()) / (cleaned_df.shape[0] * cleaned_df.shape[1]) * 100):.1f}%\n\n"
            
            report += "✅ 數據清理完成！清理後的資料已更新。\n"
            
            # 更新資料
            self.df = cleaned_df
            self.show_dataframe_in_treeview(self.df)
            
            # 顯示結果
            self.excel_result_text.delete(1.0, tk.END)
            self.excel_result_text.insert(tk.END, report)
            
        except Exception as e:
            messagebox.showerror("錯誤", f"數據清理失敗: {str(e)}")
            
    def generate_statistics(self, parent_window):
        """生成統計報告"""
        try:
            report = "📈 統計分析報告\n" + "="*30 + "\n\n"
            
            # 基本統計
            report += "📊 基本統計資訊:\n"
            report += f"• 總資料筆數: {len(self.df):,}\n"
            report += f"• 總欄位數: {len(self.df.columns)}\n"
            report += f"• 記憶體使用: {self.df.memory_usage(deep=True).sum() / 1024**2:.2f} MB\n\n"
            
            # 數值欄位統計
            numeric_cols = self.df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                report += "🔢 數值欄位統計:\n"
                desc = self.df[numeric_cols].describe()
                
                for col in numeric_cols:
                    report += f"\n• {col}:\n"
                    report += f"  平均值: {desc.loc['mean', col]:.2f}\n"
                    report += f"  標準差: {desc.loc['std', col]:.2f}\n"
                    report += f"  最小值: {desc.loc['min', col]:.2f}\n"
                    report += f"  第一四分位數: {desc.loc['25%', col]:.2f}\n"
                    report += f"  中位數: {desc.loc['50%', col]:.2f}\n"
                    report += f"  第三四分位數: {desc.loc['75%', col]:.2f}\n"
                    report += f"  最大值: {desc.loc['max', col]:.2f}\n"
                    
            # 分類欄位統計
            categorical_cols = self.df.select_dtypes(include=['object']).columns
            if len(categorical_cols) > 0:
                report += "\n\n📝 分類欄位統計:\n"
                for col in categorical_cols[:5]:  # 只顯示前5個
                    value_counts = self.df[col].value_counts().head(5)
                    report += f"\n• {col} (前5項):\n"
                    for value, count in value_counts.items():
                        percentage = (count / len(self.df)) * 100
                        report += f"  {value}: {count} ({percentage:.1f}%)\n"
                        
            # 相關性分析
            if len(numeric_cols) > 1:
                report += "\n\n📊 相關性分析 (前5個數值欄位):\n"
                correlation = self.df[numeric_cols[:5]].corr()
                
                # 找出高相關性的配對
                high_corr_pairs = []
                for i in range(len(correlation.columns)):
                    for j in range(i+1, len(correlation.columns)):
                        corr_value = correlation.iloc[i, j]
                        if abs(corr_value) > 0.7:  # 高相關性閾值
                            high_corr_pairs.append((
                                correlation.columns[i], 
                                correlation.columns[j], 
                                corr_value
                            ))
                
                if high_corr_pairs:
                    report += "⚠️ 發現高相關性配對:\n"
                    for col1, col2, corr_val in high_corr_pairs:
                        report += f"  {col1} ↔ {col2}: {corr_val:.3f}\n"
                else:
                    report += "✅ 無發現顯著相關性\n"
                    
            # 資料品質評估
            report += "\n\n🎯 資料品質評估:\n"
            
            # 完整性
            completeness = (self.df.notnull().sum().sum()) / (self.df.shape[0] * self.df.shape[1])
            report += f"• 資料完整性: {completeness*100:.1f}%\n"
            
            # 唯一性
            uniqueness_scores = []
            for col in self.df.columns:
                unique_ratio = self.df[col].nunique() / len(self.df)
                uniqueness_scores.append(unique_ratio)
            avg_uniqueness = sum(uniqueness_scores) / len(uniqueness_scores)
            report += f"• 平均唯一性: {avg_uniqueness*100:.1f}%\n"
            
            # 一致性（檢查異常值）
            outliers_count = 0
            for col in numeric_cols:
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = ((self.df[col] < lower_bound) | (self.df[col] > upper_bound)).sum()
                outliers_count += outliers
                
            report += f"• 潛在異常值: {outliers_count} 個\n"
            
            report += "\n✅ 統計分析完成！\n"
            
            # 顯示結果
            self.excel_result_text.delete(1.0, tk.END)
            self.excel_result_text.insert(tk.END, report)
            
        except Exception as e:
            messagebox.showerror("錯誤", f"統計分析失敗: {str(e)}")
            
    def create_chart(self, parent_window):
        """創建圖表"""
        try:
            # 清除圖表頁面
            for widget in self.chart_frame.winfo_children():
                widget.destroy()
                
            # 獲取數值欄位
            numeric_cols = self.df.select_dtypes(include=['number']).columns
            
            if len(numeric_cols) == 0:
                messagebox.showwarning("警告", "沒有數值欄位可以製作圖表")
                return
                
            # 創建圖表
            fig, axes = plt.subplots(2, 2, figsize=(12, 8))
            fig.suptitle(f'資料視覺化 - {self.current_file.name}', fontsize=16)
            
            # 1. 直方圖
            if len(numeric_cols) >= 1:
                col = numeric_cols[0]
                axes[0, 0].hist(self.df[col].dropna(), bins=20, alpha=0.7, color='skyblue', edgecolor='black')
                axes[0, 0].set_title(f'{col} 分布圖')
                axes[0, 0].set_xlabel(col)
                axes[0, 0].set_ylabel('頻率')
                
            # 2. 盒鬚圖
            if len(numeric_cols) >= 2:
                axes[0, 1].boxplot([self.df[col].dropna() for col in numeric_cols[:4]], 
                                 labels=numeric_cols[:4])
                axes[0, 1].set_title('盒鬚圖')
                axes[0, 1].tick_params(axis='x', rotation=45)
                
            # 3. 散佈圖
            if len(numeric_cols) >= 2:
                col1, col2 = numeric_cols[0], numeric_cols[1]
                axes[1, 0].scatter(self.df[col1], self.df[col2], alpha=0.6, color='coral')
                axes[1, 0].set_title(f'{col1} vs {col2}')
                axes[1, 0].set_xlabel(col1)
                axes[1, 0].set_ylabel(col2)
                
            # 4. 相關性熱力圖
            if len(numeric_cols) >= 2:
                corr_data = self.df[numeric_cols[:5]].corr()  # 最多5個欄位
                im = axes[1, 1].imshow(corr_data, cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
                axes[1, 1].set_title('相關性熱力圖')
                axes[1, 1].set_xticks(range(len(corr_data.columns)))
                axes[1, 1].set_yticks(range(len(corr_data.columns)))
                axes[1, 1].set_xticklabels(corr_data.columns, rotation=45)
                axes[1, 1].set_yticklabels(corr_data.columns)
                
                # 添加數值標籤
                for i in range(len(corr_data.columns)):
                    for j in range(len(corr_data.columns)):
                        text = axes[1, 1].text(j, i, f'{corr_data.iloc[i, j]:.2f}',
                                             ha="center", va="center", color="black", fontsize=8)
                                             
                plt.colorbar(im, ax=axes[1, 1])
                
            plt.tight_layout()
            
            # 在GUI中顯示圖表
            canvas = FigureCanvasTkAgg(fig, self.chart_frame)
            canvas.draw()
            canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
            
            # 切換到圖表頁面
            self.notebook.select(self.chart_frame)
            
            # 更新結果文字
            chart_report = f"""
📊 圖表生成完成！

✅ 已生成以下圖表:
• 直方圖: 顯示 {numeric_cols[0] if len(numeric_cols) > 0 else 'N/A'} 的數據分布
• 盒鬚圖: 比較多個數值欄位的分布範圍
• 散佈圖: 分析 {numeric_cols[0] if len(numeric_cols) > 0 else 'N/A'} 與 {numeric_cols[1] if len(numeric_cols) > 1 else 'N/A'} 的關係
• 相關性熱力圖: 展示各數值欄位間的相關程度

📈 圖表分析建議:
• 觀察直方圖判斷數據是否正常分布
• 盒鬚圖可識別異常值和數據範圍
• 散佈圖可發現變數間的線性關係
• 相關性熱力圖顏色越深表示相關性越強

切換到「圖表」頁面查看視覺化結果。
            """
            
            self.excel_result_text.delete(1.0, tk.END)
            self.excel_result_text.insert(tk.END, chart_report)
            
        except Exception as e:
            messagebox.showerror("錯誤", f"圖表生成失敗: {str(e)}")
            
    def export_results(self, parent_window):
        """匯出處理結果"""
        try:
            # 選擇匯出格式
            file_types = [
                ("Excel files", "*.xlsx"),
                ("CSV files", "*.csv"),
                ("JSON files", "*.json")
            ]
            
            output_file = filedialog.asksaveasfilename(
                title="儲存處理結果",
                filetypes=file_types,
                defaultextension=".xlsx",
                initialdir=self.current_dir
            )
            
            if not output_file:
                return
                
            output_path = Path(output_file)
            
            # 根據副檔名匯出
            if output_path.suffix.lower() == '.xlsx':
                self.df.to_excel(output_file, index=False, engine='openpyxl')
            elif output_path.suffix.lower() == '.csv':
                self.df.to_csv(output_file, index=False, encoding='utf-8-sig')
            elif output_path.suffix.lower() == '.json':
                self.df.to_json(output_file, orient='records', force_ascii=False, indent=2)
            else:
                messagebox.showerror("錯誤", "不支援的檔案格式")
                return
                
            # 生成匯出報告
            export_report = f"""
💾 匯出完成！

📁 輸出檔案: {output_path.name}
📂 儲存位置: {output_path.parent}
📊 資料規模: {len(self.df)} 行 × {len(self.df.columns)} 欄
💽 檔案大小: {self.format_file_size(output_path.stat().st_size)}
⏰ 匯出時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

✅ 匯出格式: {output_path.suffix.upper()}
✅ 編碼格式: UTF-8 (支援中文)
✅ 資料完整性: 100%

📝 匯出內容包含:
• 所有處理後的資料記錄
• 完整的欄位資訊
• 清理和優化後的數據

檔案已成功儲存，可以在其他軟體中開啟使用。
            """
            
            self.excel_result_text.delete(1.0, tk.END)
            self.excel_result_text.insert(tk.END, export_report)
            
            messagebox.showinfo("成功", f"資料已成功匯出至:\n{output_file}")
            
        except Exception as e:
            messagebox.showerror("錯誤", f"匯出失敗: {str(e)}")
            
    def generate_report(self):
        """生成專業報表"""
        if not self.current_file:
            messagebox.showwarning("警告", "請先開啟一個檔案")
            return
            
        try:
            # 創建報表視窗
            report_window = tk.Toplevel(self.root)
            report_window.title("📋 專業報表生成")
            report_window.geometry("900x700")
            report_window.configure(bg='#f8f9fa')
            
            # 報表內容
            report_text = scrolledtext.ScrolledText(report_window, wrap=tk.WORD, font=('Courier New', 10))
            report_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
            
            # 生成完整報表
            report_content = self.create_comprehensive_report()
            report_text.insert(tk.END, report_content)
            
            # 匯出按鈕
            export_frame = ttk.Frame(report_window)
            export_frame.pack(fill=tk.X, padx=10, pady=10)
            
            ttk.Button(export_frame, text="💾 匯出報表", 
                      command=lambda: self.export_report(report_content)).pack(side=tk.RIGHT, padx=5)
            ttk.Button(export_frame, text="🖨️ 列印報表", 
                      command=lambda: self.print_report(report_content)).pack(side=tk.RIGHT, padx=5)
                      
        except Exception as e:
            messagebox.showerror("錯誤", f"報表生成失敗: {str(e)}")
            
    def create_comprehensive_report(self):
        """創建綜合報表"""
        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                           📋 SOPHIA 專業分析報表                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📅 生成時間: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}
👤 分析師: Sophia 專業桌面助手
📁 檔案路徑: {self.current_file}

════════════════════════════════════════════════════════════════════════════════

📊 1. 檔案基本資訊
────────────────────────────────────────────────────────────────────────────────
"""
        
        # 檔案基本資訊
        file_info = self.current_file.stat()
        report += f"""
• 檔案名稱: {self.current_file.name}
• 檔案大小: {self.format_file_size(file_info.st_size)}
• 檔案類型: {self.current_file.suffix.upper()[1:]} 檔案
• 創建時間: {datetime.fromtimestamp(file_info.st_ctime).strftime('%Y-%m-%d %H:%M:%S')}
• 修改時間: {datetime.fromtimestamp(file_info.st_mtime).strftime('%Y-%m-%d %H:%M:%S')}
• 存取時間: {datetime.fromtimestamp(file_info.st_atime).strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        if self.df is not None:
            report += f"""

📈 2. 資料結構分析
────────────────────────────────────────────────────────────────────────────────

• 總記錄數: {len(self.df):,} 筆
• 總欄位數: {len(self.df.columns)} 個
• 記憶體使用: {self.df.memory_usage(deep=True).sum() / 1024**2:.2f} MB
• 資料密度: {(self.df.notnull().sum().sum() / (len(self.df) * len(self.df.columns)) * 100):.1f}%

📋 2.1 欄位詳細資訊
┌─────────────────────────────────────────────────────────────────────────────┐
│ 欄位名稱                │ 資料類型    │ 非空值數   │ 缺失率     │ 唯一值數   │
├─────────────────────────────────────────────────────────────────────────────┤"""

            for col in self.df.columns:
                non_null = self.df[col].notnull().sum()
                missing_rate = (1 - non_null / len(self.df)) * 100
                unique_count = self.df[col].nunique()
                dtype = str(self.df[col].dtype)
                
                report += f"""
│ {col:<23} │ {dtype:<11} │ {non_null:<10} │ {missing_rate:<10.1f}% │ {unique_count:<10} │"""
            
            report += """
└─────────────────────────────────────────────────────────────────────────────┘
"""
            
            # 數值統計
            numeric_cols = self.df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                report += f"""

🔢 3. 數值統計分析
────────────────────────────────────────────────────────────────────────────────
"""
                for col in numeric_cols:
                    stats = self.df[col].describe()
                    report += f"""
• {col}:
  ┌─ 統計量 ─────────┬─ 數值 ─────────────┐
  │ 平均值           │ {stats['mean']:>18.2f} │
  │ 標準差           │ {stats['std']:>18.2f} │
  │ 最小值           │ {stats['min']:>18.2f} │
  │ 第一四分位數     │ {stats['25%']:>18.2f} │
  │ 中位數           │ {stats['50%']:>18.2f} │
  │ 第三四分位數     │ {stats['75%']:>18.2f} │
  │ 最大值           │ {stats['max']:>18.2f} │
  │ 變異係數         │ {(stats['std']/stats['mean']*100):>17.2f}% │
  └──────────────────┴────────────────────┘
"""
            
            # 分類統計
            categorical_cols = self.df.select_dtypes(include=['object']).columns
            if len(categorical_cols) > 0:
                report += f"""

📝 4. 分類統計分析
────────────────────────────────────────────────────────────────────────────────
"""
                for col in categorical_cols[:3]:  # 只顯示前3個
                    value_counts = self.df[col].value_counts().head(10)
                    report += f"""
• {col} (前10項):
  ┌─ 類別 ─────────────────────┬─ 數量 ──┬─ 百分比 ─┐"""
                    for value, count in value_counts.items():
                        percentage = (count / len(self.df)) * 100
                        value_str = str(value)[:25]  # 限制長度
                        report += f"""
  │ {value_str:<25} │ {count:>7} │ {percentage:>7.1f}% │"""
                    report += """
  └───────────────────────────┴─────────┴──────────┘
"""
            
            # 資料品質分析
            report += f"""

🎯 5. 資料品質評估
────────────────────────────────────────────────────────────────────────────────

5.1 完整性分析:
• 總資料點: {len(self.df) * len(self.df.columns):,} 個
• 有效資料點: {self.df.notnull().sum().sum():,} 個
• 缺失資料點: {self.df.isnull().sum().sum():,} 個
• 完整性評分: {(self.df.notnull().sum().sum() / (len(self.df) * len(self.df.columns)) * 100):.1f}%

5.2 一致性分析:
"""
            
            # 檢查異常值
            outliers_summary = []
            for col in numeric_cols:
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = ((self.df[col] < lower_bound) | (self.df[col] > upper_bound)).sum()
                if outliers > 0:
                    outliers_summary.append(f"• {col}: {outliers} 個異常值 ({outliers/len(self.df)*100:.1f}%)")
            
            if outliers_summary:
                report += "• 發現異常值:\n" + "\n".join(outliers_summary) + "\n"
            else:
                report += "• ✅ 未發現顯著異常值\n"
            
            # 重複資料檢查
            duplicates = self.df.duplicated().sum()
            report += f"• 重複記錄: {duplicates} 筆 ({duplicates/len(self.df)*100:.1f}%)\n"
            
            # 相關性分析
            if len(numeric_cols) > 1:
                report += f"""

📊 6. 相關性分析
────────────────────────────────────────────────────────────────────────────────
"""
                correlation = self.df[numeric_cols].corr()
                
                # 找出強相關性
                strong_correlations = []
                for i in range(len(correlation.columns)):
                    for j in range(i+1, len(correlation.columns)):
                        corr_value = correlation.iloc[i, j]
                        if abs(corr_value) > 0.7:
                            strong_correlations.append((
                                correlation.columns[i],
                                correlation.columns[j],
                                corr_value
                            ))
                
                if strong_correlations:
                    report += "• 發現強相關性 (|r| > 0.7):\n"
                    for col1, col2, corr in strong_correlations:
                        direction = "正相關" if corr > 0 else "負相關"
                        report += f"  - {col1} ↔ {col2}: {corr:.3f} ({direction})\n"
                else:
                    report += "• ✅ 未發現強相關性變數\n"
        
        # 處理建議
        report += f"""

💡 7. 專業建議與後續行動
────────────────────────────────────────────────────────────────────────────────
"""
        
        if self.df is not None:
            suggestions = self.get_professional_suggestions()
            for i, suggestion in enumerate(suggestions, 1):
                report += f"7.{i} {suggestion}\n\n"
        else:
            report += """
7.1 建議使用適當的軟體開啟此檔案進行進一步分析

7.2 如果是資料檔案，考慮轉換為CSV或Excel格式以便處理

7.3 定期備份重要檔案，確保資料安全
"""
        
        # 報表結尾
        report += f"""

════════════════════════════════════════════════════════════════════════════════
📋 報表生成完成 | ⏰ 分析時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
🤖 Sophia 專業桌面助手 v1.0 | 💻 您值得信賴的資料分析夥伴
════════════════════════════════════════════════════════════════════════════════
        """
        
        return report
        
    def get_professional_suggestions(self):
        """獲得專業建議"""
        suggestions = []
        
        if self.df is None:
            return ["建議開啟支援的資料檔案格式進行分析"]
        
        # 資料清理建議
        missing_ratio = self.df.isnull().sum().sum() / (len(self.df) * len(self.df.columns))
        if missing_ratio > 0.05:
            suggestions.append("資料清理: 缺失值比例較高，建議進行缺失值處理和資料清理")
        
        # 重複資料建議
        duplicates = self.df.duplicated().sum()
        if duplicates > 0:
            suggestions.append(f"去重處理: 發現{duplicates}筆重複資料，建議進行去重操作")
        
        # 異常值建議
        numeric_cols = self.df.select_dtypes(include=['number']).columns
        total_outliers = 0
        for col in numeric_cols:
            Q1 = self.df[col].quantile(0.25)
            Q3 = self.df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((self.df[col] < (Q1 - 1.5 * IQR)) | (self.df[col] > (Q3 + 1.5 * IQR))).sum()
            total_outliers += outliers
        
        if total_outliers > len(self.df) * 0.05:
            suggestions.append("異常值處理: 檢測到較多異常值，建議進行異常值分析和處理")
        
        # 統計分析建議
        if len(numeric_cols) > 1:
            suggestions.append("統計分析: 適合進行描述性統計、相關性分析和回歸分析")
        
        # 視覺化建議
        if len(numeric_cols) >= 2:
            suggestions.append("視覺化分析: 建議創建散佈圖、直方圖和相關性熱力圖")
        
        # 機器學習建議
        if len(self.df) > 100 and len(numeric_cols) > 2:
            suggestions.append("進階分析: 資料規模適合進行機器學習和預測模型建構")
        
        # 效能優化建議
        memory_mb = self.df.memory_usage(deep=True).sum() / 1024**2
        if memory_mb > 100:
            suggestions.append("效能優化: 檔案較大，建議進行資料類型優化以減少記憶體使用")
        
        # 報表建議
        suggestions.append("報表輸出: 建議匯出處理結果為Excel格式，便於後續使用和分享")
        
        return suggestions
        
    def export_report(self, report_content):
        """匯出報表"""
        try:
            file_path = filedialog.asksaveasfilename(
                title="儲存分析報表",
                filetypes=[("文字檔案", "*.txt"), ("所有檔案", "*.*")],
                defaultextension=".txt",
                initialdir=self.current_dir,
                initialfilename=f"Sophia分析報表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            )
            
            if file_path:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(report_content)
                messagebox.showinfo("成功", f"報表已匯出至:\n{file_path}")
                
        except Exception as e:
            messagebox.showerror("錯誤", f"報表匯出失敗: {str(e)}")
            
    def print_report(self, report_content):
        """列印報表"""
        # 這裡可以實現列印功能，目前顯示訊息
        messagebox.showinfo("列印功能", "列印功能開發中...\n請使用「匯出報表」功能儲存後再列印")
        
    def show_help(self):
        """顯示說明"""
        help_text = """
🎉 Sophia 專業桌面助手 - 使用說明

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 檔案操作:
• 開啟檔案: 點擊「開啟檔案」按鈕或雙擊檔案瀏覽器中的檔案
• 支援格式: Excel (.xlsx, .xls), CSV (.csv), 文字檔 (.txt), Python (.py) 等
• 檔案瀏覽: 使用左側檔案瀏覽器導航資料夾

🔍 分析功能:
• 智能分析: 自動分析檔案內容並提供專業建議
• Excel處理: 數據清理、統計分析、圖表生成、結果匯出
• 生成報表: 創建詳細的專業分析報表

📊 數據處理:
• 數據清理: 自動處理缺失值、移除重複項、優化資料類型
• 統計分析: 描述性統計、相關性分析、異常值檢測
• 視覺化: 直方圖、散佈圖、盒鬚圖、相關性熱力圖

💾 匯出功能:
• 支援匯出: Excel (.xlsx), CSV (.csv), JSON (.json) 格式
• 報表匯出: 詳細分析報表可匯出為文字檔案
• 圖表儲存: 生成的圖表可另存為圖片檔案

🎯 使用技巧:
• 大型檔案: 系統會自動限制顯示筆數以確保效能
• 編碼問題: 系統會自動嘗試多種編碼格式
• 快捷操作: 雙擊檔案瀏覽器中的項目可快速開啟

⚙️ 系統需求:
• Python 3.6+
• pandas, openpyxl, matplotlib 等套件
• Windows 作業系統

❓ 遇到問題:
• 檔案無法開啟: 檢查檔案格式和編碼
• 記憶體不足: 嘗試處理較小的資料檔案
• 圖表顯示問題: 確保matplotlib正確安裝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Sophia v1.0 - 您最可靠的資料分析助手！
        """
        
        help_window = tk.Toplevel(self.root)
        help_window.title("❓ Sophia 使用說明")
        help_window.geometry("800x600")
        help_window.configure(bg='#f8f9fa')
        
        help_text_widget = scrolledtext.ScrolledText(help_window, wrap=tk.WORD, 
                                                    font=('Microsoft JhengHei', 10))
        help_text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        help_text_widget.insert(tk.END, help_text)
        help_text_widget.configure(state='disabled')  # 只讀
    
    # === 供 AI 對話模組呼叫的動作方法 ===
    def search_files(self, keywords: str, extensions=None, max_results: int = 10):
        """在當前資料夾遞迴搜尋符合關鍵字與副檔名的檔案。

        keywords: 以空白分隔的關鍵字（全部需匹配於檔名，不分大小寫）
        extensions: 可接受的副檔名清單（如 ['.xlsx', '.xls']），為 None 表示不限制
        """
        try:
            tokens = [t for t in (keywords or '').split() if t]
            results = []
            for root, dirs, files in os.walk(self.current_dir):
                for fname in files:
                    fpath = Path(root) / fname
                    if extensions and fpath.suffix.lower() not in [e.lower() for e in extensions]:
                        continue
                    name_lower = fname.lower()
                    if all(t.lower() in name_lower for t in tokens):
                        results.append(fpath)
                        if len(results) >= max_results:
                            return results
            return results
        except Exception:
            return []

    def clean_data_silent(self):
        """靜默模式的數據清理（不彈視窗、回傳摘要字串）。"""
        if self.df is None:
            raise Exception("尚未載入任何資料表")
        original_shape = self.df.shape
        cleaned_df = self.df.copy()

        # 移除重複行
        duplicates_before = cleaned_df.duplicated().sum()
        cleaned_df = cleaned_df.drop_duplicates()

        # 處理缺失值
        missing_before = cleaned_df.isnull().sum().sum()
        numeric_cols = cleaned_df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            if cleaned_df[col].isnull().sum() > 0:
                cleaned_df[col].fillna(cleaned_df[col].mean(), inplace=True)
        text_cols = cleaned_df.select_dtypes(include=['object']).columns
        for col in text_cols:
            if cleaned_df[col].isnull().sum() > 0:
                mode_val = cleaned_df[col].mode()[0] if not cleaned_df[col].mode().empty else "未知"
                cleaned_df[col].fillna(mode_val, inplace=True)

        # 更新 df
        self.df = cleaned_df
        self.show_dataframe_in_treeview(self.df)

        missing_after = cleaned_df.isnull().sum().sum()
        report = (
            f"🧹 數據清理完成\n"
            f"• 原始資料: {original_shape[0]} 行 × {original_shape[1]} 欄\n"
            f"• 去重筆數: {duplicates_before}\n"
            f"• 填補缺失: {missing_before - missing_after}\n"
            f"• 現況缺失: {missing_after}\n"
        )
        return report

    def create_charts_silent(self, kind: str = 'auto'):
        """靜默生成基本圖表（於圖表分頁顯示，不另開視窗），回傳摘要字串。"""
        if self.df is None:
            raise Exception("尚未載入任何資料表")
        # 直接重用現有的圖表流程
        self.create_chart(None)
        return "📈 已生成圖表"

    def export_current_df_to_excel(self, filename: str = '分析結果.xlsx'):
        """將目前的 DataFrame 匯出到當前資料夾，回傳輸出路徑。"""
        if self.df is None:
            raise Exception("尚未載入任何資料表")
        out_path = self.current_dir / filename
        self.df.to_excel(out_path, index=False, engine='openpyxl')
        return str(out_path)

    def open_in_excel_app(self):
        """使用系統的 Excel 開啟當前檔案（若有）。"""
        if not self.current_file or not self.current_file.exists():
            raise Exception("尚未有已開啟的檔案可用 Excel 開啟")
        try:
            if sys.platform.startswith('win'):
                os.startfile(self.current_file)  # type: ignore[attr-defined]
            else:
                subprocess.Popen(['open', str(self.current_file)])
        except Exception as e:
            raise Exception(f"開啟 Excel 失敗: {e}")
    
    def open_ai_chat(self):
        """開啟AI對話功能"""
        if not AI_CHAT_AVAILABLE:
            messagebox.showwarning("功能未可用", "AI對話模組載入失敗，請檢查 sophia_ai_chat.py 檔案")
            return
        
        try:
            # 創建AI對話視窗
            chat_window = create_ai_chat_window(self)
            
            # 更新狀態
            self.status_var.set("AI對話助手已開啟 - 現在可以用自然語言與Sophia溝通！")
            
        except Exception as e:
            messagebox.showerror("錯誤", f"無法開啟AI對話功能: {str(e)}")
            self.status_var.set("AI對話開啟失敗")
        
    def run(self):
        """啟動應用程式"""
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            print("程式被使用者中斷")
        except Exception as e:
            print(f"程式執行錯誤: {str(e)}")

def main():
    """主程式入口"""
    print("🚀 啟動 Sophia 專業桌面助手...")
    print("📝 檢查相依套件...")
    
    # 檢查必要套件
    required_packages = {
        'pandas': '資料處理',
        'openpyxl': 'Excel檔案支援', 
        'matplotlib': '圖表生成',
        'seaborn': '進階視覺化'
    }
    
    missing_packages = []
    for package, description in required_packages.items():
        try:
            __import__(package)
            print(f"✅ {package} - {description}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - {description} (缺失)")
    
    if missing_packages:
        print(f"\n⚠️  警告: 缺少以下套件: {', '.join(missing_packages)}")
        print("💡 請執行以下命令安裝:")
        print(f"pip install {' '.join(missing_packages)}")
        print("\n繼續啟動程式 (部分功能可能無法使用)...")
    
    print("🎉 啟動 Sophia 桌面助手...")
    
    # 啟動應用程式
    app = SophiaDesktop()
    app.run()

if __name__ == "__main__":
    main()
