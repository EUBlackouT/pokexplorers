
export interface PokemonType {
  name: string;
  url: string;
}

export interface MoveStatChange {
  change: number;
  stat: { name: string };
}

export interface MoveSecondaryEffect {
    status?: string;
    statChanges?: MoveStatChange[];
    selfStatChanges?: MoveStatChange[];
    msg?: string;
    weather?: WeatherType;
    terrain?: TerrainType;
    flinch?: boolean;
    statTarget?: 'self' | 'target' | 'ally';
    clearHazards?: boolean;
    reflect?: boolean;
    lightScreen?: boolean;
    auroraVeil?: boolean;
    spikes?: boolean;
    stealthRock?: boolean;
    stickyWeb?: boolean;
    toxicSpikes?: boolean;
    tailwind?: boolean;
    aegisField?: boolean;
    runeWard?: boolean;
    syncGaugeDrain?: number;
    trap?: number;
    fieldWarp?: boolean;
    healing?: number;
    protect?: boolean;
    forceOut?: boolean;
    forceSwitch?: boolean;
    batonPass?: boolean;
    pivot?: boolean;
    itemRemoval?: boolean;
    recharge?: boolean;
    selfDestruct?: boolean;
    statusClear?: 'self' | 'team';
    setHazard?: string;
    charge?: boolean;
    invulnerable?: boolean;
    drain?: number;
    multiHit?: [number, number];
    recoil?: number;
    selfDamage?: number;
    weatherChange?: WeatherType;
    terrainChange?: TerrainType;
    itemSwap?: boolean;
    trickRoom?: boolean;
    clearStats?: boolean;
    substitute?: boolean;
    leechSeed?: boolean;
    copyStats?: boolean;
    reverseStats?: boolean;
    setHp?: number;
    hpFraction?: number;
    bellyDrum?: boolean;
    destinyBond?: boolean;
    perishSong?: boolean;
    futureSight?: boolean;
    itemSteal?: boolean;
    curse?: boolean;
    taunt?: number;
    encore?: number;
    disable?: number;
    torment?: boolean;
    healBlock?: number;
    embargo?: number;
    magnetRise?: number;
    telekinesis?: number;
    ingrain?: boolean;
    aquaRing?: boolean;
    imprison?: boolean;
    typeChange?: string[];
    targetTypeChange?: string[];
    gravity?: number;
    healWish?: boolean;
    lunarDance?: boolean;
    memento?: boolean;
    wish?: boolean;
    yawn?: boolean;
}

export interface MoveMeta {
  ailment: { name: string };
  category: { name: string };
  min_hits?: number;
  max_hits?: number;
  min_turns?: number;
  max_turns?: number;
  drain?: number;
  healing?: number;
  crit_rate?: number;
  ailment_chance?: number;
  flinch_chance?: number;
  stat_chance?: number;
  weatherChange?: WeatherType;
  terrainChange?: TerrainType;
  stat_changes?: MoveStatChange[];
  stat_target?: 'self' | 'target' | 'ally';
  clearHazards?: boolean;
  reflect?: boolean;
  lightScreen?: boolean;
  auroraVeil?: boolean;
  spikes?: boolean;
  stealthRock?: boolean;
  stickyWeb?: boolean;
  toxicSpikes?: boolean;
  tailwind?: boolean;
  aegisField?: boolean;
  runeWard?: boolean;
  syncGaugeDrain?: number;
  trap?: number;
  fieldWarp?: boolean;
  protect?: boolean;
  forceOut?: boolean;
  forceSwitch?: boolean;
  itemRemoval?: boolean;
  recharge?: boolean;
  selfDestruct?: boolean;
  statusClear?: 'self' | 'team';
  setHazard?: string;
  charge?: boolean;
  invulnerable?: boolean;
  itemSwap?: boolean;
  trickRoom?: boolean;
  clearStats?: boolean;
  substitute?: boolean;
  leechSeed?: boolean;
}

