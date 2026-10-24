$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot '293-recursos-auxiliares.json'
if (Test-Path -LiteralPath $out) { throw 'Preserve cleanup receipt' }
$expected = @{
  11948 = '20261024003353'
  12128 = '20261024005043'
  9752 = '20261024005515'
  1372 = '20261024005750'
  8300 = '20261024010024'
  10336 = '20261024010434'
  14040 = '20261024010538'
}
$all = @(Get-CimInstance Win32_Process)
$byId = @{}
foreach ($p in $all) { $byId[[int]$p.ProcessId] = $p }
$checked = @()
foreach ($id in $expected.Keys) {
  $p = $byId[[int]$id]
  if (-not $p) { continue }
  if ($p.Name -ne 'python.exe' -or $p.CommandLine -notmatch 'serena' -or $p.CommandLine -notmatch '--context\s+codex') { throw "Unexpected auxiliary $id" }
  if ($p.CreationDate.ToUniversalTime().ToString('yyyyMMddHHmmss') -ne $expected[$id]) { throw "PID reused: $id" }
  $next = $p
  $ours = $false
  for ($i=0; $i -lt 8 -and $next; $i++) {
    if ($next.Name -eq 'codex.exe' -and $next.ProcessId -eq 4088) { $ours = $true }
    $next = $byId[[int]$next.ParentProcessId]
  }
  if (-not $ours) { throw "Unproven ownership $id" }
  $checked += [pscustomobject]@{id=$id;created=$p.CreationDate;workingSet=$p.WorkingSetSize}
}
$before = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
foreach ($item in $checked) { Stop-Process -Id $item.id -ErrorAction Stop }
$after = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
[pscustomobject]@{checkedAt=[DateTime]::UtcNow.ToString('o');closed=$checked;count=$checked.Count;freeKiBBefore=$before;freeKiBAfter=$after;scope='Only verified inactive Codex auxiliary navigators from closed subtasks; only this Codex chat active in the thread snapshot. Original/main navigator and Antigravity retained. No app/data/foreign work changed.'} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $out -Encoding utf8
Get-Content -LiteralPath $out
