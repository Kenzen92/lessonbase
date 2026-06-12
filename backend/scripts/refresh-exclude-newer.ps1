# Update uv.toml exclude-newer to today - 7 days before a dependency update session.
$cutoff = (Get-Date).ToUniversalTime().AddDays(-7).ToString("yyyy-MM-ddTHH:mm:ssZ")
$tomlPath = Join-Path $PSScriptRoot "..\uv.toml"

$content = Get-Content $tomlPath -Raw
$content = $content -replace 'exclude-newer = "[^"]*"', "exclude-newer = `"$cutoff`""
Set-Content $tomlPath -Value $content -NoNewline -Encoding utf8

Write-Host "exclude-newer -> $cutoff"
Write-Host "Now run: uv lock  (or  uv add <package>)"