export interface PokemonMove {
  name: string;
  url: string;
  power?: number;
  accuracy?: number;
  type?: string;
  damage_class?: 'physical' | 'special' | 'status';
  pp?: number;
  priority?: number;
  target?: string;
  stat_changes?: MoveStatChange[];
  meta?: MoveMeta;
  isFusion?: boolean;
  isPulse?: boolean;
  isSound?: boolean;
  isBiting?: boolean;
  isPunching?: boolean;
  isSlicing?: boolean;
  isWind?: boolean;
  isBullet?: boolean;
  contact?: boolean;
  weatherChange?: WeatherType;
  terrainChange?: TerrainType;
  flinchChance?: number;
  min_hits?: number;
  max_hits?: number;
  sfx?: string;
}

export interface MovePoolItem {
    name: string;
    url: string;
    level: number;
}

export interface StatBlock {
    hp: number;
    attack: number;
    defense: number;
    'special-attack': number;
    'special-defense': number;
    speed: number;
}

export type StatName = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

export interface Nature {
    name: string;
    increased?: StatName;
    decreased?: StatName;
}

export interface Ability {
    name: string;
    url: string;
    isHidden: boolean;
    description?: string; 
    category?: string;
    tags?: string[];
    notes?: string;
}

export interface StatStages {
  attack: number;
  defense: number;
  'special-attack': number;
  'special-defense': number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    back_default: string;
    versions?: {
      'generation-v': {
        'black-white': {
          animated: {
            front_default: string;
            back_default: string;
            front_shiny?: string;
            back_shiny?: string;
          }
        }
      }
    }
  };
  stats: StatBlock;      // Current calculated stats (Level + Base + IV + Nature)
  baseStats: StatBlock;  // Species base stats
  ivs: StatBlock;        // Individual Values (0-31)
  evs: StatBlock;        // Effort Values (0-252 per stat, 510 total)
  nature: Nature;
  ability: Ability;
  
  types: string[];
  moves: PokemonMove[];
  movePool: MovePoolItem[]; // All level-up moves
  currentHp: number;
  maxHp: number;
  isFainted: boolean;
  isFlinching?: boolean;
  isFlinchImmune?: boolean;
  status?: string;
  statusTurns?: number;
  confusionTurns?: number;
  animationState?: 'idle' | 'attack' | 'damage' | 'level-up' | 'capture-success' | 'capture-fail';
  /**
   * Species ID this Pokemon should evolve into once the current battle ends.
   * Set during battle level-up and consumed by the post-battle cinematic so
   * we don't interrupt combat to play the evolution sequence.
   */
  pendingEvolutionId?: number;
  incomingAttackType?: string; 
  isShiny?: boolean;
  cryUrl?: string;
  nextSpecialBoost?: boolean;
  isTrapped?: number;
  isProtected?: boolean;
  isInvulnerable?: boolean;
  perishTurns?: number;
  futureSightTurns?: number;
  futureSightDamage?: number;
  isLeechSeeded?: boolean;
  choiceMove?: string;
  metronomeCount?: number;
  nextMoveDamageBoost?: number | boolean;
  nextMovePriorityBoost?: number;
  lastMoveWasLink?: boolean;
  substituteHp?: number;
  trappedTurns?: number;
  confusionDamage?: boolean;
  sealedMoveName?: string;
  sealedTurns?: number;
  tookDamageThisTurn?: boolean;
  lastMoveName?: string;
  lastMoveMissed?: boolean;
  hasUsedJetstream?: boolean;
  hasUsedRuneBloomThisTurn?: boolean;
  
  nextMoveBoosts?: {
    damageMult?: number;
    priorityMod?: number;
    accuracyMod?: number;
    critMod?: boolean;
    physicalDamageMult?: number;
    healAtEnd?: boolean;
    critRate?: number;
  };
  
  // Progression
  level: number;
  xp: number;
  maxXp: number;
  
  // Battle Vars
  statStages?: StatStages;
  turnCount?: number;
  koCount?: number;
  chargingMove?: PokemonMove; // If present, pokemon is charging this move
  mustRecharge?: boolean; // If true, pokemon must recharge next turn
  heldItem?: { id: string, name: string };
  ignoresProtect?: boolean;
  usedSacrificialGuard?: boolean;
  usedTrickMirror?: boolean;
  usedBackdraftClause?: boolean;
  usedWithstand?: boolean;
  // Per-battle "one-shot" flags for new early-pool abilities
  usedShellCurl?: boolean;
  usedEmberSpark?: boolean;
  // Per-action hint set by App.tsx when ally shares a target this turn
  allySharedTarget?: boolean;
  hasMovedThisTurn?: boolean;
  isCursed?: boolean;
  isDestinyBondActive?: boolean;
  toxicTurns?: number;
  isBoosterEnergyActive?: boolean;
  mustSwitch?: boolean;
  isNightmareActive?: boolean;
  isTaunted?: number;
  isEncored?: number;
  encoredMove?: string;
  isDisabled?: number;
  disabledMove?: string;
  isTormented?: boolean;
  isHealBlocked?: number;
  isEmbargoed?: number;
  isMagnetRaised?: number;
  isTelekinesised?: number;
  isIngrained?: boolean;
  isAquaRinged?: boolean;
  isImprisoned?: boolean;
  isHealingWishActive?: boolean;
  isLunarDanceActive?: boolean;
  isYawned?: number;

  // --- Rift Atelier v2 battle transforms ---
  // These are set by the player via the in-battle POWER menu when the
  // matching Vault unlock is owned. They persist for the rest of the
  // current battle unless otherwise noted. All three are off-by-default.
  /**
   * Active Terastallization type, e.g. 'fire'. When set, the damage
   * shim in App.tsx treats the attacker's type list as `[teraType]` for
   * STAB/defense purposes. One Tera per Pokémon per battle.
   */
  teraType?: string;
  /**
   * True while Mega Evolution is active for this battle. The damage
   * shim applies a flat 1.3x attack/spAtk multiplier. Globally one
   * Mega per battle.
   */
  megaActive?: boolean;
  /**
   * Next damaging move by this Pokémon deals 1.8x and bypasses
   * accuracy. Consumed after the next hit. One Z per battle (globally).
   */
  zCharged?: boolean;
}

