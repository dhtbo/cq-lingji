@echo off
chcp 65001 >nul
title 几何工坊 (CadQuery Blockly Studio) 一键启动
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
if %ERRORLEVEL% neq 0 (
    echo.
    echo [错误] 启动过程中发生异常，请检查上方输出信息。
    pause
)
