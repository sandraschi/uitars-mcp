Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

foreach ($p in $backendPort, $frontendPort) {
    Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Warning "[uitars-mcp] Backend did not respond in 15s — continuing anyway."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules")) {
    Write-Host "[uitars-mcp] Installing frontend dependencies..."
    npm install
}

Start-Process "http://127.0.0.1:$frontendPort/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort... (Ctrl+C to stop)"
npm run dev