export type WeatherType = 'none' | 'rain' | 'sun' | 'sand' | 'hail' | 'electric' | 'ashstorm' | 'grass' | 'snow';

export type TerrainType = 'none' | 'electric' | 'grassy' | 'misty' | 'psychic';

export interface BattleState {
  playerTeam: Pokemon[];
  enemyTeam: Pokemon[];
  turn: number;
  phase: 'start' | 'player_input' | 'execution' | 'end_game' | 'loading' | 'capture_anim';
  logs: string[];
  vfx?: { 
    type: string, 
    target: 'player' | 'enemy', 
    index: number, 
    moveName?: string,
    damage?: number, 
    isCrit?: boolean,
    isMiss?: boolean,
    isSuperEffective?: boolean,
    isNotVeryEffective?: boolean
  } | null;
  /** Screen shake intensity for the battle container. `null`/`false` = no shake.
   *  Strength is driven by damage / crit / effectiveness. Kept as a union
   *  instead of a number so App.tsx can animate a known set of keyframe
   *  displacements without repainting motion.config on every frame. */
  screenShake?: boolean | 'light' | 'medium' | 'heavy';
  /** Rift Pressure multiplier applied to enemy HP/Atk/SpA at fight start.
   *  1.0 = vanilla stats; 1.5 = +50% HP & offensive stats; etc.
   *  Surfaced so the player can see WHY enemies feel tanky/punchy here. */
  riftPressure?: number;
  battleStreak: number;
  pendingMoves: {
    actorIndex: number; 
    targetIndex: number; 
    move?: PokemonMove; // Optional if item used
    item?: string;
    isPlayer: boolean;
    isFusion?: boolean;
    speed: number;
    priority?: number;
    quickClawActivated?: boolean;
    switchIndex?: number;
  }[];
  activePlayerIndex: number;
  comboMeter: number; // 0 to 100
  fusionChargeActive?: boolean; // When 100, can trigger fusion
  enemyComboMeter: number; // 0 to 100 for enemy
  enemyFusionChargeActive?: boolean;
  mustSwitch?: boolean; // If true, player must switch a pokemon (e.g. after U-turn or faint)
  switchingActorIdx?: number; // The index of the pokemon that must be switched out
  isBatonPass?: boolean;
  enemyIsBatonPass?: boolean;
  isHealingWishActive?: boolean;
  enemyIsHealingWishActive?: boolean;
  isLunarDanceActive?: boolean;
  enemyIsLunarDanceActive?: boolean;
  playerSwitching?: boolean;
  enemySwitching?: boolean;
  switchingMonIndex?: number;
  enemySwitchingMonIndex?: number;
  ui: {
      selectionMode: 'MOVE' | 'TARGET' | 'ITEM' | 'SWITCH';
      selectedMove: PokemonMove | null;
      selectedItem?: string;
      isFusionNext?: boolean;
  };
  isTrainerBattle: boolean;
  isPvP?: boolean;
  currentTrainerId?: string; // To track win
  weather: WeatherType;
  weatherTurns?: number;
  terrain: TerrainType;
  terrainTurns?: number;
  tailwindTurns?: number;
  enemyTailwindTurns?: number;
  trickRoomTurns?: number;
  aegisFieldTurns?: number;
  enemyAegisFieldTurns?: number;
  electricSquallTurns?: number;
  enemyElectricSquallTurns?: number;
  runeWardTurns?: number;
  enemyRuneWardTurns?: number;
  mysticFogActive?: boolean;
  playerHazards?: string[];
  enemyHazards?: string[];
  reflectTurns?: number;
  enemyReflectTurns?: number;
  lightScreenTurns?: number;
  enemyLightScreenTurns?: number;
  auroraVeilTurns?: number;
  enemyAuroraVeilTurns?: number;
  gravityTurns?: number;
  wishTurns?: number;
  enemyWishTurns?: number;
  backgroundUrl?: string;
  // --- Rift Atelier v2 transform gating ---
  // Enforces canon-style "one Mega / one Z per battle" on the player
  // side. Each flips true the moment the player commits to using the
  // corresponding transform.
  playerUsedMegaThisBattle?: boolean;
  playerUsedZThisBattle?: boolean;
}

