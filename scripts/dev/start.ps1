# PowerShell script to start backend (docker compose) and frontend (Vite dev server)
# Usage (PowerShell):
#   .\scripts\start.ps1
# If you get an execution policy error, run:
#   powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Starting dev environment..." -ForegroundColor Cyan

# Determine script and repo root
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$RootDir = (Resolve-Path (Join-Path $ScriptDir '..\..')).ProviderPath
$DockerDir = Join-Path $RootDir 'deploy\docker'
$FrontendDir = Join-Path $RootDir 'frontend'
$StunDir = Join-Path $RootDir 'backend\stun'

function Command-Exists {
    param([string]$Name)
    return (Get-Command $Name -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "Project root: $RootDir"

if (-not (Command-Exists 'docker')) {
    Write-Host "Error: 'docker' not found on PATH. Please install Docker and ensure it's on PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $DockerDir -PathType Container)) {
    Write-Host "Error: docker folder not found at $DockerDir" -ForegroundColor Red
    exit 1
}

Write-Host "-- Starting backend (docker compose) in $DockerDir --" -ForegroundColor Green
Push-Location $DockerDir
try {
    Write-Host "Running: docker compose up -d --build"
    # Use call operator. docker compose is the docker executable with 'compose' as arg.
    # Dev uses docker-compose.yml + docker-compose.override.yml (auto-loaded)
    & docker compose up -d --build
    Write-Host "Backend started (detached)." -ForegroundColor Green
}
catch {
    Write-Host "Failed to start backend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

if (-not (Command-Exists 'npm')) {
    Write-Host "Error: 'npm' not found on PATH. Please install Node (npm) and ensure it's on PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendDir -PathType Container)) {
    Write-Host "Error: frontend folder not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

$StunJob = $null
if ((Command-Exists 'go') -and (Test-Path $StunDir -PathType Container)) {
    Write-Host "-- Starting STUN server in $StunDir --" -ForegroundColor Green
    $StunJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        & go run ./cmd
    } -ArgumentList $StunDir
    Write-Host "STUN server started (Job ID: $($StunJob.Id))" -ForegroundColor Green
}
elseif (-not (Command-Exists 'go')) {
    Write-Host "Warning: 'go' not found on PATH, skipping STUN server." -ForegroundColor Yellow
}
else {
    Write-Host "Warning: STUN server directory not found at $StunDir, skipping." -ForegroundColor Yellow
}

try {
    Write-Host "-- Starting frontend (Vite dev server) in $FrontendDir --" -ForegroundColor Green
    Push-Location $FrontendDir
    try {
        Write-Host "Running: npm run dev"
        & npm run dev
    }
    catch {
        Write-Host "Frontend dev server exited with error: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}
finally {
    if ($StunJob) {
        Write-Host "Stopping STUN server (Job ID: $($StunJob.Id))..." -ForegroundColor Cyan
        Stop-Job -Job $StunJob -ErrorAction SilentlyContinue
        Remove-Job -Job $StunJob -Force -ErrorAction SilentlyContinue
    }
}
