param(
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'

$scriptPath = $PSCommandPath
if (-not $scriptPath) {
    $scriptPath = $MyInvocation.MyCommand.Path
}

$root = if ($scriptPath) { Split-Path -Parent $scriptPath } else { (Get-Location).Path }
$backendDir = Join-Path $root 'backend'
$mainFrontendDir = Join-Path $root 'frontend\24ifr'
$adminFrontendDir = Join-Path $root 'frontend\admin'
$pythonExe = Join-Path $root '.venv\Scripts\python.exe'
$logDir = Join-Path $root '.dev-logs'

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

if (-not (Test-Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
}

if (-not (Test-Path $mainFrontendDir)) {
    throw "Main frontend folder not found: $mainFrontendDir"
}

if (-not (Test-Path $adminFrontendDir)) {
    throw "Admin frontend folder not found: $adminFrontendDir"
}

if (-not (Test-Path $pythonExe)) {
    $pythonExe = 'python'
}

function Start-DetachedServer {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Command
    )

    $childCommand = "Set-Location -LiteralPath '$WorkingDirectory'; $Command"
    $safeName = ($Name -replace '[^A-Za-z0-9_-]', '_')
    $stdoutLog = Join-Path $logDir "$safeName.out.log"
    $stderrLog = Join-Path $logDir "$safeName.err.log"
    $process = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @('-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $childCommand) `
        -WorkingDirectory $WorkingDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog `
        -PassThru

    Write-Host "$Name started in the background (PID $($process.Id))."
    Write-Host "  stdout: $stdoutLog"
    Write-Host "  stderr: $stderrLog"
    return $process
}

Write-Host 'Starting local 24IFR services...'
Write-Host "Backend:  http://localhost:5000"
Write-Host "Main UI:  http://localhost:5173"
Write-Host "Admin UI: http://localhost:5174"
Write-Host ''

$processes = @()
$processes += Start-DetachedServer `
    -Name 'Backend' `
    -WorkingDirectory $backendDir `
    -Command "& '$pythonExe' -m waitress --port=5000 app.app:app"

$processes += Start-DetachedServer `
    -Name 'Main frontend' `
    -WorkingDirectory $mainFrontendDir `
    -Command 'npm run dev'

$processes += Start-DetachedServer `
    -Name 'Admin frontend' `
    -WorkingDirectory $adminFrontendDir `
    -Command 'npm run dev'

Write-Host ''
Write-Host 'All launch commands were sent. Keep this terminal open if you want to review the status text.'

if (-not $NoPause) {
    Write-Host 'Press Enter to close this launcher window.'
    [void](Read-Host)
}