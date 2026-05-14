Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976

try {
    foreach ($p in $backendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

if (-not (Test-Path "web_sota\dist\index.html")) {
    Write-Host "[uitars-mcp] Building frontend..."
    Set-Location web_sota
    if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
        npm install --no-audit --no-fund
    }
    npx vite build
    Set-Location $root
}

Write-Host "[uitars-mcp] Starting server on http://127.0.0.1:${backendPort}/"
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for server..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Server ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Server did not respond - check uvicorn window."
    Write-Host "[uitars-mcp] Is a VLM running? (Ollama, vLLM, or cloud API)"
}

Start-Process "http://127.0.0.1:${backendPort}/"

Write-Host "[uitars-mcp] Running. Browser opened. Ctrl+C in uvicorn window to stop."
Read-Host "Press Enter to exit"
