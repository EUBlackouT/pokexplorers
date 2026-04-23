# Session Progress — Rift Atelier v2 + Rift Transforms

Last saved: sleep break. TypeScript clean, no lint errors.

## What shipped this session

### 1. Rift Atelier fully redesigned
Old `MetaState.upgrades` + "casino packs" system is gone. Replaced by three branches in `components/screens/MetaMenu.tsx`:

- **Talents** — one-time run-shapers (Essence only)
- **Keystones** — tiered stat tracks, old 15 sliders absorbed into 6 themed tracks (Essence only, level 0..cap)
- **Vault** — chase unlocks gated by **Rift Tokens + Essence**, includes Tera / Mega / Z-Moves

Migration: `migrateMeta()` in `data/meta.ts` folds any old save's `upgrades.*` into the matching keystone on load. Idempotent. Wired into `handleLoadGame` and `handleImportSave`.

Refunds: 80% Refract on Talents + Keystones.

### 2. Rift Tokens economy (currency #2)
Sources, centralised in `data/meta.ts::TOKEN_AWARDS`:

| Source | Tokens |
|---|---|
| Gym Leader | 2 |
| Rival milestone | 3 |
| Alpha catch | 1 |
| Anomaly catch | 1 |
| Mass Outbreak first encounter | 1 (once per chunk, story flag `outbreak_token_<cx>_<cy>`) |
| Champion clear | 10 |

`rift_ledger` talent doubles all awards during the first hour of a run. `lifetime.runStartedAt` timestamped on run start.

### 3. Battle transforms — Tera / Mega / Z-Moves
**UI**: new `POWER` button in battle (purple→amber gradient) opens a picker modal on top. Only renders when at least one of Tera/Mega/Z is owned. Per-option gating (locked / already used / not eligible) rendered inline.

**Activation state** (`types.ts`):
- `Pokemon.teraType?`, `Pokemon.megaActive?`, `Pokemon.zCharged?`
- `BattleState.playerUsedMegaThisBattle?`, `BattleState.playerUsedZThisBattle?`
- Cleared in `survivingTeam` scrub after battle.

**Data** (`data/riftForms.ts`): `TERA_TYPES[]`, `MEGA_ELIGIBLE` Set (Pokédex IDs), and the multiplier constants.

**Mega**: +30% attack (post-damage `*1.3`), +20% defense (`/1.2` when taking hits). Once per battle. Persists for the fight.

**Z-Move**: Next damaging move ×1.8, pierces Protect (sets `actor.ignoresProtect`), auto-clears `zCharged` after use. Once per battle.

**Tera — done properly, not a shim** (`services/pokeService.ts`):
- New helper `getEffectiveDefensiveTypes(mon)` — returns `[teraType]` if Tera active, else real types.
- `getDamageMultiplier` uses it for type chart + WonderGuard → **defensive typing fully swaps**. Tera-Water Charizard takes 2x from Rock, neutral from Fire/Grass.
- `canAfflictStatus` uses it → Tera Fire/Electric/Ice/Poison/Steel are immune to the matching status.
- Secondary-effect status application uses it.
- STAB in `calculateDamage` computes Gen 9 Tera STAB correctly: 2.0x (both match) / 1.5x (tera only) / 1.5x (original only) / 1.0x.
- Snow's Ice Def buff uses it.
- Move power bonus vs Dragon-type defenders uses it.
- Hazard grounding (Spikes / Toxic Spikes / Sticky Web) in `App.tsx` uses it — Tera-Fire Dragapult now eats Spikes.

### 4. Talent wiring (all done except cosmetic)
- `wild_instinct` — pinned catch combo on starter at run start
- `rift_ledger` — 2x tokens first hour
- `rift_catalyst` — Sync gauge starts at 25 instead of 0
- `second_wind` — first whiteout per run → lead revived to 50% HP (story flag `second_wind_used`, cleared on run end)
- `held_legacy` — 25% of catches roll a held item from a small pool
- `sync_inherit` — first catch per run inherits starter's Nature
- `bounty_broker` — bounty slate 3→4 + paid reroll at half-cost
- `aura_sight` — tall light beacon on alpha/anomaly grass tiles so they read from across the viewport (no minimap exists; this is the meaningful alternative — talent description still says "minimap", should be updated)

### 5. Keystone wiring
All 6 keystones feed existing stat math via helper functions in `data/meta.ts`:
`warden_level`, `swift_level`, `swift_healMult`, `purse_essenceMult`, `purse_xpMult`, `purse_startingMoney`, `stability_scalingMult`, `catchers_catchMult`, `catchers_shinyTier`, `catchers_permitBonus`, `scavenger_dropBonus`, `scavenger_shopDiscount`, `scavenger_startItems`. All `upgrades.*` reads in `App.tsx` replaced.

### 6. Utility vault wiring
- `field_theorist` — your weather & terrain +2 turns
- `team_slot_7` — roster cap 6→7

## Known gaps / cancelled / next session

### Bought-but-inert Vault entries (present in UI, effect not wired)
These can be purchased but do nothing yet. Recommend hiding them until wired or labeling "coming soon":

- **`fusion_glossary`** — needs a Fusion Codex page in `PauseMenu.tsx` (~400 lines of UI against the existing FUSION_CHART). Deferred to avoid touching Pause UI.
- **`quick_swap`** — needs surgery inside the double-battle turn pipeline (consume-free switch after a KO on same turn). Risky without a test harness.

### Cancelled explicitly this session
- **Rift Warden NPC + Rift Trials** (t12) — token sources (gyms/rivals/alphas/anomalies/outbreaks) already cover earning. Add later only if playtest shows token starvation.

### Small polish item
- `aura_sight` talent description in `data/meta.ts` says "marked on the minimap" — there's no minimap. Update copy to say "alpha/anomaly tiles glow with a light beacon" or similar.

## Files touched this session

Created:
- `data/meta.ts` (new source of truth for Talents/Keystones/Vault + migration)
- `data/riftForms.ts` (Tera types, Mega eligibility, multipliers)
- `PROGRESS.md` (this file)

Modified:
- `types.ts` — `MetaState` redesign, `Pokemon.teraType/megaActive/zCharged`, `BattleState.playerUsedMegaThisBattle/ZThisBattle`
- `App.tsx` — MetaState init, save migration hooks, upgrade→keystone helper replacement, token earn hooks, talent/vault wiring, POWER button + transform picker modal, Tera hazard grounding, survivingTeam scrub
- `services/pokeService.ts` — `getEffectiveDefensiveTypes`, Tera defensive swap in damage/status/weather/move-power paths, Gen 9 Tera STAB in `calculateDamage`
- `components/screens/MetaMenu.tsx` — complete rebuild: 3-tab UI, dual currency, purchase/refund, token-earn cheatsheet
- `components/Overworld.tsx` — `auraSight` prop, beacon column on alpha/anomaly tiles
- `data/bounties.ts` — `rollBounties` accepts `slateSize`

## Sanity checks done
- `npx tsc --noEmit` → exit 0
- Lint → no errors across touched files

## If a save is loaded from before this session
`migrateMeta` runs automatically on:
1. `handleLoadGame` (load from save slot)
2. `handleImportSave` (file import)
3. `MetaMenu` mount (catches saves loaded via the autoload path)

Old `upgrades.attackBoost`/`defenseBoost`/`critBoost` → `warden_crest` level = max of the three.
Old `speedBoost`/`healingBoost` → `swift_ring`.
Etc. See `KEYSTONES[].absorbs` in `data/meta.ts`.
