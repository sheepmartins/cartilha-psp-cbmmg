# Servidor estatico local para a cartilha (sem dependencias externas).
# Uso:  powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
param([int]$Port = 8080)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.js'='application/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8'
  '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'
  '.webp'='image/webp'; '.ico'='image/x-icon'; '.woff2'='font/woff2'; '.woff'='font/woff'
  '.pdf'='application/pdf'; '.txt'='text/plain; charset=utf-8'; '.map'='application/json'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Nao foi possivel abrir a porta $Port. Tente outra: -Port 8081" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "  Cartilha PSP - CBMMG" -ForegroundColor Magenta
Write-Host "  Servindo $root" -ForegroundColor DarkGray
Write-Host "  http://localhost:$Port/" -ForegroundColor Green
Write-Host "  (Ctrl+C para encerrar)" -ForegroundColor DarkGray
Write-Host ""

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { break }

  $req = $ctx.Request
  $res = $ctx.Response

  try {
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
    $rel = $rel -replace '/', '\'

    $full = Join-Path $root $rel
    $fullResolved = [System.IO.Path]::GetFullPath($full)

    # impede sair da pasta do projeto
    if (-not $fullResolved.StartsWith([System.IO.Path]::GetFullPath($root), [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $res.Close()
      continue
    }

    if ((Test-Path $fullResolved -PathType Container)) {
      $fullResolved = Join-Path $fullResolved 'index.html'
    }

    if (Test-Path $fullResolved -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($fullResolved).ToLower()
      $ct  = $mime[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($fullResolved)
      $res.ContentType = $ct
      $res.Headers.Add('Cache-Control', 'no-cache')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("  200  /{0}" -f ($rel -replace '\\','/')) -ForegroundColor DarkGray
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - nao encontrado')
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.OutputStream.Write($msg, 0, $msg.Length)
      Write-Host ("  404  /{0}" -f ($rel -replace '\\','/')) -ForegroundColor Yellow
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.Close() } catch {}
  }
}
