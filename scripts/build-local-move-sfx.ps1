# =============================================================================
# build-local-move-sfx.ps1
# -----------------------------------------------------------------------------
# Ingest the locally-extracted "Pokemon SFX Attack Moves & Sound Effects
# Collection" pack (Gen 1-7, ~4,500 files) and produce:
#
#   1. A slim curated copy in `public/sfx/moves/{slug}.{ext}` -- one file per
#      PokeAPI move slug, picked as the highest-quality available version.
#   2. A TypeScript map `data/localMoveSounds.ts` mapping slug -> filename so
#      the sound service can use it as the top-priority SFX source.
#
# The original pack stays untouched in the project root and is git-ignored.
# Re-run this script after updating the pack.
# =============================================================================

[CmdletBinding()]
param(
    [string]$PackRoot,
    [string]$OutAudio,
    [string]$OutTs
)

$ErrorActionPreference = 'Stop'

# Resolve defaults relative to THIS script's directory (more reliable across
# invocation styles than $PSScriptRoot at param-time).
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projRoot  = Split-Path -Parent $scriptDir
if (-not $PackRoot) { $PackRoot = Join-Path $projRoot 'Pokemon SFX Attack Moves & Sound Effects Collection' }
if (-not $OutAudio) { $OutAudio = Join-Path $projRoot 'public\sfx\moves' }
if (-not $OutTs)    { $OutTs    = Join-Path $projRoot 'data\localMoveSounds.ts' }

if (-not (Test-Path -LiteralPath $PackRoot)) {
    throw "Pack not found: $PackRoot"
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Split CamelCase names (Gen 1-2 use e.g. "AcidArmor.wav"): insert a space
# between a lowercase letter followed by an uppercase letter.
function Split-CamelCase([string]$s) {
    return [regex]::Replace($s, '([a-z0-9])([A-Z])', '$1 $2')
}

# Convert a human-readable move title to a PokeAPI slug.
#   "Acid Armor"     -> "acid-armor"
#   "Will-O-Wisp"    -> "will-o-wisp"
#   "X-Scissor"      -> "x-scissor"
#   "Self-Destruct"  -> "self-destruct"
function ConvertTo-Slug([string]$s) {
    $v = $s.ToLower()
    $v = $v -replace '[_\s]+', '-'
    $v = $v -replace '-+', '-'
    $v = $v -replace '[^a-z0-9-]', ''
    $v = $v.Trim('-')
    return $v
}

# Return the move's base title after stripping "part N" and the trailing
# single-digit variant markers Gen 1-2 uses (Absorb1.wav, Absorb2.wav).
function Get-BaseTitle([string]$rawName) {
    # "Absorb part 1" -> "Absorb"
    $t = $rawName -replace '(?i)\s*part\s*\d+$', ''
    # Gen 1-2 variants: "Absorb1", "Absorb 2", "Acid1" -> "Absorb", "Acid"
    # (only a single trailing digit to avoid corrupting moves like "10 Mil Volt")
    $t = $t -replace '(?<=[A-Za-z])\s*\d$', ''
    return $t.Trim()
}

# ---------------------------------------------------------------------------
# Scan all files, group by slug, pick the winner per slug
# ---------------------------------------------------------------------------

Write-Host "Scanning pack at $PackRoot ..."
$gens = Get-ChildItem -LiteralPath $PackRoot -Directory |
        Where-Object { $_.Name -match '^GEN\s+(\d)' } |
        Sort-Object { [int]([regex]::Match($_.Name, '^GEN\s+(\d)').Groups[1].Value) }

$candidates = @()
foreach ($gen in $gens) {
    $genNum = [int]([regex]::Match($gen.Name, '^GEN\s+(\d)').Groups[1].Value)
    $files  = Get-ChildItem -LiteralPath $gen.FullName -Recurse -File `
              -Include *.mp3, *.wav -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $nameNoExt = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
        $readable  = Split-CamelCase $nameNoExt
        $base      = Get-BaseTitle $readable
        if ([string]::IsNullOrWhiteSpace($base)) { continue }
        $slug      = ConvertTo-Slug $base
        if ([string]::IsNullOrWhiteSpace($slug)) { continue }

        $hasPart = $nameNoExt -match '(?i)part\s*\d+$'
        $isVariant = $nameNoExt -match '(?<=[A-Za-z])\d$'

        # Scoring: prefer clean names, then mp3 (smaller/consistent), then newer gen.
        $score = ($genNum * 1000)
        if (-not $hasPart)   { $score += 500 }
        if (-not $isVariant) { $score += 200 }
        if ($f.Extension -eq '.mp3') { $score += 10 }

        $candidates += [pscustomobject]@{
            Slug   = $slug
            Gen    = $genNum
            Path   = $f.FullName
            Ext    = $f.Extension
            Score  = $score
            Title  = $base
            Length = $f.Length
        }
    }
}

Write-Host "Collected $($candidates.Count) candidate files."

# Pick winner per slug
$grouped = $candidates | Group-Object Slug
$winners = foreach ($g in $grouped) {
    $g.Group | Sort-Object Score -Descending | Select-Object -First 1
}
Write-Host "Unique move slugs: $($winners.Count)"

# ---------------------------------------------------------------------------
# Copy winners to public/sfx/moves
# ---------------------------------------------------------------------------

if (Test-Path -LiteralPath $OutAudio) {
    Write-Host "Clearing previous output at $OutAudio ..."
    Remove-Item -LiteralPath $OutAudio -Recurse -Force
}
New-Item -ItemType Directory -Path $OutAudio -Force | Out-Null

$totalBytes = 0
$mapEntries = @()
foreach ($w in $winners | Sort-Object Slug) {
    $targetName = "{0}{1}" -f $w.Slug, $w.Ext.ToLower()
    $dest       = Join-Path $OutAudio $targetName
    Copy-Item -LiteralPath $w.Path -Destination $dest -Force
    $totalBytes += $w.Length
    $mapEntries += "  '{0}': '{1}'," -f $w.Slug, $targetName
}

Write-Host ("Copied {0} files, {1:N1} MB total." -f $winners.Count, ($totalBytes / 1MB))

# ---------------------------------------------------------------------------
# Write the TS module
# ---------------------------------------------------------------------------

$sortedEntries = $mapEntries | Sort-Object
$tsContent = @"
// AUTO-GENERATED by scripts/build-local-move-sfx.ps1.
// Source: "Pokemon SFX Attack Moves & Sound Effects Collection" (Gen 1-7).
// Do NOT edit by hand -- re-run the script after updating the pack.
//
// Each entry is a PokeAPI move slug -> filename under /sfx/moves/ (served
// statically by Vite from public/). The sound service treats this as the
// top-priority source before falling back to PokeMiners, type OGGs, and
// finally the procedural synth.

export const LOCAL_MOVE_SFX_BASE = '/sfx/moves/';

export const LOCAL_MOVE_SFX_FILES: Record<string, string> = {
$($sortedEntries -join "`n")
};

export const LOCAL_MOVE_SFX_COUNT = $($winners.Count);
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($OutTs, $tsContent, $utf8NoBom)
Write-Host "Wrote $OutTs ($($winners.Count) entries)."
