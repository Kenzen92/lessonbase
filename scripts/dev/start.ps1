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
$RootDir = (Resolve-Path (Join-Path $ScriptDir '..')).ProviderPath
$BackendDir = Join-Path $RootDir 'backend'
$FrontendDir = Join-Path $RootDir 'frontend'

function Command-Exists {
    param([string]$Name)
    return (Get-Command $Name -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "Project root: $RootDir"

if (-not (Command-Exists 'docker')) {
    Write-Host "Error: 'docker' not found on PATH. Please install Docker and ensure it's on PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $BackendDir -PathType Container)) {
    Write-Host "Error: backend folder not found at $BackendDir" -ForegroundColor Red
    exit 1
}

Write-Host "-- Starting backend (docker compose) in $BackendDir --" -ForegroundColor Green
Push-Location $BackendDir
try {
    Write-Host "Running: docker compose -f docker-compose.dev.yml up -d --build"
    # Use call operator. docker compose is the docker executable with 'compose' as arg.
    & docker compose -f docker-compose.dev.yml up -d --build
    Write-Host "Backend started (detached)." -ForegroundColor Green
} catch {
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

Write-Host "-- Starting frontend (Vite dev server) in $FrontendDir --" -ForegroundColor Green
Push-Location $FrontendDir
try {
    Write-Host "Running: npm run dev"
    # Run npm in the foreground so logs appear here and Ctrl+C will stop the dev server
    & npm run dev
} catch {
    Write-Host "Frontend dev server exited with error: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
