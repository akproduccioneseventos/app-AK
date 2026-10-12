$ErrorActionPreference = 'Stop'
$records = @('111-start-execution.json','111-sdk-start-execution.json','111-sdk-emulator-execution.json')
$proof = @()
foreach ($file in $records) {
  $record = Get-Content -LiteralPath (Join-Path 'docs/evidencias' $file) -Raw | ConvertFrom-Json
  $all = @(Get-CimInstance Win32_Process)
  $root = $all | Where-Object { $_.ProcessId -eq $record.child }
  if (-not $root) { throw "Expected owned process missing: $file" }
  if ($root.ParentProcessId -ne $record.launcher) { throw "Owner mismatch: $file" }
  if ($root.CommandLine -notmatch 'node_modules/(next/dist/bin/next|firebase-tools/lib/bin/firebase.js)') { throw "Command mismatch: $file" }
  $ids = @([int]$root.ProcessId)
  do {
    $new = @($all | Where-Object { $_.ParentProcessId -in $ids -and $_.ProcessId -notin $ids } | ForEach-Object { [int]$_.ProcessId })
    $ids += $new
  } while ($new.Count -gt 0)
  $tree = @($ids | ForEach-Object { $id = $_; $all | Where-Object { $_.ProcessId -eq $id } | Select-Object ProcessId,ParentProcessId,Name,CommandLine })
  for ($i=$ids.Count-1; $i -ge 0; $i--) {
    $live = Get-CimInstance Win32_Process -Filter "ProcessId=$($ids[$i])"
    $before = $tree | Where-Object { $_.ProcessId -eq $ids[$i] }
    if ($live -and $live.CommandLine -eq $before.CommandLine -and $live.ParentProcessId -eq $before.ParentProcessId) { Stop-Process -Id $ids[$i] -ErrorAction SilentlyContinue }
  }
  $proof += [pscustomobject]@{ file=$file; processTree=$tree; stoppedAt=(Get-Date).ToUniversalTime().ToString('o'); intentionalTermination=$true }
}
Start-Sleep -Milliseconds 700
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(3300,3301,8085) } | Select-Object LocalPort,OwningProcess)
if ($listeners.Count -gt 0) { throw 'An audited port is still listening; do not claim stopped' }
$json = [pscustomobject]@{ stopped=$proof; listeners=$listeners; appFailure=$false } | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'docs/evidencias/111-entorno-detenido.json'), $json.Replace("`r`n","`n"), [System.Text.UTF8Encoding]::new($false))
'Owned QA services stopped; no audited listener remains.'
