#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sophia 桌面助手 - 自動安裝相依套件
自動檢測並安裝所需的Python套件
"""

import subprocess
import sys
import importlib
from pathlib import Path

def check_python_version():
    """檢查Python版本"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 6):
        print("❌ 錯誤: 需要 Python 3.6 或更高版本")
        print(f"   當前版本: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python版本: {version.major}.{version.minor}.{version.micro}")
    return True

def install_package(package_name):
    """安裝Python套件"""
    try:
        print(f"📦 正在安裝 {package_name}...")
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', package_name], 
                              capture_output=True, text=True, check=True)
        print(f"✅ {package_name} 安裝成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {package_name} 安裝失敗: {e.stderr}")
        return False

def check_package(package_name, pip_name=None):
    """檢查套件是否已安裝"""
    try:
        importlib.import_module(package_name)
        print(f"✅ {package_name} 已安裝")
        return True
    except ImportError:
        print(f"❌ {package_name} 未安裝")
        return False

def main():
    """主要安裝程序"""
    print("=" * 60)
    print("🚀 Sophia 桌面助手 - 相依套件安裝程式")
    print("=" * 60)
    
    # 檢查Python版本
    if not check_python_version():
        input("按 Enter 鍵退出...")
        return
    
    # 定義必要套件
    required_packages = {
        'tkinter': None,  # 內建套件，通常不需要安裝
        'pandas': 'pandas',
        'openpyxl': 'openpyxl',
        'matplotlib': 'matplotlib',
        'seaborn': 'seaborn',
        'pathlib': None,  # 內建套件
    }
    
    print(f"\n📋 檢查相依套件:")
    print("-" * 40)
    
    missing_packages = []
    
    for package, pip_name in required_packages.items():
        if not check_package(package):
            if pip_name:
                missing_packages.append(pip_name)
    
    if not missing_packages:
        print(f"\n🎉 所有套件都已安裝！")
        print(f"💡 現在可以執行: python sophia_desktop.py")
        input("按 Enter 鍵退出...")
        return
    
    print(f"\n📦 需要安裝的套件: {', '.join(missing_packages)}")
    
    # 詢問是否安裝
    while True:
        choice = input(f"\n❓ 是否要自動安裝這些套件？ (y/n): ").lower().strip()
        if choice in ['y', 'yes', 'Y', '是']:
            break
        elif choice in ['n', 'no', 'N', '否']:
            print("🔧 手動安裝指令:")
            print(f"pip install {' '.join(missing_packages)}")
            input("按 Enter 鍵退出...")
            return
        else:
            print("請輸入 y 或 n")
    
    # 升級pip
    print(f"\n🔧 正在升級 pip...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                      capture_output=True, text=True, check=True)
        print("✅ pip 升級完成")
    except:
        print("⚠️ pip 升級失敗，繼續安裝套件...")
    
    # 安裝套件
    print(f"\n📦 開始安裝套件:")
    print("-" * 40)
    
    successful_installs = 0
    failed_installs = []
    
    for package in missing_packages:
        if install_package(package):
            successful_installs += 1
        else:
            failed_installs.append(package)
    
    # 安裝結果
    print(f"\n📊 安裝結果:")
    print("-" * 40)
    print(f"✅ 成功安裝: {successful_installs} 個套件")
    
    if failed_installs:
        print(f"❌ 安裝失敗: {len(failed_installs)} 個套件")
        print(f"   失敗套件: {', '.join(failed_installs)}")
        print(f"\n🔧 請手動安裝失敗的套件:")
        for package in failed_installs:
            print(f"   pip install {package}")
    else:
        print("🎉 所有套件安裝成功！")
    
    # 最終檢查
    print(f"\n🔍 最終檢查:")
    print("-" * 40)
    
    all_installed = True
    for package in required_packages.keys():
        if package in ['tkinter', 'pathlib']:  # 跳過內建套件
            continue
        if not check_package(package):
            all_installed = False
    
    if all_installed:
        print(f"\n🎉 恭喜！所有套件都已準備就緒！")
        print(f"🚀 現在可以執行 Sophia 桌面助手:")
        print(f"   python sophia_desktop.py")
        
        # 詢問是否立即啟動
        while True:
            choice = input(f"\n❓ 是否要立即啟動 Sophia 桌面助手？ (y/n): ").lower().strip()
            if choice in ['y', 'yes', 'Y', '是']:
                print("🚀 正在啟動 Sophia...")
                try:
                    subprocess.Popen([sys.executable, 'sophia_desktop.py'])
                    print("✅ Sophia 桌面助手已啟動！")
                except Exception as e:
                    print(f"❌ 啟動失敗: {e}")
                    print("請手動執行: python sophia_desktop.py")
                break
            elif choice in ['n', 'no', 'N', '否']:
                break
            else:
                print("請輸入 y 或 n")
    else:
        print(f"\n⚠️ 部分套件安裝不完整")
        print("請檢查上述錯誤訊息並手動安裝")
    
    input("\n按 Enter 鍵退出...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ 安裝程序被使用者中斷")
    except Exception as e:
        print(f"\n\n❌ 安裝程序錯誤: {e}")
        input("按 Enter 鍵退出...")
