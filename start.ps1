<#
.SYNOPSIS
    几何工坊 (CadQuery / build123d Blockly Studio) 一键启动脚本
.DESCRIPTION
    自动完成环境检查、端口冲突清理、后端 FastAPI 服务启动、前端 Next.js 服务启动，
    并在服务就绪后自动打开默认浏览器访问工作台。
#>

param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 3000,
    [switch]$NoBrowser,
    [switch]$Prod
)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🚀 几何工坊 (CadQuery Blockly Studio) 一键启动程序" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

<#
.DESCRIPTION
    清理占用指定端口的残留进程，避免重启时因端口已被占用导致启动失败
#>
function Clear-PortProcess {
    param([int]$Port, [string]$ServiceName)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                try {
                    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                    Write-Host "[清理] 发现端口 $Port ($ServiceName) 被进程 $($proc.ProcessName) (PID: $procId) 占用，正在终止..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                } catch {
                    Write-Host "[警告] 无法终止 PID $procId : $_" -ForegroundColor DarkYellow
                }
            }
        }
        Start-Sleep -Seconds 1
    }
}

# 1. 基础环境校验
Write-Host "`n[1/5] 正在检查运行环境..." -ForegroundColor Green
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未检测到 Python，请确保 Python (>= 3.10) 已添加到系统 PATH 环境变量！" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未检测到 npm / Node.js，请确保 Node.js 已安装并添加到系统 PATH！" -ForegroundColor Red
    exit 1
}

$pyVersion = & python --version 2>&1
$nodeVersion = & node --version 2>&1
Write-Host "  - Python 环境: $pyVersion" -ForegroundColor Gray
Write-Host "  - Node.js 环境: $nodeVersion" -ForegroundColor Gray

# 2. 检查并清理端口冲突
Write-Host "`n[2/5] 正在检查端口状态 ($BackendPort, $FrontendPort)..." -ForegroundColor Green
Clear-PortProcess -Port $BackendPort -ServiceName "FastAPI 后端"
Clear-PortProcess -Port $FrontendPort -ServiceName "Next.js 前端"

# 3. 检查前端依赖是否已安装
$FrontendDir = Join-Path $ProjectRoot "frontend"
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $NodeModulesDir)) {
    Write-Host "`n[依赖] 首次运行未检测到 frontend/node_modules，正在安装前端依赖..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & npm install
    Pop-Location
}

# 4. 启动 FastAPI 后端服务（使用 EncodedCommand 避免命令行参数与引号转义问题）
Write-Host "`n[3/5] 正在启动 FastAPI 后端服务 (端口: $BackendPort)..." -ForegroundColor Green
$BackendScript = @"
`$Host.UI.RawUI.WindowTitle = 'CQ-Studio Backend ($BackendPort)'
Set-Location -LiteralPath '$ProjectRoot'
python -m uvicorn backend.main:app --host 0.0.0.0 --port $BackendPort --reload
"@
$BackendEncoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($BackendScript))
$BackendProc = Start-Process powershell -WorkingDirectory $ProjectRoot -ArgumentList @("-NoExit", "-EncodedCommand", $BackendEncoded) -PassThru

# 等待后端健康检查就绪
$HealthUrl = "http://127.0.0.1:$BackendPort/api/v1/health"
$MaxRetries = 35
$RetryCount = 0
$BackendReady = $false

Write-Host "  - 等待后端几何引擎初始化" -NoNewline -ForegroundColor Gray
while ($RetryCount -lt $MaxRetries) {
    try {
        $resp = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($resp.status -eq "healthy") {
            $BackendReady = $true
            break
        }
    } catch {
        # NOTE: 后端尚未完成 OCP / build123d 加载时继续轮询
    }
    Write-Host "." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
    $RetryCount++
}
Write-Host ""

if ($BackendReady) {
    Write-Host "  - 后端服务已就绪: http://localhost:$BackendPort (PID: $($BackendProc.Id))" -ForegroundColor Cyan
} else {
    Write-Host "  - [提示] 后端启动耗时较长，请查看后端终端窗口日志。" -ForegroundColor Yellow
}

# 5. 启动 Next.js 前端工作台（使用 npx next 直接传入端口，避免 npm.ps1 吞掉 -p 参数）
Write-Host "`n[4/5] 正在启动 Next.js 前端工作台 (端口: $FrontendPort)..." -ForegroundColor Green
$NextAction = if ($Prod) { "start" } else { "dev" }
$FrontendScript = @"
`$Host.UI.RawUI.WindowTitle = 'CQ-Studio Frontend ($FrontendPort)'
Set-Location -LiteralPath '$FrontendDir'
`$env:BACKEND_INTERNAL_URL = 'http://127.0.0.1:$BackendPort'
npx next $NextAction -p $FrontendPort
"@
$FrontendEncoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($FrontendScript))
$FrontendProc = Start-Process powershell -WorkingDirectory $FrontendDir -ArgumentList @("-NoExit", "-EncodedCommand", $FrontendEncoded) -PassThru

# 等待前端端口监听就绪
$FrontendUrl = "http://localhost:$FrontendPort"
$RetryCount = 0
$FrontendReady = $false

Write-Host "  - 等待前端服务编译就绪" -NoNewline -ForegroundColor Gray
while ($RetryCount -lt 30) {
    $conn = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $FrontendReady = $true
        break
    }
    Write-Host "." -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
    $RetryCount++
}
Write-Host ""

if ($FrontendReady) {
    Write-Host "  - 前端工作台已就绪: $FrontendUrl (PID: $($FrontendProc.Id))" -ForegroundColor Cyan
}

# 6. 自动打开浏览器
Write-Host "`n[5/5] 启动完成！" -ForegroundColor Green
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  🌐 前端工作台地址 : $FrontendUrl" -ForegroundColor White
Write-Host "  ⚙️  后端 API 文档  : http://localhost:$BackendPort/docs" -ForegroundColor White
Write-Host "  🛑 一键停止服务   : 双击运行 stop.bat 或关闭对应终端窗口" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

if (-not $NoBrowser) {
    Start-Sleep -Seconds 1
    Start-Process $FrontendUrl
}