export enum GamePhase {
  MENU = 'MENU',
  META_MENU = 'META_MENU',
  STARTER_SELECT = 'STARTER_SELECT',
  OVERWORLD = 'OVERWORLD',
  BATTLE = 'BATTLE',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  SHOP = 'SHOP',
  NETWORK_MENU = 'NETWORK_MENU',
  PERK_SELECT = 'PERK_SELECT',
  BOUNTY_BOARD = 'BOUNTY_BOARD'
}

export interface Coordinate {
    x: number;
    y: number;
}

export interface MainQuestProgress {
    currentQuestId: string;
    completedQuests: string[];
}

/**
 * RIFT ATELIER v2 -- meta progression system.
 *
 * Two currencies drive permanent progression:
 *   - `riftEssence` is the common currency (wild battles, trainers, permits).
 *     Spent on Talents (one-time buys) and Keystones (level 0..cap stat
 *     tracks). Talents and Keystones can be refunded for 80% essence back
 *     via Refract.
 *   - `riftTokens` is a rare "chase" currency. Awarded by:
 *        - beating a Gym Leader (2)
 *        - beating a Rival milestone (3)
 *        - catching the species that appears on an Anomaly aura tile (1)
 *        - catching the Alpha that spawns on an Alpha aura tile (1)
 *        - the first encounter per Mass Outbreak chunk (1)
 *        - clearing a Rift Trial gauntlet (2)
 *     Spent on Vault unlocks, most notably the marquee battle mechanics
 *     Terastallization / Mega Evolution / Z-Moves.
 *
 * `talents` / `vaultUnlocks` are string-id lists (owned flags).
 * `keystones` is a map of id -> level (0..cap). Old saves' `upgrades`
 * object is migrated into `keystones` on first load; see `migrateMeta`
 * in `data/meta.ts`. `upgrades` remains only for backward compatibility
 * and is no longer written to.
 */
