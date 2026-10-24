$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot '292-recursos-auxiliares.json'
if (Test-Path -LiteralPath $out) { throw 'Preserve cleanup receipt' }
# Closed Codex subtask tool workers; keep the original/main Serena and Antigravity intact.
$expected = @{
  14952 = '20261024011611'
  12524 = '20261024011258'
  2580 = '20261024011254'
  9900 = '20261024011049'
}
$all = @(Get-CimInstance Win32_Process)
$byId = @{}
foreach ($p in $all) { $byId[[int]$p.ProcessId] = $p }
$checked = @()
foreach ($id in $expected.Keys) {
  $p = $byId[[int]$id]
  if (-not $p) { continue }
  if ($p.Name -ne 'python.exe' -or $p.CommandLine -notmatch 'serena' -or $p.CommandLine -notmatch '--context\s+codex') { throw "Not the expected auxiliary $id" }
  if ($p.CreationDate.ToUniversalTime().ToString('yyyyMMddHHmmss') -ne $expected[$id]) { throw "PID reused: $id" }
  $next = $p
  $ours = $false
  for ($i=0; $i -lt 8 -and $next; $i++) {
    if ($next.Name -eq 'codex.exe' -and $next.ProcessId -eq 4088) { $ours = $true }
    $next = $byId[[int]$next.ParentProcessId]
  }
  if (-not $ours) { throw "Unproven ownership $id" }
  $checked += [pscustomobject]@{id=$id;name=$p.Name;created=$p.CreationDate;workingSet=$p.WorkingSetSize;parent=$p.ParentProcessId}
}
$before = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
foreach ($item in $checked) { Stop-Process -Id $item.id -ErrorAction Stop }
$after = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
[pscustomobject]@{
  checkedAt=[DateTime]::UtcNow.ToString('o');closed=$checked;freeKiBBefore=$before;freeKiBAfter=$after
  scope='Four inactive auxiliary Serena workers from closed Codex subtasks. All current subtasks closed; thread snapshot showed only this chat active. Original/main Serena retained. No app, Antigravity, browser, business data or foreign job stopped.'
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $out -Encoding utf8
Get-Content -LiteralPath $out
