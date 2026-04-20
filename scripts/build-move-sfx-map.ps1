# =============================================================================
# Regenerate data/moveSounds.ts from the live PokeMiners/pogo_assets repo.
# Usage:  pwsh ./scripts/build-move-sfx-map.ps1
# =============================================================================
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$outFile = Join-Path $repoRoot 'data/moveSounds.ts'

Write-Host "Fetching PokeMiners move file listing..."
$allFiles = @()
for ($p = 1; $p -le 10; $p++) {
  $url = "https://api.github.com/repos/PokeMiners/pogo_assets/contents/Sounds/Pokemon%20Moves?per_page=100&page=$p"
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
  $j = $r.Content | ConvertFrom-Json
  if ($j.Count -eq 0) { break }
  $allFiles += $j | Where-Object { $_.name -match '^\d{3}-' } | ForEach-Object { $_.name }
  if ($j.Count -lt 100) { break }
}
Write-Host "  Found $($allFiles.Count) move files."

# Parse "NNN-V_name.wav". Prefer variant 0; normalize underscores to hyphens;
# strip Pokemon-GO-specific _fast / _charged suffixes so we hit PokeAPI slugs.
$byName = @{}
foreach ($f in $allFiles) {
  if ($f -match '^(\d{3})-(\d+)_(.+)\.wav$') {
    $id = [int]$Matches[1]
    $variant = [int]$Matches[2]
    $nameRaw = $Matches[3]
    $name = $nameRaw -replace '_(fast|charged|charge)$',''
    $name = $name -replace '_','-'
    if (-not $byName.ContainsKey($name) -or $variant -lt $byName[$name].variant) {
      $byName[$name] = @{ variant = $variant; id = $id; file = $f }
    }
  }
}
Write-Host "  Unique move slugs: $($byName.Count)"

$entries = $byName.Keys | Sort-Object | ForEach-Object {
  "  '{0}': '{1}'," -f $_, $byName[$_].file
}

$content = @"
// AUTO-GENERATED from PokeMiners/pogo_assets @ master.
// Source: https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Sounds/Pokemon%20Moves/
// These are official Niantic/The Pokemon Company move sound effects extracted from
// Pokemon GO APKs. Hotlinked from GitHub raw for zero-infrastructure delivery.
// To regenerate: run ``scripts/build-move-sfx-map.ps1``.

export const MOVE_SFX_BASE =
  'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Sounds/Pokemon%20Moves/';

/** Map of PokeAPI move slug (kebab-case) -> filename under MOVE_SFX_BASE. */
export const MOVE_SFX_FILES: Record<string, string> = {
$(($entries -join [Environment]::NewLine))
};

/** Fallback: one OGG per type. Community rips under the pokebedrock resource pack. */
export const MOVE_TYPE_SFX_BASE =
  'https://raw.githubusercontent.com/smell-of-curry/pokebedrock-res/main/sounds/gameplay/moves/';

export const MOVE_TYPE_SFX_TYPES: readonly string[] = [
  'bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost',
  'grass','ground','ice','normal','poison','psychic','rock','steel','water',
] as const;
"@

Set-Content -LiteralPath $outFile -Value $content -Encoding UTF8
Write-Host "Wrote $outFile"
