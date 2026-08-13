param (
    [string]$Cmd = "npm run check:acentos"
)

$nodeBin = "C:\Users\Usuario\AppData\Local\OpenAI\Codex\runtimes\cua_node\23828fd353da361d\bin"
$env:Path = "$nodeBin;$env:Path"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Write-Output "Ejecutando: $Cmd"
Invoke-Expression $Cmd