export interface MetaState {
    riftEssence: number;
    riftTokens: number;
    unlockedStarters: number[];
    unlockedPacks: string[]; // legacy -- no longer granted, kept for loading old saves
    mainQuestProgress: MainQuestProgress;

    /** Owned talent ids. One-time purchases with run-wide effects. */
    talents: string[];
    /** Owned vault unlock ids (e.g. `tera`, `mega`, `zmove`, `quick_swap`). */
    vaultUnlocks: string[];
    /** Keystone id -> current level. Stat boosts; replaces legacy upgrades. */
    keystones: Record<string, number>;

    /**
     * @deprecated Legacy upgrades object. Read-only fallback for saves
     * written before the Rift Atelier v2 redesign. `migrateMeta()` copies
     * these into `keystones` the first time a v1 save is loaded and this
     * field is then left at zeroes. New purchases never write here.
     */
    upgrades?: {
        startingMoney: number;
        attackBoost: number;
        defenseBoost: number;
        xpMultiplier: number;
        startingPermits: number;
        shinyChance: number;
        lootQuality: number;
        riftStability: number;
        mercenaryGuild: number;
        evolutionaryInsight: number;
        speedBoost: number;
        critBoost: number;
        healingBoost: number;
        captureBoost: number;
        essenceMultiplier: number;
    };
}

export interface RunConstraints {
    isNuzlocke: boolean;
    capturePermits: number; // Earned by defeating trainers/milestones
    totalCaptures: number;
    hasDied: boolean;
    distanceReached: number;
    maxDistanceReached: number; // For milestones
    badgesEarned: number;
    perks: string[];
}

export interface PlayerGlobalState {
    name: string;
    team: Pokemon[];
    position: Coordinate; // P1 Position (Host)
    p2Position: Coordinate; // P2 Position (Client)
    mapId: string; // Current "Area" or "Biome"
    chunkPos: Coordinate; // Current Chunk X, Y
    money: number;
    badges: number;
    inventory: {
        pokeballs: number;
        potions: number;
        revives: number;
        rare_candy: number;
        items: string[];
    };
    defeatedTrainers: string[]; // List of IDs e.g. "chunk_0_0_7_4"
    storyFlags: string[]; // For basic progression tracking
    nextEncounterRare?: boolean; // If true, next wild battle is rare
    /**
     * Rolling "catch combo" counter. Incremented when the player catches the
     * same species twice in a row, reset when a different species is caught
     * or the chain is broken (KO / flee / a fight where combo mon fainted).
     * At higher counts the combo improves IVs, shiny odds, and ball-throw
     * success on the tracked species -- see the catch handler in App.tsx.
     */
    catchCombo?: {
        speciesId: number;
        speciesName: string;
        count: number;
        best: number; // personal best across the run (for HUD pride)
    };
    /**
     * Active bounty slots posted by the Trainer's Guild at any Pokemon
     * Center. Progress ticks up via the catch / trainer-defeat / biome-
     * visit handlers. Up to 3 active at once; completed bounties are
     * cleared (not archived) and a fresh trio is rolled when the player
     * interacts with the board again.
     */
    bounties?: {
        active: Array<{
            id: string;              // uuid-lite, for dedupe
            templateId: string;      // matches data/bounties.ts template key
            description: string;     // materialized at roll time (may reference a species)
            targetSpeciesId?: number;
            targetType?: string;     // e.g. 'water', 'fire'
            targetTrainerKind?: string;
            targetCount: number;
            progress: number;
            rewardMoney: number;
            rewardItemId?: string;
            rewardPokemonId?: number;
            rewardLevel?: number;
            tier: 'common' | 'rare' | 'epic'; // drives reward quality
        }>;
        rerollAvailableAt: number; // wall-clock ms; cheap rate-limit on reroll
    };
    discoveredChunks: string[]; // Track explored areas for Discovery XP
    discoveryPoints: number; // For exploration rewards
    meta: MetaState;
    run: RunConstraints;
    /** Cumulative stats used for the Explorer Score leaderboard. Persists across runs. */
    lifetime?: {
        shiniesCaught: number;
        trainersDefeated: number;
        biggestStreak: number;
        currentStreak: number;
        totalMoneyEarned: number;
        graveyardsVisited: number;    // Evolving landmark counter
        visitedBiomes: string[];      // For first-time biome lore toasts
        riftStabilityCleared?: boolean;
    };
}

