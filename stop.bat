@echo off
chcp 65001 >nul
title 几何工坊 (CadQuery Blockly Studio) 一键停止
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
timeout /t 2 >nul
