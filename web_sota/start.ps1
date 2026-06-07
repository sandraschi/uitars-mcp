Param([switch]$Headless)

# Fast port helpers (scripts/PortHelpers.ps1)
Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

try {
    foreach ($p in $backendPort, $frontendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Backend did not respond - check uvicorn window."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
    Write-Host "[uitars-mcp] Installing frontend deps (one-time)..."
    npm install --no-audit --no-fund
}

Start-Process "http://127.0.0.1:${frontendPort}/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort (Ctrl+C to stop)"
npx vite --port $frontendPort
_RepoRootForPorts = Split-Path -Parent $PSScriptRoot
Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

try {
    foreach ($p in $backendPort, $frontendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Backend did not respond - check uvicorn window."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
    Write-Host "[uitars-mcp] Installing frontend deps (one-time)..."
    npm install --no-audit --no-fund
}

Start-Process "http://127.0.0.1:${frontendPort}/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort (Ctrl+C to stop)"
npx vite --port $frontendPort
_PortHelpers = Join-Path Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

try {
    foreach ($p in $backendPort, $frontendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Backend did not respond - check uvicorn window."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
    Write-Host "[uitars-mcp] Installing frontend deps (one-time)..."
    npm install --no-audit --no-fund
}

Start-Process "http://127.0.0.1:${frontendPort}/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort (Ctrl+C to stop)"
npx vite --port $frontendPort
_RepoRootForPorts 'scripts\PortHelpers.ps1'
if (Test-Path -LiteralPath Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

try {
    foreach ($p in $backendPort, $frontendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Backend did not respond - check uvicorn window."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
    Write-Host "[uitars-mcp] Installing frontend deps (one-time)..."
    npm install --no-audit --no-fund
}

Start-Process "http://127.0.0.1:${frontendPort}/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort (Ctrl+C to stop)"
npx vite --port $frontendPort
_PortHelpers) { . Param([switch]$Headless)

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

try {
    foreach ($p in $backendPort, $frontendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Backend did not respond - check uvicorn window."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
    Write-Host "[uitars-mcp] Installing frontend deps (one-time)..."
    npm install --no-audit --no-fund
}

Start-Process "http://127.0.0.1:${frontendPort}/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort (Ctrl+C to stop)"
npx vite --port $frontendPort
_PortHelpers }

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backendPort = 10976
$frontendPort = 10977

try {
    foreach ($p in $backendPort, $frontendPort) {
        Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
} catch {
    Write-Host "[uitars-mcp] Port cleanup skipped (may need admin)"
}

Write-Host "[uitars-mcp] Starting backend on port $backendPort..."
Start-Process -FilePath "uv" -ArgumentList "run", "uitars-mcp", "--serve", "--port", "$backendPort" -WorkingDirectory $root -WindowStyle Hidden

Write-Host "[uitars-mcp] Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:${backendPort}/api/health" -UseBasicParsing -TimeoutSec 2
        $ready = $true
        Write-Host "[uitars-mcp] Backend ready."
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ready) {
    Write-Host "[uitars-mcp] Backend did not respond - check uvicorn window."
}

Set-Location (Join-Path $root "web_sota")
if (-not (Test-Path "node_modules\.bin\vite.cmd")) {
    Write-Host "[uitars-mcp] Installing frontend deps (one-time)..."
    npm install --no-audit --no-fund
}

Start-Process "http://127.0.0.1:${frontendPort}/"

Write-Host "[uitars-mcp] Starting frontend on port $frontendPort (Ctrl+C to stop)"
npx vite --port $frontendPort

