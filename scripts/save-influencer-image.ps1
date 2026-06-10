# Manuel olarak Instagram <img src="..."> URL'ini bir slug'a kaydeder.
#
# Kullanım:
#   .\scripts\save-influencer-image.ps1 ig-kremali-ananasli-mangolu-limonata 'https://instagram.fxxx.fbcdn.net/.../n.jpg?...'
#
# URL'i her zaman TEK TIRNAK içine al — & karakterleri PowerShell'i şaşırtmasın.

param(
  [Parameter(Mandatory = $true)] [string] $Slug,
  [Parameter(Mandatory = $true)] [string] $Url
)

$ErrorActionPreference = 'Stop'

if (-not $Slug.StartsWith('ig-')) {
  Write-Host "Slug 'ig-' ile başlamalı (verilen: $Slug)" -ForegroundColor Red
  exit 1
}

$dest = Join-Path -Path 'assets/influencer' -ChildPath ("{0}.jpg" -f $Slug)

# HTML'den kopyalanan URL'lerde &amp; olabilir — düzelt.
$cleanUrl = $Url -replace '&amp;', '&'

$headers = @{
  'Referer'         = 'https://www.instagram.com/'
  'User-Agent'      = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  'Accept'          = 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
  'Accept-Language' = 'en-US,en;q=0.9'
}

Invoke-WebRequest -Uri $cleanUrl -Headers $headers -OutFile $dest -UseBasicParsing | Out-Null
$bytes = (Get-Item $dest).Length
Write-Host ("OK  {0}  ({1:N0} bytes)" -f $dest, $bytes) -ForegroundColor Green