export interface GymMonLoadout {
    id: number;            // Pokedex id
    ability?: string;      // NEW_ABILITIES key, or standard poke-api ability slug
    heldItem?: { id: string; name: string };
    /** Moves that MUST appear in the final moveset; accepts poke-api slugs or NEW_MOVES keys. */
    ensureMoves?: string[];
    shiny?: boolean;
    levelDelta?: number;   // +/- from trainer's level for ace/sidekick pacing
}

export interface TrainerData {
    id: string; // unique id per map "x,y"
    name: string;
    sprite: string;
    team: number[]; // Pokedex IDs
    level: number;
    reward: number;
    dialogue: string;
    winDialogue: string;
    isGymLeader?: boolean;
    badgeId?: number;
    /** Optional per-mon competitive overrides. Length should equal team.length. */
    loadout?: GymMonLoadout[];
    /**
     * Archetype key (e.g. 'hiker', 'bugcatcher'). Used for flavor
     * dialogue variation and for Battle-Tower-style roster composition.
     * Undefined on gym leaders and story trainers.
     */
    archetype?: string;
    /**
     * If set, defeating THIS trainer automatically kicks off a battle
     * against the referenced trainer id in the SAME map -- the player's
     * team state (HP, status) is preserved between the fights. Used by
     * the route-duo "gauntlet" system. The linked trainer is rendered
     * normally on the overworld; the gauntlet just guarantees order.
     */
    gauntletNextTrainerId?: string;
    /**
     * Tier label for route/random trainers: 'rookie' | 'veteran' |
     * 'ace'. Drives visible difficulty stars and reward multipliers.
     */
    tier?: 'rookie' | 'veteran' | 'ace' | 'rival';
}

export interface NPCData {
    id: string;
    name: string;
    sprite: string; // url or key
    dialogue: string[];
    facing?: 'left'|'right'|'down'|'up';
    challenge?: {
        type: 'collect' | 'battle' | 'explore' | 'speed' | 'stealth' | 'type_trial';
        target: string;
        rewardPokemonId?: number;
        rewardLevel?: number;
        reward?: Pokemon; // Direct pokemon reward
        isCompleted?: boolean;
        timeLimit?: number; // For speed challenges
        requiredType?: string; // For type trials
    };
}

export interface InteractableData {
    // 'gym_compass' is handled specially by the interaction dispatcher in
    // App.tsx -- its `text` is ignored and instead freshly computed from the
    // player's current badge count + position so the sign always points to
    // the next unearned gym.
    type: 'sign' | 'object' | 'gym_compass';
    text: string[];
}

export interface MapZone {
    id: string;
    name: string;
    layout: number[][];
    portals: Record<string, string>;
    wildLevelRange: [number, number];
    isBoss?: boolean;
    isRift?: boolean; // Procedurally generated
    trainers?: Record<string, TrainerData>;
    npcs?: Record<string, NPCData>;
    interactables?: Record<string, InteractableData>;
    biome?: string;
}

export interface Chunk extends MapZone {
    x: number;
    y: number;
    /** Tags describing landmark POIs present in this chunk (e.g., 'graveyard', 'shipwreck'). */
    poiTags?: string[];
}
