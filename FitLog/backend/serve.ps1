# Script para levantar servidor estático en Windows (PowerShell)
# Uso: Ejecuta desde la carpeta del proyecto con: .\serve.ps1

$port = 8000
$bind = "127.0.0.1"
Write-Host "Iniciando servidor estático en http://${bind}:${port} ..."
Write-Host "Sirviendo archivos desde la carpeta frontend..."
Set-Location frontend
python -m http.server $port --bind $bind
