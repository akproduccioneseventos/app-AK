$ErrorActionPreference = 'Stop'
$records = @('122-start-execution.json','122-emulator-execution.json')
$proof = @()
foreach ($file in $records) {
  if ($file -eq '122-emulator-execution.json') {
    $env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085'
    node --input-type=module -e "import fs from 'node:fs'; import admin from 'firebase-admin'; if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private emulator required'); const a=admin.initializeApp({projectId:'demo-ak-producciones'},'qa122-after-stop');const counts={};for(const c of await a.firestore().listCollections())counts[c.id]=(await c.get()).size;const total=Object.values(counts).reduce((a,b)=>a+b,0);fs.writeFileSync('docs/evidencias/122-limpieza-sdk.json',JSON.stringify({total,counts},null,2)+'\n');await a.delete();if(total!==0)throw new Error('Fictitious documents remain');"
    if ($LASTEXITCODE -ne 0) { throw 'Post-stop SDK cleanup is not confirmed' }
  }
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
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(3301,8085) } | Select-Object LocalPort,OwningProcess)
if ($listeners.Count -gt 0) { throw 'An audited port is still listening; do not claim stopped' }
$json = [pscustomobject]@{ stopped=$proof; listeners=$listeners; appFailure=$false } | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'docs/evidencias/122-entorno-detenido.json'), $json.Replace("`r`n","`n"), [System.Text.UTF8Encoding]::new($false))
'Owned QA services stopped; no audited listener remains.'
