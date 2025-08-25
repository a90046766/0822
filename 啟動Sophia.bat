@echo off
chcp 65001 >nul
title Sophia 專業桌面助手

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                        🤖 Sophia 專業桌面助手                                ║
echo ║                      真正能開檔案的實用工具！                                ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

echo 📋 正在檢查Python環境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤：找不到Python，請先安裝Python 3.6或更高版本
    echo.
    echo 💡 下載Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python環境正常
echo.

echo 📦 正在檢查相依套件...
python -c "import pandas, openpyxl, matplotlib, seaborn, tkinter" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  發現缺少套件，正在自動安裝...
    echo.
    python install_requirements.py
    if errorlevel 1 (
        echo ❌ 套件安裝失敗，請手動執行：python install_requirements.py
        pause
        exit /b 1
    )
) else (
    echo ✅ 所有套件都已就緒
)

echo.
echo 🚀 正在啟動 Sophia 專業桌面助手...
echo.

python sophia_desktop.py
if errorlevel 1 (
    echo.
    echo ❌ 程式啟動失敗
    echo 💡 請檢查錯誤訊息或執行：python sophia_desktop.py
    echo.
    pause
)

echo.
echo 👋 感謝使用 Sophia 專業桌面助手！
pause

