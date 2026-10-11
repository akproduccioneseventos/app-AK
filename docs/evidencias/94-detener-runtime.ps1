$ErrorActionPreference = 'Stop'
$record = Get-Content -LiteralPath 'docs/evidencias/94-runtime.json' -Raw | ConvertFrom-Json
$all = @(Get-CimInstance Win32_Process)
$launcher = $all | Where-Object { $_.ProcessId -eq $record.launcher }
if (-not $launcher -or $launcher.CommandLine -notmatch '94-ejecutar-aislado.mjs start' -or
    $launcher.CreationDate.ToUniversalTime() -lt [datetime]'2026-10-10T22:00:00Z') { throw 'Runtime owner mismatch' }
$owned = @($launcher)
do {
  $ids = @($owned | ForEach-Object { $_.ProcessId })
  $new = @($all | Where-Object { $_.ParentProcessId -in $ids -and $_.ProcessId -notin $ids })
  $owned += $new
} while ($new.Count -gt 0)
foreach ($p in @($owned | Sort-Object CreationDate -Descending)) {
  $live = Get-CimInstance Win32_Process -Filter "ProcessId = $($p.ProcessId)"
  if ($live -and $live.CreationDate -eq $p.CreationDate -and $live.CommandLine -eq $p.CommandLine) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
}
Start-Sleep -Seconds 1
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(3300,8085,9195) })
@{ stoppedAt = [datetime]::UtcNow.ToString('o'); owned = @($owned | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine);
  remainingListeners = @($listeners | Select-Object LocalAddress,LocalPort,OwningProcess) } |
  ConvertTo-Json -Depth 5 | Set-Content -LiteralPath 'docs/evidencias/94-runtime-detencion.json' -Encoding UTF8
if ($listeners.Count -gt 0) { throw 'Ports still have listeners; do not kill unverified owners' }
Write-Output 'Owned runtime stopped; 3300,8085,9195 have no listeners.'
