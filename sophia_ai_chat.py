#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sophia AI 對話模組
真正能理解複雜需求並進行智能對話的助手
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import json
import os
import pandas as pd
import numpy as np
from datetime import datetime
import subprocess
import re
from pathlib import Path

class SophiaAIChat:
    def __init__(self, parent_app=None):
        self.parent_app = parent_app
        self.conversation_history = []
        self.current_context = {}
        self.working_files = {}
        self.user_preferences = self.load_user_preferences()
        
        # AI 知識庫
        self.knowledge_base = {
            'excel_operations': {
                '數據清理': ['去重', '填充缺失值', '格式標準化', '異常值處理'],
                '統計分析': ['描述統計', '相關分析', '回歸分析', '時間序列'],
                '圖表製作': ['折線圖', '柱狀圖', '散佈圖', '箱形圖', '熱力圖'],
                '數據透視': ['分組統計', '交叉表', '數據透視表'],
                '公式計算': ['求和', '平均', '最值', '條件計算', '查找引用']
            },
            'file_operations': {
                '檔案處理': ['開啟', '儲存', '轉換格式', '批次處理'],
                '資料夾管理': ['組織結構', '批次重命名', '檔案分類'],
                '搜尋功能': ['內容搜尋', '檔名搜尋', '條件篩選']
            },
            'data_analysis': {
                '報表生成': ['摘要報表', '詳細分析', '視覺化報表'],
                '趨勢分析': ['時間趨勢', '季節性分析', '預測模型'],
                '比較分析': ['期間對比', '部門對比', '指標對比']
            }
        }
        
    def load_user_preferences(self):
        """載入用戶偏好設定"""
        pref_file = 'sophia_preferences.json'
        try:
            if os.path.exists(pref_file):
                with open(pref_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        
        # 預設偏好
        return {
            'language': 'zh-TW',
            'detail_level': 'medium',
            'chart_style': 'professional',
            'output_format': 'excel',
            'working_directory': str(Path.home())
        }
    
    def save_user_preferences(self):
        """儲存用戶偏好設定"""
        try:
            with open('sophia_preferences.json', 'w', encoding='utf-8') as f:
                json.dump(self.user_preferences, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    def understand_intent(self, user_input):
        """理解用戶意圖"""
        user_input = user_input.lower().strip()
        
        # 意圖分類
        intents = {
            'greeting': ['你好', '嗨', 'hello', '早安', '午安', '晚安'],
            'file_open': ['開啟', '打開', '載入', '讀取', '開檔案'],
            'data_analysis': ['分析', '統計', '計算', '數據', '資料'],
            'excel_work': ['excel', '試算表', '表格', '工作表', 'xlsx', 'xls'],
            'chart_create': ['圖表', '圖形', '視覺化', '繪圖', 'chart'],
            'report_generate': ['報表', '報告', '總結', '摘要', 'report'],
            'help_request': ['幫忙', '協助', '教學', '怎麼', '如何', 'help'],
            'file_save': ['儲存', '存檔', '匯出', '輸出', 'save', 'export'],
            'data_clean': ['清理', '整理', '去重', '填充', '標準化'],
            'search_file': ['找', '搜尋', '尋找', '查找', 'find', 'search'],
            'compare_data': ['比較', '對比', '比對', 'compare'],
            'trend_analysis': ['趨勢', '變化', '預測', 'trend', '預估'],
            'problem_solve': ['問題', '錯誤', '故障', '不會', '不懂', 'problem']
        }
        
        # 實體識別
        entities = {
            'file_types': ['excel', 'csv', 'txt', 'pdf', 'docx', 'xlsx', 'xls'],
            'time_periods': ['今天', '昨天', '本週', '上週', '本月', '上月', '今年', '去年'],
            'operations': ['求和', '平均', '最大', '最小', '計數', '百分比'],
            'chart_types': ['折線圖', '柱狀圖', '圓餅圖', '散佈圖', '盒鬚圖'],
            'departments': ['業務', '技術', '行政', '財務', '人資', '客服'],
            'data_fields': ['薪資', '業績', '銷售', '成本', '利潤', '數量']
        }
        
        # 識別主要意圖
        main_intent = 'unknown'
        intent_confidence = 0
        
        for intent, keywords in intents.items():
            matches = sum(1 for keyword in keywords if keyword in user_input)
            confidence = matches / len(keywords)
            if confidence > intent_confidence:
                intent_confidence = confidence
                main_intent = intent
        
        # 識別實體
        found_entities = {}
        for entity_type, entity_list in entities.items():
            found = [entity for entity in entity_list if entity in user_input]
            if found:
                found_entities[entity_type] = found
        
        return {
            'intent': main_intent,
            'confidence': intent_confidence,
            'entities': found_entities,
            'original_text': user_input
        }
    
    def generate_response(self, user_input):
        """生成智能回應"""
        # 理解用戶意圖
        understanding = self.understand_intent(user_input)
        intent = understanding['intent']
        entities = understanding['entities']
        
        # 更新對話歷史
        self.conversation_history.append({
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'understanding': understanding
        })
        
        # 根據意圖生成回應
        if intent == 'greeting':
            return self.handle_greeting()
        elif intent == 'file_open':
            return self.handle_file_open(entities)
        elif intent == 'data_analysis':
            return self.handle_data_analysis(entities, user_input)
        elif intent == 'excel_work':
            return self.handle_excel_work(entities, user_input)
        elif intent == 'chart_create':
            return self.handle_chart_create(entities)
        elif intent == 'report_generate':
            return self.handle_report_generate(entities)
        elif intent == 'help_request':
            return self.handle_help_request(user_input)
        elif intent == 'file_save':
            return self.handle_file_save(entities)
        elif intent == 'data_clean':
            return self.handle_data_clean(entities)
        elif intent == 'search_file':
            return self.handle_search_file(entities, user_input)
        elif intent == 'compare_data':
            return self.handle_compare_data(entities, user_input)
        elif intent == 'trend_analysis':
            return self.handle_trend_analysis(entities, user_input)
        elif intent == 'problem_solve':
            return self.handle_problem_solve(user_input)
        else:
            return self.handle_unknown_intent(user_input)
    
    def handle_greeting(self):
        """處理問候"""
        greetings = [
            "您好！我是 Sophia，您的專業數據分析助手。今天我可以幫您處理什麼工作呢？",
            "嗨！很高興為您服務。我可以協助您分析數據、處理Excel檔案、生成報表等工作。",
            "您好！我是 Sophia。無論是數據分析、檔案處理，還是複雜的業務問題，我都能幫您解決。"
        ]
        
        import random
        return random.choice(greetings)
    
    def handle_file_open(self, entities):
        """處理開啟檔案請求"""
        file_types = entities.get('file_types', [])
        
        response = "我來幫您開啟檔案。"
        
        if 'excel' in file_types or 'xlsx' in file_types:
            response += "\n\n📊 Excel檔案處理：\n"
            response += "• 我可以讀取工作表內容\n"
            response += "• 進行數據清理和分析\n"
            response += "• 生成統計報表和圖表\n"
            response += "• 處理公式計算\n\n"
            response += "請告訴我您想要進行什麼具體操作？"
        elif 'csv' in file_types:
            response += "\n\n📄 CSV檔案處理：\n"
            response += "• 自動檢測編碼格式\n"
            response += "• 數據結構分析\n"
            response += "• 轉換為Excel格式\n\n"
        else:
            response += "\n\n請問您要開啟什麼類型的檔案？我支援：\n"
            response += "• Excel檔案 (.xlsx, .xls)\n"
            response += "• CSV檔案 (.csv)\n"
            response += "• 文字檔案 (.txt)\n"
        
        # 執行實際開啟操作
        if self.parent_app:
            response += "\n\n[正在開啟檔案選擇器...]"
            try:
                self.parent_app.open_file()
            except:
                pass
        
        return response
    
    def handle_data_analysis(self, entities, user_input):
        """處理數據分析請求"""
        data_fields = entities.get('data_fields', [])
        operations = entities.get('operations', [])
        
        response = "🔍 我來協助您進行數據分析。\n\n"
        
        # 檢查是否有載入的數據
        if hasattr(self.parent_app, 'df') and self.parent_app.df is not None:
            df = self.parent_app.df
            response += f"📊 目前載入的數據：{len(df)} 行 × {len(df.columns)} 欄\n\n"
            
            # 根據用戶需求提供分析
            if '薪資' in data_fields or '薪資' in user_input:
                response += self.analyze_salary_data(df)
            elif '業績' in data_fields or '銷售' in data_fields:
                response += self.analyze_sales_data(df)
            elif operations:
                response += self.perform_operations(df, operations)
            else:
                response += "我可以為您進行以下分析：\n"
                response += "• 📈 描述性統計：平均值、中位數、標準差\n"
                response += "• 📊 相關性分析：變數間的關聯程度\n"
                response += "• 🔍 異常值檢測：識別數據中的異常點\n"
                response += "• 📋 分組統計：按類別進行統計分析\n\n"
                response += "請告訴我您想要哪種分析？"
        else:
            response += "請先載入數據檔案，然後我就能為您進行各種分析。\n\n"
            response += "💡 建議步驟：\n"
            response += "1. 開啟Excel或CSV檔案\n"
            response += "2. 告訴我您想分析什麼\n"
            response += "3. 我會提供詳細的分析結果"
        
        return response
    
    def analyze_salary_data(self, df):
        """分析薪資數據"""
        response = "💰 薪資數據分析結果：\n\n"
        
        # 找出薪資相關欄位
        salary_cols = [col for col in df.columns if any(keyword in col.lower() 
                      for keyword in ['薪資', '薪水', '工資', 'salary', '總薪資', '基本薪資'])]
        
        if salary_cols:
            for col in salary_cols:
                if pd.api.types.is_numeric_dtype(df[col]):
                    stats = df[col].describe()
                    response += f"📊 {col}統計：\n"
                    response += f"• 平均薪資：{stats['mean']:,.0f} 元\n"
                    response += f"• 中位數：{stats['50%']:,.0f} 元\n"
                    response += f"• 最低薪資：{stats['min']:,.0f} 元\n"
                    response += f"• 最高薪資：{stats['max']:,.0f} 元\n"
                    response += f"• 標準差：{stats['std']:,.0f} 元\n\n"
        
        # 部門分析
        dept_cols = [col for col in df.columns if any(keyword in col.lower() 
                    for keyword in ['部門', 'dept', 'department', '單位'])]
        
        if dept_cols and salary_cols:
            dept_col = dept_cols[0]
            salary_col = salary_cols[0]
            dept_stats = df.groupby(dept_col)[salary_col].agg(['mean', 'count']).round(0)
            
            response += "🏢 部門薪資分析：\n"
            for dept, stats in dept_stats.iterrows():
                response += f"• {dept}：平均 {stats['mean']:,.0f} 元 ({stats['count']} 人)\n"
            response += "\n"
        
        response += "💡 建議進一步分析：\n"
        response += "• 薪資分布圖表\n"
        response += "• 部門間薪資比較\n"
        response += "• 薪資成長趨勢分析"
        
        return response
    
    def analyze_sales_data(self, df):
        """分析銷售數據"""
        response = "📊 銷售數據分析結果：\n\n"
        
        # 找出銷售相關欄位
        sales_cols = [col for col in df.columns if any(keyword in col.lower() 
                     for keyword in ['銷售', '業績', 'sales', '營收', '收入'])]
        
        if sales_cols:
            for col in sales_cols:
                if pd.api.types.is_numeric_dtype(df[col]):
                    total_sales = df[col].sum()
                    avg_sales = df[col].mean()
                    response += f"💼 {col}統計：\n"
                    response += f"• 總銷售額：{total_sales:,.0f}\n"
                    response += f"• 平均銷售額：{avg_sales:,.0f}\n"
                    response += f"• 銷售筆數：{len(df)} 筆\n\n"
        
        response += "📈 可進行的進階分析：\n"
        response += "• 銷售趨勢分析\n"
        response += "• 產品/客戶排行榜\n"
        response += "• 季節性分析\n"
        response += "• 目標達成率分析"
        
        return response
    
    def perform_operations(self, df, operations):
        """執行指定的運算操作"""
        response = "🧮 計算結果：\n\n"
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for operation in operations:
            if operation == '求和' and len(numeric_cols) > 0:
                for col in numeric_cols[:3]:  # 限制顯示前3個欄位
                    total = df[col].sum()
                    response += f"• {col} 總和：{total:,.2f}\n"
            elif operation == '平均' and len(numeric_cols) > 0:
                for col in numeric_cols[:3]:
                    avg = df[col].mean()
                    response += f"• {col} 平均：{avg:,.2f}\n"
            elif operation == '最大' and len(numeric_cols) > 0:
                for col in numeric_cols[:3]:
                    max_val = df[col].max()
                    response += f"• {col} 最大值：{max_val:,.2f}\n"
            elif operation == '最小' and len(numeric_cols) > 0:
                for col in numeric_cols[:3]:
                    min_val = df[col].min()
                    response += f"• {col} 最小值：{min_val:,.2f}\n"
            elif operation == '計數':
                response += f"• 總記錄數：{len(df)} 筆\n"
        
        response += f"\n✅ 計算完成！"
        return response
    
    def handle_excel_work(self, entities, user_input):
        """處理Excel工作請求"""
        response = "📊 Excel專業處理服務\n\n"
        
        # 分析用戶的具體需求
        if '清理' in user_input:
            response += "🧹 數據清理服務：\n"
            response += "• 移除重複項\n• 填充缺失值\n• 格式標準化\n• 異常值處理\n\n"
        elif '分析' in user_input:
            response += "📈 數據分析服務：\n"
            response += "• 描述性統計\n• 相關性分析\n• 趨勢分析\n• 異常檢測\n\n"
        elif '圖表' in user_input:
            response += "📊 圖表製作服務：\n"
            response += "• 折線圖、柱狀圖\n• 散佈圖、盒鬚圖\n• 相關性熱力圖\n• 專業報表圖表\n\n"
        else:
            response += "我可以提供以下Excel服務：\n"
            response += "• 🧹 數據清理與整理\n"
            response += "• 📈 統計分析與計算\n"
            response += "• 📊 圖表製作與視覺化\n"
            response += "• 📋 專業報表生成\n"
            response += "• 💾 格式轉換與匯出\n\n"
        
        response += "請告訴我您具體想要做什麼？我會提供專業的處理方案。"
        
        return response
    
    def handle_help_request(self, user_input):
        """處理求助請求"""
        if '怎麼' in user_input or '如何' in user_input:
            if 'excel' in user_input.lower():
                return self.provide_excel_tutorial()
            elif '分析' in user_input:
                return self.provide_analysis_tutorial()
            elif '圖表' in user_input:
                return self.provide_chart_tutorial()
        
        response = "💡 Sophia 使用指南\n\n"
        response += "我能協助您處理各種數據工作：\n\n"
        response += "🗣️ 對話方式：\n"
        response += "• 直接說出您的需求，例如：\n"
        response += "  - \"幫我分析這個薪資表\"\n"
        response += "  - \"製作銷售業績圖表\"\n"
        response += "  - \"清理這份數據的重複項\"\n\n"
        response += "📊 專業服務：\n"
        response += "• Excel檔案處理與分析\n"
        response += "• 數據清理與統計分析\n"
        response += "• 圖表製作與報表生成\n"
        response += "• 複雜業務問題解決\n\n"
        response += "💬 互動技巧：\n"
        response += "• 描述具體需求而非籠統要求\n"
        response += "• 提供背景資訊幫助我理解\n"
        response += "• 隨時詢問不懂的地方\n\n"
        response += "有什麼具體問題想問我嗎？"
        
        return response
    
    def provide_excel_tutorial(self):
        """提供Excel教學"""
        response = "📚 Excel處理教學\n\n"
        response += "🎯 基本步驟：\n"
        response += "1. 📂 開啟檔案：\"幫我開啟Excel檔案\"\n"
        response += "2. 🔍 檢視數據：我會自動分析檔案結構\n"
        response += "3. 🧹 清理數據：\"清理重複項和缺失值\"\n"
        response += "4. 📊 分析數據：\"分析薪資統計\" 或 \"計算平均值\"\n"
        response += "5. 📈 製作圖表：\"製作薪資分布圖\"\n"
        response += "6. 📋 生成報表：\"生成詳細分析報表\"\n"
        response += "7. 💾 儲存結果：\"匯出處理結果\"\n\n"
        response += "💡 實用範例：\n"
        response += "• \"分析各部門平均薪資\"\n"
        response += "• \"找出薪資異常值\"\n"
        response += "• \"製作薪資成長趨勢圖\"\n"
        response += "• \"比較去年同期業績\"\n\n"
        response += "🔧 進階功能：\n"
        response += "• 數據透視表分析\n"
        response += "• 條件格式化\n"
        response += "• 複雜公式計算\n"
        response += "• 多工作表處理"
        
        return response
    
    def handle_unknown_intent(self, user_input):
        """處理未知意圖"""
        response = "🤔 我正在學習理解您的需求...\n\n"
        response += "為了更好地協助您，請告訴我：\n\n"
        response += "💼 您遇到的工作問題：\n"
        response += "• 需要處理什麼類型的檔案？\n"
        response += "• 想要進行什麼操作？\n"
        response += "• 期望得到什麼結果？\n\n"
        response += "🎯 您可以這樣說：\n"
        response += "• \"我有一份員工薪資表，想分析各部門薪資水準\"\n"
        response += "• \"需要清理這個CSV檔案的重複資料\"\n"
        response += "• \"幫我製作銷售業績的趨勢圖表\"\n\n"
        response += "💬 或者直接問我：\n"
        response += "• \"你能幫我做什麼？\"\n"
        response += "• \"如何分析數據？\"\n"
        response += "• \"怎麼製作圖表？\""
        
        return response
    
    def handle_chart_create(self, entities):
        """處理圖表創建請求"""
        chart_types = entities.get('chart_types', [])
        
        response = "📊 圖表製作服務\n\n"
        
        if chart_types:
            response += f"正在為您準備 {', '.join(chart_types)} ...\n\n"
        
        response += "我可以製作以下類型的圖表：\n"
        response += "• 📈 折線圖：適合顯示趨勢變化\n"
        response += "• 📊 柱狀圖：適合比較不同類別\n"
        response += "• 🥧 圓餅圖：適合顯示比例關係\n"
        response += "• 📉 散佈圖：適合分析相關性\n"
        response += "• 📋 盒鬚圖：適合顯示數據分布\n"
        response += "• 🔥 熱力圖：適合顯示相關矩陣\n\n"
        
        # 執行圖表創建
        if self.parent_app and hasattr(self.parent_app, 'create_chart'):
            response += "✨ 正在為您創建圖表..."
            try:
                self.parent_app.create_chart(None)
            except:
                pass
        
        return response
    
    def handle_report_generate(self, entities):
        """處理報表生成請求"""
        response = "📋 專業報表生成服務\n\n"
        
        response += "我會為您創建包含以下內容的專業報表：\n\n"
        response += "📊 數據概況：\n"
        response += "• 基本統計資訊\n"
        response += "• 資料完整性評估\n"
        response += "• 數據品質分析\n\n"
        response += "📈 深度分析：\n"
        response += "• 描述性統計\n"
        response += "• 相關性分析\n"
        response += "• 異常值檢測\n"
        response += "• 趨勢分析\n\n"
        response += "💡 專業建議：\n"
        response += "• 數據處理建議\n"
        response += "• 後續分析方向\n"
        response += "• 改善措施建議\n\n"
        
        # 執行報表生成
        if self.parent_app and hasattr(self.parent_app, 'generate_report'):
            response += "📝 正在生成專業報表..."
            try:
                self.parent_app.generate_report()
            except:
                pass
        
        return response
    
    def handle_compare_data(self, entities, user_input):
        """處理數據比較請求"""
        time_periods = entities.get('time_periods', [])
        departments = entities.get('departments', [])
        
        response = "📊 數據比較分析\n\n"
        
        if time_periods:
            response += f"⏰ 時間比較分析：\n"
            response += f"正在準備 {', '.join(time_periods)} 的比較分析...\n\n"
            
        if departments:
            response += f"🏢 部門比較分析：\n"
            response += f"正在比較 {', '.join(departments)} 部門的數據...\n\n"
        
        response += "我可以進行以下比較分析：\n"
        response += "• 📅 期間對比：本月vs上月、今年vs去年\n"
        response += "• 🏢 部門對比：各部門指標比較\n"
        response += "• 📊 指標對比：多個KPI的綜合比較\n"
        response += "• 📈 趨勢對比：不同期間的變化趨勢\n\n"
        
        response += "💡 比較分析將包含：\n"
        response += "• 絕對數值比較\n"
        response += "• 成長率計算\n"
        response += "• 差異分析\n"
        response += "• 視覺化圖表"
        
        return response
    
    def handle_trend_analysis(self, entities, user_input):
        """處理趨勢分析請求"""
        response = "📈 趨勢分析服務\n\n"
        
        response += "我將為您進行深度趨勢分析：\n\n"
        response += "📊 趨勢識別：\n"
        response += "• 上升/下降趋势\n"
        response += "• 季節性模式\n"
        response += "• 週期性變化\n"
        response += "• 異常波動點\n\n"
        response += "🔮 預測模型：\n"
        response += "• 短期趨勢預測\n"
        response += "• 中期發展預估\n"
        response += "• 信心區間計算\n\n"
        response += "📋 分析報告：\n"
        response += "• 趨勢總結\n"
        response += "• 關鍵轉折點\n"
        response += "• 業務影響評估\n"
        response += "• 行動建議\n\n"
        
        response += "請提供您的時間序列數據，我將進行專業的趨勢分析。"
        
        return response
    
    def handle_problem_solve(self, user_input):
        """處理問題解決請求"""
        response = "🔧 問題診斷與解決\n\n"
        
        response += "讓我幫您診斷和解決問題：\n\n"
        response += "🔍 常見問題診斷：\n"
        response += "• 檔案無法開啟\n"
        response += "• 數據格式錯誤\n"
        response += "• 計算結果異常\n"
        response += "• 圖表顯示問題\n\n"
        response += "💡 解決方案：\n"
        response += "• 逐步問題分析\n"
        response += "• 多種解決方案\n"
        response += "• 預防措施建議\n\n"
        
        response += "請詳細描述您遇到的問題：\n"
        response += "• 在什麼情況下發生？\n"
        response += "• 具體的錯誤訊息？\n"
        response += "• 期望的結果是什麼？\n\n"
        
        response += "我會根據問題提供最適合的解決方案。"
        
        return response
    
    def get_conversation_summary(self):
        """獲取對話摘要"""
        if not self.conversation_history:
            return "尚未開始對話"
        
        summary = f"對話記錄 ({len(self.conversation_history)} 次互動)\n"
        summary += "=" * 40 + "\n"
        
        for i, conv in enumerate(self.conversation_history[-5:], 1):  # 最近5次對話
            timestamp = datetime.fromisoformat(conv['timestamp']).strftime('%H:%M:%S')
            summary += f"{i}. [{timestamp}] {conv['user_input'][:50]}...\n"
            summary += f"   意圖: {conv['understanding']['intent']}\n"
        
        return summary

def create_ai_chat_window(parent_app):
    """創建AI對話視窗"""
    chat_window = tk.Toplevel(parent_app.root)
    chat_window.title("💬 Sophia AI 智能對話")
    chat_window.geometry("800x700")
    chat_window.configure(bg='#f8f9fa')
    
    # 創建AI助手
    ai_chat = SophiaAIChat(parent_app)
    
    # 對話歷史區域
    history_frame = ttk.LabelFrame(chat_window, text="🗣️ 對話記錄", padding=10)
    history_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
    
    chat_history = scrolledtext.ScrolledText(history_frame, wrap=tk.WORD, height=20)
    chat_history.pack(fill=tk.BOTH, expand=True)
    
    # 輸入區域
    input_frame = ttk.Frame(chat_window)
    input_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
    
    # 輸入框
    ttk.Label(input_frame, text="💬 請輸入您的需求：").pack(anchor=tk.W, pady=(0, 5))
    
    input_var = tk.StringVar()
    input_entry = ttk.Entry(input_frame, textvariable=input_var, font=('Microsoft JhengHei', 11))
    input_entry.pack(fill=tk.X, side=tk.LEFT, expand=True, padx=(0, 5))
    
    def send_message():
        user_input = input_var.get().strip()
        if not user_input:
            return
        
        # 顯示用戶輸入
        timestamp = datetime.now().strftime('%H:%M:%S')
        chat_history.insert(tk.END, f"[{timestamp}] 👤 您：{user_input}\n\n")
        
        # 獲取AI回應
        ai_response = ai_chat.generate_response(user_input)
        
        # 顯示AI回應
        chat_history.insert(tk.END, f"[{timestamp}] 🤖 Sophia：\n{ai_response}\n\n")
        chat_history.insert(tk.END, "=" * 60 + "\n\n")
        
        # 自動滾動到底部
        chat_history.see(tk.END)
        
        # 清空輸入框
        input_var.set("")
    
    def on_enter(event):
        send_message()
    
    input_entry.bind('<Return>', on_enter)
    
    # 發送按鈕
    send_button = ttk.Button(input_frame, text="💬 發送", command=send_message)
    send_button.pack(side=tk.RIGHT)
    
    # 快速操作按鈕
    quick_frame = ttk.LabelFrame(chat_window, text="🚀 快速操作", padding=5)
    quick_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
    
    quick_commands = [
        ("📂 開啟檔案", "幫我開啟檔案"),
        ("📊 分析數據", "分析載入的數據"),
        ("📈 製作圖表", "製作數據圖表"),
        ("📋 生成報表", "生成分析報表"),
        ("❓ 使用說明", "如何使用這個系統")
    ]
    
    for i, (text, command) in enumerate(quick_commands):
        btn = ttk.Button(quick_frame, text=text, 
                        command=lambda cmd=command: input_var.set(cmd))
        btn.pack(side=tk.LEFT, padx=2, pady=2)
    
    # 歡迎訊息
    welcome_msg = """🎉 歡迎使用 Sophia AI 智能對話功能！

我是您的專業數據分析助手，可以：
• 🗣️ 理解您的自然語言需求
• 🧠 智能分析複雜工作任務  
• 💼 提供專業的解決方案
• 🔄 進行持續的對話互動

💬 試試這樣與我對話：
• "幫我分析這個薪資表，我想了解各部門的薪資水準"
• "製作一個銷售趨勢圖，並分析未來走勢"
• "清理這份數據的重複項，然後生成統計報表"

現在，告訴我您需要什麼幫助吧！😊

"""
    
    chat_history.insert(tk.END, welcome_msg)
    chat_history.insert(tk.END, "=" * 60 + "\n\n")
    
    # 聚焦到輸入框
    input_entry.focus()
    
    return chat_window

# 測試功能
if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()  # 隱藏主視窗
    
    # 創建模擬的父應用
    class MockApp:
        def __init__(self):
            self.root = root
            self.df = None
    
    app = MockApp()
    chat_window = create_ai_chat_window(app)
    
    root.mainloop()
