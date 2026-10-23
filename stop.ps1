<#
.SYNOPSIS
    几何工坊 (CadQuery Blockly Studio) 一键停止脚本
.DESCRIPTION
    终止占用后端端口 (8000) 和前端端口 (3000) 的服务进程。
#>

param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 3000
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🛑 正在停止几何工坊前后端服务..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

foreach ($port in @($BackendPort, $FrontendPort)) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                try {
                    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                    Write-Host "[停止] 正在终止端口 $port 进程 $($proc.ProcessName) (PID: $procId)..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                } catch {
                    Write-Host "[警告] 无法终止进程 PID $procId" -ForegroundColor DarkYellow
                }
            }
        }
    } else {
        Write-Host "[状态] 端口 $port 当前无运行中的服务。" -ForegroundColor Gray
    }
}

Write-Host "`n✅ 所有服务已清理完毕。" -ForegroundColor Green
