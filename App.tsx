
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pokemon, PokemonMove, GamePhase, BattleState, PlayerGlobalState, Coordinate, TrainerData, WeatherType, TerrainType, StatBlock, StatStages, MetaState, StatName } from './types';
import { NEW_ABILITIES } from './data/abilities';
import { NEW_MOVES } from './data/moves';
import { getFusionMove } from './data/fusionChart';
import { motion, AnimatePresence } from 'motion/react';
import { 
    getWildPokemon, 
    calculateDamage, 
    gainExperience, 
    checkEvolution, 
    evolvePokemon, 
    fetchPokemon, 
    getDamageMultiplier, 
    calculateAccuracy,
    applySecondaryEffect,
    handleStatusTurn,
    handleEndOfTurnStatus,
    calculateStatsFull,
    getEvolutionTarget,
    TYPE_COLORS,
    getEffectiveDefensiveTypes,
} from './services/pokeService';
import { playSound, playCry, playMoveSfx, playEffectivenessSfx, playFaintSfx, playLevelUpSfx, playBGM, stopBGM, BGM_TRACKS, unlockAudio, getAudioStatus, clearAudioFails, prefetchMoveSfx } from './services/soundService';
import { MAPS, generateRiftMap, generateChunk, generateCaveMap, generatePuzzleMap, CHUNK_SIZE, WORLD_MAX_DIST, getNextGymTarget, compassDirectionName, getGrassAura, getChunkOutbreak } from './services/mapData';
import { applyBountyEvent, rollBounties } from './data/bounties';
import { ITEMS } from './services/itemData';
import { generateBattleBackground, MENU_BACKGROUND_URL, getStaticBackground } from './services/imageService';
import { multiplayer, NetworkPayload } from './services/multiplayer';
import { auth, signInAnon } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { HealthBar } from './components/HealthBar';
import { PokemonSprite } from './components/PokemonSprite';
import { StarterSelect } from './components/StarterSelect';
import { Overworld } from './components/Overworld';
import { CatchComboBadge } from './components/ui/CatchComboBadge';
import { BountyBoard } from './components/screens/BountyBoard';
import { ActionButton } from './components/ui/ActionButton';
import { MoveButton } from './components/ui/MoveButton';
import { MoveVFX } from './components/ui/MoveVFX';
import { BattleFxOverlay } from './components/ui/BattleFxOverlay';
import { EmoteOverlay } from './components/ui/EmoteOverlay';
import { SyncGauge } from './components/ui/SyncGauge';
import { AudioWidget } from './components/ui/AudioWidget';
import { QuestLog } from './components/screens/QuestLog';
import { PerkSelect } from './components/screens/PerkSelect';
import { OnlineMenu } from './components/screens/OnlineMenu';
import { ShopMenu } from './components/screens/ShopMenu';
import { MetaMenu } from './components/screens/MetaMenu';
import { PokemonSummary } from './components/screens/PokemonSummary';
import { PauseMenu } from './components/screens/PauseMenu';
import { MAIN_QUESTS } from './data/quests';
import { ToastStack, ToastEntry, ToastTier, makeToast } from './components/ui/Toast';
import { getPlayerLevelCap, getWildLevelCap, getPartyFloor, autoScaleTeamToFloor } from './utils/progression';
import { getDailyEvent } from './utils/dailyEvent';
import { computeExplorerScore, getNewlyUnlockedPerks, TITLES } from './utils/explorerScore';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { submitScore as submitExplorerScore, getSession as warmLeaderboardSession, getLastSubmittedName as getExplorerName } from './utils/leaderboard';
import { BIOME_LORE } from './data/biomeLore';
import { getHourlyMerchantChunk, getRoamingLegendary } from './utils/worldEvents';
import { BattlePopupLayer } from './components/ui/BattlePopupLayer';
import { popupAbility, popupStat, popupStatus, popupWeather, popupCrit, popupEffective, popupImmunity, popupItem, popupCustom } from './utils/battlePopupBus';
import { writeSave, loadSave, hasSave, deleteSave, exportSaveToString, importSaveFromString, getLastSavedAt, formatSavedAt } from './utils/saveGame';
import { EvolutionScene } from './components/screens/EvolutionScene';
import { TradeScreen, TradeOffer, TradeSession, makeEmptyOffer } from './components/screens/TradeScreen';
import {
    migrateMeta,
    hasTalent,
    hasVaultUnlock,
    getKeystoneLevel,
    warden_level,
    swift_level,
    swift_healMult,
    purse_essenceMult,
    purse_xpMult,
    purse_startingMoney,
    stability_scalingMult,
    catchers_catchMult,
    catchers_shinyTier,
    catchers_permitBonus,
    scavenger_dropBonus,
    scavenger_shopDiscount,
    scavenger_startItems,
    TOKEN_AWARDS,
} from './data/meta';
import { TERA_TYPES, MEGA_ELIGIBLE, MEGA_ATK_MULT, MEGA_DEF_MULT, Z_DAMAGE_MULT } from './data/riftForms';

const toPascalCase = (str: string) => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * RIVAL MILESTONES ------------------------------------------------------
 *
 * The rival intercepts the player the first time they cross each of
 * these chunk-distance thresholds. Acts as a pacing beat between gyms:
 * distance-based rather than badge-based so exploration-focused players
 * also hit them, and gym-rushers get them lined up nicely on the
 * way to the later gyms.
 *
 * Each team is built to be MEANINGFUL at that progression tier (not
 * trivially stomped), and unique rewards hint at the "growing up"
 * narrative: mid-game you get a held item, late-game you get an
 * evolution stone for a pseudo-legendary.
 *
 * All teams are >= 2 mons so the double-battle engine can deploy a
 * proper pair -- this is the invariant the multiplayer coop depends
 * on.
 */
interface RivalMilestone {
    dist: number;
    level: number;
    team: number[];
    greeting: string;
    loss: string;
    /** Reward item id dropped on win (in addition to money). */
    trophy?: string;
    /** Flat money bonus (tier reward). */
    money: number;
}
const RIVAL_MILESTONES: RivalMilestone[] = [
    {
        dist: 25, level: 26, team: [18, 59, 65, 134],
        greeting: "Well, look who wandered this far. Time to remind you who's better.",
        loss: "Tch. You got lucky. It won't happen again.",
        trophy: 'expert-belt',
        money: 2500,
    },
    {
        dist: 50, level: 46, team: [6, 59, 94, 130, 135],
        greeting: "Still at it? Then I'll put you down harder.",
        loss: "...You've actually gotten stronger. Damn.",
        trophy: 'weakness-policy',
        money: 6000,
    },
    {
        dist: 100, level: 70, team: [6, 149, 143, 130, 248, 59],
        greeting: "Champion-level territory. Nowhere to run this time.",
        loss: "Heh. Maybe I should start calling you rival.",
        trophy: 'fusion-core',
        money: 15000,
    },
    {
        dist: 150, level: 85, team: [6, 149, 248, 445, 373, 59],
        greeting: "You've gone farther than anyone I know. Except me.",
        loss: "Alright. You've earned the title.",
        trophy: 'chrono-prism',
        money: 28000,
    },
    {
        dist: 200, level: 95, team: [6, 149, 248, 445, 373, 384],
        greeting: "The edge of the world, and you're still going. One last match.",
        loss: "...Go. Show them what you are.",
        trophy: 'master-ball',
        money: 50000,
    },
];

function buildRivalTrainer(m: RivalMilestone): TrainerData {
    return {
        id: `rival_milestone_${m.dist}`,
        name: `Rival Gary -- Mile ${m.dist}`,
        sprite: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
        team: m.team,
        level: m.level,
        reward: m.money,
        dialogue: m.greeting,
        winDialogue: m.loss,
        tier: 'rival',
        archetype: 'rival',
    };
}

export default function App() {
  console.log('App Rendering: Start');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [playerState, setPlayerState] = useState<PlayerGlobalState>({
      name: 'Jonathan', // Default name from user email
      // Start at 9,9 (Center of room) to avoid spawning in wall
      team: [], position: { x: 9, y: 9 }, p2Position: { x: 10, y: 9 }, mapId: 'house_player',
      chunkPos: { x: 0, y: 0 },
      money: 500, badges: 0, inventory: { pokeballs: 0, potions: 5, revives: 2, rare_candy: 0, items: [] as string[] }, defeatedTrainers: [], storyFlags: [],
      discoveredChunks: [], discoveryPoints: 0,
      meta: {
          riftEssence: 0,
          riftTokens: 0,
          unlockedStarters: [1, 4, 7, 25, 133],
          unlockedPacks: [],
          mainQuestProgress: {
              currentQuestId: 'q1',
              completedQuests: []
          },
          talents: [],
          vaultUnlocks: [],
          keystones: {},
      },
      run: {
          isNuzlocke: true,
          capturePermits: 2, // Start with 2 permits
          totalCaptures: 0,
          hasDied: false,
          distanceReached: 0,
          maxDistanceReached: 0,
          badgesEarned: 0,
          perks: []
      },
      lifetime: {
          shiniesCaught: 0,
          trainersDefeated: 0,
          biggestStreak: 0,
          currentStreak: 0,
          totalMoneyEarned: 0,
          graveyardsVisited: 0,
          visitedBiomes: [],
          riftStabilityCleared: false,
      },
  });
  const [battleState, setBattleState] = useState<BattleState>({
    playerTeam: [], 
    enemyTeam: [], 
    turn: 1, 
    phase: 'loading', 
    logs: [], 
    pendingMoves: [],
    activePlayerIndex: 0, 
    comboMeter: 0, 
    enemyComboMeter: 0,
    ui: { selectionMode: 'MOVE', selectedMove: null },
    isTrainerBattle: false, 
    weather: 'none',
    terrain: 'none',
    playerHazards: [],
    enemyHazards: [],
    reflectTurns: 0,
    enemyReflectTurns: 0,
    lightScreenTurns: 0,
    enemyLightScreenTurns: 0,
    auroraVeilTurns: 0,
    enemyAuroraVeilTurns: 0,
    backgroundUrl: '',
    battleStreak: 0
  });
  const [caveLayouts, setCaveLayouts] = useState<Record<string, number[][]>>({});
  const [riftLayout, setRiftLayout] = useState<number[][] | null>(null);
  const [loadedChunks, setLoadedChunks] = useState<Record<string, any>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [networkRole, setNetworkRole] = useState<'none' | 'host' | 'client'>('none');
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [comboVfx, setComboVfx] = useState<boolean>(false);
  const [dialogue, setDialogue] = useState<string[] | null>(null);
  // Rift Transform (Tera / Mega / Z) picker modal state. Null while
  // closed; when set, the in-battle overlay shows the option chooser
  // for the currently active player mon.
  const [transformPicker, setTransformPicker] = useState<null | 'root' | 'tera'>(null);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const showToast = useCallback((message: string, tier: ToastTier = 'info', opts: { kicker?: string; ttl?: number } = {}) => {
    setToasts((prev) => [...prev, makeToast(message, tier, opts)]);
  }, []);
  const expireToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const dailyEventShown = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCooldown, setScanCooldown] = useState(0);
  // Evolution cinematic queue. Each entry has a `before` snapshot, the
  // fully-built `after` Pokemon, and an `onDone` callback that commits the
  // evolution (or the cancellation) to player state. The scene renders the
  // head of the queue; `onDone` shifts it.
  const [evolutionQueue, setEvolutionQueue] = useState<Array<{
      before: Pokemon;
      after: Pokemon;
      monUid: string | number;
      onDone?: (final: Pokemon) => void;
  }>>([]);
  const queueEvolution = useCallback((before: Pokemon, after: Pokemon, onDone?: (final: Pokemon) => void) => {
      setEvolutionQueue((prev) => [...prev, { before, after, monUid: before.id + ':' + before.name, onDone }]);
  }, []);
  // Save system: `hasExistingSave` is only read on the title screen so we
  // track it in state to trigger re-render after we write/delete.
  const [hasExistingSave, setHasExistingSave] = useState<boolean>(() => hasSave());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => getLastSavedAt());

  const refreshSaveMeta = useCallback(() => {
      setHasExistingSave(hasSave());
      setLastSavedAt(getLastSavedAt());
  }, []);

  const handleManualSave = useCallback(() => {
      const file = writeSave(playerState);
      if (file) {
          refreshSaveMeta();
          showToast('Game saved.', 'reward', { kicker: 'SAVE', ttl: 1800 });
      } else {
          showToast('Save failed -- storage may be full.', 'info', { kicker: 'SAVE' });
      }
  }, [playerState, refreshSaveMeta, showToast]);

  const handleLoadGame = useCallback(() => {
      const file = loadSave();
      if (!file) {
          showToast('No save found.', 'info', { kicker: 'LOAD' });
          return;
      }
      // v1 -> v2 meta migration: folds legacy `upgrades.*` into keystones
      // and seeds talents/vaultUnlocks/riftTokens defaults. Idempotent.
      const migrated: PlayerGlobalState = { ...file.player, meta: migrateMeta(file.player.meta) };
      setPlayerState(migrated);
      setPhase(GamePhase.OVERWORLD);
      setMusicStarted(true);
      showToast(`Welcome back, ${file.player.name || 'Trainer'}.`, 'reward', { kicker: 'LOAD', ttl: 2400 });
  }, [showToast]);

  const handleDeleteSave = useCallback(() => {
      deleteSave();
      refreshSaveMeta();
      showToast('Save erased.', 'info', { kicker: 'DELETE' });
  }, [refreshSaveMeta, showToast]);

  const handleExportSave = useCallback((): string | null => {
      // Always snapshot latest state first, then export -- otherwise players
      // could export a stale copy if they hadn't autosaved recently.
      writeSave(playerState);
      refreshSaveMeta();
      return exportSaveToString();
  }, [playerState, refreshSaveMeta]);

  const handleImportSave = useCallback((payload: string): boolean => {
      const file = importSaveFromString(payload);
      if (!file) return false;
      const migrated: PlayerGlobalState = { ...file.player, meta: migrateMeta(file.player.meta) };
      setPlayerState(migrated);
      refreshSaveMeta();
      showToast('Save imported.', 'reward', { kicker: 'IMPORT' });
      return true;
  }, [refreshSaveMeta, showToast]);

  // Autosave: debounced snapshot whenever meaningful player-progression
  // fields change. We intentionally DON'T save mid-battle (phase check)
  // because battleState snapshots would stomp animation/turn timers on
  // restore. Menu and Overworld are the only safe phases.
  const autosaveTimer = useRef<number | null>(null);
  useEffect(() => {
      if (phase !== GamePhase.OVERWORLD) return;
      if (!playerState.team || playerState.team.length === 0) return;
      if (autosaveTimer.current !== null) window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = window.setTimeout(() => {
          const file = writeSave(playerState);
          if (file) {
              setLastSavedAt(file.savedAt);
              setHasExistingSave(true);
          }
      }, 2500);
      return () => {
          if (autosaveTimer.current !== null) window.clearTimeout(autosaveTimer.current);
      };
  }, [
      phase,
      playerState.badges,
      playerState.team,
      playerState.money,
      playerState.inventory,
      playerState.run.maxDistanceReached,
      playerState.run.totalCaptures,
      playerState.discoveredChunks.length,
      playerState.defeatedTrainers.length,
      playerState.meta.riftEssence,
  ]);
  // Using a beautiful atmospheric gradient to avoid "real-life" photo issues and ensure it works for everyone
  const [menuBgUrl] = useState<string>('');

  useEffect(() => {
    // Fail-safe: never let the player get stuck on the loading screen if Firebase
    // Auth takes too long or anonymous sign-in is disabled. Single-player works
    // without a signed-in user; only multiplayer needs auth.currentUser.uid.
    const failsafe = window.setTimeout(() => setAuthLoading(false), 4000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthLoading(false);
        window.clearTimeout(failsafe);
        if (u.displayName) {
          setPlayerState(prev => ({ ...prev, name: u.displayName || 'Trainer' }));
        }
        // Warm the leaderboard session as soon as auth is available so the
        // duration-gate timer reflects total play-time, not time-since-submit.
        void warmLeaderboardSession();
      } else {
        // Kick off a silent anonymous sign-in. onAuthStateChanged will fire again
        // with the anonymous user when it succeeds.
        signInAnon().catch(() => {
          // Anonymous Auth disabled in the Firebase project — unblock the UI so
          // the player can at least play single-player.
          setAuthLoading(false);
          window.clearTimeout(failsafe);
        });
      }
    });

    return () => {
      window.clearTimeout(failsafe);
      unsubscribe();
    };
  }, []);

  // --- Leaderboard auto-submit --------------------------------------------
  // Once the player has opted in by submitting a name at least once, we quietly
  // push their running score every couple of minutes (and on badge/shiny gain)
  // so the public board always reflects recent progress without forcing them
  // to open the pause menu. Server-side clamps/duration-gate mean this can't
  // be abused; if any of the inputs actually regressed we skip.
  const lastAutoSnapshotRef = useRef<string>('');
  useEffect(() => {
      const savedName = getExplorerName();
      if (!savedName) return; // player hasn't submitted manually yet
      const inputs = {
          farthestDistance: playerState.run.maxDistanceReached,
          chunksDiscovered: playerState.discoveredChunks.length,
          badges: playerState.badges,
          totalCaptures: playerState.run.totalCaptures,
          shiniesCaught: playerState.lifetime?.shiniesCaught ?? 0,
          trainersDefeated: playerState.lifetime?.trainersDefeated ?? playerState.defeatedTrainers.length,
          biggestStreak: playerState.lifetime?.biggestStreak ?? 0,
          totalMoneyEarned: playerState.lifetime?.totalMoneyEarned ?? 0,
          riftStabilityCleared: playerState.lifetime?.riftStabilityCleared ?? false,
      };
      const signature = JSON.stringify(inputs);
      if (signature === lastAutoSnapshotRef.current) return;
      // Debounce: wait 20s before firing to avoid thrashing on every tick.
      const handle = window.setTimeout(() => {
          lastAutoSnapshotRef.current = signature;
          void submitExplorerScore(inputs, savedName).catch(() => { /* silent */ });
      }, 20_000);
      return () => window.clearTimeout(handle);
  }, [
      playerState.run.maxDistanceReached,
      playerState.discoveredChunks.length,
      playerState.badges,
      playerState.run.totalCaptures,
      playerState.lifetime?.shiniesCaught,
      playerState.lifetime?.trainersDefeated,
      playerState.lifetime?.biggestStreak,
      playerState.lifetime?.totalMoneyEarned,
      playerState.lifetime?.riftStabilityCleared,
      playerState.defeatedTrainers.length,
  ]);

  const [challengeState, setChallengeState] = useState<{
      type: 'speed' | 'stealth' | 'none';
      endTime?: number;
      npcId?: string;
      isActive: boolean;
  }>({ type: 'none', isActive: false });

  const battleStateRef = useRef<BattleState | null>(null);
  const networkRoleRef = useRef<'none' | 'host' | 'client'>('none');
  const phaseRef = useRef<GamePhase>(GamePhase.MENU);
  const isHostRef = useRef(false);
  const lastSyncRef = useRef("");
  const lastMapSyncRef = useRef("");
  const onDataRef = useRef<(data: any) => void>(() => {});
  // Transient flag: true when the *current* wild battle was triggered by
  // stepping on an "anomaly" aura tile. Read + cleared by the catch
  // handler so the player gets their capture permit refunded. Using a
  // ref (not playerState) keeps this out of the save file and dodges the
  // stale-state bug where a fled anomaly battle would leak a refund into
  // the next catch. Cleared unconditionally on return to OVERWORLD.
  const pendingAnomalyRef = useRef<false | 'rustling' | 'alpha' | 'anomaly'>(false);
  // One-shot species override for the next wild battle (used by Mass
  // Outbreak chunks). Cleared on every OVERWORLD re-entry.
  const pendingOutbreakRef = useRef<number | null>(null);
  // Remembers which outbreak chunks we've already shown the intro
  // toast for, so chunk re-entry isn't spammy. String key = "cx,cy".
  const seenOutbreakChunksRef = useRef<Set<string>>(new Set());
  // Gauntlet queue: after a trainer-battle victory, if the defeated
  // trainer had a `gauntletNextTrainerId`, we stash the next
  // TrainerData here. The effect below watches (phase, dialogue) and
  // fires the next startBattle when the victory dialogue closes, so
  // the player's team HP/status carries over untouched.
  const pendingGauntletNextRef = useRef<TrainerData | null>(null);
  // Rival intercept queue -- see RIVAL_MILESTONES below. The rival
  // ambushes the player when they FIRST cross a distance milestone.
  // We record which milestones have already fired via the
  // `rival_beaten_<n>` story flag so a milestone can't re-trigger
  // even after whiteout + reload. If the player flees, they can
  // retrigger at the next chunk transition past that milestone
  // (the ref gets set again in the movement handler).
  const pendingRivalRef = useRef<TrainerData | null>(null);

  const [remotePlayers, setRemotePlayers] = useState<Map<string, any>>(new Map());
  const [battleChallenge, setBattleChallenge] = useState<{ challengerId: string, playerInfo: any } | null>(null);

  // --- Trading ---
  // `playerContextMenu`: when a player clicks a remote sprite, show Battle/Trade choices.
  // `tradeRequest`: incoming "X wants to trade" prompt on the receiving side.
  // `tradeSession`: active trade UI state once both sides accept.
  const [playerContextMenu, setPlayerContextMenu] = useState<{ id: string; info: any } | null>(null);
  const [tradeRequest, setTradeRequest] = useState<{ fromId: string; fromName: string } | null>(null);
  const [tradeSession, setTradeSession] = useState<TradeSession | null>(null);
  const tradeSessionRef = useRef<TradeSession | null>(null);
  useEffect(() => { tradeSessionRef.current = tradeSession; }, [tradeSession]);
  const [isMultiplayerBattle, setIsMultiplayerBattle] = useState(false);
  const lastProcessedLogIndexRef = useRef(0);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [isBattleLead, setIsBattleLead] = useState(false);
  const [remoteBattleActions, setRemoteBattleActions] = useState<any[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('none');
  async function handleGiveItem(pokemon: Pokemon, itemId: string) {
      const item = ITEMS[itemId];
      if (!item) return;

      if (item.category === 'healing' || item.id === 'rare-candy') {
          let evolvedMon: Pokemon | null = null;
          
          setPlayerState(prev => {
              const newTeam = [...prev.team];
              const monIdx = newTeam.findIndex(p => p.id === pokemon.id && p.name === pokemon.name);
              if (monIdx === -1) return prev;

              const p = { ...newTeam[monIdx] };
              let newHp = p.currentHp;
              let newStatus = p.status;
              let leveledUp = false;
              
              if (itemId === 'potion') newHp = Math.min(p.maxHp, p.currentHp + 20);
              else if (itemId === 'super-potion') newHp = Math.min(p.maxHp, p.currentHp + 60);
              else if (itemId === 'hyper-potion') newHp = Math.min(p.maxHp, p.currentHp + 120);
              else if (itemId === 'max-potion') newHp = p.maxHp;
              else if (itemId === 'full-restore') { newHp = p.maxHp; newStatus = undefined; }
              else if (itemId === 'full-heal') { newStatus = undefined; }
              else if (itemId === 'revive' && p.isFainted) { newHp = Math.floor(p.maxHp / 2); p.isFainted = false; }
              else if (itemId === 'rare-candy') {
                  p.level = Math.min(100, p.level + 1);
                  p.stats = calculateStatsFull(p.baseStats, p.ivs, p.evs, p.level, p.nature);
                  p.maxHp = p.stats.hp;
                  p.currentHp = p.maxHp;
                  leveledUp = true;
              }
              
          p.currentHp = newHp;
          p.status = newStatus;
          newTeam[monIdx] = p;
          
          const newInventory = { ...prev.inventory };
          if (itemId === 'potion') newInventory.potions = Math.max(0, newInventory.potions - 1);
          else if (itemId === 'revive') newInventory.revives = Math.max(0, newInventory.revives - 1);
          else if (itemId === 'rare-candy') newInventory.rare_candy = Math.max(0, newInventory.rare_candy - 1);
          else {
              const idx = newInventory.items.indexOf(itemId);
              if (idx > -1) {
                  const updatedItems = [...newInventory.items];
                  updatedItems.splice(idx, 1);
                  newInventory.items = updatedItems;
              }
          }
          
          return { ...prev, team: newTeam, inventory: newInventory };
      });

      playLevelUpSfx();
      
      // Check for level-up evolution if rare candy was used
          if (itemId === 'rare-candy') {
              const canEvolve = await checkEvolution(pokemon);
              if (canEvolve) {
                  // Build the evolved form now (off the post-level-up snapshot
                  // so stat recomputation uses the new level) and queue the
                  // cinematic. The `onDone` callback writes back to state.
                  const postLevelMon = { ...pokemon, level: Math.min(100, pokemon.level + 1) };
                  const evo = await evolvePokemon(postLevelMon);
                  queueEvolution(postLevelMon, evo, (final) => {
                      setPlayerState(prev => ({
                          ...prev,
                          team: prev.team.map(p => p.id === pokemon.id && p.name === pokemon.name ? final : p),
                      }));
                  });
              }
          }
          return;
      }

      if (item.category === 'evolution') {
          const targetId = await getEvolutionTarget(pokemon, itemId);
          if (targetId) {
              const evo = await evolvePokemon(pokemon, itemId);

              // Burn the stone first so it's gone even if the player cancels.
              setPlayerState(prev => {
                  const newInventory = { ...prev.inventory };
                  const idx = newInventory.items.indexOf(itemId);
                  if (idx > -1) {
                      const updatedItems = [...newInventory.items];
                      updatedItems.splice(idx, 1);
                      newInventory.items = updatedItems;
                  }
                  return { ...prev, inventory: newInventory };
              });
              queueEvolution(pokemon, evo, (final) => {
                  setPlayerState(prev => ({
                      ...prev,
                      team: prev.team.map(p => p.id === pokemon.id && p.name === pokemon.name ? final : p),
                  }));
              });
          } else {
              setDialogue([`It had no effect...`]);
          }
          return;
      }

      setPlayerState(prev => {
          const newTeam = prev.team.map(p => {
              if (p.id === pokemon.id && p.name === pokemon.name) {
                  const oldItem = p.heldItem;
                  const newItem = itemId ? { id: itemId, name: ITEMS[itemId].name } : undefined;
                  
                  // Return old item to inventory if any
                  const newItems = [...prev.inventory.items];
                  if (oldItem) newItems.push(oldItem.id);
                  // Remove new item from inventory
                  if (itemId) {
                      const idx = newItems.indexOf(itemId);
                      if (idx > -1) newItems.splice(idx, 1);
                  }
                  
                  return { ...p, heldItem: newItem };
              }
              return p;
          });
          
          // Also update inventory
          const newInventory = { ...prev.inventory };
          const oldItem = pokemon.heldItem;
          if (oldItem) newInventory.items = [...newInventory.items, oldItem.id];
          if (itemId) {
              const idx = newInventory.items.indexOf(itemId);
              if (idx > -1) {
                  const updatedItems = [...newInventory.items];
                  updatedItems.splice(idx, 1);
                  newInventory.items = updatedItems;
              }
          }

          return { ...prev, team: newTeam, inventory: newInventory };
      });
      playLevelUpSfx();
  };




  function handleScan() {
    if (scanCooldown > 0) return;
    setIsScanning(true);
    setScanCooldown(15); // 15s cooldown
    setTimeout(() => setIsScanning(false), 5000); // 5s duration
    playSound('https://www.soundjay.com/button/sounds/button-16.mp3'); // Scan sound
    
    // Discovery Reward: Finding hidden items or points
    const roll = Math.random();
    if (roll < 0.7) { // Increased probability from 0.6 to 0.7
        const isRare = Math.random() < 0.1; // 10% chance for rare treasure
        const bonusMoney = isRare ? (Math.floor(Math.random() * 20000) + 15000) : (Math.floor(Math.random() * 10000) + 5000);
        const bonusPoints = isRare ? (Math.floor(Math.random() * 50) + 30) : (Math.floor(Math.random() * 20) + 10);
        const hasItem = Math.random() < 0.8;
        
        let itemMsg = "";
        let itemToGive: keyof typeof playerState.inventory | 'capturePermits' | 'riftEssence' | null = null;
        let countToGive = 0;

        if (hasItem) {
            const itemRoll = Math.random();
            
            if (itemRoll < 0.1) {
                itemToGive = 'rare_candy';
                countToGive = isRare ? 5 : 2;
            } else if (itemRoll < 0.3) {
                itemToGive = 'revives';
                countToGive = isRare ? 8 : 3;
            } else if (itemRoll < 0.6) {
                itemToGive = 'capturePermits';
                countToGive = isRare ? 3 : 1;
            } else {
                itemToGive = 'riftEssence';
                countToGive = isRare ? 25 : 10;
            }

            if (itemToGive === 'capturePermits') {
                itemMsg = ` and ${countToGive} CAPTURE PERMITS`;
            } else if (itemToGive === 'riftEssence') {
                itemMsg = ` and ${countToGive} RIFT ESSENCE`;
            } else {
                itemMsg = ` and ${countToGive} ${itemToGive.toUpperCase()}`;
            }
        }

        setPlayerState(prev => {
            const newInventory = { ...prev.inventory };
            let newRiftEssence = prev.meta.riftEssence;
            let newPermits = prev.run.capturePermits;

            if (itemToGive === 'capturePermits') {
                newPermits += countToGive;
            } else if (itemToGive === 'riftEssence') {
                newRiftEssence += countToGive;
            } else if (itemToGive) {
                newInventory[itemToGive] = (newInventory[itemToGive] || 0) + countToGive;
            }
            
            return { 
                ...prev, 
                money: prev.money + bonusMoney, 
                discoveryPoints: prev.discoveryPoints + bonusPoints,
                inventory: newInventory,
                meta: { ...prev.meta, riftEssence: newRiftEssence },
                run: { ...prev.run, capturePermits: newPermits },
                nextEncounterRare: isRare ? true : prev.nextEncounterRare
            };
        });
        const prefix = isRare ? "RARE DISCOVERY! " : "Scan complete! ";
        const rareMsg = isRare ? " A rare aura has been detected!" : "";
        setDialogue([prefix, `Found hidden cache: $${bonusMoney}, ${bonusPoints} Discovery Points${itemMsg}!${rareMsg}`]);
    } else {
        setDialogue(["Scan complete.", "No hidden treasures detected in the immediate vicinity."]);
    }
  };



  function startMultiplayerBattle(id: string, oppId: string, oppInfo: any, isLead: boolean) {
    setBattleId(id);
    setOpponentId(oppId);
    setIsBattleLead(isLead);
    setIsMultiplayerBattle(true);
    
    // Initialize battle state with opponent's team
    setBattleState(prev => ({
        ...prev,
        playerTeam: playerState.team,
        enemyTeam: oppInfo.team,
        isTrainerBattle: true,
        isPvP: true,
        phase: 'player_input',
        logs: [`Battle started with ${oppInfo.name}!`]
    }));
    setPhase(GamePhase.BATTLE);
    
    // Play initial cries
    if (playerState.team[0]) playCry(playerState.team[0].id, playerState.team[0].name);
    setTimeout(() => {
        if (oppInfo.team[0]) playCry(oppInfo.team[0].id, oppInfo.team[0].name);
    }, 500);
  };

  function handleChallengeResponse(accept: boolean) {
    if (!battleChallenge) return;
    if (accept) {
        multiplayer.send({
            type: 'BATTLE_ACCEPT',
            payload: {
                challengerId: battleChallenge.challengerId,
                acceptorInfo: { name: playerState.name, team: playerState.team },
                challengerInfo: battleChallenge.playerInfo
            }
        });
    }
    setBattleChallenge(null);
  };

  /* ----------------------------- Trading ------------------------------- */

  // Initiate a trade against a remote player.
  const handleStartTrade = useCallback((targetId: string, info: any) => {
    multiplayer.send({
        type: 'TRADE_EVENT',
        payload: { kind: 'REQUEST', targetId, fromName: playerState.name },
    });
    showToast(`Trade request sent to ${info?.name || 'Trainer'}...`, 'info', { ttl: 2500 });
    // Optimistic: open our own session waiting for accept.
    setPlayerContextMenu(null);
  }, [playerState.name, showToast]);

  // Local player responds to an incoming trade request.
  const handleTradeRequestResponse = useCallback((accept: boolean) => {
    if (!tradeRequest) return;
    if (accept) {
        // Open session on our side.
        setTradeSession({
            partnerId: tradeRequest.fromId,
            partnerName: tradeRequest.fromName || 'Trainer',
            myOffer: makeEmptyOffer(),
            partnerOffer: makeEmptyOffer(),
            phase: 'choose',
        });
        multiplayer.send({
            type: 'TRADE_EVENT',
            payload: { kind: 'ACCEPT', targetId: tradeRequest.fromId, fromName: playerState.name },
        });
    } else {
        multiplayer.send({
            type: 'TRADE_EVENT',
            payload: { kind: 'DECLINE', targetId: tradeRequest.fromId },
        });
    }
    setTradeRequest(null);
  }, [tradeRequest, playerState.name]);

  // Local player updated their offer -> broadcast to partner + update local session.
  const handleTradeOfferChange = useCallback((offer: TradeOffer) => {
    setTradeSession(prev => prev ? { ...prev, myOffer: offer } : prev);
    multiplayer.send({
        type: 'TRADE_EVENT',
        payload: { kind: 'OFFER', offer },
    });
  }, []);

  // Cancel the trade session on our side and notify partner.
  const handleTradeCancel = useCallback(() => {
    if (!tradeSession) return;
    multiplayer.send({
        type: 'TRADE_EVENT',
        payload: { kind: 'CANCEL' },
    });
    showToast('Trade cancelled.', 'info', { ttl: 2500 });
    setTradeSession(null);
  }, [tradeSession, showToast]);

  // Apply the trade atomically to our playerState, then close.
  // Both sides independently apply their own delta; the wire state is already
  // in sync because every OFFER broadcast carries the full offer payload.
  const handleTradeCommit = useCallback(() => {
    const session = tradeSessionRef.current;
    if (!session) return;
    const { myOffer, partnerOffer, partnerName } = session;

    setPlayerState(prev => {
        let team = [...prev.team];

        // 1. Remove the Pokemon we offered (using teamIndex captured at offer time).
        if (myOffer.pokemon) {
            const idx = typeof myOffer.pokemonTeamIndex === 'number'
                ? myOffer.pokemonTeamIndex
                : team.findIndex(m => m.id === myOffer.pokemon!.id && m.name === myOffer.pokemon!.name);
            if (idx >= 0) team.splice(idx, 1);
        }
        // 2. Add partner's Pokemon (as a freshly owned mon).
        if (partnerOffer.pokemon) {
            // Tag the mon so the player knows where it came from if we ever surface that.
            team.push({ ...partnerOffer.pokemon, animationState: 'idle' });
        }
        // Safety: never allow zero team (shouldn't hit this due to UI guard, but keep it.)
        if (team.length === 0) team = [...prev.team];

        // 3. Items delta
        const inv = { ...prev.inventory, items: [...prev.inventory.items] };
        const stackKey: Record<string, keyof typeof inv> = {
            'poke-ball': 'pokeballs' as any,
            'potion': 'potions' as any,
            'revive': 'revives' as any,
            'rare-candy': 'rare_candy' as any,
        };
        // Out-flow
        for (const it of myOffer.items) {
            if (it.stackable) {
                const k = stackKey[it.id];
                if (k) (inv as any)[k] = Math.max(0, ((inv as any)[k] || 0) - it.qty);
            } else {
                for (let n = 0; n < it.qty; n++) {
                    const idx = inv.items.indexOf(it.id);
                    if (idx >= 0) inv.items.splice(idx, 1);
                }
            }
        }
        // In-flow
        for (const it of partnerOffer.items) {
            if (it.stackable) {
                const k = stackKey[it.id];
                if (k) (inv as any)[k] = ((inv as any)[k] || 0) + it.qty;
            } else {
                for (let n = 0; n < it.qty; n++) inv.items.push(it.id);
            }
        }

        return { ...prev, team, inventory: inv };
    });

    // Cry the received Pokemon once they land home.
    if (partnerOffer.pokemon) {
        const mon = partnerOffer.pokemon;
        setTimeout(() => { try { playCry(mon.id, mon.name); } catch { /* noop */ } }, 400);
    }

    const summary: string[] = [];
    if (partnerOffer.pokemon) summary.push(partnerOffer.pokemon.name);
    if (partnerOffer.items.length > 0) summary.push(`${partnerOffer.items.length} item(s)`);
    showToast(
        summary.length > 0 ? `Received ${summary.join(' + ')} from ${partnerName}!` : `Trade complete with ${partnerName}!`,
        'reward', { ttl: 4500 }
    );
    setTradeSession(null);
  }, [showToast]);



  function handleRunEnd() {
      const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
      let essenceAwarded = Math.floor(distance / 2) + (playerState.badges * 5);
      essenceAwarded = Math.floor(essenceAwarded * purse_essenceMult(playerState.meta));
      
      setDialogue([
          "YOUR EXPEDITION HAS ENDED.",
          `You reached a distance of ${distance} KM.`,
          `You earned ${playerState.badges} Badges.`,
          `RIFT ESSENCE EARNED: ${essenceAwarded}`
      ]);

      setPlayerState(prev => {
          const startingPermits = 2 + catchers_permitBonus(prev.meta);
          const startingMoney = purse_startingMoney(prev.meta);

          // Scavenger Cache: start-of-run stash of random held items.
          const items: string[] = [];
          const startCount = scavenger_startItems(prev.meta);
          if (startCount > 0) {
              const pool = ['choice-band', 'life-orb', 'leftovers', 'focus-sash', 'expert-belt'];
              for (let i = 0; i < startCount; i++) {
                  items.push(pool[Math.floor(Math.random() * pool.length)]);
              }
          }

          // Wild Instinct talent: start a pinned catch-combo tracker so
          // the very first catch lands in a combo (we just store a
          // placeholder target species until the starter is picked).
          const startComboShell = hasTalent(prev.meta, 'wild_instinct')
              ? { speciesId: 0, speciesName: '(starter)', count: 0, best: prev.catchCombo?.best ?? 0 }
              : undefined;

          const prevLt = prev.lifetime ?? {
              shiniesCaught: 0, trainersDefeated: 0, biggestStreak: 0, currentStreak: 0,
              totalMoneyEarned: 0, graveyardsVisited: 0, visitedBiomes: [] as string[],
          };
          return {
              ...prev,
              meta: {
                  ...prev.meta,
                  riftEssence: prev.meta.riftEssence + essenceAwarded
              },
              run: {
                  isNuzlocke: true,
                  capturePermits: startingPermits,
                  totalCaptures: 0,
                  hasDied: false,
                  distanceReached: 0,
                  maxDistanceReached: 0,
                  badgesEarned: 0,
                  perks: []
              },
              team: [],
              money: startingMoney,
              badges: 0,
              chunkPos: { x: 0, y: 0 },
              position: { x: 9, y: 9 },
              mapId: 'house_player',
              inventory: { pokeballs: 0, potions: 5, revives: 0, rare_candy: 0, items: items },
              defeatedTrainers: [],
              discoveredChunks: [],
              discoveryPoints: 0,
              // Strip run-scoped story flags so rival milestones etc.
              // re-trigger in the new run. Keystone-level flags (the
              // `unlocked_*` ones) would live on meta, not here.
              storyFlags: prev.storyFlags.filter(f => !f.startsWith('rival_') && !f.startsWith('outbreak_token_') && f !== 'second_wind_used'),
              catchCombo: startComboShell,
              // Stash the run-start timestamp so Rift Ledger (2x tokens
              // in the first hour) can reliably query it.
              lifetime: { ...prevLt, runStartedAt: Date.now() } as any,
          };
      });
      setPhase(GamePhase.MENU);
  };

  const myPokemonIndex = networkRole === 'host' ? 0 : (networkRole === 'client' ? 1 : battleState.activePlayerIndex);
  const activePlayer = battleState.playerTeam[myPokemonIndex];
  const isTargeting = battleState.ui.selectionMode === 'TARGET';
  const isBagMode = battleState.ui.selectionMode === 'ITEM';
  const isSwitchMode = battleState.ui.selectionMode === 'SWITCH';
  
  const isTrapped = activePlayer && activePlayer.ability.name !== 'PhaseStep' && (
      (activePlayer.isTrapped && activePlayer.isTrapped > 0) ||
      battleState.enemyTeam.some(e => {
          if (e.isFainted) return false;
          if (e.ability.name === 'MagneticField' && activePlayer.types.map(t => t.toLowerCase()).includes('steel')) return true;
          if (e.ability.name === 'ShadowTagger' && activePlayer.currentHp < e.currentHp) return true;
          return false;
      })
  );
  
  const hasSelected = battleState.pendingMoves.some(m => m.actorIndex === myPokemonIndex);
  const isMyTurn = !hasSelected && (
      networkRole === 'none' || 
      (networkRole === 'host' && myPokemonIndex === 0) || 
      (networkRole === 'client' && myPokemonIndex === 1)
  );
  


  function queueAction(targetIndex: number, item?: string, move?: PokemonMove, isFusion?: boolean, switchIndex?: number, forcedActorIndex?: number) {
      if (battleState.mustSwitch) {
          if (switchIndex !== undefined) {
              setBattleState(prev => {
                  const newTeam = [...prev.playerTeam];
                  const actorIdx = prev.switchingActorIdx;
                  const temp = newTeam[actorIdx];
                  newTeam[actorIdx] = newTeam[switchIndex];
                  newTeam[switchIndex] = temp;
                  
                  const nextMustSwitch = newTeam.some((p, i) => i < 2 && p.isFainted && newTeam.slice(2).some(bp => !bp.isFainted));
                  const nextSwitchingIdx = newTeam.findIndex((p, i) => i < 2 && p.isFainted && newTeam.slice(2).some(bp => !bp.isFainted));

                  return {
                      ...prev,
                      playerTeam: newTeam,
                      mustSwitch: nextMustSwitch,
                      switchingActorIdx: nextSwitchingIdx,
                      activePlayerIndex: nextMustSwitch ? nextSwitchingIdx : 0,
                      ui: { selectionMode: nextMustSwitch ? 'SWITCH' : 'MOVE', selectedMove: null }
                  };
              });
              return;
          }
      }

      if (isMultiplayerBattle) {
          const currentActorIndex = forcedActorIndex !== undefined ? forcedActorIndex : battleState.activePlayerIndex;
          const actor = battleState.playerTeam[currentActorIndex];
          let speed = actor.stats.speed;
          
          // Speed Stat Stages
          const speedStage = actor.statStages?.speed || 0;
          if (speedStage > 0) speed *= (1 + 0.5 * speedStage);
          else if (speedStage < 0) speed *= (1 / (1 + 0.5 * Math.abs(speedStage)));

          // Meta Upgrades -- Swift Ring keystone: +5% speed per level
          speed *= (1 + swift_level(playerState.meta) * 0.05);

          if (actor.status === 'paralysis') speed *= 0.5;
          if (actor.heldItem?.id === 'choice-scarf') speed *= 1.5;
          if (actor.heldItem?.id === 'iron-ball') speed *= 0.5;
          if (actor.heldItem?.id === 'lagging-tail') speed *= 0.1;

          const priority = (item || switchIndex !== undefined) ? 6 : (move?.priority || 0);
          
          const action = { actorIndex: currentActorIndex, targetIndex, move, item, isPlayer: true, isFusion, speed, priority, switchIndex };
          
          setBattleState(prev => {
              const newPending = [...prev.pendingMoves, action];
              const livingPlayers = prev.playerTeam.filter(p => !p.isFainted).length;
              const activePlayerCount = Math.min(2, livingPlayers);
              
              if (newPending.length >= activePlayerCount) {
                  multiplayer.send({
                      type: 'BATTLE_ACTION',
                      payload: {
                          battleId,
                          targetId: opponentId,
                          action: newPending
                      }
                  });
                  const nextPhase = remoteBattleActions.length > 0 ? 'execution' : 'waiting_for_opponent';
                  return { 
                      ...prev, 
                      pendingMoves: newPending, 
                      phase: nextPhase as any, 
                      activePlayerIndex: 0,
                      logs: nextPhase === 'waiting_for_opponent' ? [...prev.logs, "Waiting for opponent..."] : prev.logs 
                  };
              } else {
                  let nextIndex = prev.activePlayerIndex + 1;
                  while (nextIndex < prev.playerTeam.length && prev.playerTeam[nextIndex].isFainted) nextIndex++;
                  if (nextIndex >= 2) {
                      multiplayer.send({
                          type: 'BATTLE_ACTION',
                          payload: {
                              battleId,
                              targetId: opponentId,
                              action: newPending
                          }
                      });
                      const nextPhase = remoteBattleActions.length > 0 ? 'execution' : 'waiting_for_opponent';
                      return { 
                          ...prev, 
                          pendingMoves: newPending, 
                          phase: nextPhase as any, 
                          activePlayerIndex: 0,
                          logs: nextPhase === 'waiting_for_opponent' ? [...prev.logs, "Waiting for opponent..."] : prev.logs 
                      };
                  }
                  return { ...prev, pendingMoves: newPending, activePlayerIndex: nextIndex };
              }
          });
          return;
      }
      const currentActorIndex = forcedActorIndex !== undefined ? forcedActorIndex : battleState.activePlayerIndex;
      const actor = battleState.playerTeam[currentActorIndex];

      if (switchIndex !== undefined) {
          if (actor.trappedTurns && actor.trappedTurns > 0) {
              setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} is trapped and cannot switch!`] }));
              return;
          }
          // Shadow Tagger Ability
          const opponentWithShadowTagger = battleState.enemyTeam.find(mon => mon && !mon.isFainted && mon.ability.name === 'ShadowTagger' && mon.currentHp > actor.currentHp);
          if (opponentWithShadowTagger) {
              setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} is trapped by ${opponentWithShadowTagger.name}'s Shadow Tagger!`] }));
              return;
          }
      }

      const isFusionMove = isFusion || battleState.ui.isFusionNext;
      if (move && isFusionMove) {
          move.isFusion = true;
      }

      // Choice Item Lock
      if (actor.heldItem?.id.startsWith('choice-') && actor.choiceMove && move && move.name !== actor.choiceMove) {
          setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} is locked into ${actor.choiceMove} by its ${actor.heldItem?.name}!`] }));
          return;
      }

      // Assault Vest Lock
      if (actor.heldItem?.id === 'assault-vest' && move && move.damage_class === 'status') {
          setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} cannot use status moves with an Assault Vest!`] }));
          return;
      }
      
      let speed = (actor?.stats.speed || 0) * (1 + swift_level(playerState.meta) * 0.05);
      if (actor.status === 'paralysis') speed *= 0.5;
      if (actor.heldItem?.id === 'choice-scarf') speed *= 1.5;
      if (actor.heldItem?.id === 'lagging-tail') speed *= 0.5;
      if (actor.heldItem?.id === 'iron-ball') speed *= 0.5;
      
      // Shared Nerves: When user is paralyzed, ally's Speed is doubled
      const allyIdx = 1 - currentActorIndex;
      const ally = battleState.playerTeam[allyIdx];
      // Slipstream: Speed +1 after Flying move
      if (actor.ability.name === 'Slipstream' && actor.lastMoveName?.toLowerCase().includes('flying')) {
          speed *= 1.5;
      }

      // Threat Matrix: Speed increased by 50% if opponent has higher Attack or Sp. Atk
      if (actor.ability.name === 'ThreatMatrix') {
          const opponents = battleState.enemyTeam.filter(o => o && !o.isFainted);
          const hasHigherOffense = opponents.some(o => o.stats.attack > actor.stats.attack || o.stats.specialAttack > actor.stats.specialAttack);
          if (hasHigherOffense) speed *= 1.5;
      }

      let priority = (item || switchIndex !== undefined) ? 6 : (move?.priority || 0);
      
      // Thunderous Step: Electric moves +1 priority at full HP
      if (actor.ability.name === 'ThunderousStep' && move?.type === 'Electric' && actor.currentHp === actor.maxHp) {
          priority += 1;
      }
      
      // Sound Channel: Sound moves +1 priority
      if (actor.ability.name === 'SoundChannel' && move?.isSound) {
          priority += 1;
      }

      // Link Conduit Ability (Backline)
      const backline = battleState.playerTeam.filter(p => p && !p.isFainted && p.id !== actor.id);
      if (backline.some(p => p.ability.name === 'LinkConduit') && move?.name.toLowerCase().includes('link')) {
          priority += 1;
      }

      if (actor.nextMovePriorityBoost && move) {
          priority += 1;
          actor.nextMovePriorityBoost = false; // Reset
      }

      // Link Crystal (held item): fusion moves gain +1 priority, ONCE per
      // battle. We stash the used-flag on the actor so it resets between
      // battles (Pokemon objects are cloned per-encounter in setup).
      if (isFusionMove && actor.heldItem?.id === 'link-crystal' && !(actor as any)._usedLinkCrystal) {
          priority += 1;
          (actor as any)._usedLinkCrystal = true;
      }

      const action = { actorIndex: currentActorIndex, targetIndex, move, item, isPlayer: true, isFusion: isFusionMove, speed, priority, switchIndex };
      setBattleState(prev => {
          const newPending = [...prev.pendingMoves, action];
          const livingPlayers = prev.playerTeam.filter(p => !p.isFainted).length;
          const activePlayerCount = Math.min(2, livingPlayers);
          
          if (newPending.length >= activePlayerCount) return { ...prev, pendingMoves: newPending, phase: 'execution', activePlayerIndex: 0, ui: { selectionMode: 'MOVE', selectedMove: null, isFusionNext: false } };
          let nextIndex = prev.activePlayerIndex + 1;
          while (nextIndex < prev.playerTeam.length && prev.playerTeam[nextIndex].isFainted) nextIndex++;
          
          if (nextIndex >= 2) return { ...prev, pendingMoves: newPending, phase: 'execution', activePlayerIndex: 0, ui: { selectionMode: 'MOVE', selectedMove: null, isFusionNext: false } };
          
          return { ...prev, pendingMoves: newPending, activePlayerIndex: nextIndex, ui: { selectionMode: 'MOVE', selectedMove: null, isFusionNext: false } };
      });
  };

  function handleTargetSelect(targetIndex: number) {
      unlockAudio();
      if (battleState.ui.selectionMode === 'TARGET') {
          const move = battleState.ui.selectedMove;
          const item = battleState.ui.selectedItem;
          
          if (networkRole === 'client') {
              multiplayer.send({
                  type: 'INPUT_BATTLE_ACTION',
                  payload: { targetIndex, item, move, isFusion: battleState.ui.isFusionNext, activePlayerIndex: 1 }
              });
              setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE', selectedMove: null, selectedItem: null } }));
          } else {
              if (item === 'combo') queueAction(targetIndex, 'combo');
              else if (move) queueAction(targetIndex, undefined, move);
              else queueAction(targetIndex, 'pokeball');
          }
      }
  };

  function handleRun() {
      if (networkRole === 'client') {
          multiplayer.send({ type: 'INPUT_MENU', payload: 'RUN' });
          return;
      }
      if (battleState.isTrainerBattle) {
          setBattleState(prev => ({...prev, logs: [...prev.logs, "Can't run from a trainer battle!"]}));
      } else if (isTrapped) {
          setBattleState(prev => ({...prev, logs: [...prev.logs, `${activePlayer.name} is trapped and cannot run!`]}));
      } else {
          const canAlwaysRun = playerState.team.some(p => p.heldItem?.id === 'smoke-ball' && !p.isFainted);
          if (canAlwaysRun) {
              setPhase(GamePhase.OVERWORLD);
              setDialogue(["Got away safely using the Smoke Ball!"]);
          } else {
              setPhase(GamePhase.OVERWORLD);
              setDialogue(["Got away safely!"]);
          }
      }
  };



  function handleInteraction(playerNum: 1 | 2) {
      if (networkRole === 'client' && playerNum === 1) return; 
      const pos = playerNum === 1 ? playerState.position : playerState.p2Position;
      
      let currentMap;
      if (playerState.mapId.startsWith('chunk_')) {
          currentMap = loadedChunks[playerState.mapId];
      } else {
          currentMap = MAPS[playerState.mapId];
      }
      if (!currentMap) return;

      const checkDirs = [{x:0, y:0}, {x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
      
      for (const offset of checkDirs) {
          const targetX = pos.x + offset.x;
          const targetY = pos.y + offset.y;
          const key = `${targetX},${targetY}`;
          
          const layout = (playerState.mapId === 'rift' && riftLayout) ? riftLayout : 
                         (playerState.mapId.startsWith('cave_') && caveLayouts[playerState.mapId]) ? caveLayouts[playerState.mapId] :
                         currentMap.layout;
          const itemFlag = `item_${playerState.mapId}_${targetX}_${targetY}`;
          
          if (layout && layout[targetY] && layout[targetY][targetX] !== undefined) {
              const tile = layout[targetY][targetX];
              
              // Item Ball
              if (tile === 12 && !playerState.storyFlags.includes(itemFlag)) {
                  const roll = Math.random();
                  let randomItem: keyof typeof playerState.inventory | 'riftEssence' = 'potions';
                  let qty = Math.floor(Math.random() * 3) + 1;
                  
                  if (roll < 0.4) randomItem = 'potions';
                  else if (roll < 0.7) randomItem = 'revives';
                  else {
                      randomItem = 'riftEssence';
                      qty = Math.floor(Math.random() * 5) + 5;
                  }

                  setPlayerState(prev => {
                      if (randomItem === 'riftEssence') {
                          return {
                              ...prev,
                              meta: { ...prev.meta, riftEssence: prev.meta.riftEssence + qty },
                              storyFlags: [...prev.storyFlags, itemFlag]
                          };
                      }
                      return {
                          ...prev,
                          inventory: { ...prev.inventory, [randomItem]: (prev.inventory[randomItem as keyof typeof prev.inventory] || 0) + qty },
                          storyFlags: [...prev.storyFlags, itemFlag]
                      };
                  });
                  setDialogue([`You found ${qty} ${randomItem === 'riftEssence' ? 'RIFT ESSENCE' : randomItem.toUpperCase()}!`, `Put it in your Bag.`]);
                  return;
              }

              // Berry Tree
              if (tile === 56 && !playerState.storyFlags.includes(itemFlag)) {
                  const qty = Math.floor(Math.random() * 2) + 1;
                  setPlayerState(prev => ({
                      ...prev,
                      inventory: { ...prev.inventory, potions: prev.inventory.potions + qty },
                      storyFlags: [...prev.storyFlags, itemFlag]
                  }));
                  setDialogue([`You picked ${qty} Berries!`, `They work just like Potions.`]);
                  return;
              }

              // Healing Spring
              if (tile === 66) {
                  setPlayerState(prev => ({ ...prev, team: prev.team.map(p => ({ ...p, currentHp: p.maxHp, isFainted: false })) }));
                  setDialogue(["Your team was fully healed by the spring!"]);
                  return;
              }

              // Weather Shrine
              if (tile === 65) {
                  const weathers: WeatherType[] = ['rain', 'sun', 'sand', 'hail'];
                  const next = weathers[Math.floor(Math.random() * weathers.length)];
                  setCurrentWeather(next);
                  setDialogue([`The shrine glows with a strange light...`, `The weather has changed to ${next.toUpperCase()}!`]);
                  return;
              }

              // Power Shrine
              if (tile === 67 && !playerState.storyFlags.includes(itemFlag)) {
                  setPlayerState(prev => ({
                      ...prev,
                      inventory: { ...prev.inventory, potions: prev.inventory.potions + 3 },
                      storyFlags: [...prev.storyFlags, itemFlag]
                  }));
                  setDialogue(["The stone pulses with energy...", "You found 3 Potions!"]);
                  return;
              }
          }

          if (layout && layout[targetY] && layout[targetY][targetX] !== undefined) {
              const tile = layout[targetY][targetX];
              
              // Fishing Logic
              if (tile === 3 && playerState.storyFlags.includes('has_rod')) {
                  const roll = Math.random();
                  if (roll < 0.3) {
                      setDialogue(["Something bit!", "A wild Magikarp appeared!"]);
                      startBattle(1, false, false); // Wild battle
                  } else {
                      setDialogue(["Not even a nibble..."]);
                  }
                  return;
              }

              // Co-op Puzzle Logic
              if (tile === 68) { // Rift Portal / Puzzle Switch
                  const p1OnSwitch = playerState.position.x === targetX && playerState.position.y === targetY;
                  const p2OnSwitch = playerState.p2Position.x === targetX && playerState.p2Position.y === targetY;
                  
                  // Find the other switch
                  let otherSwitch: Coordinate | null = null;
                  for (const [k, n] of Object.entries(currentMap.npcs || {})) {
                      const npc = n as any;
                      if (npc.id.startsWith('switch_') && k !== key) {
                          const [ox, oy] = k.split(',').map(Number);
                          otherSwitch = { x: ox, y: oy };
                          break;
                      }
                  }

                  const p1OnOther = otherSwitch && playerState.position.x === otherSwitch.x && playerState.position.y === otherSwitch.y;
                  const p2OnOther = otherSwitch && playerState.p2Position.x === otherSwitch.x && playerState.p2Position.y === otherSwitch.y;

                  if ((p1OnSwitch && p2OnOther) || (p2OnSwitch && p1OnOther)) {
                      setDialogue(["The rift stabilizes!", "A secret path has opened!"]);
                      // Open the gate (tile 21)
                      const [sx, sy] = key.split(',').map(Number);
                      const gateX = sx + (otherSwitch!.x - sx) / 2;
                      const gateY = sy - 1;
                      
                      if (playerState.mapId.startsWith('chunk_')) {
                          const newLayout = [...currentMap.layout.map((r: any) => [...r])];
                          if (newLayout[gateY]) newLayout[gateY][gateX] = 4; // Path
                          setLoadedChunks(prev => ({
                              ...prev,
                              [playerState.mapId]: { ...currentMap, layout: newLayout }
                          }));
                      }
                      setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, 'rift_portal_open'] }));
                  } else {
                      setDialogue(["The portal flickers...", "It seems to require two people standing on the switches simultaneously."]);
                  }
                  return;
              }
          }

          if (currentMap.npcs?.[key]) {
              const npc = currentMap.npcs[key];
              
              if (npc.name === "Fisherman" && !playerState.storyFlags.includes('has_rod')) {
                  setDialogue(["You look like a natural!", "Take this Old Rod. Use it near water!"]);
                  setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, 'has_rod'] }));
                  return;
              }

              if (npc.id === 'guild_clerk') {
                  // If the player has no active slate, roll a fresh trio so
                  // the first visit immediately shows available contracts.
                  if (!playerState.bounties || playerState.bounties.active.length === 0) {
                      const fresh = rollBounties({
                          playerBadges: playerState.badges,
                          maxDistance: playerState.run.maxDistanceReached,
                          // Talent: Bounty Broker expands the slate from 3 to 4.
                          slateSize: hasTalent(playerState.meta, 'bounty_broker') ? 4 : 3,
                      });
                      setPlayerState(prev => ({
                          ...prev,
                          bounties: { active: fresh, rerollAvailableAt: Date.now() },
                      }));
                  }
                  setPhase(GamePhase.BOUNTY_BOARD);
                  return;
              }

              if (npc.challenge) {
                  const challengeKey = `challenge_${npc.id}`;
                  if (playerState.storyFlags.includes(challengeKey)) {
                      setDialogue(["You've already completed my challenge!", "Good luck on your journey!"]);
                  } else {
                      setDialogue([
                          `CHALLENGE: ${npc.challenge.type.toUpperCase()} ${npc.challenge.target}`,
                          npc.dialogue[0],
                          "Would you like to accept? (Press Enter to continue)"
                      ]);
                      
                      // For now, let's simplify: if it's a battle challenge, start battle.
                      // If it's collect, check inventory.
                      if (npc.challenge.type === 'battle') {
                          startBattle(1, true, true, {
                              id: npc.id,
                              name: npc.name,
                              sprite: npc.sprite,
                              level: 15,
                              team: [npc.challenge.target as any],
                              isGymLeader: false,
                              reward: 500,
                              dialogue: "Let's see what you've got!",
                              winDialogue: "Impressive!"
                          });
                          setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, challengeKey] }));
                      } else if (npc.challenge.type === 'speed') {
                          setChallengeState({
                              type: 'speed',
                              isActive: true,
                              endTime: Date.now() + (npc.challenge.timeLimit || 15) * 1000,
                              npcId: npc.id
                          });
                          setDialogue(["GO! Reach the edge of the region!"]);
                      } else if (npc.challenge.type === 'stealth') {
                          setChallengeState({
                              type: 'stealth',
                              isActive: true,
                              npcId: npc.id
                          });
                          setDialogue(["Move carefully. Don't let the guards see you!"]);
                      } else if (npc.challenge.type === 'type_trial') {
                          const requiredType = npc.challenge.requiredType || 'normal';
                          const allMatch = playerState.team.every(p => p.types.includes(requiredType));
                          if (allMatch) {
                              setDialogue([`You have mastered the ${requiredType.toUpperCase()} type!`, "Take this reward."]);
                              setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, challengeKey] }));
                          } else {
                              setDialogue([`I only speak to those who master the ${requiredType.toUpperCase()} type.`, "Come back with a team of only that type!"]);
                          }
                      } else if (npc.challenge.type === 'collect') {
                          if (npc.name === 'Trader') {
                              // Trade lead pokemon for reward
                              const lead = playerState.team[0];
                              setDialogue([`You traded your ${lead.name}!`, `You received ${npc.challenge.reward.name}!`]);
                              setPlayerState(prev => ({
                                  ...prev,
                                  team: [npc.challenge!.reward, ...prev.team.slice(1)],
                                  storyFlags: [...prev.storyFlags, challengeKey]
                              }));
                              return;
                          }
                          // Check if player has the item (e.g. potions)
                          if (playerState.inventory.potions >= 5) {
                              setDialogue(["Amazing! You collected enough items.", `Here is your reward: ${npc.challenge.reward.name}!`]);
                              setPlayerState(prev => ({
                                  ...prev,
                                  team: [...prev.team, npc.challenge!.reward],
                                  inventory: { ...prev.inventory, potions: prev.inventory.potions - 5 },
                                  storyFlags: [...prev.storyFlags, challengeKey]
                              }));
                          } else {
                              setDialogue(["I need 5 Potions to see if you're worthy.", "Come back when you have them!"]);
                          }
                      }
                  }
              } else if (npc.name === 'Gambler') {
                  const win = Math.random() > 0.5;
                  const bet = 100;
                  setDialogue(npc.dialogue.concat(win ? [`You won the coin toss! Got $${bet*2}.`] : [`You lost the toss... Lost $${bet}.`]));
                  setPlayerState(prev => ({ ...prev, money: prev.money + (win ? bet : -bet) }));
              } else {
                  setDialogue(npc.dialogue);
              }
              return;
          }
          if (currentMap.interactables?.[key]) { 
              const interactable = currentMap.interactables[key];

              // Gym compass signpost: dynamically compute direction to the
              // player's next unearned gym so the same sign stays useful
              // across the whole run. Pre-baked text on the interactable is
              // ignored in this branch.
              if (interactable.type === 'gym_compass') {
                  const target = getNextGymTarget(playerState.badges);
                  if (!target) {
                      // All 8 badges cleared -- point to the rift ring.
                      setDialogue([
                          "The signpost is etched with swirling sigils.",
                          "'When the eight are bound, seek the rift at the edge of the world.'",
                          "(All 8 gyms cleared. Travel to distance 50 in any direction.)"
                      ]);
                  } else {
                      // currentMap.id is 'chunk_CX_CY' for overworld chunks.
                      // Extract the player's current chunk to compute a
                      // compass direction from here to the next gym.
                      let pcx = 0, pcy = 0;
                      const m = currentMap.id.match(/^chunk_(-?\d+)_(-?\d+)$/);
                      if (m) {
                          pcx = parseInt(m[1], 10);
                          pcy = parseInt(m[2], 10);
                      }
                      const dx = target.cx - pcx;
                      const dy = target.cy - pcy;
                      const chunkDist = Math.round(Math.sqrt(dx * dx + dy * dy));
                      const dirName = compassDirectionName(dx, dy).toUpperCase();
                      if (chunkDist === 0) {
                          setDialogue([
                              `"The next challenger's hall stands right here."`,
                              `(Gym ${target.badge} is in this very chunk. Look around!)`
                          ]);
                      } else {
                          setDialogue([
                              `A weathered wooden signpost, freshly carved.`,
                              `"Gym ${target.badge} lies to the ${dirName}."`,
                              `"Roughly ${chunkDist} chunks further. Press on, challenger."`
                          ]);
                      }
                  }
                  return;
              }

              // Special interactable logic: Statue Riddle
              if (interactable.text.some(t => t.includes("creature of the deep"))) {
                  const leadPokemon = playerState.team[0];
                  if (leadPokemon && leadPokemon.types.includes('water')) {
                      setDialogue(["The statue glows blue!", "You received a Mystic Water! (+$1000)"]);
                      setPlayerState(prev => ({ ...prev, money: prev.money + 1000, storyFlags: [...prev.storyFlags, `riddle_${key}`] }));
                      return;
                  }
              }

              setDialogue(interactable.text); 
              
              // Hidden item mechanic
              if (interactable.text.some(t => t.toLowerCase().includes("found a hidden")) && !playerState.storyFlags.includes(itemFlag)) {
                  setPlayerState(prev => ({
                      ...prev,
                      inventory: { ...prev.inventory, potions: prev.inventory.potions + 1 },
                      storyFlags: [...prev.storyFlags, itemFlag]
                  }));
              }
              return; 
          }

      }
  };

  async function handleMapMove(newPos: Coordinate, playerNum: 1 | 2) {
      if (dialogue) {
          console.log(`[MOVE] Player ${playerNum} move rejected: Dialogue active`);
          return;
      }
      console.log(`[MOVE] Player ${playerNum} moving to`, newPos);
      
      let currentMap;
      if (playerState.mapId.startsWith('chunk_')) {
          currentMap = loadedChunks[playerState.mapId];
          if (!currentMap) {
              const [,cx,cy] = playerState.mapId.split('_');
              currentMap = generateChunk(parseInt(cx), parseInt(cy), getKeystoneLevel(playerState.meta, 'rift_stability'));
              setLoadedChunks(prev => ({ ...prev, [currentMap.id]: currentMap }));
          }
      } else {
          currentMap = MAPS[playerState.mapId];
      }
      if (!currentMap) return;

      const layout = (playerState.mapId === 'rift' && riftLayout) ? riftLayout : 
                     (playerState.mapId.startsWith('cave_') && caveLayouts[playerState.mapId]) ? caveLayouts[playerState.mapId] :
                     currentMap.layout;
      
      if (playerState.mapId.startsWith('cave_') && !caveLayouts[playerState.mapId]) {
          const seed = parseInt(playerState.mapId.split('_').slice(1).join(''));
          const newCave = generateCaveMap(seed);
          setCaveLayouts(prev => ({ ...prev, [playerState.mapId]: newCave }));
          return;
      }
      if (playerState.mapId.startsWith('chunk_')) {
          let ncx = playerState.chunkPos.x;
          let ncy = playerState.chunkPos.y;
          let nx = newPos.x;
          let ny = newPos.y;
          let transitioned = false;

          if (nx < 0) { ncx--; nx = CHUNK_SIZE - 1; transitioned = true; }
          else if (nx >= CHUNK_SIZE) { ncx++; nx = 0; transitioned = true; }
          
          if (ny < 0) { ncy--; ny = CHUNK_SIZE - 1; transitioned = true; }
          else if (ny >= CHUNK_SIZE) { ncy++; ny = 0; transitioned = true; }

          if (transitioned) {
              const nextDist = Math.sqrt(ncx*ncx + ncy*ncy);
              const distFloor = Math.floor(nextDist);

              // Hard world edge. Beyond WORLD_MAX_DIST, distance-based biome
              // levels and Number precision start misbehaving, and
              // discoveredChunks / loadedChunks would balloon indefinitely.
              // Block the step with a flavor message rather than letting the
              // game silently choke on a huge save.
              if (nextDist > WORLD_MAX_DIST) {
                  setDialogue(["A strange mist swallows the horizon...", "The world ends here. Turn back."]);
                  return;
              }

              let permitsEarned = 0;
              if (distFloor > playerState.run.maxDistanceReached && distFloor % 5 === 0 && distFloor > 0) {
                  permitsEarned = 1;
              }

              if (distFloor === 50 && playerState.badges < 8) {
                  setDialogue(["A powerful Rift Barrier blocks the way.", "You need 8 Badges to enter the Rift Core."]);
                  return;
              }

              // Rival intercept: when the player steps into a chunk whose
              // floor-distance crosses an unvisited milestone, the rival
              // queues. Gating is by the `rival_encountered_<n>` story
              // flag rather than by `maxDistanceReached`:
              //   - Old gate silently lost the milestone forever if the
              //     player fled (maxDistance had already advanced past
              //     the milestone dist, so the inner check failed next
              //     transition). Now we explicitly flag the encounter
              //     the moment we queue the ref, and the flag sticks
              //     through save/reload.
              //   - Flee without winning = milestone permanently lost
              //     (encountered set, beaten not set). Intentional trade
              //     -- forces commitment. Trophy is gone.
              //   - Returning players whose save pre-dates this system
              //     will encounter the rivals they missed, in order of
              //     milestone distance. Low-stakes catch-up content.
              const candidateMilestone = RIVAL_MILESTONES.find(m =>
                  distFloor >= m.dist
                  && !playerState.storyFlags.includes(`rival_encountered_${m.dist}`)
                  && !playerState.storyFlags.includes(`rival_beaten_${m.dist}`)
              );
              if (candidateMilestone && !pendingRivalRef.current) {
                  pendingRivalRef.current = buildRivalTrainer(candidateMilestone);
                  // Commit the encountered flag immediately so that a
                  // flee on the very next frame still treats this
                  // milestone as "presented once."
                  setPlayerState(prev => prev.storyFlags.includes(`rival_encountered_${candidateMilestone.dist}`)
                      ? prev
                      : { ...prev, storyFlags: [...prev.storyFlags, `rival_encountered_${candidateMilestone.dist}`] }
                  );
              }

              const nextChunkId = `chunk_${ncx}_${ncy}`;
              
              // Move both players to the new chunk
              // Calculate relative position for the other player
              let p1x = playerState.position.x;
              let p1y = playerState.position.y;
              let p2x = playerState.p2Position.x;
              let p2y = playerState.p2Position.y;

              if (playerNum === 1) {
                  p1x = nx; p1y = ny;
                  // If P1 moved East, P2 should also be shifted West relative to P1
                  if (newPos.x >= CHUNK_SIZE) p2x -= CHUNK_SIZE;
                  else if (newPos.x < 0) p2x += CHUNK_SIZE;
                  if (newPos.y >= CHUNK_SIZE) p2y -= CHUNK_SIZE;
                  else if (newPos.y < 0) p2y += CHUNK_SIZE;
              } else {
                  p2x = nx; p2y = ny;
                  if (newPos.x >= CHUNK_SIZE) p1x -= CHUNK_SIZE;
                  else if (newPos.x < 0) p1x += CHUNK_SIZE;
                  if (newPos.y >= CHUNK_SIZE) p1y -= CHUNK_SIZE;
                  else if (newPos.y < 0) p1y += CHUNK_SIZE;
              }

              // Discovery XP & Landmark Logic
              if (!playerState.discoveredChunks.includes(nextChunkId)) {
                  const dist = Math.sqrt(ncx*ncx + ncy*ncy);
                  const isLandmark = ncx % 5 === 0 && ncy % 5 === 0 && (ncx !== 0 || ncy !== 0);
                  const discoveryXp = (100 + Math.floor(dist * 20)) * (isLandmark ? 8 : 1); // Increased XP
                  const playerLevelCap = getPlayerLevelCap(playerState.badges);
                  const avgLevel = playerState.team.length > 0 ? playerState.team.reduce((a, b) => a + b.level, 0) / playerState.team.length : 0;
                  
                  const updatedTeam = await Promise.all(playerState.team.map(async (p) => {
                      if (p.isFainted) return p;
                      const r = await gainExperience(p, discoveryXp, playerLevelCap, avgLevel);
                      return r.mon;
                  }));

                  let landmarkMsg = "";
                  let bonusMoney = 0;
                  let bonusPoints = isLandmark ? 25 : 5; // Increased points
                  if (isLandmark) {
                      landmarkMsg = " This is a MAJOR LANDMARK!";
                      bonusMoney = 10000; // Increased money
                  }

                  // Depth milestone perks -- unlocked when the farthest distance
                  // crosses specific thresholds. Additive: perks are never lost.
                  const newPerks = getNewlyUnlockedPerks(distFloor, playerState.storyFlags);

                  setPlayerState(prev => ({
                      ...prev,
                      mapId: nextChunkId,
                      chunkPos: { x: ncx, y: ncy },
                      position: { x: p1x, y: p1y },
                      p2Position: { x: p2x, y: p2y },
                      money: prev.money + bonusMoney,
                      // Cap discovered chunks at 10,000 with FIFO eviction.
                      // Prevents unbounded save bloat + keeps `.includes`
                      // cost sane on very long runs. The player still keeps
                      // their total *count* for achievements (discoveryPoints
                      // and maxDistanceReached persist independently).
                      discoveredChunks: (() => {
                          const next = [...prev.discoveredChunks, nextChunkId];
                          return next.length > 10000 ? next.slice(next.length - 10000) : next;
                      })(),
                      discoveryPoints: prev.discoveryPoints + bonusPoints,
                      team: updatedTeam,
                      storyFlags: newPerks.length > 0
                          ? [...prev.storyFlags, ...newPerks.map(p => p.flag)]
                          : prev.storyFlags,
                      run: {
                          ...prev.run,
                          maxDistanceReached: Math.max(prev.run.maxDistanceReached, distFloor),
                          capturePermits: prev.run.capturePermits + permitsEarned
                      }
                  }));

                  // First-time biome lore toast -- each biome announces itself once.
                  const curBiome = currentMap?.biome ?? 'forest';
                  const visited = playerState.lifetime?.visitedBiomes ?? [];
                  if (!visited.includes(curBiome)) {
                      const lore = BIOME_LORE[curBiome];
                      if (lore) {
                          showToast(lore.body, 'story', { kicker: lore.kicker, ttl: 5000 });
                      }
                      setPlayerState(prev => {
                          const lt = prev.lifetime ?? { shiniesCaught: 0, trainersDefeated: 0, biggestStreak: 0, currentStreak: 0, totalMoneyEarned: 0, graveyardsVisited: 0, visitedBiomes: [] };
                          const nextVisited = [...lt.visitedBiomes, curBiome];
                          // Bounty tick: biome + distance.
                          let nextB = applyBountyEvent(prev.bounties?.active, { type: 'biome_visit', distinctCount: nextVisited.length });
                          nextB = applyBountyEvent(nextB, { type: 'distance_update', distance: prev.run.maxDistanceReached });
                          const nextBState = prev.bounties ? { ...prev.bounties, active: nextB || prev.bounties.active } : prev.bounties;
                          return { ...prev, lifetime: { ...lt, visitedBiomes: nextVisited }, bounties: nextBState };
                      });
                  } else {
                      // Distance tick still fires even if biome was already visited.
                      setPlayerState(prev => {
                          if (!prev.bounties) return prev;
                          const nextB = applyBountyEvent(prev.bounties.active, { type: 'distance_update', distance: prev.run.maxDistanceReached });
                          return { ...prev, bounties: { ...prev.bounties, active: nextB || prev.bounties.active } };
                      });
                  }

                  // Non-blocking toast stack -- chunk discovery should never
                  // steal focus or require Enter to dismiss.
                  if (isLandmark) {
                      showToast(
                          `${nextChunkId.toUpperCase()} — MAJOR LANDMARK${bonusMoney > 0 ? ` (+$${bonusMoney.toLocaleString()})` : ''}`,
                          'reward',
                          { kicker: 'Discovered', ttl: 3000 }
                      );
                  } else {
                      showToast(`${nextChunkId.toUpperCase()}`, 'info', { kicker: 'Discovered' });
                  }
                  if (permitsEarned > 0) {
                      showToast('Capture Permit earned', 'reward', { kicker: 'Milestone' });
                  }
                  newPerks.forEach((perk) => {
                      showToast(
                          `${perk.title} — ${perk.description}`,
                          'reward',
                          { kicker: `Depth ${perk.dist}`, ttl: 4500 }
                      );
                  });
                  return;
              }

              if (!loadedChunks[nextChunkId]) {
                  const nextChunk = generateChunk(ncx, ncy, getKeystoneLevel(playerState.meta, 'rift_stability'));
                  setLoadedChunks(prev => ({ ...prev, [nextChunkId]: nextChunk }));
              }

              // Mass Outbreak announcement: fire once per chunk per
              // session. The TOAST is session-scoped (refs), but the
              // Rift Token reward is persisted via a storyFlag so we
              // don't pay the player twice across reloads.
              {
                  const chunkKey = `${ncx},${ncy}`;
                  if (!seenOutbreakChunksRef.current.has(chunkKey)) {
                      const chunkBiome = loadedChunks[nextChunkId]?.biome
                          ?? generateChunk(ncx, ncy, getKeystoneLevel(playerState.meta, 'rift_stability')).biome;
                      const outbreak = getChunkOutbreak(ncx, ncy, chunkBiome);
                      if (outbreak) {
                          const outbreakFlag = `outbreak_token_${ncx}_${ncy}`;
                          const firstTime = !playerState.storyFlags.includes(outbreakFlag);
                          fetchPokemon(outbreak.speciesId, 1, false, 0, 1)
                              .then(m => {
                                  const baseMsg = `A SWARM of ${m.name.toUpperCase()} is thriving here! Chain them for big rewards.`;
                                  showToast(
                                      firstTime ? `${baseMsg} +${TOKEN_AWARDS.outbreakFirstEncounter} Rift Token!` : baseMsg,
                                      'reward',
                                      { kicker: 'Mass Outbreak', ttl: 5500 }
                                  );
                              })
                              .catch(() => {
                                  showToast('A Mass Outbreak is active in this area!', 'reward', { kicker: 'Mass Outbreak', ttl: 5500 });
                              });
                          if (firstTime) {
                              // Rift Ledger doubles fresh-run rewards.
                              const award = hasTalent(playerState.meta, 'rift_ledger')
                                  && (playerState.lifetime as any)?.runStartedAt
                                  && (Date.now() - (playerState.lifetime as any).runStartedAt) < 3_600_000
                                  ? TOKEN_AWARDS.outbreakFirstEncounter * 2
                                  : TOKEN_AWARDS.outbreakFirstEncounter;
                              setPlayerState(prev => ({
                                  ...prev,
                                  storyFlags: [...prev.storyFlags, outbreakFlag],
                                  meta: { ...prev.meta, riftTokens: (prev.meta.riftTokens || 0) + award },
                              }));
                          }
                      }
                      seenOutbreakChunksRef.current.add(chunkKey);
                  }
              }

              setPlayerState(prev => ({
                  ...prev,
                  mapId: nextChunkId,
                  chunkPos: { x: ncx, y: ncy },
                  position: { x: p1x, y: p1y },
                  p2Position: { x: p2x, y: p2y },
                  run: {
                      ...prev.run,
                      maxDistanceReached: Math.max(prev.run.maxDistanceReached, distFloor),
                      capturePermits: prev.run.capturePermits + permitsEarned
                  }
              }));
              
              if (permitsEarned > 0) showToast('Capture Permit earned', 'reward', { kicker: 'Milestone' });

              // Story beats fire as story-tier toasts so they're still
              // highlighted but never interrupt movement.
              const dist = Math.sqrt(ncx*ncx + ncy*ncy);
              if (dist > 10 && !playerState.storyFlags.includes('mid_game_story')) {
                  showToast('The air feels different here. The monsters are getting stronger.', 'story', { kicker: 'Rift shifts' });
                  setPlayerState(p => ({ ...p, storyFlags: [...p.storyFlags, 'mid_game_story'] }));
              }
              return;
          }
      }

      if (!layout || newPos.y < 0 || newPos.y >= layout.length || !layout[newPos.y] || newPos.x < 0 || newPos.x >= layout[newPos.y].length) return;
      
      // Handle Portals
      if (currentMap.portals && currentMap.portals[`${newPos.x},${newPos.y}`]) {
          const [targetMap, tx, ty] = currentMap.portals[`${newPos.x},${newPos.y}`].split(',');
          setPlayerState(prev => ({
              ...prev,
              mapId: targetMap,
              position: { x: parseInt(tx), y: parseInt(ty) },
              p2Position: { x: parseInt(tx), y: parseInt(ty) }
          }));
          return;
      }

      const tileType = layout[newPos.y][newPos.x];
      const pos = playerNum === 1 ? playerState.position : playerState.p2Position;
      
      // Challenge Logic
      if (challengeState.isActive) {
          if (challengeState.type === 'speed') {
              if (Date.now() > (challengeState.endTime || 0)) {
                  setChallengeState({ type: 'none', isActive: false });
                  setDialogue(["Time's up! You failed the speed challenge."]);
                  return;
              }
              // Check if reached edge
              if (newPos.x === 0 || newPos.x === CHUNK_SIZE - 1 || newPos.y === 0 || newPos.y === CHUNK_SIZE - 1) {
                  setChallengeState({ type: 'none', isActive: false });
                  setDialogue(["Incredible speed!", "You won the challenge!"]);
                  // Reward logic here
                  setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, `challenge_${challengeState.npcId}`] }));
              }
          } else if (challengeState.type === 'stealth') {
              // Check guards line of sight
              if (currentMap.npcs) {
                  for (const [k, n] of Object.entries(currentMap.npcs)) {
                      const npc = n as any;
                      if (npc.name === 'Guard') {
                          const [gx, gy] = k.split(',').map(Number);
                          // Simple LOS check
                          let seen = false;
                          if (npc.facing === 'up' && newPos.x === gx && newPos.y < gy && gy - newPos.y < 5) seen = true;
                          if (npc.facing === 'down' && newPos.x === gx && newPos.y > gy && newPos.y - gy < 5) seen = true;
                          if (npc.facing === 'left' && newPos.y === gy && newPos.x < gx && gx - newPos.x < 5) seen = true;
                          if (npc.facing === 'right' && newPos.y === gy && newPos.x > gx && newPos.x - gx < 5) seen = true;
                          
                          if (seen) {
                              setChallengeState({ type: 'none', isActive: false });
                              setDialogue(["HALT! You were spotted!", "The stealth challenge failed."]);
                              return;
                          }
                      }
                  }
              }
              // Check if reached treasure (statue or something)
              if (tileType === 22 || tileType === 12) {
                  setChallengeState({ type: 'none', isActive: false });
                  setDialogue(["You reached the treasure unseen!", "A true master of stealth."]);
                  setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, `challenge_${challengeState.npcId}`] }));
              }
          }
      }

      // Mining Mechanic (Rock Smashing)
      if (tileType === 24) { // Rock
          const roll = Math.random();
          if (roll < 0.2) {
              setDialogue(["You smashed the rock!", "Found a Hard Stone! (+$500)"]);
              setPlayerState(prev => ({ ...prev, money: prev.money + 500 }));
              return;
          }
      }

      // Lava hazard -- each step on a lava tile scorches your lead mon unless
      // it's a Fire/Rock/Ground type, or the player unlocked the Stable Rifts
      // perk (depth 100) which extends to all field hazards.
      if (tileType === 28) {
          const lead = playerState.team.find(p => !p.isFainted);
          if (lead) {
              const immuneType = lead.types.some(t => ['fire', 'rock', 'ground'].includes(t.toLowerCase()));
              const riftsafe = playerState.storyFlags.includes('perk_riftsafe');
              if (!immuneType && !riftsafe) {
                  const dmg = Math.max(1, Math.floor(lead.maxHp / 16));
                  setPlayerState(prev => ({
                      ...prev,
                      team: prev.team.map(p => (p.id === lead.id && !p.isFainted)
                          ? { ...p, currentHp: Math.max(0, p.currentHp - dmg), isFainted: p.currentHp - dmg <= 0 }
                          : p),
                  }));
                  showToast(`${lead.name} is scorched by lava! -${dmg} HP`, 'info', { kicker: 'Hazard', ttl: 1800 });
              }
          }
      }

      // Rare Spawn Notification
      if (Math.random() < 0.02 && !playerState.nextEncounterRare) {
          setDialogue(["A rare aura surrounds this area...", "A powerful Pokemon might be nearby!"]);
          setPlayerState(prev => ({ ...prev, nextEncounterRare: true }));
      }

      // Solid tiles
      const walls = [1, 3, 11, 23, 24, 30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44, 45, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 80, 81, 82, 83, 85];
      
      // Boulder Logic
      if (tileType === 71) { // Boulder
          const dx = newPos.x - pos.x;
          const dy = newPos.y - pos.y;
          const behindX = newPos.x + dx;
          const behindY = newPos.y + dy;
          
          if (layout[behindY] && (layout[behindY][behindX] === 0 || layout[behindY][behindX] === 72 || layout[behindY][behindX] === 70)) {
              // Move boulder
              const newLayout = [...layout.map(row => [...row])];
              if (layout[behindY][behindX] === 72) {
                  newLayout[behindY][behindX] = 4; // Filled hole becomes path
                  setDialogue(["The boulder fell into the hole!"]);
              } else {
                  newLayout[behindY][behindX] = 71;
              }
              newLayout[newPos.y][newPos.x] = 0;
              
              if (playerState.mapId.startsWith('chunk_')) {
                  setLoadedChunks(prev => ({ ...prev, [playerState.mapId]: { ...prev[playerState.mapId], layout: newLayout } }));
              } else {
                  // Handle static maps if needed
              }
              // Don't move player yet, just push
              return;
          }
          return; // Blocked
      }

      if (walls.includes(tileType)) return;

      // Ice Logic (Slippery)
      if (tileType === 70) {
          const dx = newPos.x - pos.x;
          const dy = newPos.y - pos.y;
          let slidePos = { ...newPos };
          while (true) {
              const nextX = slidePos.x + dx;
              const nextY = slidePos.y + dy;
              if (!layout[nextY] || layout[nextY][nextX] === undefined) break;
              const nextTile = layout[nextY][nextX];
              if (walls.includes(nextTile) || nextTile === 71) break;
              slidePos = { x: nextX, y: nextY };
              if (nextTile !== 70) break; // Stopped on non-ice
          }
          newPos = slidePos;
      }

      // Ledge logic (One-way South)
      if (tileType === 14) {
          if (newPos.y <= pos.y) return; // Can't walk up or sideways into a ledge
          // If jumping down, we move an extra tile to clear it
          const jumpPos = { x: newPos.x, y: newPos.y + 1 };
          if (layout[jumpPos.y] && !walls.includes(layout[jumpPos.y][jumpPos.x])) {
              newPos = jumpPos;
          } else {
              return; // Blocked below ledge
          }
      }

      const portalKey = `${newPos.x},${newPos.y}`;
      if (currentMap.portals[portalKey]) {
          const portalDest = currentMap.portals[portalKey];
          if (portalDest === "PREV_POS") {
              // Simple back logic
              setPlayerState(prev => ({ ...prev, mapId: `chunk_${prev.chunkPos.x}_${prev.chunkPos.y}`, position: { x: 10, y: 11 } }));
              return;
          }
          const [targetMapId, targetX, targetY] = portalDest.split(',');
          if (targetMapId === 'rift') setRiftLayout(generateRiftMap());
          if (targetMapId.startsWith('puzzle_')) {
              const [, type, seed] = targetMapId.split('_');
              if (!loadedChunks[targetMapId]) {
                  const puzzleMap = generatePuzzleMap(type as any, parseInt(seed));
                  setLoadedChunks(prev => ({ ...prev, [targetMapId]: puzzleMap }));
              }
          }
          
          let nextChunkPos = playerState.chunkPos;
          if (targetMapId.startsWith('chunk_')) {
              const [,cx,cy] = targetMapId.split('_');
              nextChunkPos = { x: parseInt(cx), y: parseInt(cy) };
              setCurrentWeather('none'); // Reset weather on chunk change
              if (!loadedChunks[targetMapId]) {
                  const nextChunk = generateChunk(nextChunkPos.x, nextChunkPos.y, getKeystoneLevel(playerState.meta, 'rift_stability'));
                  setLoadedChunks(prev => ({ ...prev, [targetMapId]: nextChunk }));
              }
          }

          setPlayerState(prev => ({ 
              ...prev, 
              mapId: targetMapId, 
              chunkPos: nextChunkPos,
              position: { x: parseInt(targetX), y: parseInt(targetY) }, 
              p2Position: { x: parseInt(targetX) + 1, y: parseInt(targetY) } 
          }));
          return;
      }

      const trainerKey = `${newPos.x},${newPos.y}`;
      const trainerData = currentMap.trainers?.[trainerKey];
      if (trainerData && !playerState.defeatedTrainers.includes(trainerData.id)) { startBattle(0, false, true, trainerData); return; }

      // Per-step exploration XP trickle. Old code did `playerState.badges.length`
      // on a number which silently produced NaN and disabled this whole loop.
      // With centralized helpers + the auto-scale floor, this is a small bonus
      // on top of the floor, not the main progression mechanic.
      const levelCap = getPlayerLevelCap(playerState.badges);

      const updatedTeam = playerState.team.map(p => {
          if (p.currentHp <= 0) return p;
          if (p.level < levelCap) {
              let xpMult = 1;
              if (p.heldItem?.id === 'lucky-egg') xpMult = 1.5;
              const newXp = p.xp + (1 * xpMult);
              if (newXp >= p.maxXp) {
                  return { ...p, level: p.level + 1, xp: 0, maxXp: (p.level + 1) * 100, maxHp: p.maxHp + 10, currentHp: p.currentHp + 10 };
              }
              return { ...p, xp: newXp };
          }
          return p;
      });

      if (tileType === 74) { // Puzzle Reward
          const rewardKey = `reward_${playerState.mapId}_${newPos.x}_${newPos.y}`;
          if (!playerState.storyFlags.includes(rewardKey)) {
              setDialogue(["You found a rare item!", "It's a Choice Band!"]);
              setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, rewardKey], money: prev.money + 5000 }));
              return;
          }
      }

      if (playerNum === 1) setPlayerState(prev => ({ ...prev, position: newPos, team: updatedTeam })); else setPlayerState(prev => ({ ...prev, p2Position: newPos }));
      if (tileType === 5) { setPlayerState(prev => ({ ...prev, team: prev.team.map(p => ({ ...p, currentHp: p.maxHp, isFainted: false })) })); setDialogue(["Team healed!"]); }
      if (tileType === 10) setPhase(GamePhase.SHOP);
      
      let encounterRateMult = 1;
      if (playerState.team[0]?.heldItem?.id === 'cleanse-tag') encounterRateMult = 0.5;
      // Daily world event can push encounters up or down. Keeps the world
      // feeling different on different days without mechanical whiplash.
      encounterRateMult *= getDailyEvent().encounterMult;

      if (tileType === 2) {
          // Grass-aura lookup: rustling = guaranteed + normal strength,
          // alpha = guaranteed + treated as boss, anomaly = guaranteed +
          // treated as boss with a capture-permit refund on catch.
          const cMatch = playerState.mapId.match(/^chunk_(-?\d+)_(-?\d+)$/);
          const auraCx = cMatch ? parseInt(cMatch[1], 10) : 0;
          const auraCy = cMatch ? parseInt(cMatch[2], 10) : 0;
          const aura = cMatch ? getGrassAura(auraCx, auraCy, newPos.x, newPos.y) : 'normal';

          let willBattle = false;
          let promoteBoss = playerState.nextEncounterRare || false;
          if (aura === 'normal') {
              willBattle = Math.random() < (0.15 * encounterRateMult);
          } else if (aura === 'rustling') {
              willBattle = true; // guaranteed
          } else if (aura === 'alpha') {
              willBattle = true;
              promoteBoss = true;
          } else if (aura === 'anomaly') {
              willBattle = true;
              promoteBoss = true;
          }

          if (willBattle) {
              // Stash the aura tier so the catch / battle-log hooks can
              // surface rewards + flavor. Cleared inside startBattle.
              if (aura !== 'normal') pendingAnomalyRef.current = aura;

              // Mass Outbreak override: if we're in an outbreak chunk,
              // 70% of aura-less encounters and 100% of rustle-tier
              // encounters surface the outbreak species. Alpha / anomaly
              // override the override -- those tiers are meant to break
              // the pattern and surprise the player.
              const outbreak = cMatch ? getChunkOutbreak(auraCx, auraCy, currentMap.biome) : null;
              if (outbreak && aura !== 'alpha' && aura !== 'anomaly') {
                  const forceOutbreak = aura === 'rustling' || Math.random() < 0.7;
                  if (forceOutbreak) pendingOutbreakRef.current = outbreak.speciesId;
              }

              startBattle(2, promoteBoss, false, undefined, currentMap.biome, tileType);
              if (playerState.nextEncounterRare) setPlayerState(prev => ({ ...prev, nextEncounterRare: false }));
          }
      }
      else if (tileType === 19 && Math.random() < (0.15 * encounterRateMult)) {
          startBattle(3, true, false, undefined, currentMap.biome, tileType);
      }
  };

  const startBattle = async (enemyCount: number, isBoss: boolean, isTrainer: boolean, trainerData?: TrainerData, biome?: string, tileType?: number) => {
    const isMultiplayer = !!multiplayer.roomId;
    const bId = isMultiplayer ? `wild_${multiplayer.roomId}_${Date.now()}` : null;
    if (bId) setBattleId(bId);
    setPhase(GamePhase.BATTLE);
      // --- SYNC BOOST ABILITY ---
      // Talent: Rift Catalyst seeds the Sync gauge so fusion comes online
      // sooner. Stacks with held items & SyncBoost, but capped to 100 below.
      let initialCombo = hasTalent(playerState.meta, 'rift_catalyst') ? 25 : 0;
      const activeLeads = playerState.team.slice(0, 2).filter(p => p && !p.isFainted);
      activeLeads.forEach(p => {
          if (p.ability.name === 'SyncBoost') initialCombo += 10;
          // Rift Shard: pre-charges the gauge each battle. Stacks across
          // both active slots if the player commits two holders.
          if (p.heldItem?.id === 'rift-shard') initialCombo += 20;
      });
      // Dual Pendant: if any active lead holds one and their slot-mate
      // shares at least one type, dump 20 gauge on entry. The shared-type
      // gate prevents a Pendant holder paired with *any* random mon from
      // winning the early tempo race for free -- you have to theme-build.
      if (activeLeads.length >= 2) {
          const [a, b] = activeLeads;
          const sharesType = a.types.some(t => b.types.includes(t));
          if (sharesType) {
              if (a.heldItem?.id === 'dual-pendant') initialCombo += 20;
              if (b.heldItem?.id === 'dual-pendant') initialCombo += 20;
          }
      }
      initialCombo = Math.min(100, initialCombo);
      // Aura banner: if the last tile-step set a pending aura, surface it
      // in the opening battle log so the player knows *why* this encounter
      // is guaranteed/stronger.
      const auraTier = pendingAnomalyRef.current;
      const openingLog =
          isTrainer ? "Trainer Battle!" :
          auraTier === 'rustling' ? "The grass rustled! A wild encounter!" :
          auraTier === 'alpha'    ? "ALPHA ENCOUNTER! The ground trembles..." :
          auraTier === 'anomaly'  ? "!! ANOMALY !! Reality warps around you..." :
          "Wild Encounter!";
      setBattleState(prev => ({ ...prev, phase: 'player_input', logs: [openingLog], isTrainerBattle: isTrainer, currentTrainerId: trainerData?.id, backgroundUrl: '', comboMeter: initialCombo }));
    try {
      let currentMap;
      if (playerState.mapId.startsWith('chunk_')) {
          currentMap = loadedChunks[playerState.mapId];
      } else {
          currentMap = MAPS[playerState.mapId];
      }
      if (!currentMap) return;

      const isMultiplayer = !!multiplayer.roomId;
      const isGym = !!(trainerData && trainerData.isGymLeader);
      // Scenario detection for battle art. Each special trainer gets the
      // arena it deserves, based on predictable id patterns or flags:
      //   Rift Champion  (badgeId === 9) -> champion throne room
      //   Ghost Trainer  (id starts with 'ghost_trainer_') -> haunted mansion
      //   Roaming Legendary (id starts with 'legendary_roam_<speciesId>_')
      //       -> thematic arena (ice_palace / thunder_peak / sky_pillar / ...)
      const isChampion = !!(trainerData && trainerData.badgeId === 9);
      const isHaunted = !!(trainerData && trainerData.id?.startsWith('ghost_trainer_'));
      let legendarySpeciesId: number | undefined;
      if (trainerData && trainerData.id?.startsWith('legendary_roam_')) {
          const m = trainerData.id.match(/^legendary_roam_(\d+)_/);
          if (m) legendarySpeciesId = parseInt(m[1], 10);
      }
      const isLegendary = legendarySpeciesId !== undefined;
      const bgUrl = await generateBattleBackground(
          biome || currentMap.biome || 'forest',
          tileType,
          isMultiplayer,
          {
              gym: isGym,
              champion: isChampion,
              haunted: isHaunted,
              legendary: isLegendary,
              legendarySpeciesId,
          },
      );
      console.log('Setting Battle Background URL:', bgUrl, { isGym, isChampion, isHaunted, legendarySpeciesId });
      
      // Calculate Rift Pressure (difficulty scaling).
      //
      // Coefficients used to be 0.15 (distance) + 0.10 (badges). Combined with
      // scaling ALL enemy stats (including Def/SpD/Speed), mid-game fights felt
      // like players were punching through concrete. Now that we only scale
      // HP/Atk/SpA, we can also tune these coefficients DOWN a notch so the
      // curve stays meaningful without being oppressive.
      //
      //   distance factor: 0.15  -> 0.10
      //   badge factor:    0.10  -> 0.07
      //
      // Example: badge 5, 40 chunks out, no Rift Stability:
      //   OLD:  1 + (2^1.2 * 0.15 + 5^1.1 * 0.10) = 1.93x
      //   NEW:  1 + (2^1.2 * 0.10 + 5^1.1 * 0.07) = 1.64x (only HP/Atk/SpA)
      const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
      const stabilityMult = 1 - (getKeystoneLevel(playerState.meta, 'rift_stability') * 0.1);
      const difficulty = 1 + (Math.pow(distance / 20, 1.2) * 0.10 + Math.pow(playerState.badges, 1.1) * 0.07) * stabilityMult;

      // Set background immediately
      setBattleState(prev => ({ ...prev, backgroundUrl: bgUrl }));
      
      let initialWeather = currentWeather;
      if (initialWeather === 'none') {
          if (currentMap.biome === 'lake') initialWeather = 'rain';
          else if (currentMap.biome === 'desert') initialWeather = 'sand';
          else if (currentMap.biome === 'snow') initialWeather = 'hail';
      }

      let enemies: Pokemon[];
      if (trainerData) {
          if (trainerData.isGymLeader) {
              if (trainerData.loadout && trainerData.loadout.length > 0) {
                  // Hand-authored competitive set from data/gymTeams.ts.
                  const { hydrateGymTeam } = await import('./services/pokeService');
                  enemies = await hydrateGymTeam(trainerData.level, trainerData.loadout, difficulty);
              } else {
                  const { fetchCompetitivePokemon } = await import('./services/pokeService');
                  enemies = await Promise.all(trainerData.team.map(id => fetchCompetitivePokemon(id, trainerData.level)));
              }
              // Apply Rift Pressure to gym leaders on top of their competitive set.
              // ONLY HP / Atk / SpA scale -- same rule as wild / trainer fetchPokemon,
              // so the player's damage output isn't quietly halved by scaled Def/SpD
              // and gym leaders don't out-speed everything because Speed inflated.
              enemies.forEach(e => {
                  const scaledKeys: Array<keyof StatBlock> = ['hp', 'attack', 'special-attack'];
                  scaledKeys.forEach(stat => {
                      e.stats[stat] = Math.floor(e.stats[stat] * difficulty);
                  });
                  e.currentHp = e.maxHp = e.stats.hp;
              });
          } else {
              enemies = await Promise.all(trainerData.team.map(id => fetchPokemon(id, trainerData.level, true, 0, difficulty)));
          }
      } else {
          const wildCap = getWildLevelCap(playerState.badges, distance);
          const minLvl = Math.min(wildCap, currentMap.wildLevelRange[0]);
          const maxLvl = Math.min(wildCap, currentMap.wildLevelRange[1]);
          // Daily event bumps shiny odds on top of meta upgrade.
          const effectiveShiny = catchers_shinyTier(playerState.meta) * getDailyEvent().shinyMult;
          // Mass Outbreak: if the player stepped into tall grass inside
          // an outbreak chunk, the override forces every rolled wild to
          // the outbreak species -- pure chaining fuel.
          const outbreakOverride = pendingOutbreakRef.current ?? undefined;
          enemies = await getWildPokemon(enemyCount, [minLvl, maxLvl], biome, tileType, effectiveShiny, difficulty, outbreakOverride);
          if (isBoss) {
              // Boss wilds used to get +5 levels, which routinely broke the
              // "wild cap" contract and forced grinding. +2 keeps them a real
              // threat without feeling unfair.
              enemies.forEach(e => {
                  e.level += 2;
                  e.maxHp = Math.floor(e.maxHp * 1.35);
                  e.currentHp = e.maxHp;
              });
          }
      }
      
      // Play cries only on summon
      enemies.slice(0, 2).forEach((e, i) => {
          setTimeout(() => playCry(e.id, e.name), i * 400);
      });
      playerState.team.slice(0, 2).forEach((p, i) => {
          setTimeout(() => playCry(p.id, p.name), (enemies.length > 0 ? 800 : 0) + i * 400);
      });

      // In 2v2, only the first 2 pokemon are out. 
      // If enemy has 2+, it's a double battle.
      const isDouble = enemies.length >= 2;
      const playerTeam = JSON.parse(JSON.stringify(playerState.team));
      // Mark fainted for those not in the first 2 if it's a double battle? 
      // Actually, the UI only shows the first 2 living ones usually.
      // But the current UI maps over the whole team.
      // I'll limit the active ones.
      
      // --- WEATHER & ENTRY ABILITIES ---
      let startWeather = initialWeather;
      let startLogs = isTrainer ? [`Trainer ${trainerData.name} wants to battle!`] : [`A wild ${enemies[0].name} appeared!`];

      // Surface Rift Pressure to the player so they understand WHY enemies
      // feel tanky / hit hard this deep into the rift. Only add the log once
      // the scaling is actually material (>= 10% above baseline) -- earlier
      // than that it would just be noise.
      if (difficulty >= 1.10) {
          const pct = Math.round((difficulty - 1) * 100);
          startLogs.push(`Rift Pressure ×${difficulty.toFixed(2)} — enemies are harder by +${pct}% HP / Atk / Sp.Atk.`);
      }
      const allInitial = [...playerTeam.slice(0, 2), ...enemies.slice(0, 2)];
      
      let startTailwind = 0;
      let startEnemyTailwind = 0;
      
      let startAegis = 0;
      let startEnemyAegis = 0;
      let playerSyncBoost = 0;
      let enemySyncBoost = 0;
      
      allInitial.forEach((p, idx) => {
          const isPlayer = idx < 2;
          if (p.ability.name === 'Drizzle') startWeather = 'rain';
          if (p.ability.name === 'Drought') startWeather = 'sun';
          if (p.ability.name === 'SandStream') startWeather = 'sand';
          if (p.ability.name === 'SnowWarning') startWeather = 'hail';
          if (p.ability.name === 'ArcSurge') startWeather = 'electric';
          if (p.ability.name === 'Ashstorm') startWeather = 'ashstorm';
          
          if (p.ability.name === 'MysticFog') {
              startLogs.push(`${p.name}'s Mystic Fog lowered everyone's accuracy!`);
              allInitial.forEach(mon => {
                  if (mon.statStages) mon.statStages.accuracy = Math.max(-6, (mon.statStages.accuracy || 0) - 1);
              });
          }

          if (p.ability.name === 'Jetstream') {
              if (isPlayer) startTailwind = 2;
              else startEnemyTailwind = 2;
              startLogs.push(`${p.name}'s Jetstream whipped up a tailwind!`);
          }

          if (p.ability.name === 'AegisField') {
              if (isPlayer) startAegis = 1;
              else startEnemyAegis = 1;
              startLogs.push(`${p.name}'s Aegis Field is protecting the team!`);
          }

          if (p.ability.name === 'SyncBoost') {
              if (isPlayer) playerSyncBoost += 10;
              else enemySyncBoost += 10;
              startLogs.push(`${p.name}'s Sync Boost charged the gauge!`);
          }

          if (p.ability.name === 'VenomousAura' && Math.random() < 0.3) {
              const targets = isPlayer ? enemies.slice(0, 2) : playerTeam.slice(0, 2);
              targets.forEach(t => {
                  if (!t.status && !t.types.includes('poison') && !t.types.includes('steel')) {
                      t.status = 'poison';
                      startLogs.push(`${t.name} was poisoned by ${p.name}'s Venomous Aura!`);
                  }
              });
          }
      });

      // Sync battle start to client if host
      if (networkRole === 'host') {
          multiplayer.send({
              type: 'BATTLE_START',
              payload: {
                  battleId: bId,
                  playerTeam: playerTeam.map(p => {
                      const { movePool, ...rest } = p;
                      return rest;
                  }),
                  enemies: enemies.map(p => {
                      const { movePool, ...rest } = p;
                      return rest;
                  }),
                  isBoss,
                  isTrainer,
                  trainerData,
                  biome,
                  tileType,
                  bgUrl,
                  initialWeather: startWeather,
                  initialCombo,
                  isPvP: false
              }
          });
      }

      let firstActive = 0;
      while (firstActive < playerTeam.length && playerTeam[firstActive].isFainted) firstActive++;

      setBattleState({
        playerTeam, enemyTeam: enemies,
        turn: 1, phase: 'player_input', logs: startLogs, pendingMoves: [], activePlayerIndex: firstActive, ui: { selectionMode: 'MOVE', selectedMove: null },
        isTrainerBattle: isTrainer, isPvP: false, comboMeter: Math.min(100, initialCombo + playerSyncBoost), enemyComboMeter: Math.min(100, enemySyncBoost), currentTrainerId: trainerData?.id, weather: startWeather, terrain: 'none', backgroundUrl: bgUrl,
        weatherTurns: startWeather !== 'none' ? 5 : 0,
        tailwindTurns: startTailwind,
        enemyTailwindTurns: startEnemyTailwind,
        aegisFieldTurns: startAegis,
        enemyAegisFieldTurns: startEnemyAegis,
        riftPressure: difficulty,
      });

    } catch (e) { setPhase(GamePhase.OVERWORLD); }
  };
   const checkBerries = (p: Pokemon, logs: string[]) => {
      if (p.isFainted) return;
      
      const isPlayer = battleState.playerTeam.some(mon => mon && mon.id === p.id);
      const team = isPlayer ? battleState.playerTeam : battleState.enemyTeam;
      const ally = team.find(mon => mon && !mon.isFainted && mon.id !== p.id);
      const side: 'player' | 'enemy' = isPlayer ? 'player' : 'enemy';
      const slot = Math.max(0, team.findIndex(mon => mon?.id === p.id)) as 0 | 1;
      const allySlot = ally ? (Math.max(0, team.findIndex(mon => mon?.id === ally.id)) as 0 | 1) : 0;

      // --- ShellCurl: first time below 50% HP each battle, +1 Def / +1 SpD. ---
      // Sits at the top of checkBerries because it shares the "crossed 50%"
      // trigger with Sitrus Berry and should fire before the heal (so the
      // stats are up while the berry restores HP, giving the same turn both).
      if (p.ability.name === 'ShellCurl' && !p.usedShellCurl && p.currentHp <= p.maxHp / 2 && p.currentHp > 0) {
          if (p.statStages) {
              p.statStages.defense = Math.min(6, (p.statStages.defense || 0) + 1);
              p.statStages['special-defense'] = Math.min(6, (p.statStages['special-defense'] || 0) + 1);
          }
          p.usedShellCurl = true;
          logs.push(`${p.name} curled up! Its Defense and Sp. Def rose!`);
          popupAbility(side, slot, 'Shell Curl');
          popupStat(side, slot, 'defense', 1);
          popupStat(side, slot, 'special-defense', 1);
      }

      // Helper: check if this side has BuddyBerry active (on either mon).
      const buddyHolder = (p.ability.name === 'BuddyBerry') ? p : (ally?.ability.name === 'BuddyBerry' ? ally : undefined);
      const fireBuddyBerry = (consumer: Pokemon) => {
          if (!buddyHolder) return;
          const buddyHeal = Math.floor(consumer.maxHp / 16);
          const teamMates = [consumer, ally].filter(Boolean) as Pokemon[];
          for (const mate of teamMates) {
              if (!mate.isFainted) {
                  mate.currentHp = Math.min(mate.maxHp, mate.currentHp + Math.floor(mate.maxHp / 16));
              }
          }
          logs.push(`${buddyHolder.name}'s Buddy Berry shared a small snack!`);
          // Fire the popup on whoever actually owns the ability.
          const holderSlot = Math.max(0, team.findIndex(mon => mon?.id === buddyHolder.id)) as 0 | 1;
          popupAbility(side, holderSlot, 'Buddy Berry');
      };

      if (p.heldItem?.id === 'sitrus-berry' && p.currentHp <= p.maxHp / 2) {
          const heal = Math.floor(p.maxHp / 4);
          p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
          logs.push(`${p.name} consumed its Sitrus Berry and restored HP!`);
          popupItem(side, slot, 'Sitrus Berry');
          
          // Symmetry Ability: Share berry effect with ally
          if (p.ability.name === 'Symmetry' && ally) {
              ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
              logs.push(`${ally.name} also restored HP due to Symmetry!`);
              popupAbility(side, slot, 'Symmetry');
              popupCustom(side, allySlot, '+HP', '#6ee7b7');
          }
          
          // Stash Ability: Copy ally's berry
          if (ally && ally.ability.name === 'Stash' && !ally.heldItem) {
              ally.heldItem = { ...p.heldItem };
              logs.push(`${ally.name}'s Stash copied ${p.name}'s ${p.heldItem.name}!`);
              popupAbility(side, allySlot, 'Stash');
          }
          
          fireBuddyBerry(p);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'oran-berry' && p.currentHp <= p.maxHp / 2) {
          const heal = 10;
          p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
          logs.push(`${p.name} consumed its Oran Berry and restored HP!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'pecha-berry' && (p.status === 'poison' || p.status === 'toxic')) {
          p.status = undefined;
          logs.push(`${p.name} consumed its Pecha Berry and cured its poison!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'cheri-berry' && p.status === 'paralysis') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Cheri Berry and cured its paralysis!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'chesto-berry' && p.status === 'sleep') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Chesto Berry and woke up!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'rawst-berry' && p.status === 'burn') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Rawst Berry and cured its burn!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'aspear-berry' && p.status === 'freeze') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Aspear Berry and defrosted!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'persim-berry' && p.confusionTurns && p.confusionTurns > 0) {
          p.confusionTurns = 0;
          logs.push(`${p.name} consumed its Persim Berry and cured its confusion!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'lum-berry' && (p.status || (p.confusionTurns && p.confusionTurns > 0))) {
          const oldStatus = p.status || 'confusion';
          p.status = undefined;
          p.confusionTurns = 0;
          logs.push(`${p.name} consumed its Lum Berry and cured its ${oldStatus}!`);
          popupItem(side, slot, 'Lum Berry');

          // Symmetry Ability: Share berry effect with ally
          if (p.ability.name === 'Symmetry' && ally) {
              ally.status = undefined;
              ally.confusionTurns = 0;
              logs.push(`${ally.name} was also cured due to Symmetry!`);
              popupAbility(side, slot, 'Symmetry');
              popupStatus(side, allySlot, 'cured');
          }

          // Stash Ability: Copy ally's berry
          if (ally && ally.ability.name === 'Stash' && !ally.heldItem) {
              ally.heldItem = { ...p.heldItem };
              logs.push(`${ally.name}'s Stash copied ${p.name}'s ${p.heldItem.name}!`);
              popupAbility(side, allySlot, 'Stash');
          }

          fireBuddyBerry(p);
          p.heldItem = undefined;
      }
  };

  const applyHazards = (p: Pokemon, isPlayer: boolean, hazards: string[], tempLogs: string[]) => {
      if (p.isFainted) return;
      if (p.heldItem?.id === 'heavy-duty-boots') return;
      if (p.ability.name === 'HazardEater') {
          const heal = Math.floor(p.maxHp / 8);
          p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
          tempLogs.push(`${p.name}'s Hazard Eater restored its HP!`);
          return;
      }
      if (hazards.includes('Stealth Rock')) {
          const effectiveness = getDamageMultiplier('Rock', p, undefined, 'none', 'none');
          const damage = Math.floor(p.maxHp * 0.125 * effectiveness);
          p.currentHp = Math.max(0, p.currentHp - damage);
          tempLogs.push(`${p.name} was hurt by the Stealth Rocks!`);
      }
      // Tera note: Gen 9 rule -- Tera'd mons use their Tera type for hazard
      // grounding checks (a Tera-Fire Dragapult now eats Spikes, etc.).
      const defTypes = getEffectiveDefensiveTypes(p);
      if (hazards.includes('Spikes')) {
          const spikesCount = hazards.filter(h => h === 'Spikes').length;
          const damageMult = spikesCount === 1 ? 0.125 : (spikesCount === 2 ? 0.166 : 0.25);
          if (!defTypes.includes('flying') && p.ability.name !== 'Levitate' && p.heldItem?.id !== 'heavy-duty-boots') {
              const damage = Math.floor(p.maxHp * damageMult);
              p.currentHp = Math.max(0, p.currentHp - damage);
              tempLogs.push(`${p.name} was hurt by the Spikes!`);
          }
      }
      if (hazards.includes('Toxic Spikes') && !p.status) {
          if (!defTypes.includes('flying') && p.ability.name !== 'Levitate' && p.heldItem?.id !== 'heavy-duty-boots') {
              if (defTypes.includes('poison')) {
                  setBattleState(prev => ({
                      ...prev,
                      [isPlayer ? 'playerHazards' : 'enemyHazards']: (prev[isPlayer ? 'playerHazards' : 'enemyHazards'] || []).filter(h => h !== 'Toxic Spikes')
                  }));
                  tempLogs.push(`${p.name} absorbed the Toxic Spikes!`);
              } else if (!defTypes.includes('steel')) {
                  const tsCount = hazards.filter(h => h === 'Toxic Spikes').length;
                  p.status = tsCount === 1 ? 'poison' : 'toxic';
                  tempLogs.push(`${p.name} was poisoned by the Toxic Spikes!`);
              }
          }
      }
      if (hazards.includes('Sticky Web')) {
          if (!defTypes.includes('flying') && p.ability.name !== 'Levitate' && p.heldItem?.id !== 'heavy-duty-boots') {
              if (p.statStages) {
                  p.statStages.speed = Math.max(-6, (p.statStages.speed || 0) - 1);
                  tempLogs.push(`${p.name} was caught in the Sticky Web!`);
              }
          }
      }
  };

  async function executeTurn() {
    try {
    const { pendingMoves, playerTeam, enemyTeam } = battleState;
    console.log('--- Executing Turn ---');
    console.log('Pending Moves:', pendingMoves);
    
    // Enemy AI - Limit to first 2 active slots
    let enemyMoves: any[] = [];
    if (isMultiplayerBattle) {
        if (remoteBattleActions.length === 0) {
            console.log("Waiting for remote action...");
            return;
        }
        enemyMoves = remoteBattleActions;
    } else {
        enemyMoves = enemyTeam.slice(0, 2).map((mon, i) => {
       if(mon.isFainted) return null;

       // Check for Fusion Charge
       if (battleState.enemyFusionChargeActive) {
           const partnerIndex = enemyTeam.findIndex((p, idx) => idx !== i && idx < 2 && !p.isFainted);
           if (partnerIndex !== -1) {
               const partner = enemyTeam[partnerIndex];
               const fMove = getFusionMove(mon.types[0], partner.types[0]);
               if (fMove) {
                   const moveData: PokemonMove = {
                       name: fMove.name,
                       url: '',
                       power: fMove.power,
                       accuracy: fMove.accuracy,
                       type: fMove.resultType,
                       damage_class: fMove.category.toLowerCase() as any,
                       isFusion: true
                   };
                   return { actorIndex: i, targetIndex: Math.floor(Math.random() * Math.min(2, playerTeam.length)), move: moveData, isPlayer: false, isFusion: true, speed: 999, priority: 0 };
               }
           }
       }

       const valid = mon.moves.filter(m=>m.pp && m.pp>0);
       let move = valid.length>0 ? valid[Math.floor(Math.random()*valid.length)] : {name:'struggle', url:'', power:50, type:'normal', damage_class:'physical', priority: 0};
       
       if (mon.heldItem?.id.startsWith('choice-') && mon.choiceMove) {
           const lockedMove = mon.moves.find(m => m.name === mon.choiceMove);
           if (lockedMove && lockedMove.pp && lockedMove.pp > 0) {
               move = lockedMove;
           } else {
               move = {name:'struggle', url:'', power:50, type:'normal', damage_class:'physical', priority: 0};
           }
       }
       
       // Speed reduction from paralysis
       let speed = mon.stats.speed;
       
       // Speed Stat Stages
       const speedStage = mon.statStages?.speed || 0;
       if (speedStage > 0) speed *= (1 + 0.5 * speedStage);
       else if (speedStage < 0) speed *= (1 / (1 + 0.5 * Math.abs(speedStage)));

       if (mon.status === 'paralysis') speed *= 0.5;
       if (mon.heldItem?.id === 'choice-scarf') speed *= 1.5;
       if (mon.heldItem?.id === 'lagging-tail') speed *= 0.5;
       if (mon.heldItem?.id === 'iron-ball') speed *= 0.5;

       // Shared Nerves: When user is paralyzed, ally's Speed is doubled
       const allyIdx = 1 - i;
       const ally = enemyTeam[allyIdx];
       if (ally && !ally.isFainted && ally.status === 'paralysis' && mon.ability.name === 'SharedNerves') {
           speed *= 2;
       }

       // Cooldown Cover: Speed doubled while ally is recharging
       if (ally && !ally.isFainted && ally.mustRecharge && mon.ability.name === 'CooldownCover') {
           speed *= 2;
       }

       // Threat Matrix: Speed increased by 50% if opponent has higher Attack or Sp. Atk
       if (mon.ability.name === 'ThreatMatrix') {
           const opponents = playerTeam.filter(o => o && !o.isFainted);
           const hasHigherOffense = opponents.some(o => o.stats.attack > mon.stats.attack || o.stats.specialAttack > mon.stats.specialAttack);
           if (hasHigherOffense) speed *= 1.5;
       }

       let priority = move.priority || 0;
       
       // Thunderous Step Ability
       if (mon.ability.name === 'ThunderousStep' && mon.currentHp === mon.maxHp && move.type === 'Electric') {
           priority += 1;
       }

       // Link Conduit Ability (Backline)
       const backline = enemyTeam.filter(p => p && !p.isFainted && p.id !== mon.id);
       if (backline.some(p => p.ability.name === 'LinkConduit') && move.name.toLowerCase().includes('link')) {
           priority += 1;
       }

       if (mon.nextMovePriorityBoost) {
           priority += 1;
           mon.nextMovePriorityBoost = false; // Reset
       }

       return { actorIndex: i, targetIndex: Math.floor(Math.random() * Math.min(2, playerTeam.length)), move, isPlayer: false, speed, priority };
    }).filter(m => m !== null);
    }

    console.log('Enemy Moves:', enemyMoves);

    const fullQueue = [...pendingMoves, ...enemyMoves].map(action => {
        const team = action.isPlayer ? playerTeam : enemyTeam;
        const actor = team[action.actorIndex];
        if (actor.heldItem?.id === 'quick-claw' && Math.random() < 0.2) {
            return { ...action, quickClawActivated: true };
        }
        return action;
    }).sort((a,b) => {
         if (a.priority !== b.priority) return b.priority - a.priority;
         if (a.quickClawActivated && !b.quickClawActivated) return -1;
         if (!a.quickClawActivated && b.quickClawActivated) return 1;
         if (battleState.trickRoomTurns && battleState.trickRoomTurns > 0) {
             return a.speed - b.speed;
         }
         return b.speed - a.speed;
     });

    console.log('Full Queue:', fullQueue);

    // --- TwinFocus resolution ----------------------------------------------
    // Before any action fires, scan for pairs of actors on the same side who
    // targeted the same opposing slot with a damaging move. If either holder
    // has TwinFocus, flag both actions so damageCalc can apply the 1.2x.
    (() => {
        const pAttackers = fullQueue.filter(a => a.isPlayer && a.move && a.move.damage_class !== 'status' && typeof a.targetIndex === 'number');
        const eAttackers = fullQueue.filter(a => !a.isPlayer && a.move && a.move.damage_class !== 'status' && typeof a.targetIndex === 'number');
        const flagTwins = (pool: any[], team: Pokemon[]) => {
            if (pool.length < 2) return;
            // Group by targetIndex
            const byTarget: Record<number, any[]> = {};
            pool.forEach(a => {
                if (!byTarget[a.targetIndex]) byTarget[a.targetIndex] = [];
                byTarget[a.targetIndex].push(a);
            });
            Object.values(byTarget).forEach(group => {
                if (group.length < 2) return;
                const hasTwinFocus = group.some(a => team[a.actorIndex]?.ability?.name === 'TwinFocus');
                if (hasTwinFocus) {
                    group.forEach(a => {
                        const actor = team[a.actorIndex];
                        if (actor) actor.allySharedTarget = true;
                    });
                }
            });
        };
        flagTwins(pAttackers, playerTeam);
        flagTwins(eAttackers, enemyTeam);
    })();

    let tempPTeam = JSON.parse(JSON.stringify(playerTeam));
    let tempETeam = JSON.parse(JSON.stringify(enemyTeam));
    let tempLogs = [...battleState.logs];

    // --- LOG-TO-POPUP INTERCEPTOR ------------------------------------------
    // The battle code has hundreds of `tempLogs.push(...)` sites for status
    // inflictions, stat changes, item procs, etc. Wiring a popup emit into
    // each of them would be nuclear-grade invasive, so instead we patch the
    // array's push method once and parse each log line for well-known
    // patterns. Anything we don't recognize silently falls through -- the
    // log box still gets the line, we just don't show a banner for it.
    // This is additive: explicit popup emits at specific sites (e.g. crit,
    // switch-in abilities) still run and stack above the auto-parsed ones.
    const resolveMon = (name: string): { side: 'player' | 'enemy'; slot: 0 | 1 } | null => {
        for (let i = 0; i < Math.min(2, tempPTeam.length); i++) {
            if (tempPTeam[i] && tempPTeam[i].name === name) return { side: 'player', slot: i as 0 | 1 };
        }
        for (let i = 0; i < Math.min(2, tempETeam.length); i++) {
            if (tempETeam[i] && tempETeam[i].name === name) return { side: 'enemy', slot: i as 0 | 1 };
        }
        return null;
    };
    const STAT_KEYWORD: Record<string, 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed' | 'accuracy' | 'evasion'> = {
        Attack: 'attack', Defense: 'defense', 'Sp. Atk': 'special-attack', 'Sp. Def': 'special-defense',
        'Special Attack': 'special-attack', 'Special Defense': 'special-defense',
        Speed: 'speed', Accuracy: 'accuracy', Evasion: 'evasion',
    };
    const STATUS_KEYWORD: Record<string, 'burn' | 'poison' | 'sleep' | 'freeze' | 'paralysis' | 'confusion'> = {
        burned: 'burn', poisoned: 'poison', 'fast asleep': 'sleep', asleep: 'sleep',
        frozen: 'freeze', paralyzed: 'paralysis', confused: 'confusion',
    };
    const dispatchLogPopup = (line: string): void => {
        try {
            // "X was <status>" / "X was <status> by Y's ..."
            for (const [kw, st] of Object.entries(STATUS_KEYWORD)) {
                const re = new RegExp(`^([^']+?) was ${kw}`);
                const m = line.match(re);
                if (m) {
                    const who = resolveMon(m[1].trim());
                    if (who) popupStatus(who.side, who.slot, st as any);
                    return;
                }
            }
            // "X's <Stat> rose/fell/sharply rose/sharply fell/was raised/was lowered"
            for (const [label, stat] of Object.entries(STAT_KEYWORD)) {
                // generic "raised/lowered <stat>" e.g. "X's Intimidate lowered Y's Attack!"
                const reLower = new RegExp(`lowered\\s+([^'\\n]+?)'s ${label.replace(/\\./g, '\\\\.')}`);
                const reRaise = new RegExp(`(raised|boosted)\\s+([^'\\n]+?)'s ${label.replace(/\\./g, '\\\\.')}`);
                const reSharplyLower = new RegExp(`sharply lowered\\s+([^'\\n]+?)'s ${label.replace(/\\./g, '\\\\.')}`);
                const reSharplyRaise = new RegExp(`(sharply (raised|boosted))\\s+([^'\\n]+?)'s ${label.replace(/\\./g, '\\\\.')}`);
                let m = line.match(reSharplyLower);
                if (m) { const w = resolveMon(m[1].trim()); if (w) popupStat(w.side, w.slot, stat, -2); return; }
                m = line.match(reSharplyRaise);
                if (m) { const w = resolveMon(m[3].trim()); if (w) popupStat(w.side, w.slot, stat, 2); return; }
                m = line.match(reLower);
                if (m) { const w = resolveMon(m[1].trim()); if (w) popupStat(w.side, w.slot, stat, -1); return; }
                m = line.match(reRaise);
                if (m) { const w = resolveMon(m[2].trim()); if (w) popupStat(w.side, w.slot, stat, 1); return; }
            }
            // "X's <Stat> was lowered/raised" (reflexive)
            for (const [label, stat] of Object.entries(STAT_KEYWORD)) {
                const re = new RegExp(`^([^']+?)'s ${label.replace(/\\./g, '\\\\.')} was (raised|lowered|sharply raised|sharply lowered)`);
                const m = line.match(re);
                if (m) {
                    const w = resolveMon(m[1].trim());
                    if (w) {
                        const mag = m[2].startsWith('sharply') ? 2 : 1;
                        popupStat(w.side, w.slot, stat, m[2].endsWith('raised') ? mag : -mag);
                    }
                    return;
                }
            }
            // "X flinched!"
            const flinch = line.match(/^([^!]+?) flinched/);
            if (flinch) {
                const w = resolveMon(flinch[1].trim());
                if (w) popupCustom(w.side, w.slot, 'FLINCHED', 'from-gray-700 to-gray-500', '\u273d');
                return;
            }
        } catch { /* parsing never throws visibly */ }
    };
    const origLogPush = tempLogs.push.bind(tempLogs);
    (tempLogs as { push: (...items: string[]) => number }).push = (...items: string[]) => {
        for (const item of items) dispatchLogPopup(item);
        return origLogPush(...items);
    };

    // Reset turn flags
    tempPTeam.forEach((p: Pokemon) => { if (p) { p.hasMovedThisTurn = false; p.tookDamageThisTurn = false; p.isProtected = false; } });
    tempETeam.forEach((p: Pokemon) => { if (p) { p.hasMovedThisTurn = false; p.tookDamageThisTurn = false; p.isProtected = false; } });

    // Synergy Check: If both players use moves of the same type, they get a boost
    const playerActions = pendingMoves.filter(m => m.isPlayer && m.move);
    if (playerActions.length === 2) {
        const a1 = playerActions[0];
        const a2 = playerActions[1];
        if (a1.move && a2.move && a1.move.type === a2.move.type && a1.move.type !== 'normal') {
            tempLogs.push(`SYNERGY! ${a1.move.type.toUpperCase()} moves are boosted!`);
            // Boost power for this turn - Reduced from 1.08 to 1.05 to prevent dominance
            a1.move = { ...a1.move, power: (a1.move.power || 0) * 1.05 };
            a2.move = { ...a2.move, power: (a2.move.power || 0) * 1.05 };
        }
    }

    let gameOver = false;
    let victory = false;

    // Helper to update React state mid-loop and wait
    const syncState = async (ms: number = 300) => {
         setBattleState(prev => ({ ...prev, playerTeam: tempPTeam, enemyTeam: tempETeam, logs: tempLogs.slice(-6), vfx: prev.vfx }));
         await delay(ms); 
    }

    const setVFX = async (type: string, target: 'player' | 'enemy', index: number, moveName?: string) => {
        setBattleState(prev => ({ ...prev, vfx: { type, target, index, moveName } }));
        // Showdown sprite animations run ~900ms; old hard-coded 500 ms cut them off.
        await delay(900);
        setBattleState(prev => ({ ...prev, vfx: null }));
    }

    const setDamageVFX = async (target: 'player' | 'enemy', index: number, damage: number, isCrit: boolean, effectiveness: number) => {
        const isSuper = effectiveness > 1;
        const isNotVery = effectiveness < 1 && effectiveness > 0;

        // Fire popups near the defender so the player can actually see that
        // their crit/SE mattered without having to read the log box.
        const slot = (index === 1 ? 1 : 0) as 0 | 1;
        if (isCrit) popupCrit(target, slot);
        if (isSuper) popupEffective(target, slot, 'super');
        else if (isNotVery) popupEffective(target, slot, 'resist');

        // Scale the shake to the hit: crit and super-effective both bump the
        // intensity one tier. Keeps the default battle snappy while making big
        // moments genuinely feel like big moments.
        let shake: BattleState['screenShake'] = false;
        if (damage > 40 || (isCrit && damage > 25) || (isSuper && damage > 25)) shake = 'heavy';
        else if (damage > 20 || isCrit || isSuper) shake = 'medium';
        else if (damage > 8) shake = 'light';

        setBattleState(prev => ({ 
            ...prev, 
            vfx: { 
                type: 'damage', 
                target, 
                index, 
                damage, 
                isCrit, 
                isSuperEffective: isSuper, 
                isNotVeryEffective: isNotVery 
            },
            screenShake: shake,
        }));
        await delay(800);
        setBattleState(prev => ({ ...prev, vfx: null, screenShake: false }));
    }

    for (const action of fullQueue as any[]) {
            // Re-check game state
            if (tempPTeam.every((p: Pokemon) => p.isFainted)) { gameOver = true; break; }
            if (tempETeam.every((p: Pokemon) => p.isFainted)) { victory = true; break; }
            
            let actor = action.isPlayer ? tempPTeam[action.actorIndex] : tempETeam[action.actorIndex];
            if (!actor) {
                console.warn(`Actor at index ${action.actorIndex} is undefined. Skipping action.`);
                continue;
            }
            if (actor.isFainted) continue;

            if (actor.mustRecharge) {
                actor.mustRecharge = false;
                tempLogs.push(`${actor.name} must recharge!`);
                await syncState(800);
                continue;
            }

            if (actor.isFlinching) {
                actor.isFlinching = false;
                tempLogs.push(`${actor.name} flinched and couldn't move!`);
                await syncState(800);
                continue;
            }

            actor.hasMovedThisTurn = true;
            actor.isDestinyBondActive = false;

            if (actor.chargingMove) {
                action.move = actor.chargingMove;
                actor.chargingMove = undefined;
                actor.isInvulnerable = false;
                tempLogs.push(`${actor.name} executed ${action.move.name}!`);
            }

            // Handle Switch Action
            if (action.switchIndex !== undefined) {
                const isPlayer = action.isPlayer;
                const activeTeam = isPlayer ? tempPTeam : tempETeam;
                const oldMon = activeTeam[action.actorIndex];
                const newMon = activeTeam[action.switchIndex];
                
                tempLogs.push(`${oldMon.name}, come back!`);
                
                // Trapped check
                if (oldMon.isTrapped && oldMon.isTrapped > 0 && oldMon.ability.name !== 'PhaseStep') {
                    tempLogs.push(`${oldMon.name} is trapped and cannot switch!`);
                    await syncState(800);
                    continue;
                }

                // Regenerator Ability
                if (oldMon.ability.name === 'Regenerator' && !oldMon.isFainted) {
                    const heal = Math.floor(oldMon.maxHp / 3);
                    oldMon.currentHp = Math.min(oldMon.maxHp, oldMon.currentHp + heal);
                    tempLogs.push(`${oldMon.name}'s Regenerator restored its HP!`);
                }

                // Reset stats and turn-based effects when switching out (unless Baton Pass)
                if (!battleState.isBatonPass) {
                    oldMon.statStages = {
                        attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0
                    };
                    oldMon.toxicTurns = 0;
                    oldMon.isProtected = false;
                    oldMon.isInvulnerable = false;
                    oldMon.isTrapped = 0;
                    oldMon.confusionTurns = 0;
                    oldMon.isLeechSeeded = false;
                    oldMon.isCursed = false;
                    oldMon.isNightmareActive = false;
                    oldMon.perishTurns = undefined;
                    oldMon.futureSightTurns = undefined;
                    oldMon.hasMovedThisTurn = false;
                    oldMon.tookDamageThisTurn = false;
                    oldMon.isDestinyBondActive = false;
                    oldMon.ignoresProtect = false;
                    oldMon.usedSacrificialGuard = false;
                    oldMon.usedTrickMirror = false;
                    oldMon.usedBackdraftClause = false;
                    oldMon.substituteHp = 0;
                } else {
                    // Copy effects to newMon (Baton Pass)
                    newMon.statStages = { ...oldMon.statStages };
                    newMon.confusionTurns = oldMon.confusionTurns;
                    newMon.isLeechSeeded = oldMon.isLeechSeeded;
                    newMon.substituteHp = oldMon.substituteHp;
                    newMon.isCursed = oldMon.isCursed;
                    newMon.perishTurns = oldMon.perishTurns;
                    newMon.isNightmareActive = oldMon.isNightmareActive;
                    newMon.isTrapped = oldMon.isTrapped;
                    
                    // Reset oldMon anyway for future use
                    oldMon.statStages = { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 };
                    oldMon.toxicTurns = 0;
                    oldMon.isProtected = false;
                    oldMon.isInvulnerable = false;
                    oldMon.isTrapped = 0;
                    oldMon.confusionTurns = 0;
                    oldMon.isLeechSeeded = false;
                    oldMon.isCursed = false;
                    oldMon.isNightmareActive = false;
                    oldMon.perishTurns = undefined;
                    oldMon.futureSightTurns = undefined;
                    oldMon.substituteHp = 0;
                }
                
                // Clear Baton Pass flag
                setBattleState(prev => ({ ...prev, isBatonPass: false }));

                // Tag Cleanse: When user switches out, its ally's status is cured
                if (oldMon.ability.name === 'TagCleanse') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.status) {
                        ally.status = undefined;
                        tempLogs.push(`${oldMon.name}'s Tag Cleanse cured ${ally.name}'s status!`);
                    }
                }

                tempLogs.push(`Go, ${newMon.name}!`);
                
                // Swap in the team array
                const newTeam = [...activeTeam];
                const temp = newTeam[action.actorIndex];
                newTeam[action.actorIndex] = newTeam[action.switchIndex];
                newTeam[action.switchIndex] = temp;
                
                if (isPlayer) tempPTeam = newTeam;
                else tempETeam = newTeam;

                // Healing Wish / Lunar Dance
                if (isPlayer && battleState.isHealingWishActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Healing Wish!`);
                    setBattleState(prev => ({ ...prev, isHealingWishActive: false }));
                }
                if (isPlayer && battleState.isLunarDanceActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Lunar Dance!`);
                    setBattleState(prev => ({ ...prev, isLunarDanceActive: false }));
                }
                if (!isPlayer && battleState.enemyIsHealingWishActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Healing Wish!`);
                    setBattleState(prev => ({ ...prev, enemyIsHealingWishActive: false }));
                }
                if (!isPlayer && battleState.enemyIsLunarDanceActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Lunar Dance!`);
                    setBattleState(prev => ({ ...prev, enemyIsLunarDanceActive: false }));
                }
                
                playCry(newMon.id, newMon.name);
                await syncState(500);

                // Arc Surge Ability
                if (newMon.ability.name === 'ArcSurge') {
                    setBattleState(prev => ({
                        ...prev,
                        [isPlayer ? 'electricSquallTurns' : 'enemyElectricSquallTurns']: 1
                    }));
                    tempLogs.push(`${newMon.name}'s Arc Surge created an electric squall!`);
                    
                    // Damage flying types
                    const foes = isPlayer ? tempETeam : tempPTeam;
                    foes.forEach(f => {
                        if (f && !f.isFainted && f.types.includes('flying')) {
                            const damage = Math.floor(f.maxHp / 8);
                            f.currentHp = Math.max(0, f.currentHp - damage);
                            tempLogs.push(`${f.name} was buffeted by the electric squall!`);
                        }
                    });
                }

                // Jetstream Ability
                if (newMon.ability.name === 'Jetstream' && !newMon.hasUsedJetstream) {
                    setBattleState(prev => ({
                        ...prev,
                        [isPlayer ? 'tailwindTurns' : 'enemyTailwindTurns']: 1
                    }));
                    newMon.hasUsedJetstream = true;
                    tempLogs.push(`${newMon.name}'s Jetstream set a one-turn Tailwind!`);
                }

                // Venomous Aura Ability
                if (newMon.ability.name === 'VenomousAura') {
                    const foes = isPlayer ? tempETeam : tempPTeam;
                    foes.forEach(f => {
                        if (f && !f.isFainted && !f.status && Math.random() < 0.3) {
                            f.status = 'poison';
                            tempLogs.push(`${newMon.name}'s Venomous Aura poisoned ${f.name}!`);
                        }
                    });
                }
                
                // Antibody Relay: When switching in, if ally is poisoned, cure it and boost own stats
                if (newMon.ability.name === 'AntibodyRelay') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.status === 'poison') {
                        ally.status = undefined;
                        if (newMon.statStages) {
                            newMon.statStages.attack = Math.min(6, (newMon.statStages.attack || 0) + 1);
                            newMon.statStages['special-attack'] = Math.min(6, (newMon.statStages['special-attack'] || 0) + 1);
                        }
                        tempLogs.push(`${newMon.name}'s Antibody Relay cured ${ally.name} and boosted its own stats!`);
                    }
                }
                
                const p = newMon;
                const ownSide: 'player' | 'enemy' = isPlayer ? 'player' : 'enemy';
                const ownSlot = ((action.actorIndex ?? 0) === 1 ? 1 : 0) as 0 | 1;
                // --- HAZARDS ---
                applyHazards(newMon, isPlayer, isPlayer ? (battleState.playerHazards || []) : (battleState.enemyHazards || []), tempLogs);

                // --- POPUP BANNERS (ability activations) ---------------------
                // Every meaningful on-entry ability gets a yellow "ABILITY"
                // banner near the Pokemon. The more interesting effects also
                // fire secondary popups (stat arrows, weather plates, status
                // icons) on whichever mon is actually affected.
                const ABILITY_LABELS: Record<string, string> = {
                    Intimidate: 'Intimidate', Drizzle: 'Drizzle', Drought: 'Drought',
                    SandStream: 'Sand Stream', SnowWarning: 'Snow Warning',
                    ArcSurge: 'Arc Surge', Ashstorm: 'Ashstorm', Jetstream: 'Jetstream',
                    SyncBoost: 'Sync Boost', AegisField: 'Aegis Field', BacklineGuard: 'Backline Guard',
                    RuneWard: 'Rune Ward', MysticFog: 'Mystic Fog', MysticHusk: 'Mystic Husk',
                    TideTurner: 'Tide Turner', GloomWard: 'Gloom Ward', ScaleAegis: 'Scale Aegis',
                    Protosynthesis: 'Protosynthesis', QuarkDrive: 'Quark Drive',
                    ThreatMatrix: 'Threat Matrix', QuietZone: 'Quiet Zone',
                    PartnerBoost: 'Partner Boost', ShieldWall: 'Shield Wall', Vanguard: 'Vanguard',
                    BatteryPack: 'Battery Pack', SmogLung: 'Smog Lung', VenomousAura: 'Venomous Aura',
                    GlacialAura: 'Glacial Aura', GravityWell: 'Gravity Well', RiftWalker: 'Rift Walker',
                    HazardEater: 'Hazard Eater', TagCleanse: 'Tag Cleanse', AntibodyRelay: 'Antibody Relay',
                    FusionMaster: 'Fusion Master', TypeTwist: 'Type Twist', PressurePoint: 'Pressure Point',
                    PrimalHunger: 'Primal Hunger', GrudgeEngine: 'Grudge Engine', ShadowTagger: 'Shadow Tagger',
                };
                if (p.ability?.name && ABILITY_LABELS[p.ability.name]) {
                    popupAbility(ownSide, ownSlot, ABILITY_LABELS[p.ability.name]);
                }
                // Weather abilities also get a weather plate.
                if (p.ability?.name === 'Drought') popupWeather(ownSide, ownSlot, 'sun');
                else if (p.ability?.name === 'Drizzle') popupWeather(ownSide, ownSlot, 'rain');
                else if (p.ability?.name === 'SandStream') popupWeather(ownSide, ownSlot, 'sand');
                else if (p.ability?.name === 'SnowWarning') popupWeather(ownSide, ownSlot, 'snow');
                // Intimidate's per-target Atk drop is emitted by the log
                // interceptor (which parses "X's Intimidate lowered Y's
                // Attack!"), so we only need the ability banner here.
                // Self-buff on switch-in.
                if (p.ability?.name === 'Vanguard') {
                    popupStat(ownSide, ownSlot, 'attack', 1);
                    popupStat(ownSide, ownSlot, 'speed', 1);
                }
                if (p.ability?.name === 'ShieldWall') {
                    popupStat(ownSide, ownSlot, 'defense', 1);
                    popupStat(ownSide, ownSlot, 'special-defense', 1);
                    popupStat(ownSide, ownSlot === 0 ? 1 : 0, 'defense', 1);
                    popupStat(ownSide, ownSlot === 0 ? 1 : 0, 'special-defense', 1);
                }
                if (p.ability?.name === 'TideTurner' && battleState.weather === 'rain') {
                    popupStat(ownSide, ownSlot, 'speed', 1);
                }
                // Tailwind custom plate.
                if (p.ability?.name === 'Jetstream') {
                    popupCustom(ownSide, ownSlot, 'TAILWIND', 'from-sky-500 to-cyan-500', '\u27a4');
                }
                if (p.ability?.name === 'QuietZone') {
                    popupCustom(ownSide, ownSlot, 'QUIET ZONE', 'from-slate-700 to-slate-500', '\u266a');
                }
                if (p.ability?.name === 'AegisField' || p.ability?.name === 'BacklineGuard') {
                    popupCustom(ownSide, ownSlot, 'SHIELDED', 'from-blue-600 to-indigo-500', '\u2748');
                }

                // --- ENTRY ABILITIES ON SWITCH ---
                if (p.ability.name === 'RiftWalker') {
                    tempLogs.push(`${p.name}'s Rift Walker swapped the field!`);
                    setBattleState(prev => {
                        let nextWeather = prev.weather;
                        let nextTerrain = prev.terrain;
                        
                        if (prev.weather === 'sun') nextWeather = 'rain';
                        else if (prev.weather === 'rain') nextWeather = 'sun';
                        else if (prev.weather === 'sand') nextWeather = 'hail';
                        else if (prev.weather === 'hail') nextWeather = 'sand';
                        
                        if (prev.terrain === 'electric') nextTerrain = 'grassy';
                        else if (prev.terrain === 'grassy') nextTerrain = 'electric';
                        else if (prev.terrain === 'psychic') nextTerrain = 'misty';
                        else if (prev.terrain === 'misty') nextTerrain = 'psychic';
                        
                        return { ...prev, weather: nextWeather, terrain: nextTerrain };
                    });
                }
                if (p.ability.name === 'GlacialAura') {
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (t && !t.isFainted && !t.status && Math.random() < 0.2) {
                            t.status = 'freeze';
                            tempLogs.push(`${t.name} was frozen by ${p.name}'s Glacial Aura!`);
                        }
                    });
                }
                if (p.ability.name === 'GravityWell') {
                    tempLogs.push(`${p.name}'s Gravity Well intensified gravity!`);
                    setBattleState(prev => ({ ...prev, gravityTurns: 5 }));
                }
                if (p.ability.name === 'Drizzle') { tempLogs.push(`${p.name}'s Drizzle summoned rain!`); setBattleState(prev => ({ ...prev, weather: 'rain', weatherTurns: 5 })); }
                if (p.ability.name === 'Drought') { tempLogs.push(`${p.name}'s Drought summoned sun!`); setBattleState(prev => ({ ...prev, weather: 'sun', weatherTurns: 5 })); }
                if (p.ability.name === 'SandStream') { tempLogs.push(`${p.name}'s Sand Stream summoned a sandstorm!`); setBattleState(prev => ({ ...prev, weather: 'sand', weatherTurns: 5 })); }
                if (p.ability.name === 'SnowWarning') { tempLogs.push(`${p.name}'s Snow Warning summoned snow!`); setBattleState(prev => ({ ...prev, weather: 'hail', weatherTurns: 5 })); }
                if (p.ability.name === 'ArcSurge') { tempLogs.push(`${p.name}'s Arc Surge summoned an electric squall!`); setBattleState(prev => ({ ...prev, weather: 'electric', weatherTurns: 5 })); }
                if (p.ability.name === 'Ashstorm') { tempLogs.push(`${p.name}'s Ashstorm summoned an ashstorm!`); setBattleState(prev => ({ ...prev, weather: 'ashstorm', weatherTurns: 5 })); }
                
                if (p.ability.name === 'Jetstream') {
                    setBattleState(prev => ({ ...prev, tailwindTurns: 2 }));
                    tempLogs.push(`${p.name}'s Jetstream whipped up a tailwind!`);
                }
                if (p.ability.name === 'SyncBoost') {
                    setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                    tempLogs.push(`${p.name}'s Sync Boost charged the Sync Gauge!`);
                }
                if (p.ability.name === 'AegisField' || p.ability.name === 'BacklineGuard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, aegisFieldTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: 1 }));
                    tempLogs.push(`${p.name}'s ${p.ability.name} is protecting the team!`);
                }
                if (p.ability.name === 'HazardEater') {
                    // Simplified: heal on switch-in
                    const heal = Math.floor(p.maxHp / 8);
                    p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                    tempLogs.push(`${p.name}'s Hazard Eater restored its HP!`);
                }
                if (p.ability.name === 'TagCleanse') {
                    if (p.status) {
                        p.status = undefined;
                        tempLogs.push(`${p.name}'s Tag Cleanse cured its status!`);
                    }
                }
                if (p.ability.name === 'QuietZone') {
                    setBattleState(prev => ({ ...prev, quietZoneTurns: 5 }));
                    tempLogs.push(`${p.name}'s Quiet Zone silenced the battlefield!`);
                }
                if (p.ability.name === 'ArcSurge') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, electricSquallTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyElectricSquallTurns: 1 }));
                    tempLogs.push(`${p.name}'s Arc Surge created an electric squall!`);
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (t && !t.isFainted && t.types.includes('flying')) {
                            t.currentHp = Math.max(0, t.currentHp - Math.floor(t.maxHp / 8));
                            tempLogs.push(`${t.name} was hurt by the electric squall!`);
                        }
                    });
                }
                if (p.ability.name === 'Jetstream') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, tailwindTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyTailwindTurns: 1 }));
                    tempLogs.push(`${p.name}'s Jetstream set a tailwind!`);
                }
                if (p.ability.name === 'AegisField') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, aegisFieldTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: 1 }));
                    tempLogs.push(`${p.name}'s Aegis Field protects the team!`);
                }
                if (p.ability.name === 'RuneWard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, runeWardTurns: 5 }));
                    else setBattleState(prev => ({ ...prev, enemyRuneWardTurns: 5 }));
                    tempLogs.push(`${p.name}'s Rune Ward protects the team from stat drops!`);
                }
                if (p.ability.name === 'MysticFog') {
                    setBattleState(prev => ({ ...prev, mysticFogActive: true }));
                    tempLogs.push(`${p.name}'s Mystic Fog lowered Accuracy for everyone!`);
                    [...tempPTeam, ...tempETeam].forEach(t => {
                        if (t && !t.isFainted && t.statStages) {
                            t.statStages.accuracy = Math.max(-6, (t.statStages.accuracy || 0) - 1);
                        }
                    });
                }
                if (p.ability.name === 'SyncBoost') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                    else setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 10) }));
                    tempLogs.push(`${p.name}'s Sync Boost charged the gauge!`);
                }
                if (p.ability.name === 'VenomousAura') {
                    tempETeam.slice(0, 2).forEach(t => {
                        if (!t.status && !t.isFainted && !t.types.includes('poison') && !t.types.includes('steel')) {
                            t.status = 'poison';
                            tempLogs.push(`${t.name} was poisoned by ${p.name}'s Venomous Aura!`);
                        }
                    });
                }
                if (p.ability.name === 'MysticFog') {
                    setBattleState(prev => ({ ...prev, mysticFogActive: true }));
                    tempLogs.push(`${p.name}'s Mystic Fog lowered Accuracy for everyone!`);
                    [...tempPTeam, ...tempETeam].forEach(t => {
                        if (t && !t.isFainted && t.statStages) {
                            t.statStages.accuracy = Math.max(-6, (t.statStages.accuracy || 0) - 1);
                        }
                    });
                }
                if (p.ability.name === 'Intimidate') {
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (!t.isFainted && t.statStages) {
                            t.statStages.attack = Math.max(-6, (t.statStages.attack || 0) - 1);
                            tempLogs.push(`${p.name}'s Intimidate lowered ${t.name}'s Attack!`);
                            if (t.heldItem?.id === 'adrenaline-orb') {
                                t.statStages.speed = Math.min(6, (t.statStages.speed || 0) + 1);
                                tempLogs.push(`${t.name}'s Adrenaline Orb boosted its Speed!`);
                                t.heldItem = undefined;
                            }
                        }
                    });
                }
                if (p.ability.name === 'RuneWard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, runeWardTurns: 5 }));
                    else setBattleState(prev => ({ ...prev, enemyRuneWardTurns: 5 }));
                    tempLogs.push(`${p.name}'s Rune Ward protects the team from stat drops!`);
                }
                if (p.ability.name === 'MysticHusk' && p.currentHp >= p.maxHp * 0.75) {
                    tempLogs.push(`${p.name}'s Mystic Husk is active!`);
                }
                if (p.ability.name === 'TideTurner' && battleState.weather === 'rain') {
                    if (p.statStages) {
                        p.statStages.speed = Math.min(6, (p.statStages.speed || 0) + 1);
                        tempLogs.push(`${p.name}'s Tide Turner raised its Speed!`);
                    }
                }
                if (p.ability.name === 'GloomWard') {
                    tempLogs.push(`${p.name}'s Gloom Ward protects it from confusion and sleep!`);
                }
                if (p.ability.name === 'ScaleAegis') {
                    tempLogs.push(`${p.name}'s Scale Aegis protects its Defense!`);
                }
                if ((p.ability.name === 'Protosynthesis' || p.ability.name === 'QuarkDrive') && p.heldItem?.id === 'booster-energy') {
                    tempLogs.push(`${p.name}'s Booster Energy activated!`);
                    p.heldItem = undefined;
                    p.isBoosterEnergyActive = true;
                }
                if (p.ability.name === 'ThreatMatrix') {
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (!t.isFainted) {
                            const moves = t.moves.map(m => m.name).join(', ');
                            tempLogs.push(`${p.name}'s Threat Matrix revealed ${t.name}'s moves: ${moves}`);
                        }
                    });
                }
                if (p.ability.name === 'QuietZone') {
                    setBattleState(prev => ({ ...prev, quietZoneTurns: 5 }));
                    tempLogs.push(`${p.name}'s Quiet Zone silenced the battlefield!`);
                }
                if (p.ability.name === 'BacklineGuard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, playerBacklineGuard: true }));
                    else setBattleState(prev => ({ ...prev, enemyBacklineGuard: true }));
                    tempLogs.push(`${p.name}'s Backline Guard is protecting the team!`);
                }
                if (p.ability.name === 'PartnerBoost') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        const stats: (keyof StatStages)[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
                        const highestStat = stats.reduce((a, b) => (ally.stats[a] > ally.stats[b] ? a : b));
                        ally.statStages[highestStat] = Math.min(6, (ally.statStages[highestStat] || 0) + 1);
                        tempLogs.push(`${p.name}'s Partner Boost raised ${ally.name}'s ${highestStat}!`);
                    }
                }
                if (p.ability.name === 'ShieldWall') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    [p, ally].forEach(mon => {
                        if (mon && !mon.isFainted && mon.statStages) {
                            mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                            mon.statStages['special-defense'] = Math.min(6, (mon.statStages['special-defense'] || 0) + 1);
                        }
                    });
                    tempLogs.push(`${p.name}'s Shield Wall boosted the team's defenses!`);
                }
                if (p.ability.name === 'Vanguard') {
                    if (p.statStages) {
                        p.statStages.attack = Math.min(6, (p.statStages.attack || 0) + 1);
                        p.statStages.speed = Math.min(6, (p.statStages.speed || 0) + 1);
                    }
                    tempLogs.push(`${p.name}'s Vanguard boosted its Attack and Speed!`);
                }
                if (p.ability.name === 'BatteryPack') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        ally.statStages['special-attack'] = Math.min(6, (ally.statStages['special-attack'] || 0) + 1);
                        tempLogs.push(`${p.name}'s Battery Pack boosted ${ally.name}'s Sp. Atk!`);
                    }
                }
                if (p.ability.name === 'SmogLung') {
                    const foes = isPlayer ? tempETeam : tempPTeam;
                    foes.slice(0, 2).forEach(f => {
                        if (f && !f.isFainted && f.statStages) {
                            f.statStages.attack = Math.max(-6, (f.statStages.attack || 0) - 1);
                            tempLogs.push(`${p.name}'s Smog Lung lowered ${f.name}'s Attack!`);
                        }
                    });
                }
                await syncState(1000);
                continue;
            }

            if (actor.isFlinching) {
                tempLogs.push(`${actor.name} flinched and couldn't move!`);
                await syncState(800);
                continue;
            }

            // 1. Handle Status Turn (Sleep, Freeze, Paralyze, Confusion)
            const statusCheck = handleStatusTurn(actor);
            if (statusCheck.msg) {
                tempLogs.push(statusCheck.msg);
                await syncState(800);
            }
            checkBerries(actor, tempLogs);
            if (statusCheck.damage) {
                actor.currentHp = Math.max(0, actor.currentHp - statusCheck.damage);
                actor.animationState = 'damage';
                await syncState(500);
                actor.animationState = 'idle';
            }
            if (actor.statusTurns) actor.statusTurns--;
            if (actor.confusionTurns) actor.confusionTurns--;

            if (!statusCheck.canMove) {
                continue;
            }

            if (action.item) {
                const item = ITEMS[action.item];
                if (item && item.category === 'pokeball') {
                    const target = tempETeam[action.targetIndex];
                    if (!target) {
                        tempLogs.push("Target not found!");
                        continue;
                    }
                    if (target.isFainted) { tempLogs.push("Cannot capture fainted!"); continue; }
                    if (battleState.isTrainerBattle) { tempLogs.push("Cannot capture a trainer's Pokémon!"); continue; }
                    
                    if (playerState.run.capturePermits <= 0) {
                        tempLogs.push("No Capture Permits remaining!");
                        continue;
                    }

                    tempLogs.push(`Using a Capture Permit on ${target.name}...`);
                    playMoveSfx('normal');
                    
                    await syncState(1000);

                    let catchMultiplier = 1;
                    // Special balls still give bonuses if you happen to have them from other sources, 
                    // but standard Poké Balls are now just Permits
                    if (action.item === 'great-ball') catchMultiplier = 1.5;
                    else if (action.item === 'ultra-ball') catchMultiplier = 2;
                    else if (action.item === 'master-ball') catchMultiplier = 255;

                    let catchRate = ((3 * target.maxHp - 2 * target.currentHp) * 45 * catchMultiplier) / (3 * target.maxHp) * (target.status ? 1.5 : 1);
                    
                    // Rift Upgrade Capture Boost
                    if (action.isPlayer) {
                        catchRate *= catchers_catchMult(playerState.meta);
                    }

                    // Catch Combo bonus: chaining the same species ramps the
                    // effective catch rate. Caps at +60% so Master / Ultra
                    // balls remain meaningfully stronger for zero-prep grabs.
                    const comboAlign = playerState.catchCombo && playerState.catchCombo.speciesId === target.id
                        ? playerState.catchCombo.count
                        : 0;
                    if (comboAlign > 0) {
                        // +2.5% per chain step, capped at +60% (24 chain).
                        catchRate *= 1 + Math.min(0.6, comboAlign * 0.025);
                    }

                    if (Math.random() * 255 < catchRate || action.item === 'master-ball') {
                        playCry(target.id, target.name);
                        tempLogs.push(`Gotcha! ${target.name} was caught!`);
                        target.isFainted = true;
                        
                        setPlayerState(prev => ({
                            ...prev,
                            run: {
                                ...prev.run,
                                capturePermits: prev.run.capturePermits - 1,
                                totalCaptures: prev.run.totalCaptures + 1
                            }
                        }));

                        // Catch XP Bonus for the whole team - Massively boosted to encourage catching over grinding
                        const catchXp = Math.floor((target.baseStats.hp * target.level) * 12);
                        const playerLevelCap = getPlayerLevelCap(playerState.badges);
                        const avgLevel = playerState.team.reduce((a, b) => a + b.level, 0) / playerState.team.length;
                        
                        for (const p of tempPTeam) {
                            if (!p.isFainted) {
                                const r = await gainExperience(p, catchXp, playerLevelCap, avgLevel);
                                Object.assign(p, r.mon);
                            }
                        }

                        const newMon = JSON.parse(JSON.stringify(target));
                        newMon.isFainted = false;
                        newMon.currentHp = newMon.maxHp;
                        newMon.status = undefined;

                        // Catch-Combo IV / shiny boost. Chain tiers:
                        //   5+:  guarantee 1 perfect IV, shiny 1/2048
                        //   10+: guarantee 2 perfect IVs, shiny 1/1024
                        //   20+: guarantee 3 perfect IVs, shiny 1/512
                        //   30+: guarantee 4 perfect IVs, shiny 1/256
                        //   50+: guarantee 5 perfect IVs, shiny 1/128
                        //
                        // Previous tuning ramped to 1/50 @ x50 which made
                        // shinies feel inevitable once you bothered chaining.
                        // The new curve keeps them a pursuit: a 50-chain is
                        // a full play-session commitment and still only ~30%
                        // cumulative shiny odds, which is a fun goal rather
                        // than a guaranteed outcome.
                        const comboForThisCatch = playerState.catchCombo && playerState.catchCombo.speciesId === target.id
                            ? playerState.catchCombo.count + 1 // +1 because this catch is about to bump it
                            : 1;
                        let guaranteedPerfect = 0;
                        let shinyDenom = 4096;
                        if (comboForThisCatch >= 50) { guaranteedPerfect = 5; shinyDenom = 128; }
                        else if (comboForThisCatch >= 30) { guaranteedPerfect = 4; shinyDenom = 256; }
                        else if (comboForThisCatch >= 20) { guaranteedPerfect = 3; shinyDenom = 512; }
                        else if (comboForThisCatch >= 10) { guaranteedPerfect = 2; shinyDenom = 1024; }
                        else if (comboForThisCatch >= 5)  { guaranteedPerfect = 1; shinyDenom = 2048; }

                        if (guaranteedPerfect > 0 && newMon.ivs) {
                            const statKeys = Object.keys(newMon.ivs) as Array<keyof typeof newMon.ivs>;
                            // Shuffle stat keys so the guaranteed 31s aren't always HP/Atk/Def.
                            for (let i = statKeys.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [statKeys[i], statKeys[j]] = [statKeys[j], statKeys[i]];
                            }
                            for (let i = 0; i < guaranteedPerfect && i < statKeys.length; i++) {
                                (newMon.ivs as any)[statKeys[i]] = 31;
                            }
                        }
                        if (!newMon.isShiny && Math.random() < 1 / shinyDenom) {
                            newMon.isShiny = true;
                        }

                        if (guaranteedPerfect > 0) {
                            tempLogs.push(`COMBO x${comboForThisCatch}! ${newMon.name} inherited ${guaranteedPerfect} perfect IVs!`);
                        }

                        // Talent: Held Legacy -- 25% of freshly caught mons
                        // come with a small pool of held items, if they don't
                        // already hold something the species spawned with.
                        if (!newMon.heldItem && hasTalent(playerState.meta, 'held_legacy') && Math.random() < 0.25) {
                            const pool = [
                                { id: 'oran-berry', name: 'Oran Berry' },
                                { id: 'sitrus-berry', name: 'Sitrus Berry' },
                                { id: 'leftovers', name: 'Leftovers' },
                                { id: 'rift-shard', name: 'Rift Shard' },
                                { id: 'focus-sash', name: 'Focus Sash' },
                            ];
                            newMon.heldItem = pool[Math.floor(Math.random() * pool.length)];
                            tempLogs.push(`${newMon.name} was holding a ${newMon.heldItem.name}!`);
                        }

                        // Talent: Synchrony -- first catch of a run inherits
                        // the starter's Nature so players can target Modest/
                        // Adamant/Timid runs without re-rolling forever.
                        // "First catch" = team currently just the starter.
                        if (hasTalent(playerState.meta, 'sync_inherit') && playerState.team.length === 1) {
                            const starterNature = playerState.team[0].nature;
                            if (starterNature && newMon.nature !== starterNature) {
                                newMon.nature = starterNature;
                                tempLogs.push(`Synchrony! ${newMon.name} shares your starter's ${starterNature} nature.`);
                            }
                        }

                        setPlayerState(prev => {
                            const lt = prev.lifetime ?? { shiniesCaught: 0, trainersDefeated: 0, biggestStreak: 0, currentStreak: 0, totalMoneyEarned: 0, graveyardsVisited: 0, visitedBiomes: [] };
                            const shinyBump = newMon.isShiny ? 1 : 0;
                            const nextLifetime = { ...lt, shiniesCaught: lt.shiniesCaught + shinyBump };

                            // Catch-Combo chain update: same species -> +1,
                            // different -> reset chain to 1 on the new species.
                            const prevCombo = prev.catchCombo;
                            const samSpecies = prevCombo && prevCombo.speciesId === newMon.id;
                            const nextCount = samSpecies ? prevCombo!.count + 1 : 1;
                            const nextBest = Math.max(prevCombo?.best ?? 0, nextCount);
                            const nextCombo = {
                                speciesId: newMon.id,
                                speciesName: newMon.name,
                                count: nextCount,
                                best: nextBest,
                            };
                            if (samSpecies && (nextCount === 5 || nextCount === 10 || nextCount === 20 || nextCount === 30 || nextCount === 50)) {
                                // Milestone toast so the player notices the
                                // system is rewarding them.
                                showToast(`Catch Combo x${nextCount}!`, 'reward', { kicker: newMon.name });
                            }
                            // Anomaly refund: if this was an "anomaly grass"
                            // wild, give the permit back so the player isn't
                            // punished by item scarcity for chasing rare
                            // auras. Ref is cleared after processing so
                            // subsequent non-anomaly catches don't inherit.
                            const anomalyPending = pendingAnomalyRef.current === 'anomaly';
                            const alphaPending   = pendingAnomalyRef.current === 'alpha';
                            const refundedPermits = anomalyPending
                                ? prev.run.capturePermits + 1
                                : prev.run.capturePermits;
                            const nextFlags = prev.storyFlags;

                            // Rift Token drops on catch of rare-aura mons.
                            // Award is deferred to the state update below
                            // (consumed on the meta merge). We only decide
                            // *here* so the toast text matches the actual
                            // award under all branches.
                            let catchTokens = 0;
                            if (anomalyPending) {
                                catchTokens += TOKEN_AWARDS.anomalyCatch;
                                showToast(
                                    `Anomaly captured! +1 Permit · +${TOKEN_AWARDS.anomalyCatch} Rift Token`,
                                    'reward', { kicker: 'RIFT TOKEN' }
                                );
                                pendingAnomalyRef.current = false;
                            } else if (alphaPending) {
                                catchTokens += TOKEN_AWARDS.alphaCatch;
                                showToast(
                                    `Alpha captured! +${TOKEN_AWARDS.alphaCatch} Rift Token`,
                                    'reward', { kicker: 'RIFT TOKEN' }
                                );
                                pendingAnomalyRef.current = false;
                            }
                            // Rift Ledger: double tokens in first hour of run.
                            if (catchTokens > 0 && hasTalent(prev.meta, 'rift_ledger')) {
                                const runStart = (prev.lifetime as any)?.runStartedAt as number | undefined;
                                if (runStart && Date.now() - runStart < 3_600_000) {
                                    catchTokens *= 2;
                                }
                            }

                            // Bounty progress: tick catch_any + catch_type,
                            // then also apply combo_update since the combo
                            // count just changed.
                            const caughtTypes = (newMon.types || []).map((t: string) => (t || '').toLowerCase());
                            let nextBounties = applyBountyEvent(prev.bounties?.active, { type: 'catch', typeIds: caughtTypes });
                            nextBounties = applyBountyEvent(nextBounties, { type: 'combo_update', count: nextCount });
                            const nextBountyState = prev.bounties ? { ...prev.bounties, active: nextBounties || prev.bounties.active } : prev.bounties;

                            const mergedMeta = catchTokens > 0
                                ? { ...prev.meta, riftTokens: (prev.meta.riftTokens || 0) + catchTokens }
                                : prev.meta;

                            // Vault: Seventh Seal expands the roster to 7.
                            // Battles still only deploy up to 6 actives.
                            const teamCap = hasVaultUnlock(prev.meta, 'team_slot_7') ? 7 : 6;
                            if (prev.team.length < teamCap) {
                                const scaledNew = autoScaleTeamToFloor([newMon], prev.badges, prev.run.maxDistanceReached)[0];
                                return {
                                    ...prev,
                                    team: [...prev.team, scaledNew],
                                    catchCombo: nextCombo,
                                    lifetime: nextLifetime,
                                    storyFlags: nextFlags,
                                    meta: mergedMeta,
                                    run: { ...prev.run, capturePermits: refundedPermits },
                                    bounties: nextBountyState,
                                };
                            }
                            return {
                                ...prev,
                                catchCombo: nextCombo,
                                lifetime: nextLifetime,
                                storyFlags: nextFlags,
                                meta: mergedMeta,
                                run: { ...prev.run, capturePermits: refundedPermits },
                                bounties: nextBountyState,
                            };
                        });

                        if (tempETeam.every((p: Pokemon) => p.isFainted)) {
                            victory = true;
                            await syncState(500);
                            break;
                        }
                        await syncState(500);
                    } else {
                        tempLogs.push(`Argh! ${target.name} broke free!`);
                        await syncState(500);
                    }
                    continue;
                }
                if (item && item.category === 'healing') {
                    let healAmount = 0;
                    let cureStatus = false;
                    
                    if (action.item === 'potion') healAmount = 20;
                    else if (action.item === 'super-potion') healAmount = 60;
                    else if (action.item === 'hyper-potion') healAmount = 120;
                    else if (action.item === 'max-potion') healAmount = actor.maxHp;
                    else if (action.item === 'full-restore') { healAmount = actor.maxHp; cureStatus = true; }
                    
                    if (action.isPlayer && healAmount > 0 && healAmount < actor.maxHp) {
                        healAmount = Math.floor(healAmount * swift_healMult(playerState.meta));
                    }
                    
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + healAmount);
                    if (cureStatus) actor.status = undefined;
                    
                    tempLogs.push(`${actor.name} used ${item.name} and restored HP!`);
                    
                    // Decrement inventory
                    setPlayerState(prev => {
                        const newInv = { ...prev.inventory };
                        if (action.item === 'potion') newInv.potions = Math.max(0, newInv.potions - 1);
                        else {
                            const idx = newInv.items.indexOf(action.item!);
                            if (idx > -1) {
                                const updatedItems = [...newInv.items];
                                updatedItems.splice(idx, 1);
                                newInv.items = updatedItems;
                            }
                        }
                        return { ...prev, inventory: newInv };
                    });

                    await syncState(800);
                    continue;
                }

                console.warn(`Unknown item action: ${action.item}. Skipping.`);
                continue;
            }

            // Flinch check
            if (actor.isFlinching) {
                tempLogs.push(`${actor.name} flinched and couldn't move!`);
                actor.isFlinching = false;
                await syncState(800);
                continue;
            }

            if (!action.move) {
                console.warn("Action has no move. Skipping.");
                continue;
            }

            // Move Logic
            actor.lastMoveMissed = false;
            const targetTeam = action.isPlayer ? tempETeam : tempPTeam;
            const isBothFoes = action.move.target === 'Both foes' || action.move.target === 'all-opponents';
            const targetsToHit = isBothFoes ? targetTeam.filter((t: Pokemon) => !t.isFainted) : [targetTeam[action.targetIndex]];
            
            if (targetsToHit.length === 0 || targetsToHit.every(t => !t || t.isFainted)) {
                tempLogs.push(`${actor.name}'s attack missed!`);
                actor.lastMoveMissed = true;
                
                // Mirror Focus
                if (actor.ability.name === 'MirrorFocus') {
                    actor.nextMoveBoosts = { ...actor.nextMoveBoosts, damageMult: 1.5 };
                    tempLogs.push(`${actor.name}'s Mirror Focus boosted its next move!`);
                }

                // Gauge Throttle Ability
                if (actor.ability.name === 'GaugeThrottle') {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'comboMeter' : 'enemyComboMeter']: Math.min(100, (action.isPlayer ? prev.comboMeter : prev.enemyComboMeter) + 5) }));
                    tempLogs.push(`${actor.name}'s Gauge Throttle generated Sync energy!`);
                }

                await syncState(500);
                continue;
            }

            // Sparkjump Ability
            if (actor.ability.name === 'Sparkjump' && (action.move.priority || 0) > 0) {
                if (actor.statStages) {
                    actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                    tempLogs.push(`${actor.name}'s Sparkjump raised its Speed!`);
                }
            }

            // Hot-Blooded Ability
            if (actor.ability.name === 'HotBlooded' && actor.status === 'burn') {
                const heal = Math.floor(actor.maxHp / 16);
                actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                tempLogs.push(`${actor.name}'s Hot-Blooded restored its HP from the burn!`);
            }

            tempLogs.push(`${actor.name} used ${action.move.name}!`);
            const previousMove = actor.lastMoveName;
            actor.lastMoveName = action.move.name;
            await delay(500);

            // Sealed Move Check
            if (actor.sealedMoveName === action.move.name && actor.sealedTurns && actor.sealedTurns > 0) {
                tempLogs.push(`${actor.name}'s ${action.move.name} is sealed and cannot be used!`);
                await syncState(800);
                continue;
            }

            for (let tIdx = 0; tIdx < targetsToHit.length; tIdx++) {
                let target = targetsToHit[tIdx];
                if (!target || target.isFainted) continue;

                // Determine if moving first relative to targets
                const currentActionIndex = (fullQueue as any[]).indexOf(action);
                const targetsHaveMoved = targetsToHit.some(t => {
                    const targetAction = (fullQueue as any[]).find(a => {
                        const isTargetPlayer = !action.isPlayer;
                        const team = isTargetPlayer ? tempPTeam : tempETeam;
                        return a.isPlayer === isTargetPlayer && team[a.actorIndex] === t;
                    });
                    if (!targetAction) return false;
                    return (fullQueue as any[]).indexOf(targetAction) < currentActionIndex;
                });
                const movingFirst = !targetsHaveMoved;

                // 2. Accuracy Check
                const hits = calculateAccuracy(actor, target, action.move, action.isPlayer, tempPTeam, tempETeam, battleState.weather, movingFirst);
                if (!hits) {
                    tempLogs.push(`${actor.name}'s attack missed ${target.name}!`);
                    actor.lastMoveMissed = true;

                    // Blunder Policy
                    if (actor.heldItem?.id === 'blunder-policy' && actor.statStages) {
                        actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 2);
                        tempLogs.push(`${actor.name}'s Blunder Policy sharply raised its Speed!`);
                        actor.heldItem = undefined;
                    }
                    
                    // Mirror Focus
                    if (actor.ability.name === 'MirrorFocus') {
                        actor.nextMoveBoosts = { ...actor.nextMoveBoosts, damageMult: 1.5 };
                        tempLogs.push(`${actor.name}'s Mirror Focus boosted its next move!`);
                    }

                    // Gauge Throttle Ability
                    if (actor.ability.name === 'GaugeThrottle') {
                        setBattleState(prev => ({ ...prev, [action.isPlayer ? 'comboMeter' : 'enemyComboMeter']: Math.min(100, (action.isPlayer ? prev.comboMeter : prev.enemyComboMeter) + 5) }));
                        tempLogs.push(`${actor.name}'s Gauge Throttle generated Sync energy!`);
                    }

                    await syncState(500);
                    continue;
                }

                // Start Attack Animation (Immutable update)
                const actorIdx = action.actorIndex;
                if (action.isPlayer) {
                    tempPTeam[actorIdx] = { ...tempPTeam[actorIdx], animationState: 'attack' };
                    actor = tempPTeam[actorIdx];
                } else {
                    tempETeam[actorIdx] = { ...tempETeam[actorIdx], animationState: 'attack' };
                    actor = tempETeam[actorIdx];
                }

                // --- FUSION MOVE CUE ---------------------------------------
                // Fusion moves are the headline gimmick of the whole game so
                // they deserve their own visual + audio punch. We fire a
                // popup banner on the actor, a low rumble SFX, and kick on
                // the screen shake early (before damageCalc completes) so
                // players can't miss that a Link move just happened.
                if (action.isFusion || action.move.isFusion) {
                    const actorSide: 'player' | 'enemy' = action.isPlayer ? 'player' : 'enemy';
                    popupCustom(
                        actorSide,
                        actorIdx as 0 | 1,
                        `LINK · ${action.move.name}`,
                        '#f5d67d',
                        '⚡',
                    );
                    // Charge sound: use a dramatic hit-stop effect. Falls back
                    // to the regular move SFX below if this URL fails.
                    playSound('https://play.pokemonshowdown.com/audio/sfx/megaevo.mp3', 0.55);
                    setBattleState(prev => ({ ...prev, screenShake: 'heavy' }));
                    await delay(320);
                    setBattleState(prev => ({ ...prev, screenShake: false }));
                }

                playMoveSfx(action.move.type || 'normal', action.move.name, action.move.sfx);
                const realTargetIndex = targetTeam.findIndex(mon => mon === target);
                await setVFX(action.move.type, action.isPlayer ? 'enemy' : 'player', realTargetIndex, action.move.name);
                await syncState(400); // Wait for attack

                // Iron Blood Ability (Immunity)
                if (target.ability.name === 'IronBlood' && action.move?.type === 'Poison') {
                    tempLogs.push(`${target.name}'s Iron Blood absorbed the poison!`);
                    const heal = Math.floor(target.maxHp / 16);
                    target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                    await syncState(500);
                    continue;
                }

                // Static Field Ability
                const staticFieldUser = [...tempPTeam, ...tempETeam].find(p => p && !p.isFainted && p.ability.name === 'StaticField');
                if (staticFieldUser && (action.move?.priority || 0) > 0 && Math.random() < 0.25) {
                    tempLogs.push(`${staticFieldUser.name}'s Static Field disrupted the priority move!`);
                    await syncState(500);
                    continue;
                }

                // Z-Move: pierces Protect. We set the flag on the actor so
                // pokeService's protect check lets this hit through; the
                // flag is consumed visually + numerically in the shim below.
                if (actor.zCharged) {
                    actor.ignoresProtect = true;
                }

                const res = calculateDamage(
                    actor, 
                    target, 
                    action.move, 
                    battleState.weather, 
                    battleState.terrain,
                    action.isPlayer ? battleState.comboMeter : battleState.enemyComboMeter,
                    action.isPlayer ? battleState.enemyComboMeter : battleState.comboMeter,
                    action.isPlayer,
                    battleState.tailwindTurns || 0,
                    battleState.enemyTailwindTurns || 0,
                    battleState.aegisFieldTurns || 0,
                    battleState.enemyAegisFieldTurns || 0,
                    movingFirst,
                    tempPTeam,
                    tempETeam,
                    battleState,
                    warden_level(playerState.meta),   // attackBoost (5% dmg/lvl)
                    warden_level(playerState.meta),   // defenseBoost (5% reduction/lvl)
                    swift_level(playerState.meta),    // speedBoost (5% speed/lvl)
                    warden_level(playerState.meta)    // critBoost (2% crit/lvl)
                );

                // --- Rift Transform damage shim ----------------------------
                // Tera's STAB + defensive typing are now handled inside
                // pokeService.calculateDamage() / getDamageMultiplier() so
                // ALL downstream math (effectiveness messages, crits,
                // secondary effects) sees the real numbers. What stays here:
                // Mega (persistent attacker/defender stats) and Z-Move
                // (one-shot multiplier + protect pierce).
                if (action.move.damage_class !== 'status' && res.damage > 0) {
                    if (actor.megaActive) {
                        res.damage = Math.floor(res.damage * MEGA_ATK_MULT);
                    }
                    if (target.megaActive) {
                        res.damage = Math.floor(res.damage / MEGA_DEF_MULT);
                    }
                    if (actor.zCharged) {
                        res.damage = Math.floor(res.damage * Z_DAMAGE_MULT);
                        actor.zCharged = false;
                        popupCustom(
                            action.isPlayer ? 'player' : 'enemy',
                            actorIdx as 0 | 1,
                            'Z-MOVE!',
                            '#fbbf24',
                            '✦',
                        );
                    }
                }

                // --- Early-pool signature-ability popups ---
                // Fire visible banners when the new abilities proc. The stat
                // mutations themselves are resolved inside damageCalc (power /
                // crit), so here we only need to announce.
                const actorSide: 'player' | 'enemy' = action.isPlayer ? 'player' : 'enemy';
                const actorSlot = action.actorIndex as 0 | 1;
                const moveTypeLower = (action.move?.type || '').toLowerCase();
                // EmberSpark set .usedEmberSpark inside damageCalc; that's our
                // signal that it procced *this* hit (flag was false before).
                if (actor.ability.name === 'EmberSpark' && actor.usedEmberSpark && moveTypeLower === 'fire' && !(actor as any)._emberSparkAnnounced) {
                    popupAbility(actorSide, actorSlot, 'Ember Spark');
                    (actor as any)._emberSparkAnnounced = true;
                }
                if (actor.ability.name === 'MoonCharm' && res.isCritical && (moveTypeLower === 'fairy' || moveTypeLower === 'normal')) {
                    popupAbility(actorSide, actorSlot, 'Moon Charm');
                }
                if (actor.ability.name === 'TwinFocus' && actor.allySharedTarget && res.damage > 0) {
                    popupAbility(actorSide, actorSlot, 'Twin Focus');
                }

                // BackdraftClause Ability
                if (res.wasBlockedByProtect && action.isFusion && actor.ability.name === 'BackdraftClause' && !actor.usedBackdraftClause) {
                    actor.usedBackdraftClause = true;
                    actor.ignoresProtect = true;
                    setBattleState(prev => {
                        if (action.isPlayer) return { ...prev, comboMeter: Math.min(100, prev.comboMeter + 20) };
                        else return { ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 20) };
                    });
                    tempLogs.push(`${actor.name}'s Backdraft Clause activated! Next Link move ignores Protect!`);
                }

                if (res.wasBlockedByProtect) {
                    tempLogs.push(`${target.name} protected itself!`);
                    continue;
                }

                if (res.damage === 0 && action.move.damage_class !== 'status') {
                    tempLogs.push(`It had no effect on ${target.name}!`);
                    continue;
                }

                if (res.damage > 0) {
                    target.tookDamageThisTurn = true;
                }

                let numHits = (res.hits || 1);
                if (actor.ability.name === 'ThreeHitWonder') {
                    numHits = 3;
                }
                if (actor.ability.name === 'EchoChamber' && action.move?.isSound && numHits === 1) {
                    numHits = 2;
                }
                let totalDamage = 0;

                // Harmony Engine: Link Gauge gains +20 on hit if allies share primary type
                if (actor.ability.name === 'HarmonyEngine') {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.types[0] === actor.types[0]) {
                        setBattleState(prev => {
                            if (action.isPlayer) {
                                const newMeter = Math.min(100, prev.comboMeter + 20);
                                return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                            } else {
                                const newMeter = Math.min(100, prev.enemyComboMeter + 20);
                                return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                            }
                        });
                        tempLogs.push(`${actor.name}'s Harmony Engine boosted the Sync Gauge!`);
                    }
                }

                // Sour Sap Ability: Grass moves may lower Sp. Def
                if (actor.ability.name === 'SourSap' && action.move.type === 'grass' && Math.random() < 0.2) {
                    if (target.statStages) {
                        target.statStages['special-defense'] = Math.max(-6, (target.statStages['special-defense'] || 0) - 1);
                        const aSide: 'player' | 'enemy' = action.isPlayer ? 'player' : 'enemy';
                        popupAbility(aSide, (action.actorIndex === 1 ? 1 : 0) as 0 | 1, 'Sour Sap');
                        tempLogs.push(`${actor.name}'s Sour Sap lowered ${target.name}'s Sp. Def!`);
                    }
                }

                // Blinding Sand Ability: In Sandstorm, moves may lower Accuracy
                if (actor.ability.name === 'BlindingSand' && battleState.weather === 'sand' && Math.random() < 0.1) {
                    if (target.statStages) {
                        target.statStages.accuracy = Math.max(-6, (target.statStages.accuracy || 0) - 1);
                        const aSide: 'player' | 'enemy' = action.isPlayer ? 'player' : 'enemy';
                        popupAbility(aSide, (action.actorIndex === 1 ? 1 : 0) as 0 | 1, 'Blinding Sand');
                        tempLogs.push(`${actor.name}'s Blinding Sand lowered ${target.name}'s Accuracy!`);
                    }
                }

                // Contact Abilities
                const makesContact = action.move.category === 'physical'; // Simplified contact check
                if (makesContact) {
                    // Heavy Stance Ability
                    if (target.ability.name === 'HeavyStance') {
                        if (target.statStages) {
                            target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                            target.statStages.defense = Math.min(6, (target.statStages.defense || 0) + 1);
                            tempLogs.push(`${target.name}'s Heavy Stance traded Speed for Defense!`);
                        }
                    }

                    // Frostbite Skin Ability
                    if (target.ability.name === 'FrostbiteSkin' && !target.status && Math.random() < 0.2) {
                        target.status = 'freeze';
                        const tSide: 'player' | 'enemy' = action.isPlayer ? 'enemy' : 'player';
                        popupAbility(tSide, realTargetIndex as 0 | 1, 'Frostbite Skin');
                        tempLogs.push(`${actor.name} was frozen by ${target.name}'s Frostbite Skin!`);
                    }

                    // Wound Leak Ability
                    if (target.ability.name === 'WoundLeak') {
                        const recoil = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} took recoil from ${target.name}'s Wound Leak!`);
                    }

                    // Static Charge Ability
                    if (target.ability.name === 'StaticCharge' && !actor.status && Math.random() < 0.3) {
                        actor.status = 'paralysis';
                        const tSide: 'player' | 'enemy' = action.isPlayer ? 'enemy' : 'player';
                        popupAbility(tSide, realTargetIndex as 0 | 1, 'Static Charge');
                        tempLogs.push(`${actor.name} was paralyzed by ${target.name}'s Static Charge!`);
                    }

                    // Flame Body Ability
                    if (target.ability.name === 'FlameBody' && !actor.status && Math.random() < 0.3) {
                        actor.status = 'burn';
                        const tSide: 'player' | 'enemy' = action.isPlayer ? 'enemy' : 'player';
                        popupAbility(tSide, realTargetIndex as 0 | 1, 'Flame Body');
                        tempLogs.push(`${actor.name} was burned by ${target.name}'s Flame Body!`);
                    }

                    // Iron Barbs / Rough Skin Ability
                    if (target.ability.name === 'IronBarbs' || target.ability.name === 'RoughSkin') {
                        const dmg = Math.floor(actor.maxHp / 8);
                        actor.currentHp = Math.max(0, actor.currentHp - dmg);
                        const tSide: 'player' | 'enemy' = action.isPlayer ? 'enemy' : 'player';
                        popupAbility(tSide, realTargetIndex as 0 | 1, target.ability.name === 'IronBarbs' ? 'Iron Barbs' : 'Rough Skin');
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s ${target.ability.name}!`);
                    }

                    // Gooey / Tangling Hair Ability
                    if (target.ability.name === 'Gooey' || target.ability.name === 'TanglingHair') {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.max(-6, (actor.statStages.speed || 0) - 1);
                            const tSide: 'player' | 'enemy' = action.isPlayer ? 'enemy' : 'player';
                            popupAbility(tSide, realTargetIndex as 0 | 1, target.ability.name === 'Gooey' ? 'Gooey' : 'Tangling Hair');
                            tempLogs.push(`${actor.name}'s Speed was lowered by ${target.name}'s ${target.ability.name}!`);
                        }
                    }

                    // Mummy Ability
                    if (target.ability.name === 'Mummy' && actor.heldItem?.id !== 'ability-shield') {
                        actor.ability = { ...target.ability };
                        tempLogs.push(`${actor.name}'s ability became Mummy!`);
                    }

                    // Wandering Spirit Ability
                    if (target.ability.name === 'WanderingSpirit' && actor.heldItem?.id !== 'ability-shield' && target.heldItem?.id !== 'ability-shield') {
                        const tempAbility = { ...actor.ability };
                        actor.ability = { ...target.ability };
                        target.ability = tempAbility;
                        tempLogs.push(`${actor.name} swapped abilities with ${target.name}!`);
                    }
                }

                // Cursed Body Ability
                if (target.ability.name === 'CursedBody' && Math.random() < 0.3) {
                    // Simplified: just log for now
                    tempLogs.push(`${target.name}'s Cursed Body is ready to disable!`);
                }

                // Ammo Share: Extra hit from ally if multi-hit move
                let finalNumHits = numHits;
                if (numHits > 1 && actor.ability.name === 'AmmoShare') {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        finalNumHits += 1;
                        tempLogs.push(`${ally.name} joined in with Ammo Share!`);
                    }
                }

                for (let h = 0; h < finalNumHits; h++) {
                    // Spread damage reduction
                    let finalDamage = res.damage;
                    if (actor.ability.name === 'EchoChamber' && action.move?.isSound && h === 1) {
                        finalDamage = Math.floor(finalDamage * 0.5);
                    }
                    if (isBothFoes && targetsToHit.length > 1) {
                        finalDamage = Math.floor(finalDamage * 0.75);
                    }
                    
                    // FossilDrive Ability
                    if (actor.ability.name === 'FossilDrive' && action.move?.type === 'Rock') {
                        tempLogs.push(`${actor.name}'s Fossil Drive powered up the move!`);
                    }

                    // RuneDrive Ability
                    if (actor.ability.name === 'RuneDrive' && action.move?.type === 'Fairy') {
                        tempLogs.push(`${actor.name}'s Rune Drive powered up the move!`);
                    }

                    // Relentless Ability
                    if (actor.ability.name === 'Relentless') {
                        const boost = 1 + (h * 0.1);
                        finalDamage = Math.floor(finalDamage * boost);
                    }

                    // Reset Attack, Start Damage (Immutable update)
                    if (action.isPlayer) {
                        tempPTeam[actorIdx] = { ...tempPTeam[actorIdx], animationState: 'idle' };
                        actor = tempPTeam[actorIdx];
                        tempETeam[realTargetIndex] = { ...tempETeam[realTargetIndex], animationState: 'damage', incomingAttackType: action.move.type };
                        target = tempETeam[realTargetIndex];
                    } else {
                        tempETeam[actorIdx] = { ...tempETeam[actorIdx], animationState: 'idle' };
                        actor = tempETeam[actorIdx];
                        tempPTeam[realTargetIndex] = { ...tempPTeam[realTargetIndex], animationState: 'damage', incomingAttackType: action.move.type };
                        target = tempPTeam[realTargetIndex];
                    }

                    // Lag Shock Ability (Handled in status application)
                    // Crossfire Burn Ability (Handled in status application)

                    if (target.substituteHp) {
                        const subDamage = Math.min(target.substituteHp, finalDamage);
                        target.substituteHp -= subDamage;
                        if (target.substituteHp <= 0) {
                            target.substituteHp = undefined;
                            tempLogs.push(`${target.name}'s substitute broke!`);
                        } else {
                            tempLogs.push(`${target.name}'s substitute took the hit!`);
                        }
                        finalDamage = 0;
                    }

                    // Survival Logic (Focus Band, Sturdy, Focus Sash, Withstand)
                    if (finalDamage >= target.currentHp && target.currentHp > 0) {
                        let survives = false;
                        let reason = '';
                        if (target.heldItem?.id === 'focus-band' && Math.random() < 0.1) {
                            survives = true;
                            reason = 'Focus Band';
                        }
                        if (target.ability.name === 'Sturdy' && target.currentHp === target.maxHp) {
                            survives = true;
                            reason = 'Sturdy';
                        }
                        if (target.heldItem?.id === 'focus-sash' && target.currentHp === target.maxHp) {
                            survives = true;
                            reason = 'Focus Sash';
                            target.heldItem = undefined; // Consume
                        }
                        if (target.ability.name === 'Withstand' && target.currentHp === target.maxHp) {
                            survives = true;
                            reason = 'Withstand';
                        }

                        if (survives) {
                            finalDamage = target.currentHp - 1;
                            tempLogs.push(`${target.name} endured the hit with its ${reason}!`);
                        }
                    }

                    // SacrificialGuard Ability
                    const targetAllyIdx = 1 - realTargetIndex;
                    const targetAlly = action.isPlayer ? tempETeam[targetAllyIdx] : tempPTeam[targetAllyIdx];
                    let damageTarget = target;
                    if (finalDamage >= target.currentHp && targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'SacrificialGuard' && !targetAlly.usedSacrificialGuard) {
                        damageTarget = targetAlly;
                        targetAlly.usedSacrificialGuard = true;
                        tempLogs.push(`${targetAlly.name}'s Sacrificial Guard took the hit for ${target.name}!`);
                    }
                    
                    damageTarget.currentHp = Math.max(0, damageTarget.currentHp - finalDamage);
                    if (finalDamage > 0) damageTarget.tookDamageThisTurn = true;
                    totalDamage += finalDamage;

                    // Primal Hunger Ability
                    if (actor.ability.name === 'PrimalHunger' && action.move?.isBiting) {
                        const heal = Math.floor(finalDamage * 0.5);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Primal Hunger restored its HP!`);
                    }
                    
                    // Trigger Damage VFX
                    if (finalDamage > 0) {
                        playEffectivenessSfx(res.effectiveness);
                        await setDamageVFX(
                            !action.isPlayer ? 'enemy' : 'player',
                            realTargetIndex,
                            finalDamage,
                            res.isCritical,
                            res.effectiveness
                        );
                    } else if (res.damage === 0 && action.move.damage_class !== 'status') {
                        setBattleState(prev => ({ 
                            ...prev, 
                            vfx: { type: 'miss', target: !action.isPlayer ? 'enemy' : 'player', index: realTargetIndex, isMiss: true } 
                        }));
                        await delay(600);
                        setBattleState(prev => ({ ...prev, vfx: null }));
                    }

                    checkBerries(target, tempLogs);

                    // Air Balloon Popping
                    if (target.heldItem?.id === 'air-balloon' && finalDamage > 0) {
                        tempLogs.push(`${target.name}'s Air Balloon popped!`);
                        target.heldItem = undefined;
                    }

                    // Weakness Policy
                    if (target.heldItem?.id === 'weakness-policy' && res.effectiveness > 1 && finalDamage > 0 && !target.isFainted) {
                        if (target.statStages) {
                            target.statStages.attack = Math.min(6, (target.statStages.attack || 0) + 2);
                            target.statStages['special-attack'] = Math.min(6, (target.statStages['special-attack'] || 0) + 2);
                            tempLogs.push(`${target.name}'s Weakness Policy sharply boosted its Attack and Sp. Atk!`);
                            target.heldItem = undefined;
                        }
                    }

                    // Eject Button
                    if (target.heldItem?.id === 'eject-button' && finalDamage > 0 && !target.isFainted) {
                        tempLogs.push(`${target.name} is switched out by its Eject Button!`);
                        target.heldItem = undefined;
                        if (action.isPlayer) {
                            setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: realTargetIndex }));
                        } else {
                            setBattleState(prev => ({ ...prev, mustSwitch: true, switchingActorIdx: realTargetIndex }));
                        }
                    }

                    // Red Card
                    if (target.heldItem?.id === 'red-card' && finalDamage > 0 && !actor.isFainted) {
                        tempLogs.push(`${target.name} showed the Red Card to ${actor.name}!`);
                        target.heldItem = undefined;
                        if (action.isPlayer) {
                            setBattleState(prev => ({ ...prev, mustSwitch: true, switchingActorIdx: action.actorIndex }));
                        } else {
                            setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: action.actorIndex }));
                        }
                    }

                    // Rocky Helmet
                    if (target.heldItem?.id === 'rocky-helmet' && action.move.contact && finalDamage > 0 && actor.heldItem?.id !== 'protective-pads' && actor.heldItem?.id !== 'punching-glove') {
                        const helmetDmg = Math.floor(actor.maxHp / 6);
                        actor.currentHp = Math.max(0, actor.currentHp - helmetDmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Rocky Helmet!`);
                    }

                    // Drain logic
                    if (action.move.meta?.drain && finalDamage > 0) {
                        let drainAmount = Math.floor(finalDamage * action.move.meta.drain / 100);
                        if (drainAmount > 0) {
                            if (actor.heldItem?.id === 'big-root') {
                                drainAmount = Math.floor(drainAmount * 1.3);
                            }
                            actor.currentHp = Math.min(actor.maxHp, actor.currentHp + drainAmount);
                            tempLogs.push(`${actor.name} drained energy from ${target.name}!`);
                        } else if (drainAmount < 0) {
                            actor.currentHp = Math.max(0, actor.currentHp + drainAmount);
                            tempLogs.push(`${actor.name} took recoil damage!`);
                        }
                    }

                    // Healing logic (for moves like Recover)
                    if (action.move.meta?.healing && action.move.damage_class === 'status') {
                        let healAmount = Math.floor(actor.maxHp * action.move.meta.healing / 100);
                        if (action.isPlayer) {
                            healAmount = Math.floor(healAmount * swift_healMult(playerState.meta));
                        }
                        if (healAmount > 0) {
                            actor.currentHp = Math.min(actor.maxHp, actor.currentHp + healAmount);
                            tempLogs.push(`${actor.name} restored its HP!`);
                        }
                    }

                    // Split Agony: Ally takes 10% of damage, user takes 20% less (handled in calcDamage)
                    if (target.ability.name === 'SplitAgony') {
                        const allyIdx = 1 - realTargetIndex;
                        const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            const allyDmg = Math.floor(finalDamage * 0.1);
                            ally.currentHp = Math.max(0, ally.currentHp - allyDmg);
                            tempLogs.push(`${ally.name} took some damage from Split Agony!`);
                        }
                    }

                    // Battery Ability
                    if (actor.ability.name === 'Battery' && finalDamage > 0) {
                        if (action.isPlayer) {
                            setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                        } else {
                            setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                        }
                        tempLogs.push(`${actor.name}'s Battery charged the Sync Gauge!`);
                    }

                    // Sparkjump Ability
                    if (actor.ability.name === 'Sparkjump' && (action.move.priority || 0) > 0) {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s Sparkjump boosted its Speed!`);
                        }
                    }

                    // Wardrum Ability
                    if (actor.ability.name === 'Wardrum' && action.move.type === 'Fighting') {
                        const allyIdx = 1 - actorIdx;
                        const ally = (action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted && ally.statStages) {
                            ally.statStages.attack = Math.min(6, (ally.statStages.attack || 0) + 1);
                            tempLogs.push(`${actor.name}'s Wardrum boosted ${ally.name}'s Attack!`);
                        }
                    }

                    // RuneBloom Ability
                    if (actor.ability.name === 'RuneBloom' && action.move.type === 'Fairy' && action.move.damage_class === 'status') {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s RuneBloom boosted its Speed!`);
                        }
                    }

                    // Heavy Stance Ability
                    if (target.ability.name === 'HeavyStance' && action.move.contact && finalDamage > 0) {
                        if (target.statStages) {
                            target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                            target.statStages.defense = Math.min(6, (target.statStages.defense || 0) + 1);
                            tempLogs.push(`${target.name}'s Heavy Stance traded Speed for Defense!`);
                        }
                    }

                    // Frostbite Skin Ability
                    if (target.ability.name === 'FrostbiteSkin' && action.move.contact && finalDamage > 0 && !actor.status) {
                        if (Math.random() < 0.2) {
                            actor.status = 'frostbite';
                            tempLogs.push(`${actor.name} was frostbitten by ${target.name}'s Frostbite Skin!`);
                        }
                    }

                    // ThornField Ability
                    if (target.ability.name === 'ThornField' && action.move.category === 'physical' && finalDamage > 0) {
                        const recoil = Math.floor(finalDamage / 8);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Thorn Field!`);
                    }

                    // SpikeCloak Ability
                    if (target.ability.name === 'SpikeCloak' && action.move.contact && finalDamage > 0) {
                        const recoil = Math.floor(finalDamage / 8);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Spike Cloak!`);
                        if (actor.statStages && Math.random() < 0.3) {
                            actor.statStages.speed = Math.max(-6, (actor.statStages.speed || 0) - 1);
                            tempLogs.push(`${actor.name}'s Speed fell!`);
                        }
                    }

                    // Iron Blood Ability
                    if (target.ability.name === 'IronBlood' && action.move.type === 'Poison') {
                        const heal = Math.floor(target.maxHp / 4);
                        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                        tempLogs.push(`${target.name}'s Iron Blood absorbed the poison!`);
                        finalDamage = 0; // Already handled in multiplier but double check
                    }

                    // Contact Charge Ability
                    if (actor.ability.name === 'ItemShatter' && action.move?.contact) {
                        if (target.heldItem) {
                            tempLogs.push(`${actor.name} shattered ${target.name}'s ${target.heldItem.name}!`);
                            target.heldItem = undefined;
                        }
                    }

                    // Life Steal Ability
                    if (actor.ability.name === 'LifeSteal' && action.move?.contact) {
                        const heal = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Life Steal restored its HP!`);
                    }

                    // Shimmer Hide Ability
                    if (actor.ability.name === 'ShimmerHide' && action.move?.type === 'Fairy' && res.isCritical) {
                        if (target.statStages) {
                            target.statStages.attack = Math.max(-6, (target.statStages.attack || 0) - 1);
                            tempLogs.push(`${actor.name}'s Shimmer Hide lowered ${target.name}'s Attack!`);
                        }
                    }

                    // Hollow Echo Ability
                    if (actor.ability.name === 'HollowEcho' && action.move?.type === 'Ghost' && res.isCritical) {
                        tempLogs.push(`${actor.name}'s Hollow Echo drained ${target.name}'s energy!`);
                    }

                    // Decay Touch Ability
                    if (target.ability.name === 'DecayTouch' && action.move?.contact) {
                        if (actor.statStages) {
                            actor.statStages.attack = Math.max(-6, (actor.statStages.attack || 0) - 1);
                            tempLogs.push(`${target.name}'s Decay Touch lowered ${actor.name}'s Attack!`);
                        }
                    }

                    // Venom Spite Ability
                if (target.ability.name === 'VenomSpite' && actor.status === 'poison' && res.damage > 0) {
                    if (actor.statStages) {
                        actor.statStages['special-defense'] = Math.max(-6, (actor.statStages['special-defense'] || 0) - 1);
                        tempLogs.push(`${target.name}'s Venom Spite lowered ${actor.name}'s Sp. Def!`);
                    }
                }

                // Wound Leak Ability
                    if (target.ability.name === 'WoundLeak' && action.move?.contact) {
                        const recoil = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Wound Leak!`);
                    }

                    // Razor Tread Ability
                    if (actor.ability.name === 'RazorTread' && action.move?.isSlicing && Math.random() < 0.3) {
                        if (target.statStages) {
                            target.statStages.defense = Math.max(-6, (target.statStages.defense || 0) - 1);
                            tempLogs.push(`${actor.name}'s Razor Tread lowered ${target.name}'s Defense!`);
                        }
                    }

                    // Pressure Point Ability
                    if (target.ability.name === 'PressurePoint' && res.effectiveness > 1) {
                        // PP reduction is hard to implement without move state, but we can log it
                        tempLogs.push(`${target.name}'s Pressure Point drained ${actor.name}'s energy!`);
                    }
                    
                    // Whirlpool Heart Ability
                    if (actor.ability.name === 'WhirlpoolHeart' && action.move?.type === 'water') {
                        const allyIdx = 1 - actorIdx;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            const heal = Math.floor(res.damage / 4);
                            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                            tempLogs.push(`${actor.name}'s Whirlpool Heart healed ${ally.name}!`);
                        }
                    }

                    // Amber Core Ability
                    if (actor.ability.name === 'AmberCore' && action.move?.type === 'bug') {
                        const heal = Math.floor(res.damage / 4);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Amber Core restored its HP!`);
                    }

                    // Torrent Sync Ability
                    if (actor.ability.name === 'TorrentSync' && action.move?.type === 'water') {
                        const allyIdx = 1 - actorIdx;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            ally.nextMoveDamageBoost = true;
                            tempLogs.push(`${actor.name}'s Torrent Sync boosted ${ally.name}!`);
                        }
                    }

                    // Storm Rider Ability
                    if (target.ability.name === 'StormRider' && action.move?.type === 'electric' && battleState.weather === 'rain') {
                        if (target.statStages) {
                            target.statStages.speed = Math.min(6, (target.statStages.speed || 0) + 1);
                            tempLogs.push(`${target.name}'s Storm Rider boosted its Speed!`);
                        }
                    }

                    // Life Steal Ability
                    if (actor.ability.name === 'LifeSteal' && action.move?.contact) {
                        const heal = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name} stole life with Life Steal!`);
                    }

                    // Frostbite Skin Ability
                    if (target.ability.name === 'FrostbiteSkin' && action.move?.contact && Math.random() < 0.2) {
                        if (!actor.status) {
                            actor.status = 'freeze';
                            tempLogs.push(`${actor.name} was frozen by ${target.name}'s Frostbite Skin!`);
                        }
                    }

                    // Contact Charge Ability
                    if (target.ability.name === 'ContactCharge' && action.move?.contact) {
                        setBattleState(prev => {
                            if (action.isPlayer) {
                                const newMeter = Math.min(100, prev.enemyComboMeter + 5);
                                return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                            } else {
                                const newMeter = Math.min(100, prev.comboMeter + 5);
                                return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                            }
                        });
                    }

                    // Panel Breaker Ability
                    if (actor.ability.name === 'PanelBreaker') {
                        // In this game, we don't have screens yet, but we can log it
                        tempLogs.push(`${actor.name}'s Panel Breaker shattered the defenses!`);
                    }

                    // Heavy Stance Ability
                    if (actor.ability.name === 'HeavyStance') {
                        if (target.statStages) {
                            target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                            tempLogs.push(`${actor.name}'s Heavy Stance lowered ${target.name}'s Speed!`);
                        }
                    }

                    // Wardrum Ability
                    if (actor.ability.name === 'Wardrum') {
                        setBattleState(prev => ({ ...prev, [action.isPlayer ? 'comboMeter' : 'enemyComboMeter']: Math.min(100, (action.isPlayer ? prev.comboMeter : prev.enemyComboMeter) + 2) }));
                        tempLogs.push(`${actor.name}'s Wardrum generated Sync energy!`);
                    }

                    // Link Saver Ability
                    if (actor.ability.name === 'LinkSaver' && action.move.name.toLowerCase().includes('link') && Math.random() < 0.5) {
                        tempLogs.push(`${actor.name}'s Link Saver saved Sync energy!`);
                        // Logic to prevent gauge consumption would go here if we had a consumption step
                    }

                    if (numHits > 1) {
                        await syncState(200);
                        if (target.currentHp === 0) break;
                    }
                }
                
                // TrickMirror Ability
                let realActor = actor;
                let realTarget = target;
                if (action.move.damage_class === 'status' && target.ability.name === 'TrickMirror' && !target.usedTrickMirror) {
                    target.usedTrickMirror = true;
                    tempLogs.push(`${target.name}'s Trick Mirror reflected the move!`);
                    realActor = target;
                    realTarget = actor;
                }

                const sec = applySecondaryEffect(realActor, realTarget, action.move, battleState.weather, battleState.terrain);

                // Link Conduit Ability
                if (actor.ability.name === 'LinkConduit' && Math.random() < 0.5) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                    } else {
                        setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                    }
                    tempLogs.push(`${actor.name}'s Link Conduit charged the Sync Gauge!`);
                }

                // Item Shatter Ability
                if (actor.ability.name === 'ItemShatter' && target.heldItem && Math.random() < 0.3) {
                    tempLogs.push(`${actor.name}'s Item Shatter destroyed ${target.name}'s ${target.heldItem.name}!`);
                    target.heldItem = undefined;
                }

                // Armor Melt Ability
                if (actor.ability.name === 'ArmorMelt' && Math.random() < 0.3) {
                    if (target.statStages) {
                        target.statStages.defense = Math.max(-6, (target.statStages.defense || 0) - 1);
                        tempLogs.push(`${actor.name}'s Armor Melt lowered ${target.name}'s Defense!`);
                    }
                }
                
                // Sync Pulse Ability
                if (actor.ability.name === 'SyncPulse') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        const stats: (keyof StatStages)[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
                        const randomStat = stats[Math.floor(Math.random() * stats.length)];
                        ally.statStages[randomStat] = Math.min(6, (ally.statStages[randomStat] || 0) + 1);
                        tempLogs.push(`${actor.name}'s Sync Pulse raised ${ally.name}'s ${randomStat}!`);
                    }
                }

                // Synchrony Tax Ability
                if (actor.ability.name === 'SynchronyTax') {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            return { ...prev, enemyComboMeter: Math.max(0, prev.enemyComboMeter - 5) };
                        } else {
                            return { ...prev, comboMeter: Math.max(0, prev.comboMeter - 5) };
                        }
                    });
                    tempLogs.push(`${actor.name}'s Synchrony Tax drained the enemy's Sync Gauge!`);
                }

                // Aftershock Ability
                if (actor.ability.name === 'Aftershock' && action.move?.type.toLowerCase() === 'electric') {
                    const extraDamage = Math.floor(target.maxHp / 16);
                    target.currentHp = Math.max(0, target.currentHp - extraDamage);
                    tempLogs.push(`${target.name} was hurt by the Aftershock!`);
                }

                // Slipstream Ability
                if (actor.ability.name === 'Slipstream' && action.move?.type.toLowerCase() === 'flying' && actor.statStages) {
                    actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                    tempLogs.push(`${actor.name}'s Slipstream boosted its Speed!`);
                }

                // Cavern Roar Ability
                if (actor.ability.name === 'CavernRoar' && action.move?.isSound && Math.random() < 0.2 && target.statStages) {
                    target.statStages.defense = Math.max(-6, (target.statStages.defense || 0) - 1);
                    tempLogs.push(`${actor.name}'s Cavern Roar lowered ${target.name}'s Defense!`);
                }

                // Type Twist Ability
                if (target.ability.name === 'TypeTwist' && action.move?.type) {
                    target.types = [action.move.type];
                    tempLogs.push(`${target.name}'s Type Twist changed its type to ${action.move.type}!`);
                }

                // Panel Breaker Ability
                if (actor.ability.name === 'PanelBreaker') {
                    // Simplified: break Aegis Field
                    if (action.isPlayer && battleState.enemyAegisFieldTurns > 0) {
                        setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: 0 }));
                        tempLogs.push(`${actor.name}'s Panel Breaker shattered the enemy's Aegis Field!`);
                    } else if (!action.isPlayer && battleState.aegisFieldTurns > 0) {
                        setBattleState(prev => ({ ...prev, aegisFieldTurns: 0 }));
                        tempLogs.push(`${actor.name}'s Panel Breaker shattered the team's Aegis Field!`);
                    }
                }

                // Spectator's Roar Ability
                if (actor.ability.name === 'SpectatorSRoar' && res.isCritical) {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (actor.statStages) actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                    if (ally && !ally.isFainted && ally.statStages) ally.statStages.speed = Math.min(6, (ally.statStages.speed || 0) + 1);
                    tempLogs.push(`${actor.name}'s Spectator's Roar boosted Speed!`);
                }

                // Gladiator's Spirit Ability
                if (actor.ability.name === 'GladiatorSSpirit' && target.currentHp === 0) {
                    if (actor.statStages) actor.statStages.defense = Math.min(6, (actor.statStages.defense || 0) + 1);
                    tempLogs.push(`${actor.name}'s Gladiator's Spirit raised its Defense!`);
                    
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        ally.nextMoveBoosts = { ...ally.nextMoveBoosts, healAtEnd: true };
                        tempLogs.push(`${ally.name} will be healed by Gladiator's Spirit at the end of the turn!`);
                    }
                }

                // Battery Pack Ability
                if (actor.ability.name === 'BatteryPack' && action.move && (action.move.pp || 0) >= 3) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                    else setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 10) }));
                    tempLogs.push(`${actor.name}'s Battery Pack boosted the Sync Gauge!`);
                }

                // Coalescence Ability
                if (actor.ability.name === 'Coalescence' && action.isFusion) {
                    const heal = Math.floor(actor.maxHp * 0.25);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name}'s Coalescence restored its HP!`);
                }

                // Link Pivot Ability
                if (actor.ability.name === 'LinkPivot' && action.isFusion) {
                    // Simplified: switch after fusion
                    tempLogs.push(`${actor.name}'s Link Pivot is ready to switch!`);
                }

                // Fuse Insurance Ability
                if (actor.ability.name === 'FuseInsurance' && action.isFusion && actor.currentHp === 0) {
                    actor.currentHp = 1;
                    tempLogs.push(`${actor.name} endured the hit with Fuse Insurance!`);
                }

                if (res.hits && res.hits > 1) {
                    tempLogs.push(`Hit ${res.hits} times!`);
                }

                if (res.recoil && res.recoil > 0) {
                    actor.currentHp = Math.max(0, actor.currentHp - res.recoil);
                    tempLogs.push(`${actor.name} is hurt by recoil!`);

                    // Recoil Bond: Ally heals for half of recoil damage
                    if (actor.ability.name === 'RecoilBond') {
                        const allyIdx = 1 - action.actorIndex;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            const heal = Math.floor(res.recoil / 2);
                            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                            tempLogs.push(`${actor.name}'s Recoil Bond healed ${ally.name}!`);
                        }
                    }
                }

                if (sec.drain && totalDamage > 0) {
                    const heal = Math.floor(totalDamage * sec.drain);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name} drained energy!`);
                }

                // --- APPLY SECONDARY EFFECTS ---
                if (sec.taunt) {
                    target.isTaunted = 3;
                    tempLogs.push(`${target.name} was taunted!`);
                }
                if (sec.encore) {
                    target.isEncored = 3;
                    target.encoredMove = target.lastMoveName;
                    tempLogs.push(`${target.name} was encored!`);
                }
                if (sec.disable) {
                    target.isDisabled = 4;
                    target.disabledMove = target.lastMoveName;
                    tempLogs.push(`${target.name}'s ${target.lastMoveName} was disabled!`);
                }
                if (sec.torment) {
                    target.isTormented = true;
                    tempLogs.push(`${target.name} was tormented!`);
                }
                if (sec.healBlock) {
                    target.isHealBlocked = 5;
                    tempLogs.push(`${target.name} was heal blocked!`);
                }
                if (sec.embargo) {
                    target.isEmbargoed = 5;
                    tempLogs.push(`${target.name} was embargoed!`);
                }
                if (sec.magnetRise) {
                    actor.isMagnetRaised = 5;
                    tempLogs.push(`${actor.name} levitated with Magnet Rise!`);
                }
                if (sec.telekinesis) {
                    target.isTelekinesised = 3;
                    tempLogs.push(`${target.name} was lifted by Telekinesis!`);
                }
                if (sec.ingrain) {
                    actor.isIngrained = true;
                    tempLogs.push(`${actor.name} planted its roots!`);
                }
                if (sec.aquaRing) {
                    actor.isAquaRinged = true;
                    tempLogs.push(`${actor.name} surrounded itself with a veil of water!`);
                }
                if (sec.imprison) {
                    actor.isImprisoned = true;
                    tempLogs.push(`${actor.name} imprisoned its foes!`);
                }
                if (sec.gravity) {
                    setBattleState(prev => ({ ...prev, gravityTurns: 5 }));
                    tempLogs.push(`Gravity intensified!`);
                }
                if (sec.healWish || sec.lunarDance) {
                    actor.currentHp = 0;
                    actor.isFainted = true;
                    actor.isHealingWishActive = true;
                    if (sec.lunarDance) actor.isLunarDanceActive = true;
                    tempLogs.push(`${actor.name} sacrificed itself!`);
                }
                if (sec.memento) {
                    actor.currentHp = 0;
                    actor.isFainted = true;
                    if (target.statStages) {
                        target.statStages.attack = Math.max(-6, (target.statStages.attack || 0) - 2);
                        target.statStages['special-attack'] = Math.max(-6, (target.statStages['special-attack'] || 0) - 2);
                    }
                    tempLogs.push(`${actor.name} sacrificed itself to lower ${target.name}'s stats!`);
                }
                if (sec.typeChange) {
                    actor.types = sec.typeChange;
                    tempLogs.push(`${actor.name}'s type changed to ${sec.typeChange.join('/')}!`);
                }
                if (sec.targetTypeChange) {
                    target.types = sec.targetTypeChange;
                    tempLogs.push(`${target.name}'s type changed to ${sec.targetTypeChange.join('/')}!`);
                }
                if (sec.batonPass) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, isBatonPass: true, playerSwitching: true, switchingMonIndex: actorIdx }));
                    else setBattleState(prev => ({ ...prev, enemyIsBatonPass: true, enemySwitching: true, enemySwitchingMonIndex: actorIdx }));
                }
                if (sec.pivot) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, playerSwitching: true, switchingMonIndex: actorIdx }));
                    else setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: actorIdx }));
                }

                // Life Orb Recoil
                if (actor.heldItem?.id === 'life-orb' && totalDamage > 0 && actor.ability.name !== 'MagicGuard') {
                    const loRecoil = Math.floor(actor.maxHp / 10);
                    actor.currentHp = Math.max(0, actor.currentHp - loRecoil);
                    tempLogs.push(`${actor.name} was hurt by its Life Orb!`);
                }

                // Overheat Drive Recoil
                if (actor.ability.name === 'OverheatDrive' && action.move?.type === 'Fire' && totalDamage > 0) {
                    const recoil = Math.floor(actor.maxHp / 8);
                    actor.currentHp = Math.max(0, actor.currentHp - recoil);
                    tempLogs.push(`${actor.name} took recoil from Overheat Drive!`);
                }

                // Shell Bell
                if (actor.heldItem?.id === 'shell-bell' && totalDamage > 0) {
                    const heal = Math.floor(totalDamage / 8);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name} restored HP with its Shell Bell!`);
                }

                // Metronome Item
                if (actor.heldItem?.id === 'metronome') {
                    if (previousMove === action.move.name) {
                        actor.metronomeCount = Math.min(5, (actor.metronomeCount || 0) + 1);
                    } else {
                        actor.metronomeCount = 0;
                    }
                }

                // King's Rock / Razor Fang
                if ((actor.heldItem?.id === 'kings-rock' || actor.heldItem?.id === 'razor-fang') && totalDamage > 0 && Math.random() < 0.1) {
                    targetsToHit.forEach(t => {
                        if (!t.isFainted) t.isFlinching = true;
                    });
                    tempLogs.push(`${actor.name}'s ${actor.heldItem.name} caused flinching!`);
                }
                
                // Battery Ability
                if (target.ability.name === 'Battery') {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const newMeter = Math.min(100, prev.enemyComboMeter + 5);
                            return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                        } else {
                            const newMeter = Math.min(100, prev.comboMeter + 5);
                            return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                        }
                    });
                }

                // Sparkjump Ability
                if (actor.ability.name === 'Sparkjump' && action.move?.priority && action.move.priority > 0) {
                    if (actor.statStages) {
                        actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                        tempLogs.push(`${actor.name}'s Sparkjump raised its Speed!`);
                    }
                }

                // Whirlpool Heart Ability
                if (actor.ability.name === 'WhirlpoolHeart' && action.move?.type.toLowerCase() === 'water') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        const heal = Math.floor(ally.maxHp / 16);
                        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Whirlpool Heart healed its ally!`);
                    }
                }

                // Amber Core Ability
                if (actor.ability.name === 'AmberCore' && action.move?.type.toLowerCase() === 'bug') {
                    const heal = Math.floor(actor.maxHp / 16);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name}'s Amber Core restored its HP!`);
                }

                // --- COMBO METER UPDATE ---
                // Harmony Bell (held item): when holder fires a fusion move,
                // restore 25% max HP to the ally. Runs BEFORE the reset-gauge
                // branch below so we still fire even though the hit dumped
                // the gauge to 0.
                if (action.isFusion && actor.heldItem?.id === 'harmony-bell') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        const heal = Math.floor(ally.maxHp * 0.25);
                        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Harmony Bell chimed -- ${ally.name} recovered HP!`);
                    }
                }

                setBattleState(prev => {
                    if (action.isFusion) {
                        if (action.isPlayer) return { ...prev, comboMeter: 0, fusionChargeActive: false };
                        else return { ...prev, enemyComboMeter: 0, enemyFusionChargeActive: false };
                    }
                    
                    let boost = 10;
                    
                    // Harmony Engine: If both allies share a primary type, boost more
                    if (actor.ability.name === 'HarmonyEngine') {
                        const allyIdx = 1 - action.actorIndex;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted && ally.types[0] === actor.types[0]) {
                            boost += 20;
                        } else {
                            boost += 5;
                        }
                    }

                    // Fusion Core (held item): 25% multiplicative boost to
                    // per-hit gauge fill. Applied at the end so it compounds
                    // with Harmony Engine / SyncPulse etc.

                    // Partner Boost Ability
                    if (action.isFusion) {
                        const allyIdx = 1 - actorIdx;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted && ally.ability.name === 'PartnerBoost' && ally.statStages) {
                            ally.statStages.speed = Math.min(6, (ally.statStages.speed || 0) + 1);
                            tempLogs.push(`${ally.name}'s Partner Boost raised its Speed!`);
                        }
                        if (actor.ability.name === 'PartnerBoost' && actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s Partner Boost raised its Speed!`);
                        }
                    }
                    
                    let pulseChance = 0.3;
                    if (actor.ability.name === 'Amplifier') pulseChance = 0.6;
                    if (actor.ability.name === 'SyncPulse' && Math.random() < pulseChance) boost += 10;

                    if (actor.heldItem?.id === 'fusion-core') boost = Math.floor(boost * 1.25);

                    if (action.isPlayer) {
                        const newMeter = Math.min(100, prev.comboMeter + boost);
                        return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                    } else {
                        const newMeter = Math.min(100, prev.enemyComboMeter + boost);
                        return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                    }
                });

                // Wardrum Ability
                if (actor.ability.name === 'Wardrum' && action.move?.type === 'Fighting' && Math.random() < 0.3) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        ally.statStages.attack = Math.min(6, (ally.statStages.attack || 0) + 1);
                        tempLogs.push(`${actor.name}'s Wardrum raised ${ally.name}'s Attack!`);
                    }
                }

                // Sour Sap Ability
                if (actor.ability.name === 'SourSap' && action.move?.type === 'Grass' && Math.random() < 0.2) {
                    if (target.statStages) {
                        target.statStages['special-defense'] = Math.max(-6, (target.statStages['special-defense'] || 0) - 1);
                        tempLogs.push(`${actor.name}'s Sour Sap lowered ${target.name}'s Sp. Def!`);
                    }
                }

                if (target.ability.name === 'HeavyStance' && action.move?.contact) {
                    if (target.statStages) {
                        target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                        target.statStages.defense = Math.min(6, (target.statStages.defense || 0) + 1);
                        tempLogs.push(`${target.name}'s Heavy Stance raised Defense but lowered Speed!`);
                    }
                }

                // Crosswind Move Effect
                if (action.move?.name === 'Crosswind') {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, tailwindTurns: 4 }));
                    else setBattleState(prev => ({ ...prev, enemyTailwindTurns: 4 }));
                    tempLogs.push(`A tailwind started blowing!`);
                }

                // Gravebind Move Effect
                if (action.move?.name === 'Gravebind') {
                    let turns = 4;
                    if (actor.heldItem?.id === 'grip-claw') turns = 7;
                    target.trappedTurns = turns;
                    if (target.lastMoveName) {
                        target.sealedMoveName = target.lastMoveName;
                        target.sealedTurns = 2;
                        tempLogs.push(`${target.name} was trapped and its ${target.lastMoveName} was sealed!`);
                    } else {
                        tempLogs.push(`${target.name} was trapped!`);
                    }
                }

                // Soul Resonance Move Effect
                if (action.move?.name === 'Soul Resonance') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        const allyHeal = Math.floor(ally.maxHp * 0.25);
                        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + allyHeal);
                        tempLogs.push(`${ally.name} was healed by Soul Resonance!`);
                    }
                    const selfHeal = Math.floor(actor.maxHp * 0.15);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + selfHeal);
                    tempLogs.push(`${actor.name} was healed by Soul Resonance!`);
                }

                // Eclipse Beam Move Effect
                if (action.move?.name === 'Eclipse Beam') {
                    if (battleState.trickRoomTurns && battleState.trickRoomTurns > 0) {
                        setBattleState(prev => ({ ...prev, trickRoomTurns: 0, tailwindTurns: 4 }));
                        tempLogs.push("Trick Room ended! Tailwind started blowing!");
                    } else if (battleState.tailwindTurns && battleState.tailwindTurns > 0) {
                        setBattleState(prev => ({ ...prev, tailwindTurns: 0, trickRoomTurns: 5 }));
                        tempLogs.push("Tailwind ended! Trick Room started!");
                    } else {
                        setBattleState(prev => ({ ...prev, trickRoomTurns: 5 }));
                        tempLogs.push("Trick Room started!");
                    }

                    // Room Service
                    [...tempPTeam, ...tempETeam].forEach(mon => {
                        if (mon && !mon.isFainted && mon.heldItem?.id === 'room-service' && mon.statStages) {
                            mon.statStages.speed = Math.max(-6, (mon.statStages.speed || 0) - 1);
                            tempLogs.push(`${mon.name}'s Room Service lowered its Speed!`);
                            mon.heldItem = undefined;
                        }
                    });
                }

                // End of Action: Track Link
                actor.lastMoveWasLink = action.isFusion;

                // Crystal Memory Ability
                if (actor.ability.name === 'CrystalMemory' && Math.random() < 0.3) {
                    tempLogs.push(`${actor.name}'s Crystal Memory restored its energy!`);
                }

                // Throat Spray
                if (actor.heldItem?.id === 'throat-spray' && action.move?.isSound) {
                    if (actor.statStages) {
                        actor.statStages['special-attack'] = Math.min(6, (actor.statStages['special-attack'] || 0) + 1);
                        tempLogs.push(`${actor.name}'s Throat Spray boosted its Sp. Atk!`);
                        actor.heldItem = undefined;
                    }
                }

                // Choice Item Lock
                if (actor.heldItem?.id.startsWith('choice-') && !actor.choiceMove && action.move) {
                    actor.choiceMove = action.move.name;
                }

                // Sync Pulse Ability
                if (actor.ability.name === 'SyncPulse' && action.isFusion) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        ally.nextMoveDamageBoost = true;
                        tempLogs.push(`${actor.name}'s Sync Pulse boosted ${ally.name}'s next move!`);
                    }
                }
                
                // Handle Fainting
                if (target.currentHp === 0 && !target.isFainted) {
                    target.isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${target.name} fainted!`);

                    // Destiny Bond
                    if (target.isDestinyBondActive && !actor.isFainted) {
                        actor.currentHp = 0;
                        actor.isFainted = true;
                        tempLogs.push(`${actor.name} took ${target.name} with it!`);
                    }
                    
                    const targetAllyIdx = 1 - realTargetIndex;
                    const targetAlly = (!action.isPlayer) ? tempPTeam[targetAllyIdx] : tempETeam[targetAllyIdx];

                    // Carry Over Ability: Pass item to ally on faint
                    if (target.ability.name === 'CarryOver') {
                        if (target.heldItem) {
                            if (targetAlly && !targetAlly.isFainted && !targetAlly.heldItem) {
                                targetAlly.heldItem = target.heldItem;
                                tempLogs.push(`${target.name}'s Carry Over passed its ${target.heldItem.name} to ${targetAlly.name}!`);
                                target.heldItem = undefined;
                            }
                        }
                        if (target.statStages) {
                            if (targetAlly && !targetAlly.isFainted && targetAlly.statStages) {
                                Object.keys(target.statStages).forEach(s => {
                                    const stat = s as keyof StatStages;
                                    targetAlly.statStages![stat] = Math.min(6, Math.max(-6, (targetAlly.statStages![stat] || 0) + (target.statStages![stat] || 0)));
                                });
                                tempLogs.push(`${target.name}'s Carry Over passed stats to ${targetAlly.name}!`);
                            }
                        }
                    }

                    // Soul Siphon Ability
                    if (actor.ability.name === 'SoulSiphon' && !actor.isFainted) {
                        const heal = Math.floor(actor.maxHp / 8);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        const stats: StatName[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
                        const randomStat = stats[Math.floor(Math.random() * stats.length)];
                        if (actor.statStages) {
                            actor.statStages[randomStat] = Math.min(6, (actor.statStages[randomStat] || 0) + 1);
                            tempLogs.push(`${actor.name}'s Soul Siphon restored HP and raised its ${randomStat}!`);
                        }
                    }

                    // Moxie Ability
                    if (actor.ability.name === 'Moxie' && actor.statStages) {
                        actor.statStages.attack = Math.min(6, (actor.statStages.attack || 0) + 1);
                        tempLogs.push(`${actor.name}'s Moxie raised its Attack!`);
                    }

                    // Reckless Tempo Ability
                    if (actor.ability.name === 'RecklessTempo' && !actor.isFainted) {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s Reckless Tempo raised its Speed!`);
                        }
                    }

                    // Soul Link Ability
                    if (targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'SoulLink') {
                        const heal = Math.floor(targetAlly.maxHp * 0.25);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${targetAlly.name}'s Soul Link restored its HP!`);
                    }

                    // Grim Recovery Ability
                    if (actor.ability.name === 'GrimRecovery' && target.status) {
                        const heal = Math.floor(actor.maxHp / 4);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Grim Recovery restored its HP!`);
                    }

                    // Feedback Ability
                    if (actor.ability.name === 'Feedback' && !actor.isFainted) {
                        setBattleState(prev => {
                            if (action.isPlayer) {
                                const newMeter = Math.min(100, prev.comboMeter + 20);
                                return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                            } else {
                                const newMeter = Math.min(100, prev.enemyComboMeter + 20);
                                return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                            }
                        });
                        tempLogs.push(`${actor.name}'s Feedback boosted the Sync Gauge!`);
                    }

                    // Grudge Engine Ability
                    if (targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'GrudgeEngine') {
                        targetAlly.nextMoveBoosts = { ...targetAlly.nextMoveBoosts, critRate: 1 };
                        tempLogs.push(`${targetAlly.name}'s Grudge Engine boosted its critical hit rate!`);
                    }

                    // Spirit Tether Ability
                    if (target.ability.name === 'SpiritTether' && targetAlly && !targetAlly.isFainted) {
                        const heal = Math.floor(targetAlly.maxHp * 0.5);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${target.name}'s Spirit Tether restored ${targetAlly.name}'s HP!`);
                    }

                    // Ashen Body Ability
                    if (target.ability.name === 'AshenBody') {
                        const foes = action.isPlayer ? tempETeam : tempPTeam;
                        foes.forEach(f => {
                            if (f && !f.isFainted && !f.status && !f.types.includes('fire')) {
                                f.status = 'burn';
                                tempLogs.push(`${f.name} was burned by ${target.name}'s Ashen Body!`);
                            }
                        });
                    }

                    // Death Wail Ability
                    if (target.ability.name === 'DeathWail') {
                        const foes = action.isPlayer ? tempETeam : tempPTeam;
                        foes.forEach(f => {
                            if (f && !f.isFainted && f.statStages) {
                                f.statStages.attack = Math.max(-6, (f.statStages.attack || 0) - 1);
                                tempLogs.push(`${target.name}'s Death Wail lowered ${f.name}'s Attack!`);
                            }
                        });
                    }

                    // Gave Pact Ability
                    if (target.ability.name === 'GavePact' && targetAlly && !targetAlly.isFainted) {
                        const heal = Math.floor(targetAlly.maxHp * 0.25);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${target.name}'s Gave Pact healed ${targetAlly.name}!`);
                    }

                    // Aftermath Ability
                    if (target.ability.name === 'Aftermath' && makesContact && !actor.isFainted) {
                        const dmg = Math.floor(actor.maxHp / 4);
                        actor.currentHp = Math.max(0, actor.currentHp - dmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Aftermath!`);
                    }

                    // Innards Out Ability
                    if (target.ability.name === 'InnardsOut' && !actor.isFainted) {
                        // Simplified: use last damage dealt
                        const dmg = totalDamage;
                        actor.currentHp = Math.max(0, actor.currentHp - dmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Innards Out!`);
                    }
                    
                    // Grudge Engine Ability
                    if (targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'GrudgeEngine') {
                        tempLogs.push(`${targetAlly.name}'s Grudge Engine is revving up!`);
                    }

                    // Final Spark Ability
                    if (target.ability.name === 'FinalSpark') {
                        const foes = action.isPlayer ? tempETeam : tempPTeam;
                        const dmg = Math.floor(target.maxHp * 0.25);
                        foes.forEach(f => {
                            if (f && !f.isFainted) {
                                f.currentHp = Math.max(0, f.currentHp - dmg);
                                tempLogs.push(`${f.name} was hit by ${target.name}'s Final Spark!`);
                            }
                        });
                    }

                    // Sacrifice Ability
                    if (target.ability.name === 'Sacrifice' && targetAlly && !targetAlly.isFainted && targetAlly.statStages) {
                        Object.keys(targetAlly.statStages).forEach(s => {
                            const stat = s as keyof StatStages;
                            targetAlly.statStages![stat] = 6;
                        });
                        tempLogs.push(`${target.name}'s Sacrifice maxed ${targetAlly.name}'s stats!`);
                    }

                    // Vengeance Ability
                    if (target.ability.name === 'Vengeance' && targetAlly && !targetAlly.isFainted) {
                        targetAlly.nextMoveDamageBoost = true;
                        tempLogs.push(`${target.name}'s Vengeance boosted ${targetAlly.name}'s next move!`);
                    }

                    // Fuse Insurance Ability
                    if (target.ability.name === 'FuseInsurance' && action.isFusion && targetAlly && !targetAlly.isFainted) {
                        const heal = Math.floor(targetAlly.maxHp * 0.5);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${target.name}'s Fuse Insurance restored ${targetAlly.name}'s HP!`);
                    }

                    if (action.isPlayer && !actor.isFainted) {
                        // Massively boosted XP to reduce grinding as requested (reaching cap in ~2 battles)
                        // Added Streak Bonus: +10% per streak point (max +100%)
                        const streakBonus = 1 + Math.min(1, battleState.battleStreak * 0.1);
                        let itemXpMult = 1;
                        if (actor.heldItem?.id === 'lucky-egg') itemXpMult = 1.5;
                        const xpGain = Math.floor((target.baseStats.hp * target.level) * 25 * streakBonus * purse_xpMult(playerState.meta) * itemXpMult * getDailyEvent().xpMult);
                        const playerLevelCap = getPlayerLevelCap(playerState.badges);
                        const avgLevel = playerState.team.reduce((a, b) => a + b.level, 0) / playerState.team.length;
                        const r = await gainExperience(actor, xpGain, playerLevelCap, avgLevel);
                        if (r.leveledUp) {
                            playLevelUpSfx();
                            tempLogs.push(`${actor.name} grew to Lv. ${r.mon.level}!`);
                            Object.assign(actor, r.mon); 
                            if(r.newMoves.length) tempLogs.push(`${actor.name} learned ${r.newMoves.join(', ')}!`);
                            // Mainline Pokemon behavior: don't interrupt the
                            // battle to evolve. Flag the target species and
                            // let the post-battle victory block play the
                            // cinematic after combat wraps up.
                            const nextId = await getEvolutionTarget(actor);
                            if (nextId) {
                                actor.pendingEvolutionId = nextId;
                                tempLogs.push(`${actor.name} seems ready to evolve...`);
                            }
                            await syncState(1000);
                        } else {
                            actor.xp = r.mon.xp;
                        }
                    }
                }
                
                if (res.effectiveness > 1) tempLogs.push("It's super effective!");
                if (res.effectiveness < 1 && res.effectiveness > 0) tempLogs.push("It's not very effective...");
                if (res.isCritical) tempLogs.push("Critical hit!");
                
                await syncState(800); // Wait for hit anim

                // Reset Damage Animation
                if (action.isPlayer) {
                    tempETeam[realTargetIndex] = { ...tempETeam[realTargetIndex], animationState: 'idle', incomingAttackType: undefined };
                    target = tempETeam[realTargetIndex];
                } else {
                    tempPTeam[realTargetIndex] = { ...tempPTeam[realTargetIndex], animationState: 'idle', incomingAttackType: undefined };
                    target = tempPTeam[realTargetIndex];
                }

                if (sec.charge && !actor.chargingMove) {
                    actor.chargingMove = action.move;
                    if (sec.invulnerable) actor.isInvulnerable = true;
                    tempLogs.push(`${actor.name} is charging ${action.move.name}!`);
                    await syncState(800);
                    continue;
                }

                if (sec.forceOut) {
                    const isPlayerTarget = !action.isPlayer;
                    const targetTeam = isPlayerTarget ? tempPTeam : tempETeam;
                    const nextIdx = targetTeam.findIndex((p, i) => i > 1 && !p.isFainted); // Find someone in the backline
                    if (nextIdx !== -1) {
                        const old = targetTeam[realTargetIndex];
                        targetTeam[realTargetIndex] = targetTeam[nextIdx];
                        targetTeam[nextIdx] = old;
                        tempLogs.push(`${old.name} was forced out! ${targetTeam[realTargetIndex].name} came in!`);
                        playCry(targetTeam[realTargetIndex].id, targetTeam[realTargetIndex].name);
                    } else {
                        tempLogs.push(`But there was no one to switch in!`);
                    }
                }

                if (sec.forceSwitch) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ 
                            ...prev, 
                            mustSwitch: true, 
                            switchingActorIdx: action.actorIndex,
                            isBatonPass: sec.batonPass
                        }));
                        tempLogs.push(`${realActor.name} is switching out!`);
                    } else {
                        const team = tempETeam;
                        const backline = team.slice(2).filter(p => !p.isFainted);
                        if (backline.length > 0) {
                            const nextIdx = team.indexOf(backline[0]);
                            const oldMon = team[action.actorIndex];
                            const newMon = team[nextIdx];
                            
                            if (sec.batonPass) {
                                newMon.statStages = { ...oldMon.statStages };
                                newMon.confusionTurns = oldMon.confusionTurns;
                                newMon.isLeechSeeded = oldMon.isLeechSeeded;
                                newMon.substituteHp = oldMon.substituteHp;
                            }
                            
                            // Swap
                            team[action.actorIndex] = newMon;
                            team[nextIdx] = oldMon;
                            tempLogs.push(`Enemy ${oldMon.name} switched out! Enemy ${newMon.name} came in!`);
                            playCry(newMon.id, newMon.name);
                        }
                    }
                }

                if (sec.itemRemoval) {
                    realTarget.heldItem = undefined;
                    tempLogs.push(`${realTarget.name}'s item was knocked off!`);
                }

                if (sec.recharge) {
                    realActor.mustRecharge = true;
                }

                if (sec.selfDamage) {
                    const damage = Math.floor(realActor.maxHp * sec.selfDamage);
                    realActor.currentHp = Math.max(0, realActor.currentHp - damage);
                    tempLogs.push(`${realActor.name} was hurt by its ${action.move.name}!`);
                }

                if (sec.selfDestruct) {
                    realActor.currentHp = 0;
                    realActor.isFainted = true;
                    tempLogs.push(`${realActor.name} fainted from self-destruction!`);
                }

                if (sec.taunt) {
                    realTarget.isTaunted = sec.taunt;
                    tempLogs.push(`${realTarget.name} was taunted!`);
                }
                if (sec.encore) {
                    realTarget.isEncored = sec.encore;
                    tempLogs.push(`${realTarget.name} was encored!`);
                }
                if (sec.disable) {
                    realTarget.isDisabled = sec.disable;
                    realTarget.disabledMoveName = action.move?.name;
                    tempLogs.push(`${realTarget.name}'s ${action.move?.name} was disabled!`);
                }
                if (sec.torment) {
                    realTarget.isTormented = true;
                    tempLogs.push(`${realTarget.name} was tormented!`);
                }
                if (sec.healBlock) {
                    realTarget.isHealBlocked = sec.healBlock;
                    tempLogs.push(`${realTarget.name} was heal blocked!`);
                }
                if (sec.embargo) {
                    realTarget.isEmbargoed = sec.embargo;
                    tempLogs.push(`${realTarget.name} was embargoed!`);
                }
                if (sec.magnetRise) {
                    realActor.isMagnetRaised = sec.magnetRise;
                    tempLogs.push(`${realActor.name} raised itself with electromagnetism!`);
                }
                if (sec.telekinesis) {
                    realTarget.isTelekinesised = sec.telekinesis;
                    tempLogs.push(`${realTarget.name} was lifted by telekinesis!`);
                }
                if (sec.ingrain) {
                    realActor.isIngrained = true;
                    tempLogs.push(`${realActor.name} planted its roots!`);
                }
                if (sec.aquaRing) {
                    realActor.isAquaRinged = true;
                    tempLogs.push(`${realActor.name} surrounded itself with a veil of water!`);
                }
                if (sec.imprison) {
                    realActor.isImprisoned = true;
                    tempLogs.push(`${realActor.name} imprisoned its foes!`);
                }
                if (sec.gravity) {
                    setBattleState(prev => ({ ...prev, gravityTurns: 5 }));
                    tempLogs.push(`Gravity intensified!`);
                }

                if (sec.healWish) {
                    realActor.currentHp = 0;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, isHealingWishActive: true }));
                    else setBattleState(prev => ({ ...prev, enemyIsHealingWishActive: true }));
                    tempLogs.push(`${realActor.name} sacrificed itself for the team!`);
                }
                if (sec.lunarDance) {
                    realActor.currentHp = 0;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, isLunarDanceActive: true }));
                    else setBattleState(prev => ({ ...prev, enemyIsLunarDanceActive: true }));
                    tempLogs.push(`${realActor.name} sacrificed itself for the team!`);
                }

                if (sec.batonPass) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ ...prev, isBatonPass: true, mustSwitch: true, switchingActorIdx: action.actorIndex }));
                    } else {
                        setBattleState(prev => ({ ...prev, enemyIsBatonPass: true, enemySwitching: true, enemySwitchingMonIndex: action.actorIndex }));
                    }
                    tempLogs.push(`${realActor.name} is switching out!`);
                }
                if (sec.pivot) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ ...prev, mustSwitch: true, switchingActorIdx: action.actorIndex }));
                    } else {
                        setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: action.actorIndex }));
                    }
                    tempLogs.push(`${realActor.name} is switching out!`);
                }

                if (sec.wish) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, wishTurns: 2 }));
                    else setBattleState(prev => ({ ...prev, enemyWishTurns: 2 }));
                    tempLogs.push(`${realActor.name} made a wish!`);
                }
                if (sec.yawn) {
                    realTarget.isYawned = 2;
                    tempLogs.push(`${realTarget.name} became drowsy!`);
                }
                if (sec.status === 'freeze') {
                    realTarget.status = 'freeze';
                    tempLogs.push(`${realTarget.name} was frozen solid!`);
                    // Trigger Status VFX
                    setBattleState(prev => ({ 
                        ...prev, 
                        vfx: { 
                            type: 'freeze', 
                            target: !action.isPlayer ? 'player' : 'enemy', 
                            index: realTargetIndex 
                        } 
                    }));
                }
                if (sec.typeChange) {
                    realActor.types = sec.typeChange;
                    tempLogs.push(`${realActor.name}'s type changed to ${sec.typeChange.join('/')}!`);
                }
                if (sec.targetTypeChange) {
                    realTarget.types = sec.targetTypeChange;
                    tempLogs.push(`${realTarget.name}'s type changed to ${sec.targetTypeChange.join('/')}!`);
                }

                if (sec.statusClear) {
                    if (sec.statusClear === 'self') {
                        realActor.status = undefined;
                        tempLogs.push(`${realActor.name} cleared its status!`);
                    } else {
                        const team = action.isPlayer ? tempPTeam : tempETeam;
                        team.forEach((p: Pokemon) => { if (p) p.status = undefined; });
                        tempLogs.push(`The team's status conditions were cleared!`);
                    }
                }

                if (sec.tailwind) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, tailwindTurns: 4 }));
                    else setBattleState(prev => ({ ...prev, enemyTailwindTurns: 4 }));
                    tempLogs.push(`A tailwind started blowing!`);
                }
                if (sec.trickRoom) {
                    setBattleState(prev => ({ ...prev, trickRoomTurns: 5 }));
                    tempLogs.push(`Trick Room was set!`);
                }

                if (sec.leechSeed) {
                    if (realTarget.types.includes('grass')) {
                        tempLogs.push(`It doesn't affect ${realTarget.name}!`);
                    } else if (realTarget.isLeechSeeded) {
                        tempLogs.push(`${realTarget.name} is already seeded!`);
                    } else {
                        realTarget.isLeechSeeded = true;
                        tempLogs.push(`${realTarget.name} was seeded!`);
                    }
                }

                if (sec.substitute) {
                    if (realActor.substituteHp) {
                        tempLogs.push(`${realActor.name} already has a substitute!`);
                    } else {
                        const cost = Math.floor(realActor.maxHp / 4);
                        if (realActor.currentHp > cost) {
                            realActor.currentHp -= cost;
                            realActor.substituteHp = cost;
                            tempLogs.push(`${realActor.name} created a substitute!`);
                        } else {
                            tempLogs.push(`But it didn't have enough HP!`);
                        }
                    }
                }

                if (sec.copyStats) {
                    if (realTarget.statStages) {
                        realActor.statStages = { ...realTarget.statStages };
                        tempLogs.push(`${realActor.name} copied ${realTarget.name}'s stat changes!`);
                    }
                }

                if (sec.reverseStats) {
                    if (realTarget.statStages) {
                        Object.keys(realTarget.statStages).forEach(s => {
                            const stat = s as keyof StatStages;
                            realTarget.statStages![stat] = -(realTarget.statStages![stat] || 0);
                        });
                        tempLogs.push(`${realTarget.name}'s stat changes were reversed!`);
                    }
                }

                if (sec.setHp !== undefined) {
                    realTarget.currentHp = Math.min(realTarget.maxHp, sec.setHp);
                    tempLogs.push(`${realTarget.name}'s HP was set!`);
                }

                if (sec.hpFraction !== undefined) {
                    const damage = Math.floor(realTarget.maxHp * sec.hpFraction);
                    realTarget.currentHp = Math.max(0, realTarget.currentHp - damage);
                    tempLogs.push(`${realTarget.name} lost HP!`);
                }

                if (sec.bellyDrum) {
                    const cost = Math.floor(realActor.maxHp / 2);
                    if (realActor.currentHp > cost && realActor.statStages) {
                        realActor.currentHp -= cost;
                        realActor.statStages.attack = 6;
                        tempLogs.push(`${realActor.name} cut its own HP and maximized its Attack!`);
                    } else {
                        tempLogs.push(`But it failed!`);
                    }
                }

                if (sec.destinyBond) {
                    realActor.isDestinyBondActive = true;
                    tempLogs.push(`${realActor.name} is trying to take its foe with it!`);
                }

                if (sec.perishSong) {
                    [...tempPTeam.slice(0, 2), ...tempETeam.slice(0, 2)].forEach(p => {
                        if (p && !p.isFainted) {
                            p.perishTurns = 4;
                        }
                    });
                    tempLogs.push(`All Pokémon that heard the song will faint in three turns!`);
                }

                if (sec.futureSight) {
                    realTarget.futureSightTurns = 3;
                    realTarget.futureSightDamage = 100; // Simplified base damage
                    tempLogs.push(`${realActor.name} foresaw an attack!`);
                }

                if (sec.itemSteal) {
                    if (realTarget.heldItem && !realActor.heldItem) {
                        realActor.heldItem = realTarget.heldItem;
                        realTarget.heldItem = undefined;
                        tempLogs.push(`${realActor.name} stole ${realTarget.name}'s ${realActor.heldItem.name}!`);
                    }
                }

                if (sec.curse) {
                    realTarget.isCursed = true;
                    tempLogs.push(`${realTarget.name} was cursed!`);
                }

                if (sec.clearStats) {
                    [...tempPTeam, ...tempETeam].forEach((p: Pokemon) => {
                        if (p && p.statStages) {
                            p.statStages = { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 };
                        }
                    });
                    tempLogs.push(`All stat changes were eliminated!`);
                }

                if (sec.healing) {
                    const heal = Math.floor(realActor.maxHp * sec.healing);
                    realActor.currentHp = Math.min(realActor.maxHp, realActor.currentHp + heal);
                    tempLogs.push(`${realActor.name} restored its HP!`);
                }

                if (sec.itemSwap) {
                    const tempItem = realActor.heldItem;
                    realActor.heldItem = realTarget.heldItem;
                    realTarget.heldItem = tempItem;
                    tempLogs.push(`${realActor.name} and ${realTarget.name} swapped items!`);
                }

                if (sec.reflect) {
                    const duration = actor.heldItem?.id === 'light-clay' ? 8 : 5;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, reflectTurns: duration }));
                    else setBattleState(prev => ({ ...prev, enemyReflectTurns: duration }));
                    tempLogs.push(`Reflect raised Defense!`);
                }
                if (sec.lightScreen) {
                    const duration = actor.heldItem?.id === 'light-clay' ? 8 : 5;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, lightScreenTurns: duration }));
                    else setBattleState(prev => ({ ...prev, enemyLightScreenTurns: duration }));
                    tempLogs.push(`Light Screen raised Special Defense!`);
                }
                if (sec.auroraVeil) {
                    const duration = actor.heldItem?.id === 'light-clay' ? 8 : 5;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, auroraVeilTurns: duration }));
                    else setBattleState(prev => ({ ...prev, enemyAuroraVeilTurns: duration }));
                    tempLogs.push(`Aurora Veil raised Defense and Special Defense!`);
                }

                if (sec.protect) {
                    actor.isProtected = true;
                    tempLogs.push(`${actor.name} protected itself!`);
                }

                if (sec.weatherChange) {
                    let duration = 5;
                    if (actor.heldItem?.id === 'damp-rock' && sec.weatherChange === 'rain') duration = 8;
                    if (actor.heldItem?.id === 'heat-rock' && sec.weatherChange === 'sun') duration = 8;
                    if (actor.heldItem?.id === 'smooth-rock' && sec.weatherChange === 'sand') duration = 8;
                    if (actor.heldItem?.id === 'icy-rock' && (sec.weatherChange === 'hail' || sec.weatherChange === 'snow')) duration = 8;
                    // Vault: Field Theorist -- your weather lingers +2 turns.
                    if (action.isPlayer && hasVaultUnlock(playerState.meta, 'field_theorist')) duration += 2;
                    setBattleState(prev => ({ ...prev, weather: sec.weatherChange as WeatherType, weatherTurns: duration }));
                    tempLogs.push(`The weather changed to ${sec.weatherChange}!`);
                }
                if (sec.terrainChange) {
                    let duration = actor.heldItem?.id === 'terrain-extender' ? 8 : 5;
                    // Vault: Field Theorist -- same +2 extension on terrain.
                    if (action.isPlayer && hasVaultUnlock(playerState.meta, 'field_theorist')) duration += 2;
                    setBattleState(prev => ({ ...prev, terrain: sec.terrainChange as TerrainType, terrainTurns: duration }));
                    tempLogs.push(`The terrain changed to ${sec.terrainChange}!`);
                }

                if (sec.setHazard) {
                    const isPlayerTarget = !action.isPlayer;
                    const hazardKey = isPlayerTarget ? 'playerHazards' : 'enemyHazards';
                    setBattleState(prev => {
                        const current = prev[hazardKey] || [];
                        if (!current.includes(sec.setHazard as any)) {
                            return { ...prev, [hazardKey]: [...current, sec.setHazard] };
                        }
                        return prev;
                    });
                    tempLogs.push(`${sec.setHazard} were set on the enemy's side!`);
                }

                if (sec.clearHazards) {
                    setBattleState(prev => ({
                        ...prev,
                        playerHazards: [],
                        enemyHazards: [],
                        reflectTurns: 0,
                        enemyReflectTurns: 0,
                        lightScreenTurns: 0,
                        enemyLightScreenTurns: 0,
                        auroraVeilTurns: 0,
                        enemyAuroraVeilTurns: 0
                    }));
                    tempLogs.push(`The effects of hazards and screens were cleared!`);
                }
                if (sec.tailwind) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'tailwindTurns' : 'enemyTailwindTurns']: 4 }));
                }
                if (sec.spikes) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (hazards.filter(h => h === 'Spikes').length < 3) {
                            hazards.push('Spikes');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.stealthRock) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (!hazards.includes('Stealth Rock')) {
                            hazards.push('Stealth Rock');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.toxicSpikes) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (hazards.filter(h => h === 'Toxic Spikes').length < 2) {
                            hazards.push('Toxic Spikes');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.reflect) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'reflectTurns' : 'enemyReflectTurns']: 5 }));
                }
                if (sec.lightScreen) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'lightScreenTurns' : 'enemyLightScreenTurns']: 5 }));
                }
                if (sec.auroraVeil && battleState.weather === 'snow') {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'auroraVeilTurns' : 'enemyAuroraVeilTurns']: 5 }));
                }
                if (sec.aegisField) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'aegisFieldTurns' : 'enemyAegisFieldTurns']: 5 }));
                }
                if (sec.runeWard) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'runeWardTurns' : 'enemyRuneWardTurns']: 5 }));
                }
                if (sec.syncGaugeDrain) {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const drain = Math.min(prev.enemyComboMeter, sec.syncGaugeDrain!);
                            return { ...prev, comboMeter: Math.min(100, prev.comboMeter + drain), enemyComboMeter: Math.max(0, prev.enemyComboMeter - drain) };
                        } else {
                            const drain = Math.min(prev.comboMeter, sec.syncGaugeDrain!);
                            return { ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + drain), comboMeter: Math.max(0, prev.comboMeter - drain) };
                        }
                    });
                }
                if (sec.trap) {
                    target.isTrapped = sec.trap;
                }
                if (sec.fieldWarp) {
                    setBattleState(prev => {
                        if (prev.tailwindTurns || prev.enemyTailwindTurns) {
                            return { ...prev, tailwindTurns: 0, enemyTailwindTurns: 0, trickRoomTurns: 5 };
                        } else {
                            return { ...prev, tailwindTurns: 5, enemyTailwindTurns: 5 };
                        }
                    });
                }
                if (sec.stickyWeb) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (!hazards.includes('Sticky Web')) {
                            hazards.push('Sticky Web');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.protect) {
                    target.isProtected = true;
                }
                if (sec.forceOut && target.ability.name !== 'AnchorGrip') {
                    const team = action.isPlayer ? tempETeam : tempPTeam;
                    const backline = team.slice(2).filter(p => !p.isFainted);
                    if (backline.length > 0) {
                        const randomIdx = Math.floor(Math.random() * backline.length);
                        const backIdx = team.indexOf(backline[randomIdx]);
                        const temp = team[realTargetIndex];
                        team[realTargetIndex] = team[backIdx];
                        team[backIdx] = temp;
                        tempLogs.push(`${target.name} was forced out!`);
                    }
                }
                if (sec.healing && actor.statStages) {
                    const heal = Math.floor(actor.maxHp * (sec.healing / 100));
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name} restored its HP!`);
                }
                if (sec.selfStatChanges && actor.statStages) {
                    sec.selfStatChanges.forEach(sc => {
                        const statName = sc.stat.name as keyof StatStages;
                        actor.statStages![statName] = Math.min(6, Math.max(-6, (actor.statStages![statName] || 0) + sc.change));
                        tempLogs.push(`${actor.name}'s ${statName} ${sc.change > 0 ? 'rose' : 'fell'}!`);

                        // Trigger Stat VFX
                        setBattleState(prev => ({ 
                            ...prev, 
                            vfx: { 
                                type: sc.change > 0 ? 'stat-up' : 'stat-down', 
                                target: action.isPlayer ? 'player' : 'enemy', 
                                index: action.actorIndex 
                            } 
                        }));
                    });
                }
                if (sec.weather) {
                    let duration = 5;
                    if (actor.heldItem?.id === 'damp-rock' && sec.weather === 'rain') duration = 8;
                    if (actor.heldItem?.id === 'heat-rock' && sec.weather === 'sun') duration = 8;
                    if (actor.heldItem?.id === 'smooth-rock' && sec.weather === 'sand') duration = 8;
                    if (actor.heldItem?.id === 'icy-rock' && (sec.weather === 'hail' || sec.weather === 'snow')) duration = 8;
                    setBattleState(prev => ({ ...prev, weather: sec.weather!, weatherTurns: duration }));
                    tempLogs.push(sec.msg || `The weather became ${sec.weather}!`);
                    
                    // Tide Turner Ability
                    if (sec.weather === 'rain') {
                        [...tempPTeam, ...tempETeam].forEach(p => {
                            if (p && !p.isFainted && p.ability.name === 'TideTurner' && p.statStages) {
                                p.statStages.speed = Math.min(6, (p.statStages.speed || 0) + 1);
                                tempLogs.push(`${p.name}'s Tide Turner boosted its Speed!`);
                            }
                        });
                    }
                    await syncState(500);
                }
                if (sec.terrain) {
                    const duration = actor.heldItem?.id === 'terrain-extender' ? 8 : 5;
                    setBattleState(prev => ({ ...prev, terrain: sec.terrain!, terrainTurns: duration }));
                    tempLogs.push(sec.msg || `The terrain became ${sec.terrain}!`);
                    await syncState(500);
                }
                if (sec.flinch) {
                    target.isFlinching = true;
                    tempLogs.push(sec.msg || `${target.name} flinched!`);
                    
                    // Shared Nerves Ability
                    const allyIdx = 1 - realTargetIndex;
                    const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.ability.name === 'SharedNerves') {
                        ally.isFlinchImmune = true;
                        tempLogs.push(`${ally.name}'s Shared Nerves made it immune to flinching!`);
                    }
                    await syncState(500);
                }
                if (sec.msg && !sec.weather && !sec.flinch) {
                    tempLogs.push(sec.msg);
                    if (sec.status === 'confusion') {
                        target.confusionTurns = Math.floor(Math.random() * 4) + 2; // 2-5 turns
                        checkBerries(target, tempLogs);
                    } else {
                        // Verdant Veil Ability
                        const verdantVeilUser = [...tempPTeam, ...tempETeam].find(p => p && !p.isFainted && p.ability.name === 'VerdantVeil');
                        const isTargetAllyOfVeil = verdantVeilUser && (
                            (tempPTeam.includes(verdantVeilUser) && tempPTeam.includes(target)) ||
                            (tempETeam.includes(verdantVeilUser) && tempETeam.includes(target))
                        );
                        if (isTargetAllyOfVeil && battleState.terrain === 'grassy') {
                            tempLogs.push(`${verdantVeilUser.name}'s Verdant Veil protected ${target.name} from status!`);
                            await syncState(500);
                            continue;
                        }

                        target.status = sec.status;
                        // Trigger Status VFX
                        setBattleState(prev => ({ 
                            ...prev, 
                            vfx: { 
                                type: sec.status === 'poison' || sec.status === 'toxic' ? 'poison_status' : sec.status!, 
                                target: !action.isPlayer ? 'player' : 'enemy', 
                                index: realTargetIndex 
                            } 
                        }));
                        if (sec.status === 'sleep') target.statusTurns = Math.floor(Math.random() * 3) + 1;
                        checkBerries(target, tempLogs);
                        
                        // Lag Shock & Crossfire Burn (Attacker has the ability)
                        if (sec.status === 'paralysis' && actor.ability.name === 'LagShock') {
                            const otherFoeIdx = 1 - realTargetIndex;
                            const otherFoe = (action.isPlayer) ? tempETeam[otherFoeIdx] : tempPTeam[otherFoeIdx];
                            if (otherFoe && !otherFoe.isFainted) {
                                otherFoe.nextMovePriorityBoost = (otherFoe.nextMovePriorityBoost || 0) - 1;
                                tempLogs.push(`${actor.name}'s Lag Shock reduced ${otherFoe.name}'s next move priority!`);
                            }
                        }
                        if (sec.status === 'burn' && actor.ability.name === 'CrossfireBurn') {
                            const otherFoeIdx = 1 - realTargetIndex;
                            const otherFoe = (action.isPlayer) ? tempETeam[otherFoeIdx] : tempPTeam[otherFoeIdx];
                            if (otherFoe && !otherFoe.isFainted) {
                                otherFoe.nextMoveDamageBoost = (otherFoe.nextMoveDamageBoost || 1) * 0.8;
                                tempLogs.push(`${actor.name}'s Crossfire Burn weakened ${otherFoe.name}'s next move!`);
                            }
                        }

                        // Split Agony Ability
                        if (sec.status === 'toxic' && target.ability.name === 'SplitAgony') {
                            target.status = 'poison';
                            tempLogs.push(`${target.name}'s Split Agony converted the toxic poison!`);
                            const allyIdx = 1 - realTargetIndex;
                            const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                            if (ally && !ally.isFainted && !ally.status) {
                                ally.status = 'poison';
                                tempLogs.push(`${target.name}'s Split Agony poisoned ${ally.name}!`);
                            }
                        }

                        // Antibody Relay: When user or ally is poisoned, other is cured
                        if (sec.status === 'poison' || sec.status === 'toxic') {
                            const allyIdx = 1 - realTargetIndex;
                            const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                            if (ally && !ally.isFainted && (target.ability.name === 'AntibodyRelay' || ally.ability.name === 'AntibodyRelay')) {
                                ally.status = undefined;
                                tempLogs.push(`${target.name}'s Antibody Relay cured ${ally.name}!`);
                            }
                        }
                    }
                    await syncState(500);
                }
                if (sec.statChanges && sec.statChanges.length > 0) {
                    const targetMon = sec.statTarget === 'self' ? actor : (sec.statTarget === 'ally' ? (action.isPlayer ? tempPTeam[1 - actorIdx] : tempETeam[1 - actorIdx]) : target);
                    if (targetMon && !targetMon.isFainted) {
                        const isProtectedByRuneWard = (action.isPlayer ? battleState.runeWardTurns : battleState.enemyRuneWardTurns) && (sec.statTarget !== 'self');
                        sec.statChanges.forEach((sc: any) => {
                            const stat = sc.stat.name as keyof StatStages;
                            if (targetMon.statStages) {
                                if (sc.change < 0 && isProtectedByRuneWard) {
                                    tempLogs.push(`${targetMon.name} is protected by Rune Ward!`);
                                    return;
                                }

                                // Clear Amulet
                                if (sc.change < 0 && targetMon.heldItem?.id === 'clear-amulet' && sec.statTarget !== 'self') {
                                    tempLogs.push(`${targetMon.name}'s Clear Amulet prevented stat loss!`);
                                    return;
                                }

                                // Mirror Herb
                                if (sc.change > 0 && sec.statTarget === 'self') {
                                    const opponentTeam = action.isPlayer ? tempETeam : tempPTeam;
                                    opponentTeam.forEach(opp => {
                                        if (opp && !opp.isFainted && opp.heldItem?.id === 'mirror-herb' && opp.statStages) {
                                            opp.statStages[stat] = Math.min(6, (opp.statStages[stat] || 0) + sc.change);
                                            tempLogs.push(`${opp.name}'s Mirror Herb mirrored the stat boost!`);
                                            opp.heldItem = undefined;
                                        }
                                    });
                                }

                                // Foil Ability: Redirect team-wide stat drops to user
                                if (sc.change < 0 && action.isPlayer !== (targetMon === tempPTeam[0] || targetMon === tempPTeam[1])) {
                                    const team = (targetMon === tempPTeam[0] || targetMon === tempPTeam[1]) ? tempPTeam : tempETeam;
                                    const allyIdx = 1 - team.indexOf(targetMon);
                                    const ally = team[allyIdx];
                                    if (ally && ally.ability.name === 'Foil' && !ally.isFainted && (action.move?.target === 'Both foes' || action.move?.target === 'all-opponents')) {
                                        tempLogs.push(`${targetMon.name} is protected by ${ally.name}'s Foil!`);
                                        if (ally.statStages) {
                                            ally.statStages[stat] = Math.min(6, Math.max(-6, (ally.statStages[stat] || 0) + sc.change * 2));
                                            tempLogs.push(`${ally.name}'s ${stat} fell sharply due to Foil!`);
                                        }
                                        return;
                                    }
                                }

                                const oldVal = targetMon.statStages[stat] || 0;
                                targetMon.statStages[stat] = Math.min(6, Math.max(-6, oldVal + sc.change));
                                tempLogs.push(`${targetMon.name}'s ${stat} ${sc.change > 0 ? 'rose' : 'fell'}!`);

                                // Eject Pack
                                if (sc.change < 0 && targetMon.heldItem?.id === 'eject-pack') {
                                    tempLogs.push(`${targetMon.name}'s Eject Pack activated!`);
                                    targetMon.heldItem = undefined;
                                    targetMon.mustSwitch = true;
                                }

                                // Trigger Stat VFX
                                const isPlayerTarget = action.isPlayer ? (targetMon === tempPTeam[0] || targetMon === tempPTeam[1]) : (targetMon === tempETeam[0] || targetMon === tempETeam[1]);
                                const targetIdx = (targetMon === tempPTeam[0] || targetMon === tempETeam[0]) ? 0 : 1;
                                setBattleState(prev => ({ 
                                    ...prev, 
                                    vfx: { 
                                        type: sc.change > 0 ? 'stat-up' : 'stat-down', 
                                        target: isPlayerTarget ? 'player' : 'enemy', 
                                        index: targetIdx 
                                    } 
                                }));

                                // Mirror Focus: When user's stats are lowered, ally's corresponding stat is raised
                                if (sc.change < 0 && targetMon.ability.name === 'MirrorFocus') {
                                    const allyIdx = 1 - (action.isPlayer ? tempPTeam.indexOf(targetMon) : tempETeam.indexOf(targetMon));
                                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                                    if (ally && !ally.isFainted && ally.statStages) {
                                        ally.statStages[stat] = Math.min(6, (ally.statStages[stat] || 0) + 1);
                                        tempLogs.push(`${targetMon.name}'s Mirror Focus raised ${ally.name}'s ${stat}!`);
                                    }
                                }

                                // Tempo Sync: When ally's Speed is raised, user's Speed is also raised
                                if (sc.change > 0 && stat === 'speed') {
                                    const allyIdx = 1 - (action.isPlayer ? tempPTeam.indexOf(targetMon) : tempETeam.indexOf(targetMon));
                                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                                    if (ally && !ally.isFainted && ally.ability.name === 'TempoSync' && ally.statStages) {
                                        ally.statStages.speed = Math.min(6, (ally.statStages.speed || 0) + 1);
                                        tempLogs.push(`${ally.name}'s Tempo Sync boosted its Speed!`);
                                    }
                                }
                            }
                        });
                        if (sec.msg && !sec.weather && !sec.flinch && !sec.status) tempLogs.push(sec.msg);
                        await syncState(500);
                    }
                }

                // Reset
                target.animationState = 'idle';
                target.incomingAttackType = undefined;

                // Link Pivot Ability
                if (actor.ability.name === 'LinkPivot' && action.move?.name.toLowerCase().includes('link')) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        ally.nextMovePriorityBoost = true;
                        tempLogs.push(`${actor.name}'s Link Pivot boosted ${ally.name}'s next move!`);
                    }
                }

                // Sync Pulse Ability
                if (actor.ability.name === 'SyncPulse' && Math.random() < 0.3) {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const newMeter = Math.min(100, prev.comboMeter + 10);
                            return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                        } else {
                            const newMeter = Math.min(100, prev.enemyComboMeter + 10);
                            return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                        }
                    });
                    tempLogs.push(`${actor.name}'s Sync Pulse boosted the Sync Gauge!`);
                }

                // Amplifier Ability: Boosts Sync Pulse chance to 60%
                if (actor.ability.name === 'Amplifier' && Math.random() < 0.6) {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const newMeter = Math.min(100, prev.comboMeter + 10);
                            return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                        } else {
                            const newMeter = Math.min(100, prev.enemyComboMeter + 10);
                            return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                        }
                    });
                    tempLogs.push(`${actor.name}'s Amplifier boosted the Sync Gauge!`);
                }

                // Wardrum Ability
                if (actor.ability.name === 'Wardrum' && action.move.type === 'fighting' && Math.random() < 0.3) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        ally.statStages.attack = Math.min(6, (ally.statStages.attack || 0) + 1);
                        tempLogs.push(`${actor.name}'s Wardrum raised ${ally.name}'s Attack!`);
                    }
                }

                // Rune Bloom Ability
                if (actor.ability.name === 'RuneBloom' && action.move.type === 'fairy' && action.move.category === 'status' && !actor.hasUsedRuneBloomThisTurn) {
                    if (actor.statStages) {
                        actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                        actor.hasUsedRuneBloomThisTurn = true;
                        tempLogs.push(`${actor.name}'s Rune Bloom raised its Speed!`);
                    }
                }
            }
        }

        // 4. End of Turn Status Damage & Abilities
        for (let i = 0; i < tempPTeam.length; i++) {
            const mon = tempPTeam[i];
            if (mon.isFainted) continue;
            
            // Slip Cover Ability
            const allyIdx = 1 - i;
            const ally = tempPTeam[allyIdx];
            if (mon.ability.name === 'SlipCover' && (!ally || ally.isFainted)) {
                if (mon.statStages) {
                    mon.statStages.evasion = Math.min(6, (mon.statStages.evasion || 0) + 1);
                    tempLogs.push(`${mon.name}'s Slip Cover raised its Evasion!`);
                }
            }

            // Tag Cleanse Ability
            if (mon.ability.name === 'TagCleanse' && Math.random() < 0.5) {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted && (ally.status || (ally.confusionTurns && ally.confusionTurns > 0))) {
                    ally.status = undefined;
                    ally.confusionTurns = 0;
                    tempLogs.push(`${mon.name}'s Tag Cleanse cured its ally!`);
                }
            }

            // Rain Dish+ & Chlorophyll+
            if (mon.ability.name === 'RainDishPlus' && battleState.weather === 'rain') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 2) }));
                tempLogs.push(`${mon.name} restored HP and Sync Gauge in the rain!`);
            }
            if (mon.ability.name === 'ChlorophyllPlus' && battleState.weather === 'sun') {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 2) }));
                tempLogs.push(`${mon.name} boosted its Sync Gauge in the sun!`);
            }

            // Salt Veins Ability
            if (mon.ability.name === 'SaltVeins' && mon.status === 'paralysis') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Salt Veins restored its HP!`);
            }

            // Moonlight Call Ability
            if (mon.ability.name === 'MoonlightCall' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Moonlight Call restored its HP!`);
            }

            // Shellblood Ability
            if (mon.ability.name === 'Shellblood' && mon.currentHp <= mon.maxHp / 2) {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Shellblood restored its HP!`);
            }

            // Photosynth Ability
            if (mon.ability.name === 'Photosynth' && battleState.weather === 'sun') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Photosynth restored its HP!`);
            }

            // Stone Harvest Ability
            if (mon.ability.name === 'StoneHarvest' && battleState.weather === 'sand') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                }
                tempLogs.push(`${mon.name}'s Stone Harvest restored HP and raised Defense!`);
            }

            // Energy Core Ability
            if (mon.ability.name === 'EnergyCore' && !mon.tookDamageThisTurn) {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                tempLogs.push(`${mon.name}'s Energy Core boosted the Sync Gauge!`);
            }

            // Bleakwind Ability
            if (mon.ability.name === 'Bleakwind' && battleState.weather === 'hail') {
                tempETeam.forEach(e => {
                    if (e && !e.isFainted && e.statStages) {
                        e.statStages.speed = Math.max(-6, (e.statStages.speed || 0) - 1);
                        tempLogs.push(`${mon.name}'s Bleakwind lowered ${e.name}'s Speed!`);
                    }
                });
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;
            mon.isInvulnerable = false;

            // Perish Song
            if (mon.perishTurns !== undefined) {
                mon.perishTurns--;
                tempLogs.push(`${mon.name}'s perish count fell to ${mon.perishTurns}!`);
                if (mon.perishTurns === 0) {
                    mon.currentHp = 0;
                    mon.isFainted = true;
                    tempLogs.push(`${mon.name} fainted from Perish Song!`);
                }
            }

            // Future Sight
            if (mon.futureSightTurns !== undefined) {
                mon.futureSightTurns--;
                if (mon.futureSightTurns === 0) {
                    const damage = mon.futureSightDamage || 100;
                    mon.currentHp = Math.max(0, mon.currentHp - damage);
                    tempLogs.push(`${mon.name} was hit by Future Sight!`);
                    mon.futureSightTurns = undefined;
                }
            }

            // Leech Seed
            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                const actualDamage = Math.min(mon.currentHp, damage);
                tempPTeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - actualDamage), animationState: 'damage' };
                tempLogs.push(`${mon.name}'s health was sapped by Leech Seed!`);
                
                // Heal the opponent(s)
                const foes = tempETeam.slice(0, 2).filter(f => !f.isFainted);
                if (foes.length > 0) {
                    const healPerFoe = Math.floor(actualDamage / foes.length);
                    foes.forEach(f => {
                        f.currentHp = Math.min(f.maxHp, f.currentHp + healPerFoe);
                    });
                }
                await syncState(500);
                tempPTeam[i] = { ...tempPTeam[i], animationState: 'idle' };
                if (tempPTeam[i].currentHp === 0) {
                    tempPTeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${tempPTeam[i].name} fainted!`);
                    await syncState(500);
                }
            }

            // Nightmare
            if (mon.isNightmareActive && mon.status === 'sleep' && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`${mon.name} is locked in a nightmare!`);
            }

            // Curse (Ghost)
            if (mon.isCursed && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`${mon.name} is afflicted by a curse!`);
            }

            // Trapping Damage (Binding Band)
            if (mon.trappedTurns && mon.trappedTurns > 0 && !mon.isFainted) {
                let trapDamageMult = 1;
                // Check if any opponent has Binding Band (simplified)
                const opponents = i < 2 ? tempETeam : tempPTeam;
                if (opponents.some((o: Pokemon) => o && !o.isFainted && o.heldItem?.id === 'binding-band')) {
                    trapDamageMult = 1.5;
                }
                const trapDamage = Math.floor(mon.maxHp / 8 * trapDamageMult);
                mon.currentHp = Math.max(0, mon.currentHp - trapDamage);
                tempLogs.push(`${mon.name} is hurt by the trap!`);
                if (mon.currentHp === 0) {
                    mon.isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${mon.name} fainted!`);
                }
            }

            // Withstand Ability (Ally protection)
            const allyIdxW = 1 - i;
            const allyW = tempPTeam[allyIdxW];
            if (allyW && allyW.currentHp === 0 && !allyW.isFainted && mon.ability.name === 'Withstand' && !mon.usedWithstand) {
                allyW.currentHp = 1;
                mon.usedWithstand = true;
                tempLogs.push(`${mon.name}'s Withstand protected ${allyW.name}!`);
            }

            const endResP = handleEndOfTurnStatus(mon, battleState.weather, battleState.terrain);
            if (endResP.damage > 0) {
                tempPTeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - endResP.damage), animationState: 'damage' };
                tempLogs.push(endResP.msg!);
                await syncState(500);
                tempPTeam[i] = { ...tempPTeam[i], animationState: 'idle' };
                if (tempPTeam[i].currentHp === 0) {
                    tempPTeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${tempPTeam[i].name} fainted!`);
                    await syncState(500);
                }
            } else if (endResP.damage < 0) {
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp - endResP.damage) };
                tempLogs.push(endResP.msg!);
                await syncState(500);
            }

            // Lifebloom Ability (Aura)
            if (mon.ability.name === 'Lifebloom') {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 16);
                    tempPTeam[allyIdx] = { ...ally, currentHp: Math.min(ally.maxHp, ally.currentHp + heal) };
                    tempLogs.push(`${mon.name}'s Lifebloom healed its ally!`);
                    popupAbility('player', allyIdx as 0 | 1, 'Lifebloom');
                }
            }

            // DreamEater: heal 1/8 max HP per sleeping foe on the field.
            if (mon.ability.name === 'DreamEater') {
                const sleepingFoes = tempETeam.filter(f => f && !f.isFainted && f.status === 'sleep').length;
                if (sleepingFoes > 0) {
                    const heal = Math.floor(mon.maxHp / 8) * sleepingFoes;
                    tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                    tempLogs.push(`${mon.name} drained the dreams of ${sleepingFoes} foe${sleepingFoes > 1 ? 's' : ''}!`);
                    popupAbility('player', i as 0 | 1, 'Dream Eater');
                }
            }

            // Gladiator's Spirit (Ally heal)
            const allyIdxGS = 1 - i;
            const allyGS = tempPTeam[allyIdxGS];
            if (allyGS && !allyGS.isFainted && allyGS.ability.name === 'GladiatorSSpirit' && (allyGS.koCount || 0) > 0) {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${allyGS.name}'s Gladiator's Spirit restored ${mon.name}'s HP!`);
            }

            // healAtEnd (Gladiator's Spirit one-time or persistent)
            if (mon.nextMoveBoosts?.healAtEnd) {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name} was healed by Gladiator's Spirit!`);
                mon.nextMoveBoosts.healAtEnd = false;
            }

            // Overclock
            if (mon.ability.name === 'Overclock') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    const recoil = Math.floor(mon.maxHp / 16);
                    mon.currentHp = Math.max(0, mon.currentHp - recoil);
                    tempLogs.push(`${mon.name}'s Overclock boosted Speed but caused recoil!`);
                }
            }
            // Slow Pulse
            if (mon.ability.name === 'SlowPulse') {
                [...tempPTeam, ...tempETeam].forEach(target => {
                    if (target && !target.isFainted && target.statStages) {
                        target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                    }
                });
                tempLogs.push(`${mon.name}'s Slow Pulse slowed everyone down!`);
            }
            // Lucky Bark
            if (mon.ability.name === 'LuckyBark' && Math.random() < 0.1) {
                const heal = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`${mon.name}'s Lucky Bark restored its HP!`);
            }
            // Pollen Surge
            if (mon.ability.name === 'PollenSurge' && battleState.weather === 'sun') {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 8);
                    ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                    tempLogs.push(`${mon.name}'s Pollen Surge healed ${ally.name}!`);
                }
            }
            // Night Bloom
            if (mon.ability.name === 'NightBloom' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 8);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`${mon.name}'s Night Bloom restored its HP!`);
            }
            // Abyssal Pull
            if (mon.ability.name === 'AbyssalPull') {
                tempETeam.slice(0, 2).forEach(f => {
                    if (f && !f.isFainted) {
                        f.isTrapped = 1;
                        if (f.statStages) {
                            f.statStages.speed = Math.max(-6, (f.statStages.speed || 0) - 1);
                        }
                    }
                });
                tempLogs.push(`${mon.name}'s Abyssal Pull is trapping the foes!`);
            }

            // Mud Forged
            if (mon.ability.name === 'MudForged' && battleState.weather === 'sand') {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`${mon.name}'s Mud Forged boosted its Defense in the sand!`);
                }
            }
            // Crystal Memory
            if (mon.ability.name === 'CrystalMemory' && mon.lastMoveName) {
                tempLogs.push(`${mon.name}'s Crystal Memory is active!`);
            }
            // Hollow Echo
            if (mon.ability.name === 'HollowEcho' && mon.currentHp < mon.maxHp / 2) {
                const foes = tempETeam.slice(0, 2);
                foes.forEach(f => {
                    if (f && !f.isFainted && f.statStages) {
                        f.statStages['special-defense'] = Math.max(-6, (f.statStages['special-defense'] || 0) - 1);
                    }
                });
                tempLogs.push(`${mon.name}'s Hollow Echo lowered foes' Sp. Def!`);
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;

            // Overcharge Cycle Ability
            if (mon.ability.name === 'OverchargeCycle') {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                tempLogs.push(`${mon.name}'s Overcharge Cycle generated Sync energy!`);
            }

            // Clutch Meter Ability
            if (mon.ability.name === 'ClutchMeter' && mon.currentHp <= mon.maxHp * 0.25) {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                tempLogs.push(`${mon.name}'s Clutch Meter surged with Sync energy!`);
            }

            // Rooted Spirit Ability
            if (mon.ability.name === 'RootedSpirit' && battleState.weather === 'grass') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Rooted Spirit restored its HP!`);
            }

            // Shoreline Ability
            if (mon.ability.name === 'Shoreline' && (battleState.weather === 'sand' || battleState.weather === 'rain')) {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`${mon.name}'s Shoreline raised its Defense!`);
                }
            }

            // Whirlpool Heart Ability
            if (mon.ability.name === 'WhirlpoolHeart' && battleState.weather === 'rain') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    tempLogs.push(`${mon.name}'s Whirlpool Heart raised its Speed!`);
                }
            }

            // Amber Core Ability
            if (mon.ability.name === 'AmberCore' && mon.lastMoveType === 'Bug') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Amber Core raised its Sp. Atk!`);
                }
            }

            // Torrent Sync Ability
            if (mon.ability.name === 'TorrentSync' && mon.lastMoveType === 'Water') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Torrent Sync raised its Sp. Atk!`);
                }
            }

            // Storm Rider Ability
            if (mon.ability.name === 'StormRider' && mon.lastMoveType === 'Electric') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Storm Rider raised its Sp. Atk!`);
                }
            }

            // Shared Nerves Ability
            if (mon.ability.name === 'SharedNerves') {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted && ally.status) {
                    ally.status = undefined;
                    tempLogs.push(`${mon.name}'s Shared Nerves cured ${ally.name}'s status!`);
                }
            }
        }
        for (let i = 0; i < tempETeam.length; i++) {
            const mon = tempETeam[i];
            if (mon.isFainted) continue;

            // Rain Dish+ & Chlorophyll+ (Enemy)
            if (mon.ability.name === 'RainDishPlus' && battleState.weather === 'rain') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 2) }));
                tempLogs.push(`Enemy ${mon.name} restored HP and Sync Gauge in the rain!`);
            }
            if (mon.ability.name === 'ChlorophyllPlus' && battleState.weather === 'sun') {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 2) }));
                tempLogs.push(`Enemy ${mon.name} boosted its Sync Gauge in the sun!`);
            }

            // Tag Cleanse Ability
            if (mon.ability.name === 'TagCleanse' && Math.random() < 0.5) {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted && (ally.status || (ally.confusionTurns && ally.confusionTurns > 0))) {
                    ally.status = undefined;
                    ally.confusionTurns = 0;
                    tempLogs.push(`Enemy ${mon.name}'s Tag Cleanse cured its ally!`);
                }
            }

            // Salt Veins Ability
            if (mon.ability.name === 'SaltVeins' && mon.status === 'paralysis') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Salt Veins restored its HP!`);
            }

            // Moonlight Call Ability
            if (mon.ability.name === 'MoonlightCall' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Moonlight Call restored its HP!`);
            }

            // Shellblood Ability
            if (mon.ability.name === 'Shellblood' && mon.currentHp <= mon.maxHp / 2) {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Shellblood restored its HP!`);
            }

            // Photosynth Ability
            if (mon.ability.name === 'Photosynth' && battleState.weather === 'sun') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Photosynth restored its HP!`);
            }

            // Overcharge Cycle Ability
            if (mon.ability.name === 'OverchargeCycle') {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                tempLogs.push(`Enemy ${mon.name}'s Overcharge Cycle generated Sync energy!`);
            }

            // Clutch Meter Ability
            if (mon.ability.name === 'ClutchMeter' && mon.currentHp <= mon.maxHp * 0.25) {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 10) }));
                tempLogs.push(`Enemy ${mon.name}'s Clutch Meter surged with Sync energy!`);
            }

            // Rooted Spirit Ability
            if (mon.ability.name === 'RootedSpirit' && battleState.weather === 'grass') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Rooted Spirit restored its HP!`);
            }

            // Shoreline Ability
            if (mon.ability.name === 'Shoreline' && (battleState.weather === 'sand' || battleState.weather === 'rain')) {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Shoreline raised its Defense!`);
                }
            }

            // Whirlpool Heart Ability
            if (mon.ability.name === 'WhirlpoolHeart' && battleState.weather === 'rain') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Whirlpool Heart raised its Speed!`);
                }
            }

            // Amber Core Ability
            if (mon.ability.name === 'AmberCore' && mon.lastMoveType === 'Bug') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Amber Core raised its Sp. Atk!`);
                }
            }

            // Torrent Sync Ability
            if (mon.ability.name === 'TorrentSync' && mon.lastMoveType === 'Water') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Torrent Sync raised its Sp. Atk!`);
                }
            }

            // Storm Rider Ability
            if (mon.ability.name === 'StormRider' && mon.lastMoveType === 'Electric') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Storm Rider raised its Sp. Atk!`);
                }
            }

            // Energy Core Ability (Enemy)
            if (mon.ability.name === 'EnergyCore' && !mon.tookDamageThisTurn) {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                tempLogs.push(`Enemy ${mon.name}'s Energy Core boosted the Sync Gauge!`);
            }

            // Lifebloom Ability (Enemy)
            if (mon.ability.name === 'Lifebloom') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 16);
                    tempETeam[allyIdx] = { ...ally, currentHp: Math.min(ally.maxHp, ally.currentHp + heal) };
                    tempLogs.push(`Enemy ${mon.name}'s Lifebloom restored its ally's HP!`);
                    popupAbility('enemy', allyIdx as 0 | 1, 'Lifebloom');
                }
            }

            // DreamEater (Enemy): heal 1/8 per sleeping player-team foe.
            if (mon.ability.name === 'DreamEater') {
                const sleepingFoes = tempPTeam.filter(f => f && !f.isFainted && f.status === 'sleep').length;
                if (sleepingFoes > 0) {
                    const heal = Math.floor(mon.maxHp / 8) * sleepingFoes;
                    tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                    tempLogs.push(`Enemy ${mon.name} drained the dreams of ${sleepingFoes} foe${sleepingFoes > 1 ? 's' : ''}!`);
                    popupAbility('enemy', i as 0 | 1, 'Dream Eater');
                }
            }

            // Shared Nerves Ability
            if (mon.ability.name === 'SharedNerves') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted && ally.status) {
                    ally.status = undefined;
                    tempLogs.push(`Enemy ${mon.name}'s Shared Nerves cured ${ally.name}'s status!`);
                }
            }

            // Stone Harvest Ability
            if (mon.ability.name === 'StoneHarvest' && battleState.weather === 'sand') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                }
                tempLogs.push(`Enemy ${mon.name}'s Stone Harvest restored HP and raised Defense!`);
            }

            // Bleakwind Ability
            if (mon.ability.name === 'Bleakwind' && battleState.weather === 'hail') {
                tempPTeam.forEach(p => {
                    if (!p.isFainted && p.statStages) {
                        p.statStages.speed = Math.max(-6, (p.statStages.speed || 0) - 1);
                        tempLogs.push(`Enemy ${mon.name}'s Bleakwind lowered ${p.name}'s Speed!`);
                    }
                });
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;
            mon.isInvulnerable = false;

            // Perish Song
            if (mon.perishTurns !== undefined) {
                mon.perishTurns--;
                tempLogs.push(`Enemy ${mon.name}'s perish count fell to ${mon.perishTurns}!`);
                if (mon.perishTurns === 0) {
                    mon.currentHp = 0;
                    mon.isFainted = true;
                    tempLogs.push(`Enemy ${mon.name} fainted from Perish Song!`);
                }
            }

            // Future Sight
            if (mon.futureSightTurns !== undefined) {
                mon.futureSightTurns--;
                if (mon.futureSightTurns === 0) {
                    const damage = mon.futureSightDamage || 100;
                    mon.currentHp = Math.max(0, mon.currentHp - damage);
                    tempLogs.push(`Enemy ${mon.name} was hit by Future Sight!`);
                    mon.futureSightTurns = undefined;
                }
            }

            // Leech Seed
            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                const actualDamage = Math.min(mon.currentHp, damage);
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - actualDamage), animationState: 'damage' };
                tempLogs.push(`Enemy ${mon.name}'s health was sapped by Leech Seed!`);
                
                // Heal the player(s)
                const foes = tempPTeam.slice(0, 2).filter(f => !f.isFainted);
                if (foes.length > 0) {
                    const healPerFoe = Math.floor(actualDamage / foes.length);
                    foes.forEach(f => {
                        f.currentHp = Math.min(f.maxHp, f.currentHp + healPerFoe);
                    });
                }
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            }

            // Nightmare
            if (mon.isNightmareActive && mon.status === 'sleep' && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is locked in a nightmare!`);
            }

            // Curse (Ghost)
            if (mon.isCursed && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is afflicted by a curse!`);
            }

            const endRes = handleEndOfTurnStatus(mon, battleState.weather, battleState.terrain);
            if (endRes.damage > 0) {
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - endRes.damage), animationState: 'damage' };
                tempLogs.push(`Enemy ${endRes.msg!}`);
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            } else if (endRes.damage < 0) {
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp - endRes.damage) };
                tempLogs.push(`Enemy ${endRes.msg!}`);
                await syncState(500);
            }

            // Lifebloom Ability (Aura)
            if (mon.ability.name === 'Lifebloom') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 16);
                    tempETeam[allyIdx] = { ...ally, currentHp: Math.min(ally.maxHp, ally.currentHp + heal) };
                    tempLogs.push(`Enemy ${mon.name}'s Lifebloom healed its ally!`);
                }
            }

            // Gladiator's Spirit (Ally heal)
            const allyIdxGS_E = 1 - i;
            const allyGS_E = tempETeam[allyIdxGS_E];
            if (allyGS_E && !allyGS_E.isFainted && allyGS_E.ability.name === 'GladiatorSSpirit' && (allyGS_E.koCount || 0) > 0) {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${allyGS_E.name}'s Gladiator's Spirit restored ${mon.name}'s HP!`);
            }

            // healAtEnd
            if (mon.nextMoveBoosts?.healAtEnd) {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name} was healed by Gladiator's Spirit!`);
                mon.nextMoveBoosts.healAtEnd = false;
            }

            // Overclock (Enemy)
            if (mon.ability.name === 'Overclock') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    const recoil = Math.floor(mon.maxHp / 16);
                    mon.currentHp = Math.max(0, mon.currentHp - recoil);
                    tempLogs.push(`Enemy ${mon.name}'s Overclock boosted Speed but caused recoil!`);
                }
            }
            // Slow Pulse (Enemy)
            if (mon.ability.name === 'SlowPulse') {
                [...tempPTeam, ...tempETeam].forEach(target => {
                    if (target && !target.isFainted && target.statStages) {
                        target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                    }
                });
                tempLogs.push(`Enemy ${mon.name}'s Slow Pulse slowed everyone down!`);
            }
            // Lucky Bark (Enemy)
            if (mon.ability.name === 'LuckyBark' && Math.random() < 0.1) {
                const heal = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`Enemy ${mon.name}'s Lucky Bark restored its HP!`);
            }
            // Pollen Surge (Enemy)
            if (mon.ability.name === 'PollenSurge' && battleState.weather === 'sun') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 8);
                    ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                    tempLogs.push(`Enemy ${mon.name}'s Pollen Surge healed ${ally.name}!`);
                }
            }
            // Night Bloom (Enemy)
            if (mon.ability.name === 'NightBloom' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 8);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`Enemy ${mon.name}'s Night Bloom restored its HP!`);
            }
            // Abyssal Pull (Enemy)
            if (mon.ability.name === 'AbyssalPull') {
                tempPTeam.slice(0, 2).forEach(f => {
                    if (f && !f.isFainted) {
                        f.isTrapped = 1;
                        if (f.statStages) {
                            f.statStages.speed = Math.max(-6, (f.statStages.speed || 0) - 1);
                        }
                    }
                });
                tempLogs.push(`Enemy ${mon.name}'s Abyssal Pull is trapping the foes!`);
            }

            // Perish Song (Enemy)
            if (mon.perishTurns !== undefined) {
                mon.perishTurns--;
                tempLogs.push(`Enemy ${mon.name}'s perish count fell to ${mon.perishTurns}!`);
                if (mon.perishTurns === 0) {
                    mon.currentHp = 0;
                    mon.isFainted = true;
                    tempLogs.push(`Enemy ${mon.name} fainted from Perish Song!`);
                }
            }

            // Future Sight (Enemy)
            if (mon.futureSightTurns !== undefined) {
                mon.futureSightTurns--;
                if (mon.futureSightTurns === 0) {
                    const damage = mon.futureSightDamage || 100;
                    mon.currentHp = Math.max(0, mon.currentHp - damage);
                    tempLogs.push(`Enemy ${mon.name} was hit by Future Sight!`);
                    mon.futureSightTurns = undefined;
                }
            }

            // Leech Seed (Enemy)
            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} was drained by Leech Seed!`);
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    ally.currentHp = Math.min(ally.maxHp, ally.currentHp + damage);
                }
            }

            // Nightmare (Enemy)
            if (mon.isNightmareActive && mon.status === 'sleep' && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is locked in a nightmare!`);
            }

            // Curse (Ghost) (Enemy)
            if (mon.isCursed && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is afflicted by a curse!`);
            }

            // Energy Core (Enemy)
            if (mon.ability.name === 'EnergyCore') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name} restored its Sp. Atk!`);
                }
            }
            // Mud Forged (Enemy)
            if (mon.ability.name === 'MudForged' && battleState.weather === 'sand') {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Mud Forged boosted its Defense in the sand!`);
                }
            }
            // Crystal Memory (Enemy)
            if (mon.ability.name === 'CrystalMemory' && mon.lastMoveName) {
                tempLogs.push(`Enemy ${mon.name}'s Crystal Memory is active!`);
            }
            // Hollow Echo (Enemy)
            if (mon.ability.name === 'HollowEcho' && mon.currentHp < mon.maxHp / 2) {
                const foes = tempPTeam.slice(0, 2);
                foes.forEach(f => {
                    if (f && !f.isFainted && f.statStages) {
                        f.statStages['special-defense'] = Math.max(-6, (f.statStages['special-defense'] || 0) - 1);
                    }
                });
                tempLogs.push(`Enemy ${mon.name}'s Hollow Echo lowered foes' Sp. Def!`);
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;

            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                const actualDamage = Math.min(mon.currentHp, damage);
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - actualDamage), animationState: 'damage' };
                tempLogs.push(`Enemy ${mon.name}'s health was sapped by Leech Seed!`);
                
                // Heal the opponent(s)
                const foes = tempPTeam.slice(0, 2).filter(f => !f.isFainted);
                if (foes.length > 0) {
                    const healPerFoe = Math.floor(actualDamage / foes.length);
                    foes.forEach(f => {
                        f.currentHp = Math.min(f.maxHp, f.currentHp + healPerFoe);
                    });
                }
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            }

            const endResE = handleEndOfTurnStatus(mon, battleState.weather, battleState.terrain);
            if (endResE.damage > 0) {
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - endResE.damage), animationState: 'damage' };
                tempLogs.push(`Enemy ${endResE.msg!}`);
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            } else if (endResE.damage < 0) {
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp - endResE.damage) };
                tempLogs.push(`Enemy ${endResE.msg!}`);
                await syncState(500);
            }
        }
        // 5. Weather Turns
        if (battleState.weather !== 'none') {
            const newTurns = (battleState.weatherTurns || 0) - 1;
            if (newTurns <= 0) {
                const oldWeather = battleState.weather;
                setBattleState(prev => ({ ...prev, weather: 'none', weatherTurns: 0 }));
                tempLogs.push(`The weather returned to normal.`);
                
                // Shoreline Ability
                if (oldWeather === 'rain') {
                    [...tempPTeam, ...tempETeam].forEach(p => {
                        if (!p.isFainted && p.ability.name === 'Shoreline') {
                            const heal = Math.floor(p.maxHp * 0.25);
                            p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                            tempLogs.push(`${p.name}'s Shoreline restored its HP as the rain ended!`);
                        }
                    });
                }
            } else {
                setBattleState(prev => ({ ...prev, weatherTurns: newTurns }));
            }
        }

        // 6. Terrain Turns
        if (battleState.terrain !== 'none') {
            const newTerrainTurns = (battleState.terrainTurns || 0) - 1;
            if (newTerrainTurns <= 0) {
                setBattleState(prev => ({ ...prev, terrain: 'none', terrainTurns: 0 }));
                tempLogs.push(`The terrain returned to normal.`);
            } else {
                setBattleState(prev => ({ ...prev, terrainTurns: newTerrainTurns }));
            }
        }
        // 6. Tailwind Turns
        if (battleState.tailwindTurns && battleState.tailwindTurns > 0) {
            const newTailwind = battleState.tailwindTurns - 1;
            if (newTailwind === 0) tempLogs.push(`The player's tailwind petered out.`);
            setBattleState(prev => ({ ...prev, tailwindTurns: newTailwind }));
        }
        if (battleState.enemyTailwindTurns && battleState.enemyTailwindTurns > 0) {
            const newEnemyTailwind = battleState.enemyTailwindTurns - 1;
            if (newEnemyTailwind === 0) tempLogs.push(`The enemy's tailwind petered out.`);
            setBattleState(prev => ({ ...prev, enemyTailwindTurns: newEnemyTailwind }));
        }

        // 7. Aegis Field Turns
        if (battleState.aegisFieldTurns && battleState.aegisFieldTurns > 0) {
            setBattleState(prev => ({ ...prev, aegisFieldTurns: prev.aegisFieldTurns! - 1 }));
        }
        if (battleState.enemyAegisFieldTurns && battleState.enemyAegisFieldTurns > 0) {
            setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: prev.enemyAegisFieldTurns! - 1 }));
        }

        // 8. Reflect, Light Screen, Aurora Veil, Rune Ward Turns
        if (battleState.reflectTurns && battleState.reflectTurns > 0) {
            const newReflect = battleState.reflectTurns - 1;
            if (newReflect === 0) tempLogs.push(`The player's Reflect wore off.`);
            setBattleState(prev => ({ ...prev, reflectTurns: newReflect }));
        }
        if (battleState.enemyReflectTurns && battleState.enemyReflectTurns > 0) {
            const newEnemyReflect = battleState.enemyReflectTurns - 1;
            if (newEnemyReflect === 0) tempLogs.push(`The enemy's Reflect wore off.`);
            setBattleState(prev => ({ ...prev, enemyReflectTurns: newEnemyReflect }));
        }
        if (battleState.lightScreenTurns && battleState.lightScreenTurns > 0) {
            const newLightScreen = battleState.lightScreenTurns - 1;
            if (newLightScreen === 0) tempLogs.push(`The player's Light Screen wore off.`);
            setBattleState(prev => ({ ...prev, lightScreenTurns: newLightScreen }));
        }
        if (battleState.enemyLightScreenTurns && battleState.enemyLightScreenTurns > 0) {
            const newEnemyLightScreen = battleState.enemyLightScreenTurns - 1;
            if (newEnemyLightScreen === 0) tempLogs.push(`The enemy's Light Screen wore off.`);
            setBattleState(prev => ({ ...prev, enemyLightScreenTurns: newEnemyLightScreen }));
        }
        if (battleState.auroraVeilTurns && battleState.auroraVeilTurns > 0) {
            const newAuroraVeil = battleState.auroraVeilTurns - 1;
            if (newAuroraVeil === 0) tempLogs.push(`The player's Aurora Veil wore off.`);
            setBattleState(prev => ({ ...prev, auroraVeilTurns: newAuroraVeil }));
        }
        if (battleState.enemyAuroraVeilTurns && battleState.enemyAuroraVeilTurns > 0) {
            const newEnemyAuroraVeil = battleState.enemyAuroraVeilTurns - 1;
            if (newEnemyAuroraVeil === 0) tempLogs.push(`The enemy's Aurora Veil wore off.`);
            setBattleState(prev => ({ ...prev, enemyAuroraVeilTurns: newEnemyAuroraVeil }));
        }
        if (battleState.runeWardTurns && battleState.runeWardTurns > 0) {
            const newRuneWard = battleState.runeWardTurns - 1;
            if (newRuneWard === 0) tempLogs.push(`The player's Rune Ward wore off.`);
            setBattleState(prev => ({ ...prev, runeWardTurns: newRuneWard }));
        }
        if (battleState.enemyRuneWardTurns && battleState.enemyRuneWardTurns > 0) {
            const newEnemyRuneWard = battleState.enemyRuneWardTurns - 1;
            if (newEnemyRuneWard === 0) tempLogs.push(`The enemy's Rune Ward wore off.`);
            setBattleState(prev => ({ ...prev, enemyRuneWardTurns: newEnemyRuneWard }));
        }

        // 9. Trick Room Turns
        if (battleState.trickRoomTurns && battleState.trickRoomTurns > 0) {
            const newTrickRoom = battleState.trickRoomTurns - 1;
            if (newTrickRoom === 0) tempLogs.push(`The dimensions returned to normal.`);
            setBattleState(prev => ({ ...prev, trickRoomTurns: newTrickRoom }));
        }

        // 9. Reset Flinching
        tempPTeam.forEach(p => p.isFlinching = false);
        tempETeam.forEach(p => p.isFlinching = false);

        // 9. Trapped & Sealed Turns
        tempPTeam.forEach(p => {
            if (p.trappedTurns && p.trappedTurns > 0) p.trappedTurns--;
            if (p.sealedTurns && p.sealedTurns > 0) {
                p.sealedTurns--;
                if (p.sealedTurns === 0) p.sealedMoveName = undefined;
            }
        });
        tempETeam.forEach(p => {
            if (p.trappedTurns && p.trappedTurns > 0) p.trappedTurns--;
            if (p.sealedTurns && p.sealedTurns > 0) {
                p.sealedTurns--;
                if (p.sealedTurns === 0) p.sealedMoveName = undefined;
            }
        });
    
    // Final check after loop logic
    if (tempPTeam.every((p: Pokemon) => p.isFainted)) gameOver = true;
    if (tempETeam.every((p: Pokemon) => p.isFainted)) victory = true;

    if (gameOver) {
        // Talent: Second Wind -- once per run, the first total-team wipe
        // instead revives the lead to 50% HP and the fight continues.
        // We mark it consumed by setting a story flag so a later wipe in
        // the same run just triggers the normal run-end flow.
        const alreadyUsed = !!playerState.storyFlags?.includes('second_wind_used');
        if (hasTalent(playerState.meta, 'second_wind') && !alreadyUsed) {
            const leadIdx = tempPTeam.findIndex(p => p);
            if (leadIdx >= 0) {
                const lead = tempPTeam[leadIdx];
                lead.currentHp = Math.max(1, Math.floor(lead.maxHp * 0.5));
                lead.isFainted = false;
                lead.status = 'none';
                setPlayerState(prev => ({
                    ...prev,
                    storyFlags: [...(prev.storyFlags || []), 'second_wind_used'],
                }));
                setBattleState(prev => ({
                    ...prev,
                    playerTeam: tempPTeam,
                    logs: [...prev.logs, `${lead.name} found a second wind and stood back up at half HP!`],
                    phase: 'player_input',
                }));
                playSound('https://play.pokemonshowdown.com/audio/sfx/megaevo.mp3', 0.5);
                return;
            }
        }
        handleRunEnd();
        return;
    }

    if (victory) {
        const newStreak = battleState.battleStreak + 1;
        setBattleState(prev => ({ ...prev, battleStreak: newStreak }));

        // Permanent Death: Remove fainted monsters from team. Also strip
        // in-battle Rift transform flags (Tera/Mega/Z) so they don't
        // bleed into the overworld / next encounter.
        const survivingTeam = tempPTeam
            .filter(p => !p.isFainted)
            .map(p => ({ ...p, teraType: undefined, megaActive: false, zCharged: false }));
        
        if (survivingTeam.length === 0) {
            handleRunEnd();
            return;
        }

        // --- POST-BATTLE EVOLUTION QUEUE ------------------------------------
        // Any team member that leveled into its evolution during this battle
        // now gets the cinematic. We build the evolved form up-front but
        // only commit it to state after the player presses Continue on the
        // evolution scene (or cancels it).
        for (let i = 0; i < survivingTeam.length; i++) {
            const p = survivingTeam[i];
            if (!p.pendingEvolutionId) continue;
            const before = { ...p };
            // Drop the flag before queueing so rerenders don't re-fire.
            survivingTeam[i] = { ...p, pendingEvolutionId: undefined };
            try {
                const evo = await evolvePokemon(p);
                if (evo && evo.id !== p.id) {
                    queueEvolution(before, evo, (final) => {
                        setPlayerState(prev => ({
                            ...prev,
                            team: prev.team.map(tp =>
                                tp.id === before.id && tp.name === before.name ? final : tp
                            ),
                        }));
                    });
                }
            } catch (err) {
                console.warn('[Evolution] Failed to build evolved form:', err);
            }
        }

        // Loot Drop Logic
        const loot: string[] = [];
        // Scavenger Cache keystone -> "+15% drop chance per level".
        // Expressed here in legacy "lootQuality level" units so the rest
        // of this function doesn't need to change its thresholds.
        const lootQuality = getKeystoneLevel(playerState.meta, 'scavenger_cache');
        const dropChance = 0.2 + (newStreak * 0.05) + (lootQuality * 0.1); // Scavenger upgrade increases drop chance
        if (Math.random() < dropChance) {
            const pool = ['poke-ball', 'great-ball', 'potion', 'super-potion', 'revive', 'rare-candy'];
            if (newStreak >= 5 || lootQuality >= 1) pool.push('ultra-ball', 'hyper-potion', 'full-restore');
            if (newStreak >= 10 || lootQuality >= 2) pool.push('master-ball', 'rare-candy', 'rare-candy', 'rare-candy');
            
            // Add evolution stones if loot quality is high
            if (lootQuality >= 1) {
                const stones = ['firestone', 'waterstone', 'thunderstone', 'leafstone', 'moonstone', 'sunstone', 'shinystone', 'duskstone', 'dawnstone'];
                pool.push(...stones);
            }

            // Add battle items if loot quality is very high
            if (lootQuality >= 3) {
                const battleItems = [
                    'leftovers', 'choice-band', 'choice-specs', 'choice-scarf', 
                    'life-orb', 'focus-sash', 'rocky-helmet', 'assault-vest', 
                    'expert-belt', 'eviolite', 'big-root', 'lucky-egg', 
                    'cleanse-tag', 'smoke-ball', 'eject-button', 'red-card', 
                    'binding-band', 'grip-claw', 'amulet-coin', 'booster-energy',
                    'ability-shield', 'protective-pads', 'blunder-policy',
                    'heavy-duty-boots', 'utility-umbrella', 'eject-pack',
                    'room-service', 'covert-cloak', 'loaded-dice', 'punching-glove',
                    'clear-amulet', 'mirror-herb', 'metronome', 'kings-rock',
                    'razor-fang', 'bright-powder', 'wide-lens', 'zoom-lens',
                    'lagging-tail', 'iron-ball', 'sticky-barb', 'flame-orb',
                    'toxic-orb', 'weakness-policy', 'throat-spray', 'light-clay',
                    'damp-rock', 'heat-rock', 'smooth-rock', 'icy-rock',
                    'terrain-extender', 'adrenaline-orb'
                ];
                pool.push(...battleItems);
            }
            
            const item = pool[Math.floor(Math.random() * pool.length)];
            loot.push(item);
        }

        if (battleState.currentTrainerId) {
            let currentMap;
            if (playerState.mapId.startsWith('chunk_')) {
                currentMap = loadedChunks[playerState.mapId];
            } else {
                currentMap = MAPS[playerState.mapId];
            }
            
            // Rival milestone trainers don't live in any map -- they're
            // synthesized by buildRivalTrainer() on demand. Detect them
            // by id prefix so we can award the milestone flag / trophy.
            const rivalMilestoneId = battleState.currentTrainerId?.startsWith('rival_milestone_')
                ? battleState.currentTrainerId
                : null;
            const rivalMilestone = rivalMilestoneId
                ? RIVAL_MILESTONES.find(m => `rival_milestone_${m.dist}` === rivalMilestoneId)
                : null;

            const trainer = rivalMilestone
                ? buildRivalTrainer(rivalMilestone)
                : (Object.values(currentMap?.trainers || {}).find((t: any) => t.id === battleState.currentTrainerId) as TrainerData | undefined);
            const isGymLeader = trainer?.isGymLeader;
            const isRival = !!rivalMilestone;

            // Gauntlet linkage: if this trainer has a queued partner,
            // resolve it from the SAME map and stash it for the
            // phase/dialogue effect to auto-trigger after the victory
            // dialogue closes. Team HP is NOT healed when chaining.
            let gauntletNext: TrainerData | undefined;
            if (trainer?.gauntletNextTrainerId && currentMap?.trainers) {
                const next = Object.values(currentMap.trainers).find(
                    (t: any) => t.id === trainer.gauntletNextTrainerId
                    && !playerState.defeatedTrainers.includes(t.id)
                ) as TrainerData | undefined;
                if (next) {
                    gauntletNext = next;
                    pendingGauntletNextRef.current = next;
                }
            }
            const chainingGauntlet = !!gauntletNext;

            // Capture Permits: 2 for Gym Leader, 1 for regular Trainer.
            // Gauntlet chaining defers permit payout to the FINAL battle
            // so the player doesn't double-dip in the middle of a combo.
            const permitsEarned = chainingGauntlet ? 0 : (isGymLeader ? 2 : 1);

            // Immediate Rift Essence: 5 for Gym Leader, 1 for regular Trainer
            let essenceEarned = chainingGauntlet ? 0 : (isGymLeader ? 5 : 1);
            if (!chainingGauntlet) {
                // Essence Purse keystone: +10% essence per level.
                const mult = purse_essenceMult(playerState.meta);
                if (mult > 1) {
                    essenceEarned = Math.floor(essenceEarned * mult);
                    // Nudge so a full-stacked Purse never stalls at the floor.
                    if (getKeystoneLevel(playerState.meta, 'essence_purse') >= 5 && essenceEarned === (isGymLeader ? 5 : 1)) {
                        essenceEarned += 1;
                    }
                }
            }

            // Streak Bonus for Money: +20% per streak point
            const moneyBonus = 1 + (newStreak * 0.2);
            const baseMoney = isGymLeader ? 2000 : 500;
            let moneyMult = 1;
            if (survivingTeam.some(p => p.heldItem?.id === 'amulet-coin')) moneyMult = 2;
            const finalMoney = Math.floor(baseMoney * moneyBonus * moneyMult * getDailyEvent().moneyMult);

            // Victory Heal: normally +25% on win. Suppress entirely when
            // chaining a gauntlet -- the whole point of a "two trainers
            // in a row" encounter is that the *sum* of the fights is
            // the test, so a free heal between battles would defeat it.
            if (!chainingGauntlet) {
                survivingTeam.forEach(p => {
                    const healAmt = Math.floor(p.maxHp * 0.25);
                    p.currentHp = Math.min(p.maxHp, p.currentHp + healAmt);
                });
            }

            setPlayerState(prev => {
                const newItems = [...prev.inventory.items, ...loot];
                // If it's a trainer, we always give loot now
                if (loot.length === 0) {
                    const pool = ['great-ball', 'super-potion', 'revive', 'rare-candy'];
                    newItems.push(pool[Math.floor(Math.random() * pool.length)]);
                }
                // Rival trophy -- guaranteed unique drop per milestone.
                if (isRival && rivalMilestone?.trophy) {
                    newItems.push(rivalMilestone.trophy);
                }

                const newBadges = isGymLeader ? prev.badges + 1 : prev.badges;
                // When a badge is earned, auto-scale the whole team to the new
                // floor -- so grabbing badge 3 immediately pulls low-level
                // benched mons up to fighting shape.
                const finalTeam = isGymLeader
                    ? autoScaleTeamToFloor(survivingTeam, newBadges, prev.run.maxDistanceReached)
                    : survivingTeam;

                const lt = prev.lifetime ?? { shiniesCaught: 0, trainersDefeated: 0, biggestStreak: 0, currentStreak: 0, totalMoneyEarned: 0, graveyardsVisited: 0, visitedBiomes: [] };
                // Bounty tick: trainer defeated.
                const nextBounties = applyBountyEvent(prev.bounties?.active, { type: 'trainer_defeat' });
                const nextBountyState = prev.bounties ? { ...prev.bounties, active: nextBounties || prev.bounties.active } : prev.bounties;
                // Rival milestone flag: permanent, gates re-triggering
                // the same milestone on future explorations + feeds
                // into quest hooks / story checks.
                const rivalFlag = isRival && rivalMilestone
                    ? [`rival_beaten_${rivalMilestone.dist}`]
                    : [];

                // Rift Token award ----------------------------------------
                // Flagship content grants Rift Tokens -- the chase currency
                // that gates Vault unlocks (Terastallization / Mega / Z).
                // See data/meta.ts TOKEN_AWARDS for the rates.
                let tokensEarned = 0;
                if (!chainingGauntlet) {
                    if (isGymLeader) tokensEarned += TOKEN_AWARDS.gymLeader;
                    if (isRival)     tokensEarned += TOKEN_AWARDS.rivalMilestone;
                    // Champion tag: story `_beaten_rift-champion` flag used
                    // by existing end-game flow; treat as a capstone drop.
                    if (trainer?.badgeId === 9) tokensEarned += TOKEN_AWARDS.championClear;
                    // Talent: Rift Ledger doubles tokens during the first
                    // hour of this run. We reuse `lifetime.runStartedAt` if
                    // available, otherwise never double (safe fallback).
                    if (tokensEarned > 0 && hasTalent(prev.meta, 'rift_ledger')) {
                        const runStart = (prev.lifetime as any)?.runStartedAt as number | undefined;
                        if (runStart && Date.now() - runStart < 3_600_000) {
                            tokensEarned *= 2;
                        }
                    }
                }

                return {
                    ...prev,
                    team: finalTeam,
                    money: prev.money + finalMoney,
                    badges: newBadges,
                    // FIFO cap at 5000 -- matches the discoveredChunks
                    // pattern. Route trainers can populate this fast
                    // (~17% chunk rate * many chunks); without a cap
                    // the .includes() checks on chunk load + movement
                    // would creep toward O(5000)+ per render. If a
                    // very-old trainer's id evicts and the player
                    // returns, they re-fight the encounter; that's
                    // the better failure mode than save bloat.
                    defeatedTrainers: (() => {
                        const next = [...prev.defeatedTrainers, battleState.currentTrainerId!];
                        return next.length > 5000 ? next.slice(next.length - 5000) : next;
                    })(),
                    storyFlags: rivalFlag.length > 0
                        ? [...prev.storyFlags, ...rivalFlag]
                        : prev.storyFlags,
                    inventory: { ...prev.inventory, items: newItems },
                    meta: {
                        ...prev.meta,
                        riftEssence: prev.meta.riftEssence + essenceEarned,
                        riftTokens: (prev.meta.riftTokens || 0) + tokensEarned,
                    },
                    run: {
                        ...prev.run,
                        capturePermits: prev.run.capturePermits + permitsEarned
                    },
                    lifetime: {
                        ...lt,
                        trainersDefeated: lt.trainersDefeated + 1,
                        totalMoneyEarned: lt.totalMoneyEarned + finalMoney,
                        currentStreak: newStreak,
                        biggestStreak: Math.max(lt.biggestStreak, newStreak),
                    },
                    bounties: nextBountyState,
                };
            });
            
            const victoryMsgs = isGymLeader ?
                [
                    "Gym Leader defeated!",
                    "You earned a Badge!",
                    "You received 2 Capture Permits!",
                    `Gained ${essenceEarned} Rift Essence + ${TOKEN_AWARDS.gymLeader} Rift Tokens!`,
                    "Your team was partially healed!"
                ] :
                isRival && rivalMilestone ?
                    [
                        `You defeated ${trainer?.name}!`,
                        `"${trainer?.winDialogue ?? '...'}"`,
                        `You got $${finalMoney}.`,
                        rivalMilestone.trophy
                            ? `Trophy: ${ITEMS[rivalMilestone.trophy]?.name ?? rivalMilestone.trophy}!`
                            : 'Legendary match...',
                        `(Milestone ${rivalMilestone.dist} cleared · +${TOKEN_AWARDS.rivalMilestone} Rift Tokens)`,
                    ] :
                chainingGauntlet ?
                    [
                        `${trainer?.name ?? 'Trainer'} defeated! You got ${finalMoney}.`,
                        `${gauntletNext!.name} steps forward -- no rest, no heal!`,
                    ] :
                    [`Trainer defeated! You got ${finalMoney}.`, "You received a Capture Permit!", "Gained 1 Rift Essence!", "Your team was partially healed!"];

            if (loot.length > 0) {
                if (chainingGauntlet) {
                    // Surface loot as toasts during a gauntlet chain so
                    // the dialogue stays short and the player hits the
                    // next battle snappier.
                    loot.forEach(id => showToast(`+${ITEMS[id].name}`, 'reward', { kicker: 'Loot' }));
                } else {
                    loot.forEach(id => victoryMsgs.push(`Found a ${ITEMS[id].name}!`));
                }
            }
            if (newStreak > 1 && !chainingGauntlet) victoryMsgs.push(`Battle Streak: ${newStreak}!`);

            setDialogue(victoryMsgs);

            if (isGymLeader) {
                setPhase(GamePhase.PERK_SELECT);
                return;
            }
        } else {
            // Wild victory
            // Capture Permits: 1 for every 6 wild battles (streak) - Harder than trainers
            const permitsEarned = (newStreak % 6 === 0) ? 1 : 0;

            setPlayerState(prev => {
                const newItems = [...prev.inventory.items, ...loot];
                const lt = prev.lifetime ?? { shiniesCaught: 0, trainersDefeated: 0, biggestStreak: 0, currentStreak: 0, totalMoneyEarned: 0, graveyardsVisited: 0, visitedBiomes: [] };
                return {
                    ...prev,
                    team: survivingTeam,
                    inventory: { ...prev.inventory, items: newItems },
                    run: {
                        ...prev.run,
                        capturePermits: prev.run.capturePermits + permitsEarned
                    },
                    lifetime: {
                        ...lt,
                        currentStreak: newStreak,
                        biggestStreak: Math.max(lt.biggestStreak, newStreak),
                    }
                };
            });
            
            const wildMsgs = ["Wild Pokemon defeated."];
            if (permitsEarned > 0) wildMsgs.push("You earned a Capture Permit!");
            if (loot.length > 0) {
                loot.forEach(id => wildMsgs.push(`Found a ${ITEMS[id].name}!`));
            }
            if (newStreak > 1) wildMsgs.push(`Battle Streak: ${newStreak}!`);
            setDialogue(wildMsgs);
        }
        setPhase(GamePhase.OVERWORLD);
        return;
    }

    // End of Turn: Healing Items
    [...tempPTeam, ...tempETeam].forEach(p => {
        if (p && !p.isFainted) {
            checkBerries(p, tempLogs);
            if (p.heldItem?.id === 'leftovers') {
                const heal = Math.floor(p.maxHp / 16);
                p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                tempLogs.push(`${p.name} restored its HP with Leftovers!`);
            }
            if (p.heldItem?.id === 'black-sludge') {
                if (p.types.includes('poison')) {
                    const heal = Math.floor(p.maxHp / 16);
                    p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                    tempLogs.push(`${p.name} restored its HP with Black Sludge!`);
                } else {
                    const dmg = Math.floor(p.maxHp / 8);
                    p.currentHp = Math.max(0, p.currentHp - dmg);
                    tempLogs.push(`${p.name} was hurt by its Black Sludge!`);
                }
            }
            if (p.heldItem?.id === 'sticky-barb') {
                const dmg = Math.floor(p.maxHp / 8);
                p.currentHp = Math.max(0, p.currentHp - dmg);
                tempLogs.push(`${p.name} was hurt by its Sticky Barb!`);
            }
            if (p.heldItem?.id === 'flame-orb' && !p.status) {
                p.status = 'burn';
                tempLogs.push(`${p.name} was burned by its Flame Orb!`);
            }
            if (p.heldItem?.id === 'toxic-orb' && !p.status) {
                p.status = 'toxic';
                tempLogs.push(`${p.name} was badly poisoned by its Toxic Orb!`);
            }
        }
    });

    const mustSwitch = tempPTeam.some((p, i) => i < 2 && p.isFainted && tempPTeam.slice(2).some(bp => !bp.isFainted));
    const switchingIdx = tempPTeam.findIndex((p, i) => i < 2 && p.isFainted && tempPTeam.slice(2).some(bp => !bp.isFainted));

    setBattleState(prev => {
        const finalMustSwitch = mustSwitch || prev.mustSwitch;
        const finalSwitchingIdx = mustSwitch ? switchingIdx : prev.switchingActorIdx;
        
        return { 
            ...prev, 
            playerTeam: tempPTeam, 
            enemyTeam: tempETeam, 
            logs: tempLogs.slice(-6), 
            phase: 'player_input', 
            turn: prev.turn + 1, 
            activePlayerIndex: finalMustSwitch ? finalSwitchingIdx : 0, 
            pendingMoves: [], 
            mustSwitch: finalMustSwitch,
            switchingActorIdx: finalSwitchingIdx,
            ui: { 
                selectionMode: finalMustSwitch ? 'SWITCH' : 'MOVE', 
                selectedMove: null 
            } 
        };
    });
    setRemoteBattleActions([]);
} catch (e) {
        console.error('Battle execution error:', e);
        setBattleState(prev => ({ ...prev, phase: 'player_input' }));
    }
  };

  function handleSwapTeam(i1: number, i2: number) {
      setPlayerState(prev => {
          const t = [...prev.team];
          [t[i1], t[i2]] = [t[i2], t[i1]];
          // Opportunistic auto-scale: whenever a Pokemon becomes the lead, make
          // sure it's at least at the party floor so switching in doesn't get
          // you curb-stomped. Others remain untouched until they also swap in.
          const scaled = autoScaleTeamToFloor(t, prev.badges, prev.run.maxDistanceReached);
          if (scaled[0]) playCry(scaled[0].id, scaled[0].name);
          return { ...prev, team: scaled };
      });
  };

  // Snap the entire party to the current floor -- player-initiated from the
  // pause menu. Stays free; it's a no-op for mons already above the floor.
  function handleSyncPartyToCap() {
      setPlayerState(prev => ({ ...prev, team: autoScaleTeamToFloor(prev.team, prev.badges, prev.run.maxDistanceReached) }));
      showToast('Team synced to level floor', 'reward', { kicker: 'Party' });
  }

  // Apply a move swap from the relearner. Same-shape helper so the pause menu
  // doesn't need direct setPlayerState access.
  function handleApplyRelearn(monIndex: number, updated: Pokemon) {
      setPlayerState(prev => {
          const t = prev.team.slice();
          if (monIndex < 0 || monIndex >= t.length) return prev;
          t[monIndex] = updated;
          return { ...prev, team: t };
      });
      showToast(`${updated.name.toUpperCase()} learned a new move`, 'reward', { kicker: 'Relearner' });
  }
    // --- Bounty Board handlers ---
    // Reroll is on a soft timer rather than a hard cash cost. The guild
    // posts fresh contracts on a schedule; paying 1500 lets you jump the
    // queue. This way the board always feels alive, and the player doesn't
    // get punished for browsing.
    const BOUNTY_REROLL_COST = 1500;
    const BOUNTY_REROLL_COOLDOWN_MS = 10 * 60 * 1000; // 10 min passive refresh
    function handleBountyClaim(bountyId: string) {
        // Capture the reward name BEFORE dispatching state so the toast
        // always matches the claimed item (was subject to a stale-read
        // race previously).
        const snapshot = playerState.bounties?.active.find(bb => bb.id === bountyId);
        const itemName = snapshot?.rewardItemId ? (ITEMS[snapshot.rewardItemId]?.name ?? snapshot.rewardItemId) : null;

        setPlayerState(prev => {
            if (!prev.bounties) return prev;
            const target = prev.bounties.active.find(b => b.id === bountyId);
            if (!target) return prev;
            if (target.progress < target.targetCount) return prev; // safety

            const newInventory = { ...prev.inventory };
            let newPermits = prev.run.capturePermits;
            if (target.rewardItemId) {
                if (target.rewardItemId === 'poke-ball') newPermits += 1;
                else if (target.rewardItemId === 'potion') newInventory.potions += 1;
                else if (target.rewardItemId === 'revive') newInventory.revives += 1;
                else if (target.rewardItemId === 'rare-candy') newInventory.rare_candy += 1;
                else newInventory.items = [...(newInventory.items || []), target.rewardItemId];
            }

            // Auto-refill: roll a single fresh contract into the claimed
            // slot so the board always shows 3 options. The player
            // shouldn't have to leave the building and come back just to
            // re-queue work.
            const refill = rollBounties({
                playerBadges: prev.badges,
                maxDistance: prev.run.maxDistanceReached,
            });
            // rollBounties returns a fresh trio; we only need ONE card,
            // and it must not dupe existing active templates.
            const taken = new Set(prev.bounties.active.filter(b => b.id !== bountyId).map(b => b.templateId));
            const singleRefill = refill.find(r => !taken.has(r.templateId)) ?? refill[0];
            const remainingPlusOne = prev.bounties.active
                .filter(b => b.id !== bountyId)
                .concat([singleRefill]);

            return {
                ...prev,
                money: prev.money + target.rewardMoney,
                inventory: newInventory,
                run: { ...prev.run, capturePermits: newPermits },
                bounties: { ...prev.bounties, active: remainingPlusOne },
            };
        });

        showToast(itemName ? `Claimed: +${itemName}` : 'Bounty claimed!', 'reward', { kicker: 'Guild' });
    }
    function handleBountyReroll() {
        const now = Date.now();
        const cooldownReady = !playerState.bounties || (playerState.bounties.rerollAvailableAt ?? 0) <= now;
        const slateSize = hasTalent(playerState.meta, 'bounty_broker') ? 4 : 3;
        if (cooldownReady) {
            // Free reroll: cooldown expired, the guild just posted new work.
            const fresh = rollBounties({
                playerBadges: playerState.badges,
                maxDistance: playerState.run.maxDistanceReached,
                slateSize,
            });
            setPlayerState(prev => ({
                ...prev,
                bounties: { active: fresh, rerollAvailableAt: now + BOUNTY_REROLL_COOLDOWN_MS },
            }));
            showToast('Fresh contracts posted!', 'reward', { kicker: 'Guild' });
            return;
        }
        // Paid reroll: skip the queue. Bounty Broker gives one discount per
        // visit -- the first paid reroll is half-cost.
        const rerollCost = hasTalent(playerState.meta, 'bounty_broker')
            ? Math.floor(BOUNTY_REROLL_COST / 2)
            : BOUNTY_REROLL_COST;
        if (playerState.money < rerollCost) return;
        const fresh = rollBounties({
            playerBadges: playerState.badges,
            maxDistance: playerState.run.maxDistanceReached,
            slateSize,
        });
        setPlayerState(prev => ({
            ...prev,
            money: prev.money - rerollCost,
            bounties: { active: fresh, rerollAvailableAt: now + BOUNTY_REROLL_COOLDOWN_MS },
        }));
    }

    function handleBuy(item: string, price: number) {
        if (playerState.money >= price) {
            setPlayerState(prev => {
                const newInventory = { ...prev.inventory };
                let newPermits = prev.run.capturePermits;

                if (item === 'poke-ball') newPermits += 1;
                else if (item === 'potion') newInventory.potions += 1;
                else if (item === 'revive') newInventory.revives += 1;
                else if (item === 'rare-candy') newInventory.rare_candy += 1;
                else newInventory.items = [...(newInventory.items || []), item];
                
                return { 
                    ...prev, 
                    money: prev.money - price, 
                    inventory: newInventory,
                    run: { ...prev.run, capturePermits: newPermits }
                };
            });
            playLevelUpSfx();
        }
    };
  function triggerEmote(e: string) { setCurrentEmote(e); setTimeout(()=>setCurrentEmote(null), 2000); };
  function handleStarterSelect(team: Pokemon[]) { 
      if (team[0]) playCry(team[0].id, team[0].name);
      setPlayerState(prev=>({...prev, team})); 
      setPhase(GamePhase.OVERWORLD); 
  };
  

  useEffect(() => { battleStateRef.current = battleState; }, [battleState]);
  useEffect(() => { networkRoleRef.current = networkRole; }, [networkRole]);

  // Announce the daily world event exactly once per session, the first time
  // the player reaches the overworld. Stays sticky for a beat so players can
  // actually read it (4s instead of the default 3.2s story tier).
  useEffect(() => {
      if (phase !== GamePhase.OVERWORLD || dailyEventShown.current) return;
      const ev = getDailyEvent();
      dailyEventShown.current = true;
      showToast(`${ev.title} — ${ev.flavor}`, 'story', { kicker: "Today's Event", ttl: 4500 });
  }, [phase, showToast]);

  // Dynamic world events -- every time the player enters a new chunk, we check
  // whether it's the hourly merchant's chunk, the current roaming legendary
  // spot, or a graveyard unlocked for a Ghost Trainer. When a match hits, we
  // inject the NPC/trainer into the chunk's local dict so interactions work
  // through the normal handler.
  const lastEventChunkRef = useRef<string>('');
  useEffect(() => {
      if (phase !== GamePhase.OVERWORLD) return;
      if (!playerState.mapId.startsWith('chunk_')) return;
      const chunk = loadedChunks[playerState.mapId];
      if (!chunk) return;

      // Debounce: only inject once per chunk entry.
      const token = `${playerState.mapId}:${Math.floor(Date.now() / 3600000)}:${playerState.lifetime?.graveyardsVisited ?? 0}:${playerState.discoveredChunks.length}`;
      if (lastEventChunkRef.current === token) return;
      lastEventChunkRef.current = token;

      const { cx, cy } = playerState.chunkPos;
      let mutated = false;
      const newTrainers = { ...(chunk.trainers ?? {}) };
      const newNpcs = { ...(chunk.npcs ?? {}) };

      // 1. Hourly merchant
      const merchantChunk = getHourlyMerchantChunk();
      if (merchantChunk.cx === cx && merchantChunk.cy === cy) {
          const merchantId = `merchant_hourly_${Math.floor(Date.now() / 3600000)}`;
          const slot = '10,10';
          if (!newNpcs[slot]) {
              newNpcs[slot] = {
                  id: merchantId,
                  name: 'Hourly Merchant',
                  sprite: 'https://play.pokemonshowdown.com/sprites/trainers/gentleman.png',
                  dialogue: [
                      "A traveling merchant has set up shop here for the hour.",
                      "Check back in an hour -- I'll be somewhere else entirely by then.",
                      "Rumor is some collectors plan their whole week around my route.",
                  ],
                  facing: 'down',
              };
              mutated = true;
              showToast('The Hourly Merchant has set up shop here.', 'reward', { kicker: 'Passing Trade', ttl: 3500 });
          }
      }

      // 2. Roaming legendary
      const legend = getRoamingLegendary(playerState.discoveredChunks.length, playerState.run.maxDistanceReached);
      if (legend && legend.cx === cx && legend.cy === cy) {
          const legendId = `legendary_roam_${legend.speciesId}_${Math.floor(playerState.discoveredChunks.length / 15)}`;
          const slot = '8,8';
          if (!newTrainers[slot] && !playerState.defeatedTrainers.includes(legendId)) {
              newTrainers[slot] = {
                  id: legendId,
                  name: `A fleeing ${legend.name}`,
                  sprite: `https://play.pokemonshowdown.com/sprites/ani/${legend.name.toLowerCase()}.gif`,
                  team: [legend.speciesId],
                  level: legend.level,
                  reward: 10000,
                  dialogue: `A legendary ${legend.name} senses you approach...`,
                  winDialogue: `The ${legend.name} vanishes in a flash of light. It will reappear elsewhere.`,
                  isGymLeader: false,
              };
              mutated = true;
              showToast(`A ${legend.name} is here! Catch it before it flees!`, 'story', { kicker: 'Roaming Legendary', ttl: 4500 });
          }
      }

      // 3. Ghost Trainer in graveyards after 3 visits
      const graveyardsVisited = playerState.lifetime?.graveyardsVisited ?? 0;
      if (chunk.poiTags?.includes('graveyard')) {
          // Count first visit to each graveyard (by chunk id).
          const graveyardKey = `graveyard_seen_${chunk.id}`;
          if (!playerState.storyFlags.includes(graveyardKey)) {
              setPlayerState(prev => {
                  const lt = prev.lifetime ?? { shiniesCaught: 0, trainersDefeated: 0, biggestStreak: 0, currentStreak: 0, totalMoneyEarned: 0, graveyardsVisited: 0, visitedBiomes: [] };
                  return {
                      ...prev,
                      storyFlags: [...prev.storyFlags, graveyardKey],
                      lifetime: { ...lt, graveyardsVisited: lt.graveyardsVisited + 1 },
                  };
              });
          }
          if (graveyardsVisited >= 3) {
              const ghostId = `ghost_trainer_${chunk.id}`;
              const slot = '11,11';
              if (!newTrainers[slot] && !playerState.defeatedTrainers.includes(ghostId)) {
                  newTrainers[slot] = {
                      id: ghostId,
                      name: 'Pale Trainer',
                      sprite: 'https://play.pokemonshowdown.com/sprites/trainers/hex.png',
                      team: [94, 609, 477, 356], // Gengar, Chandelure, Dusknoir, Dusclops
                      level: Math.min(75, 30 + graveyardsVisited * 3),
                      reward: 5000,
                      dialogue: '"...You\'ve wandered too far. The graves remember."',
                      winDialogue: 'The figure dissipates into mist. You feel lighter.',
                      isGymLeader: false,
                  };
                  mutated = true;
                  showToast('A pale figure watches from the pillars...', 'story', { kicker: 'Ghost Trainer', ttl: 4000 });
              }
          }
      }

      if (mutated) {
          const updated: typeof chunk = { ...chunk, trainers: newTrainers, npcs: newNpcs };
          setLoadedChunks(prev => ({ ...prev, [chunk.id]: updated }));
      }
  }, [playerState.mapId, playerState.chunkPos, playerState.discoveredChunks.length, playerState.lifetime?.graveyardsVisited, playerState.defeatedTrainers, loadedChunks, phase, showToast]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  // Clear any pending aura tier / outbreak override when we leave
  // BATTLE back to the overworld (flee / victory / whiteout / shop
  // transitions all exit through OVERWORLD). Guarantees no aura or
  // forced-species flag bleeds into the next fight.
  useEffect(() => {
      if (phase === GamePhase.OVERWORLD) {
          pendingAnomalyRef.current = false;
          pendingOutbreakRef.current = null;
      }
  }, [phase]);

  // Gauntlet chain: when the victory dialogue from a gauntlet trainer
  // closes (phase back in OVERWORLD, dialogue cleared), immediately
  // fire the next battle with the queued partner. The player's team
  // HP/status was intentionally NOT healed by the previous victory
  // handler, so the follow-up fight carries over damage. This is the
  // whole point -- two trainers in a row test your surviving squad.
  useEffect(() => {
      if (phase !== GamePhase.OVERWORLD) return;
      if (dialogue) return;
      const next = pendingGauntletNextRef.current;
      if (!next) return;
      // Safety: if every mon fainted (edge case with burns/rocks
      // post-victory), skip the chain -- triggering a battle with an
      // empty party softlocks the engine.
      const alive = playerState.team.some(p => !p.isFainted && p.currentHp > 0);
      if (!alive) {
          pendingGauntletNextRef.current = null;
          return;
      }
      // Consume the ref BEFORE calling startBattle so a mid-chain
      // effect re-run doesn't double-trigger.
      pendingGauntletNextRef.current = null;
      showToast(`Gauntlet: ${next.name} engages!`, 'warning', { kicker: 'Trainer' });
      startBattle(0, false, true, next);
  }, [phase, dialogue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rival intercept: same pattern as the gauntlet chain. Triggers the
  // cinematic rival battle on the next clean OVERWORLD frame after the
  // chunk-entry dialogue (or landmark banner) settles. Unlike gauntlet,
  // we DO heal/save a beat before -- the rival is a big event, not a
  // stamina test like the duo gauntlet. Player gets 3s to react; we
  // also drop a story toast so they understand what's happening.
  useEffect(() => {
      if (phase !== GamePhase.OVERWORLD) return;
      if (dialogue) return;
      const pending = pendingRivalRef.current;
      if (!pending) return;
      // Don't ambush in the middle of already-chained content.
      if (pendingGauntletNextRef.current) return;
      const alive = playerState.team.some(p => !p.isFainted && p.currentHp > 0);
      if (!alive) {
          // Clear it so whiteout + heal doesn't re-surface this same
          // battle mid-shop. We'll re-arm on the next milestone cross.
          pendingRivalRef.current = null;
          return;
      }
      pendingRivalRef.current = null;
      // Big-event toast -- the rival dialogue itself is shown as the
      // battle's opening log line via the trainer's `dialogue` field.
      showToast(`${pending.name} blocks your path!`, 'warning', {
          kicker: 'Rival',
          ttl: 4500,
      });
      startBattle(0, false, true, pending);
  }, [phase, dialogue]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { isHostRef.current = multiplayer.isHost; }, [multiplayer.isHost]);

  // Prefetch the hand-crafted battle background for the player's current biome
  // so the first wild encounter in a new area paints instantly (no spinner flash).
  // This only fires when the mapId changes, so it's cheap (15 images cached
  // lazily as the player explores).
  useEffect(() => {
      if (phase !== GamePhase.OVERWORLD) return;
      const map = playerState.mapId.startsWith('chunk_')
          ? loadedChunks[playerState.mapId]
          : MAPS[playerState.mapId];
      const biome = map?.biome;
      if (!biome) return;
      const url = getStaticBackground(biome);
      if (url) {
          const img = new Image();
          img.src = url;
      }
  }, [playerState.mapId, phase, loadedChunks]);

  // When both players have confirmed, advance the session into the cinematic
  // phase. This runs on BOTH clients independently - both see the same
  // my/partner offers (each broadcasts its own), so both start the animation.
  useEffect(() => {
    if (!tradeSession) return;
    if (tradeSession.phase !== 'choose') return;
    if (tradeSession.myOffer.confirmed && tradeSession.partnerOffer.confirmed && tradeSession.myOffer.locked && tradeSession.partnerOffer.locked) {
        setTradeSession(prev => prev ? { ...prev, phase: 'committing' } : prev);
    }
  }, [tradeSession]);

  onDataRef.current = (data) => {
    if (data.type === 'BATTLE_REQUEST') {
        setBattleChallenge(data.payload);
    } else if (data.type === 'TRADE_EVENT') {
        const p = data.payload || {};
        const myUid = auth.currentUser?.uid;
        const kind = p.kind;
        const fromId = p.fromUid;
        // Ignore trade chatter aimed at someone else in a 3+ player room.
        if (p.targetId && myUid && p.targetId !== myUid) return;

        if (kind === 'REQUEST') {
            // Incoming trade invite. Ignore if we're already in a trade or battle,
            // or if a prompt is already up.
            if (tradeSessionRef.current || phaseRef.current === GamePhase.BATTLE) {
                // Auto-decline.
                multiplayer.send({ type: 'TRADE_EVENT', payload: { kind: 'DECLINE', targetId: fromId, reason: 'busy' } });
                return;
            }
            setTradeRequest({ fromId, fromName: p.fromName || 'Trainer' });
        } else if (kind === 'ACCEPT') {
            // Partner accepted our trade. Open the session (if we haven't already).
            if (!tradeSessionRef.current) {
                setTradeSession({
                    partnerId: fromId,
                    partnerName: p.fromName || 'Trainer',
                    myOffer: makeEmptyOffer(),
                    partnerOffer: makeEmptyOffer(),
                    phase: 'choose',
                });
            }
        } else if (kind === 'DECLINE') {
            if (tradeSessionRef.current) setTradeSession(null);
            showToast(p.reason === 'busy' ? 'They\'re busy right now.' : 'Trade declined.', 'info', { ttl: 2500 });
        } else if (kind === 'OFFER') {
            setTradeSession(prev => prev ? { ...prev, partnerOffer: p.offer } : prev);
        } else if (kind === 'CANCEL') {
            if (tradeSessionRef.current) {
                showToast('Partner cancelled the trade.', 'info', { ttl: 2500 });
                setTradeSession(null);
            }
        }
    } else if (data.type === 'BATTLE_ACCEPT') {
        const { battleId, opponentId, opponentInfo, isLead } = data.payload;
        startMultiplayerBattle(battleId, opponentId, opponentInfo, isLead);
    } else if (data.type === 'BATTLE_START') {
        const { playerTeam: netPlayerTeam, enemies, isBoss, isTrainer, trainerData, biome, tileType, bgUrl, initialWeather, initialCombo, isPvP, battleId: netBattleId } = data.payload;
        if (netBattleId) setBattleId(netBattleId);
        setIsMultiplayerBattle(true);
        setPhase(GamePhase.BATTLE);
        
        // Play initial cries
        if (netPlayerTeam && netPlayerTeam[0]) playCry(netPlayerTeam[0].id, netPlayerTeam[0].name);
        else if (playerState.team[0]) playCry(playerState.team[0].id, playerState.team[0].name);
        
        setTimeout(() => {
            if (enemies && enemies[0]) playCry(enemies[0].id, enemies[0].name);
        }, 500);

        setBattleState({
            playerTeam: netPlayerTeam || playerState.team,
            enemyTeam: enemies,
            turn: 1,
            phase: 'player_input',
            logs: isTrainer ? [`Trainer ${trainerData?.name || 'Unknown'} wants to battle!`] : [`A wild ${enemies[0]?.name || 'Pokémon'} appeared!`],
            pendingMoves: [],
            activePlayerIndex: 0,
            ui: { selectionMode: 'MOVE', selectedMove: null },
            isTrainerBattle: isTrainer,
            isPvP: !!isPvP,
            comboMeter: initialCombo,
            enemyComboMeter: 0,
            currentTrainerId: trainerData?.id,
            weather: initialWeather,
            terrain: 'none',
            backgroundUrl: bgUrl,
            weatherTurns: initialWeather !== 'none' ? 5 : 0,
            tailwindTurns: 0,
            enemyTailwindTurns: 0,
            aegisFieldTurns: 0,
            enemyAegisFieldTurns: 0,
            battleStreak: 0
        });
    } else if (data.type === 'BATTLE_ACTION') {
        const remoteActions = Array.isArray(data.payload) 
            ? data.payload.map((a: any) => ({ ...a, isPlayer: false }))
            : [{ ...data.payload, isPlayer: false }];
        setRemoteBattleActions(remoteActions);
        setBattleState(prev => {
            const livingPlayers = prev.playerTeam.filter(p => !p.isFainted).length;
            const activePlayerCount = Math.min(2, livingPlayers);
            if (prev.pendingMoves.length >= activePlayerCount) {
                return { ...prev, phase: 'execution' };
            }
            return prev;
        });
    } else if (data.type === 'SYNC_STATE') {
        setRemotePlayers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.payload.id, data.payload);
            return newMap;
        });
    } else if (data.type === 'MAP_DATA_SYNC') {
        const { riftLayout: netRift, caveLayouts: netCaves } = data.payload;
        if (netRift) setRiftLayout(netRift);
        if (netCaves) setCaveLayouts(netCaves);
    } else if (data.type === 'GAME_SYNC') {
        const { phase: netPhase, battleState: netBS, p2Position: netP2Pos, mapId: netMapId, type: nestedType } = data.payload;
        
        // Handle nested special types within GAME_SYNC
        if (nestedType === 'BATTLE_START' || data.payload.type === 'BATTLE_START') {
            console.log('[BATTLE] Processing BATTLE_START via GAME_SYNC');
            onDataRef.current({ type: 'BATTLE_START', payload: data.payload });
            return;
        }

        if (netPhase) setPhase(netPhase); 
        if (networkRoleRef.current === 'client') {
            setPlayerState(prev => ({ 
                ...prev, 
                position: netP2Pos || prev.position,
                mapId: netMapId || prev.mapId
            }));
        }
        if (netBS) {
            if (networkRoleRef.current === 'client') {
                // Always sync backgroundUrl if provided and not empty
                if (netBS.backgroundUrl && netBS.backgroundUrl !== battleStateRef.current?.backgroundUrl) {
                    setBattleState(prev => prev ? { ...prev, backgroundUrl: netBS.backgroundUrl } : netBS);
                }

                // Only sync full battleState if not in player_input, or if the host says it's execution, 
                // or if we have no pokemon teams yet (initialization)
                const hasNoTeams = !battleStateRef.current || (battleStateRef.current.playerTeam.length === 0 && battleStateRef.current.enemyTeam.length === 0);
                if (hasNoTeams || battleStateRef.current?.phase !== 'player_input' || netBS.phase === 'execution') {
                    const isPvP = !!netBS.isPvP;
                    setBattleState({
                        ...netBS,
                        playerTeam: isPvP ? netBS.enemyTeam : netBS.playerTeam,
                        enemyTeam: isPvP ? netBS.playerTeam : netBS.enemyTeam,
                        pendingMoves: []
                    });
                }
            } else {
                setBattleState(netBS);
            }
        }
    } else if (data.type === 'INPUT_MOVE') { 
        if (isHostRef.current) handleMapMove(data.payload, 2);
    } else if (data.type === 'INPUT_BATTLE_ACTION') { 
        if (isHostRef.current) queueAction(data.payload.targetIndex, data.payload.item, data.payload.move, data.payload.isFusion, data.payload.switchIndex, data.payload.activePlayerIndex);
    } else if (data.type === 'INPUT_MENU') {
        if (isHostRef.current) {
            if (data.payload === 'PAUSE') setIsPaused(prev => !prev);
            if (data.payload.type === 'SWAP') handleSwapTeam(data.payload.i1, data.payload.i2);
            if (data.payload.type === 'BUY') handleBuy(data.payload.item, data.payload.price);
            if (data.payload.type === 'CLOSE_SHOP') setPhase(GamePhase.OVERWORLD);
            if (data.payload.type === 'INTERACT') handleInteraction(2);
            if (data.payload.type === 'RUN') handleRun();
        }
    } else if (data.type === 'INPUT_EMOTE') {
        triggerEmote(data.payload);
    }
  };

  useEffect(() => {
    if (scanCooldown > 0) {
      const timer = setInterval(() => setScanCooldown(c => Math.max(0, c - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [scanCooldown]);

  // Multiplayer Listeners
  useEffect(() => {
    multiplayer.onPlayersUpdate((players) => {
        setRemotePlayers(new Map(players));
    });

    const unsub = multiplayer.onData((data) => {
        if (onDataRef.current) onDataRef.current(data);
    });
    return unsub;
  }, []);

  // Sync game state to others (Host only)
  useEffect(() => { 
    if (multiplayer.isHost && multiplayer.roomId) {
        // Strip movePool from battleState pokemon to reduce size significantly
        const optimizedBattleState = battleState ? {
            ...battleState,
            playerTeam: battleState.playerTeam.map(p => {
                const { movePool, ...rest } = p;
                return rest;
            }),
            enemyTeam: battleState.enemyTeam.map(p => {
                const { movePool, ...rest } = p;
                return rest;
            })
        } : null;

        const syncData = { 
            phase, 
            battleState: optimizedBattleState, 
            p2Position: playerState.p2Position,
            mapId: playerState.mapId
        };
        const syncString = JSON.stringify(syncData);
        if (lastSyncRef.current === syncString) return;
        lastSyncRef.current = syncString;

        multiplayer.send({ 
            type: 'GAME_SYNC', 
            payload: syncData 
        }); 
    } 
  }, [phase, battleState, playerState.p2Position, playerState.mapId]);

  // Sync map data (Host only, persistent)
  useEffect(() => {
    if (multiplayer.isHost && multiplayer.roomId && (riftLayout || Object.keys(caveLayouts).length > 0)) {
        const syncString = JSON.stringify({ riftLayout, caveLayouts });
        if (lastMapSyncRef.current === syncString) return;
        lastMapSyncRef.current = syncString;

        multiplayer.send({
            type: 'MAP_DATA_SYNC',
            payload: {
                riftLayout,
                caveLayouts,
                isPersistent: true,
                type: 'MAP_DATA'
            }
        });
    }
  }, [riftLayout, caveLayouts]);

  // Sync player state to others
  useEffect(() => {
    if (phase === GamePhase.OVERWORLD && multiplayer.roomId) {
        const syncInterval = setInterval(() => {
            multiplayer.send({
                type: 'SYNC_STATE',
                payload: {
                    id: auth.currentUser?.uid,
                    name: playerState.name,
                    position: playerState.position,
                    mapId: playerState.mapId,
                    team: playerState.team.map(p => ({ id: p.id, name: p.name, level: p.level, currentHp: p.currentHp, maxHp: p.maxHp })),
                    spriteUrl: networkRole === 'host' ? '/sprites/overworld/red.png' : '/sprites/overworld/kris.png',
                    isHost: networkRole === 'host'
                }
            });
        }, 1000);
        return () => clearInterval(syncInterval);
    }
  }, [phase, playerState.position, playerState.mapId, playerState.name, networkRole]);

  // Main Quest Progression
  useEffect(() => {
    const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
    const currentQuest = MAIN_QUESTS.find(q => q.id === playerState.meta.mainQuestProgress.currentQuestId);
    
    if (currentQuest) {
        const questValue = currentQuest.type === 'distance' ? distance : playerState.badges;
        if (questValue >= currentQuest.target) {
            const nextQuestIndex = MAIN_QUESTS.findIndex(q => q.id === currentQuest.id) + 1;
            const nextQuest = MAIN_QUESTS[nextQuestIndex];
            
            setPlayerState(prev => ({
                ...prev,
                meta: {
                    ...prev.meta,
                    mainQuestProgress: {
                        currentQuestId: nextQuest ? nextQuest.id : 'completed',
                        completedQuests: [...prev.meta.mainQuestProgress.completedQuests, currentQuest.id]
                    }
                }
            }));
            
            setDialogue([
                `QUEST COMPLETED: ${currentQuest.title}`,
                nextQuest ? `NEW QUEST: ${nextQuest.title}` : "You have completed all main quests!"
            ]);
            playLevelUpSfx();
        }
    }
  }, [playerState.chunkPos, playerState.badges]);


  // Discovery Milestones
  useEffect(() => {
    const milestone = Math.floor(playerState.discoveryPoints / 50); // Milestone every 50 points
    if (milestone > 0 && !playerState.storyFlags.includes(`discovery_milestone_${milestone}`)) {
        const rewardMoney = milestone * 10000;
        const rewardRareCandies = milestone * 2;
        
        setPlayerState(prev => ({
            ...prev,
            money: prev.money + rewardMoney,
            inventory: {
                ...prev.inventory,
                rare_candy: (prev.inventory.rare_candy || 0) + rewardRareCandies
            },
            storyFlags: [...prev.storyFlags, `discovery_milestone_${milestone}`]
        }));
        
        setDialogue(["DISCOVERY MILESTONE REACHED!", `You've earned a reward for your exploration: $${rewardMoney} and ${rewardRareCandies} RARE CANDIES!`]);
    }
  }, [playerState.discoveryPoints, playerState.storyFlags]);



  useEffect(() => {
    if (phase === GamePhase.BATTLE) {
        console.log('Battle Background URL:', battleState.backgroundUrl);
    }
  }, [phase, battleState.backgroundUrl]);

    // Sound Reactive Effect for Client in Multiplayer
    useEffect(() => {
        if (networkRoleRef.current !== 'client' || !battleState.logs || battleState.logs.length === 0) {
            if (!battleState.logs) lastProcessedLogIndexRef.current = 0;
            else lastProcessedLogIndexRef.current = battleState.logs.length;
            return;
        }

        const newLogs = battleState.logs.slice(lastProcessedLogIndexRef.current);
        lastProcessedLogIndexRef.current = battleState.logs.length;

        newLogs.forEach(log => {
            if (log.includes(' used ')) {
                const parts = log.split(' used ');
                if (parts.length > 1) {
                    const moveName = parts[1].split('!')[0].trim();
                    const moveEntry = Object.entries(NEW_MOVES).find(([name]) => name === moveName);
                    if (moveEntry) {
                        playMoveSfx(moveEntry[1].type, moveEntry[0], moveEntry[1].sfx);
                    } else {
                        playMoveSfx('normal');
                    }
                }
            } else if (log.includes(' fainted!')) {
                playFaintSfx();
            } else if (log.includes('Super effective!')) {
                playEffectivenessSfx(2);
            } else if (log.includes('Not very effective...')) {
                playEffectivenessSfx(0.5);
            } else if (log.includes('Critical hit!')) {
                playSound('https://cdn.jsdelivr.net/gh/smogon/pokemon-showdown@master/audio/sfx/hit.mp3', 0.4);
            }
        });
    }, [battleState.logs?.length, networkRoleRef.current]);

  // --- CONTROLS ---
  // Keyboard mapping (Pokemon-mainline-ish):
  //   - Arrows / WASD: move
  //   - Space / E: A-button (interact, advance dialogue)
  //   - Enter: Start button (toggle pause menu)
  //   - Esc: closes whichever modal is on top (handled by useEscapeKey)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== GamePhase.OVERWORLD) return;

      // Enter toggles the pause menu globally in the overworld, regardless
      // of whether a dialogue is up. If a dialogue is open it still closes
      // on Enter via the dialogue-advance branch below.
      // Guard: don't steal Enter when the user is typing in a form field
      // (import-save textarea, chat, etc.) -- otherwise hitting Enter would
      // close the menu *and* swallow the newline/confirm.
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
      );
      if (e.key === 'Enter' && !dialogue && !isTyping) {
          e.preventDefault();
          setIsPaused(prev => !prev);
          return;
      }

      if (dialogue && (e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.key === ' ')) {
          setDialogue(null);
          return;
      }

      if (isPaused) return;

      if (networkRole === 'client') {
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
          if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
          if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
          if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
          if (dx !== 0 || dy !== 0) {
              const newPos = { x: playerState.position.x + dx, y: playerState.position.y + dy };
              console.log("[CONTROLS] Client sending INPUT_MOVE to", newPos);
              multiplayer.send({ type: 'INPUT_MOVE', payload: newPos });
          }
          if (e.key === ' ' || e.key === 'e' || e.key === 'E') multiplayer.send({ type: 'INPUT_MENU', payload: { type: 'INTERACT' } });
      } else {
          // Host Logic
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
          if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
          if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
          if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

          if (dx !== 0 || dy !== 0) {
              const target = { x: playerState.position.x + dx, y: playerState.position.y + dy };
              handleMapMove(target, 1);
          }
          if (e.key === ' ' || e.key === 'e' || e.key === 'E') handleInteraction(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, playerState, networkRole, isPaused, dialogue]);

  useEffect(() => { if (battleState.phase === 'execution' && (networkRole === 'none' || networkRole === 'host')) executeTurn(); }, [battleState.phase]);

  // Clear remote actions on client when turn ends
  useEffect(() => {
    if (isMultiplayerBattle && networkRole === 'client' && battleState.phase === 'player_input') {
        setRemoteBattleActions([]);
    }
  }, [battleState.phase, isMultiplayerBattle, networkRole]);

  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
      if (!musicStarted) return;

      if (phase === GamePhase.MENU) {
          playBGM(BGM_TRACKS.MENU);
      } else if (phase === GamePhase.BATTLE) {
          playBGM(BGM_TRACKS.BATTLE);
      } else if (phase === GamePhase.OVERWORLD) {
          // Overworld is silent by design -- the procedural chiptune was placeholder
          // and will be replaced with a real track later. stopBGM() ensures the
          // battle track actually stops when returning to the map.
          stopBGM();
      }
  }, [phase, musicStarted]);

  // Pre-fetch the official move SFX for every move that either side might use
  // as soon as we enter a battle. The first play is then gapless instead of
  // hitting the procedural fallback while GitHub's raw CDN responds.
  useEffect(() => {
      if (phase !== GamePhase.BATTLE) return;
      const mons = [
          ...(battleState.playerTeam || []),
          ...(battleState.opponentTeam || [])
      ];
      const moves: Array<{ type?: string; name?: string; sfx?: string }> = [];
      for (const m of mons) {
          if (!m || !m.moves) continue;
          for (const mv of m.moves) {
              if (mv && mv.name) moves.push({ name: mv.name, type: mv.type, sfx: mv.sfx });
          }
      }
      if (moves.length) prefetchMoveSfx(moves);
  }, [phase, battleState.playerTeam, battleState.opponentTeam]);

  useEffect(() => {
      if (phase === GamePhase.MENU && !musicStarted) {
          const startMusic = () => {
              setMusicStarted(true);
              window.removeEventListener('click', startMusic);
          };
          window.addEventListener('click', startMusic);
          return () => window.removeEventListener('click', startMusic);
      }
  }, [phase, musicStarted]);

    // RENDER UI
    const renderContent = () => {
        if (authLoading) return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-yellow-400 animate-pulse font-press-start uppercase tracking-widest">Initialising Rift...</div>
            </div>
        );

        console.log('App Rendering: Phase =', phase);
        if (phase === GamePhase.MENU) return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-press-start">
                {/* Hand-crafted hero background (cel-shaded Pokemon-style vista) */}
                <div className="absolute inset-0 z-0">
                    {/* Base image with a gentle Ken-Burns drift so the title feels alive */}
                    <motion.div
                        className="absolute inset-0 bg-center bg-cover"
                        style={{ backgroundImage: `url(${MENU_BACKGROUND_URL})` }}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: [1.05, 1.1, 1.05] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {/* Readability vignette: darken top and bottom so the logo + buttons pop */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>

                    {/* Floating rift particles layered on top for extra atmosphere */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: Math.random() * window.innerHeight,
                                    opacity: 0
                                }}
                                animate={{
                                    y: [null, Math.random() * -200],
                                    opacity: [0, 0.6, 0],
                                    scale: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 5 + Math.random() * 10,
                                    repeat: Infinity,
                                    delay: Math.random() * 5
                                }}
                                className="absolute w-1 h-1 bg-cyan-300 rounded-full blur-sm"
                            />
                        ))}
                    </div>
                </div>

                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="z-10 text-center mb-16 relative"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black italic mb-4 tracking-tighter leading-tight"
                            style={{ 
                                color: '#ffcb05',
                                textShadow: '0 8px 0 #3c5aa6, 0 12px 24px rgba(0,0,0,0.6)',
                                WebkitTextStroke: '3px #3c5aa6',
                                paintOrder: 'stroke fill'
                            }}
                        >
                            POKÉMON<br/>EXPLORERS
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-[2px] w-12 bg-cyan-500/50"></div>
                            <p className="text-cyan-400 text-[10px] tracking-[0.4em] font-bold uppercase drop-shadow-lg">Roguelike Pokémon Expedition</p>
                            <div className="h-[2px] w-12 bg-cyan-500/50"></div>
                        </div>
                    </motion.div>
                </motion.div>

                <div className="z-10 flex flex-col gap-6 w-full max-w-sm px-6">
                    {hasExistingSave && (
                        <button
                            onClick={() => { unlockAudio(); handleLoadGame(); }}
                            className="group relative bg-amber-500 hover:bg-amber-400 px-8 py-6 rounded-2xl text-xl border-b-8 border-amber-700 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(245,158,11,0.3)]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3 text-black">
                                <span className="text-2xl">💾</span> Continue
                            </span>
                            <div className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-black/70 uppercase tracking-widest">
                                saved {formatSavedAt(lastSavedAt)}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    )}
                    <button
                        onClick={()=>{
                            unlockAudio();
                            setMusicStarted(true);
                            if (hasExistingSave) {
                                const confirmed = window.confirm('Starting a new adventure will overwrite your existing save. Continue?');
                                if (!confirmed) return;
                                deleteSave();
                                refreshSaveMeta();
                            }
                            setPhase(GamePhase.STARTER_SELECT);
                        }}
                        className="group relative bg-blue-600 hover:bg-blue-500 px-8 py-6 rounded-2xl text-xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">⚡</span> {hasExistingSave ? 'New Adventure' : 'Start Adventure'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                    
                    <button 
                        onClick={()=>setPhase(GamePhase.META_MENU)} 
                        className="group relative bg-purple-600 hover:bg-purple-500 px-8 py-6 rounded-2xl text-xl border-b-8 border-purple-800 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(147,51,234,0.3)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">💎</span> RIFT UPGRADES
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {playerState.meta.riftEssence > 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] px-3 py-1.5 rounded-full animate-bounce font-black shadow-lg border-2 border-black">
                                {playerState.meta.riftEssence} ESSENCE
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={()=>{ unlockAudio(); setMusicStarted(true); setPhase(GamePhase.NETWORK_MENU); }} 
                        className="group relative bg-emerald-600 hover:bg-emerald-500 px-8 py-6 rounded-2xl text-xl border-b-8 border-emerald-800 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">🌍</span> Join Friend
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </div>

                <div className="absolute bottom-8 flex flex-col items-center gap-4">
                    {!musicStarted && (
                        <div className="text-[8px] text-yellow-400/60 animate-pulse uppercase tracking-[0.3em] font-bold">
                            Click anywhere to start music
                        </div>
                    )}
                    <div className="flex gap-4 text-gray-500 text-[8px] uppercase tracking-widest font-bold">
                        <span>v1.2.0-rift-update</span>
                        <span className="text-gray-700">•</span>
                        <span>build 2026.04.08</span>
                    </div>
                    <div className="text-[6px] text-gray-600 uppercase tracking-[0.5em]">Jonathan Vanderwilt Expedition</div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-cyan-500/20 m-8 rounded-tl-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-purple-500/20 m-8 rounded-br-3xl pointer-events-none"></div>
            </div>
        );

        if (phase === GamePhase.META_MENU) return <MetaMenu state={playerState} setState={setPlayerState} onBack={() => setPhase(GamePhase.MENU)} />;
        if (phase === GamePhase.PERK_SELECT) return <PerkSelect onSelect={(perk) => {
            setPlayerState(prev => ({
                ...prev,
                run: {
                    ...prev.run,
                    perks: [...(prev.run.perks || []), perk]
                }
            }));
            setPhase(GamePhase.OVERWORLD);
            setDialogue([`You gained the ${perk.toUpperCase()} perk!`]);
        }} />;
        if (phase === GamePhase.NETWORK_MENU) return <OnlineMenu onBack={()=>{ setPhase(GamePhase.MENU); setNetworkRole('none'); multiplayer.disconnect(); }} onStartGame={()=>{ setNetworkRole('client'); setPhase(GamePhase.STARTER_SELECT); }} />;
        if (phase === GamePhase.STARTER_SELECT) { 
            return (
                <StarterSelect 
                    onSelect={handleStarterSelect} 
                    unlockedPacks={playerState.meta.unlockedPacks} 
                    shinyBoost={catchers_shinyTier(playerState.meta)} 
                    upgrades={playerState.meta.upgrades}
                    networkRole={networkRole}
                    multiplayer={multiplayer}
                    remotePlayers={remotePlayers}
                    onInvite={async () => {
                        await multiplayer.createRoom();
                        setNetworkRole('host');
                    }}
                    onBack={() => {
                        setPhase(GamePhase.MENU);
                        setNetworkRole('none');
                        multiplayer.disconnect();
                    }}
                />
            ); 
        }
        if (phase === GamePhase.SHOP) return <ShopMenu onClose={()=>setPhase(GamePhase.OVERWORLD)} money={playerState.money} inventory={playerState.inventory} onBuy={handleBuy} discount={scavenger_shopDiscount(playerState.meta)} />;

        if (phase === GamePhase.BOUNTY_BOARD) {
            const active = playerState.bounties?.active ?? [];
            const rerollAt = playerState.bounties?.rerollAvailableAt ?? 0;
            return (
                <BountyBoard
                    bounties={active}
                    onClaim={handleBountyClaim}
                    onReroll={handleBountyReroll}
                    onClose={() => setPhase(GamePhase.OVERWORLD)}
                    rerollMsRemaining={Math.max(0, rerollAt - Date.now())}
                    rerollCost={BOUNTY_REROLL_COST}
                    playerMoney={playerState.money}
                    comboInfo={playerState.catchCombo && playerState.catchCombo.count > 0 ? {
                        count: playerState.catchCombo.count,
                        speciesName: playerState.catchCombo.speciesName,
                        best: playerState.catchCombo.best,
                    } : undefined}
                />
            );
        }
        
        if (phase === GamePhase.OVERWORLD) {
            const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
            const stabilityMult = 1 - (getKeystoneLevel(playerState.meta, 'rift_stability') * 0.1);
            // Kept in sync with the battle-side Rift Pressure formula
            // (distance coeff 0.10, badge coeff 0.07). Times 100 so the HUD
            // shows an intuitive percentage above the baseline 1.0x.
            const riftIntensity = Math.min(100, Math.floor((Math.pow(distance / 20, 1.2) * 10 + Math.pow(playerState.badges, 1.1) * 7) * stabilityMult));
            
            return (
                <div className="relative overflow-hidden w-screen h-screen bg-black">
                   <EmoteOverlay emote={currentEmote} />
                   <QuestLog state={playerState} />
                   <ToastStack toasts={toasts} onExpire={expireToast} />
                   {isPaused && <PauseMenu
                        onClose={()=>setIsPaused(false)}
                        state={playerState}
                        onSwap={handleSwapTeam}
                        onGiveItem={handleGiveItem}
                        onSyncToCap={handleSyncPartyToCap}
                        onApplyRelearn={handleApplyRelearn}
                        onOpenLeaderboard={() => { setIsPaused(false); setShowLeaderboard(true); }}
                        onSave={handleManualSave}
                        onExportSave={handleExportSave}
                        onImportSave={handleImportSave}
                        onDeleteSave={handleDeleteSave}
                        lastSavedAt={lastSavedAt}
                   />}
                   {showLeaderboard && (
                       <LeaderboardScreen
                           inputs={{
                               farthestDistance: playerState.run.maxDistanceReached,
                               chunksDiscovered: playerState.discoveredChunks.length,
                               badges: playerState.badges,
                               totalCaptures: playerState.run.totalCaptures,
                               shiniesCaught: playerState.lifetime?.shiniesCaught ?? 0,
                               trainersDefeated: playerState.lifetime?.trainersDefeated ?? playerState.defeatedTrainers.length,
                               biggestStreak: playerState.lifetime?.biggestStreak ?? 0,
                               totalMoneyEarned: playerState.lifetime?.totalMoneyEarned ?? 0,
                               riftStabilityCleared: playerState.lifetime?.riftStabilityCleared ?? false,
                           }}
                           onClose={() => setShowLeaderboard(false)}
                       />
                   )}
                   {dialogue && <div className="absolute bottom-6 left-6 right-6 bg-blue-900/95 border-4 border-white p-6 rounded-2xl z-[60] text-white shadow-2xl"><div className="text-base leading-relaxed">{dialogue.map((l,i)=><p key={i}>{l}</p>)}</div><div className="text-xs text-yellow-400 mt-3 font-bold animate-pulse">Press Enter</div></div>}
                   <div className="absolute top-6 left-6 z-40 flex gap-3">{playerState.team.slice(0,3).map((p,i)=><div key={i} className="scale-90 origin-top-left"><HealthBar current={p.currentHp} max={p.maxHp} label={p.name} level={p.level} status={p.status} /></div>)}</div>
                   <div className="absolute top-6 right-6 z-40 flex flex-col gap-3 items-end">
                        <div className="bg-gradient-to-br from-amber-500/90 to-amber-700/90 px-4 py-2 border-2 border-amber-300/80 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-2">
                            <span className="text-amber-200">$</span>
                            <span className="font-mono tabular-nums">{playerState.money.toLocaleString()}</span>
                        </div>
                        <div className="bg-black/80 px-3 py-2 border border-emerald-400/50 rounded-md backdrop-blur-sm flex items-center gap-3 text-[10px] uppercase tracking-widest">
                            <div>
                                <div className="text-gray-400 text-[7px]">Lv Cap</div>
                                <div className="text-emerald-300 font-bold">{getPlayerLevelCap(playerState.badges)}</div>
                            </div>
                            <div className="w-px h-6 bg-white/20" />
                            <div>
                                <div className="text-gray-400 text-[7px]">Floor</div>
                                <div className="text-cyan-300 font-bold">{getPartyFloor(playerState.badges, playerState.run.maxDistanceReached)}</div>
                            </div>
                            <div className="w-px h-6 bg-white/20" />
                            <div>
                                <div className="text-gray-400 text-[7px]">Badges</div>
                                <div className="text-yellow-300 font-bold flex gap-0.5">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <span key={i} className={i < playerState.badges ? 'text-yellow-300' : 'text-gray-600'}>●</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-black/70 px-3 py-1.5 border border-red-500/50 text-white text-xs rounded-md backdrop-blur-sm flex flex-col gap-1 w-32">
                            <div className="flex justify-between font-black text-[8px] tracking-tighter text-red-400">
                                <span>RIFT INTENSITY</span>
                                <span>{riftIntensity}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${riftIntensity}%` }}></div>
                            </div>
                        </div>
                        {(() => {
                            const score = computeExplorerScore({
                                farthestDistance: playerState.run.maxDistanceReached,
                                chunksDiscovered: playerState.discoveredChunks.length,
                                badges: playerState.badges,
                                totalCaptures: playerState.run.totalCaptures,
                                shiniesCaught: playerState.lifetime?.shiniesCaught ?? 0,
                                trainersDefeated: playerState.lifetime?.trainersDefeated ?? playerState.defeatedTrainers.length,
                                biggestStreak: playerState.lifetime?.biggestStreak ?? 0,
                                totalMoneyEarned: playerState.lifetime?.totalMoneyEarned ?? 0,
                                riftStabilityCleared: playerState.lifetime?.riftStabilityCleared ?? false,
                            });
                            return (
                                <button
                                    onClick={() => setShowLeaderboard(true)}
                                    className="bg-gradient-to-br from-indigo-700/90 to-purple-800/90 px-3 py-1.5 border border-indigo-300/60 rounded-md text-white text-[10px] uppercase tracking-widest w-32 hover:from-indigo-600 hover:to-purple-700 transition shadow-lg text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-indigo-200 font-bold">{score.title}</span>
                                        <span className="text-[8px] text-indigo-300">▸</span>
                                    </div>
                                    <div className="text-white font-black text-sm tabular-nums">{score.total.toLocaleString()}</div>
                                </button>
                            );
                        })()}
                    </div>
                <Overworld 
                    p1Pos={networkRole === 'client' ? ((Array.from(remotePlayers.values()).find((p: any) => p.isHost) as any)?.position || { x: -100, y: -100 }) : playerState.position} 
                    p2Pos={networkRole === 'host' ? playerState.p2Position : (networkRole === 'client' ? playerState.position : { x: -100, y: -100 })} 
                    mapId={playerState.mapId} 
                    loadedChunks={loadedChunks} 
                    customLayout={playerState.mapId==='rift'?riftLayout! : (playerState.mapId.startsWith('cave_') ? caveLayouts[playerState.mapId] : undefined)} 
                    myPlayerId={networkRole==='client'?2:1} 
                    networkRole={networkRole}
                    onInteract={(x,y)=>handleInteraction(1)} 
                    onChallenge={(id, info) => setPlayerContextMenu({ id, info })}
                    remotePlayers={remotePlayers}
                    storyFlags={playerState.storyFlags} 
                    badges={playerState.badges} 
                    isScanning={isScanning}
                    auraSight={hasTalent(playerState.meta, 'aura_sight')}
                />
                <CatchComboBadge combo={playerState.catchCombo} />
                {battleChallenge && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
                        <div className="bg-blue-900 border-4 border-blue-400 p-8 rounded-2xl text-center max-w-sm shadow-2xl animate-in zoom-in duration-300">
                            <h3 className="text-yellow-400 text-xl mb-4 font-bold tracking-widest">BATTLE CHALLENGE!</h3>
                            <p className="text-white text-sm mb-8 leading-relaxed">
                                <span className="text-blue-300 font-bold">{battleChallenge.playerInfo.name}</span> wants to battle you!
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleChallengeResponse(true)}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl border-b-4 border-green-800 font-bold transition-all active:translate-y-1 active:border-b-0"
                                >
                                    ACCEPT
                                </button>
                                <button 
                                    onClick={() => handleChallengeResponse(false)}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl border-b-4 border-red-800 font-bold transition-all active:translate-y-1 active:border-b-0"
                                >
                                    DECLINE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Remote-player action picker: Battle or Trade */}
                {playerContextMenu && !battleChallenge && !tradeRequest && !tradeSession && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[105] p-4" onClick={() => setPlayerContextMenu(null)}>
                        <div className="bg-gray-900 border-4 border-yellow-400 p-6 rounded-xl text-center max-w-xs shadow-2xl font-press-start" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[8px] uppercase tracking-[.4em] text-gray-400 mb-1">Trainer Found</div>
                            <h3 className="text-yellow-300 text-sm mb-5 tracking-widest uppercase">
                                {playerContextMenu.info?.name || 'Trainer'}
                            </h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        multiplayer.send({
                                            type: 'BATTLE_REQUEST',
                                            payload: { targetId: playerContextMenu.id, playerInfo: { name: playerState.name, team: playerState.team } }
                                        });
                                        setDialogue(["Challenge sent!", `Waiting for ${playerContextMenu.info?.name || 'Trainer'} to accept...`]);
                                        setPlayerContextMenu(null);
                                    }}
                                    className="py-3 bg-gradient-to-r from-red-700 to-orange-700 hover:from-red-600 hover:to-orange-600 text-white text-[10px] uppercase tracking-widest border border-red-300 rounded"
                                >
                                    ⚔ Battle
                                </button>
                                <button
                                    onClick={() => handleStartTrade(playerContextMenu.id, playerContextMenu.info)}
                                    className="py-3 bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white text-[10px] uppercase tracking-widest border border-blue-300 rounded"
                                >
                                    ⇆ Trade
                                </button>
                                <button
                                    onClick={() => setPlayerContextMenu(null)}
                                    className="py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-[8px] uppercase tracking-widest border border-gray-500 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Incoming trade invite */}
                {tradeRequest && !tradeSession && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[110] p-4">
                        <div className="bg-purple-900 border-4 border-pink-400 p-8 rounded-2xl text-center max-w-sm shadow-2xl animate-in zoom-in duration-300 font-press-start">
                            <div className="text-3xl mb-2">⇆</div>
                            <h3 className="text-pink-300 text-sm mb-4 tracking-widest uppercase">Trade Request</h3>
                            <p className="text-white text-[10px] mb-8 leading-relaxed uppercase tracking-wide">
                                <span className="text-yellow-300 font-bold">{tradeRequest.fromName}</span><br/>wants to trade with you!
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleTradeRequestResponse(true)}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white text-[10px] uppercase tracking-widest rounded-xl border-b-4 border-green-800 active:translate-y-1 active:border-b-0 transition-all"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleTradeRequestResponse(false)}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase tracking-widest rounded-xl border-b-4 border-red-800 active:translate-y-1 active:border-b-0 transition-all"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="fixed bottom-28 right-8 z-50 flex flex-col gap-3">
                    <button 
                        onClick={handleScan}
                        disabled={scanCooldown > 0}
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all active:scale-95 ${scanCooldown > 0 ? 'bg-gray-700 border-gray-600 opacity-50' : 'bg-blue-600 border-blue-400 hover:bg-blue-500'}`}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-white text-xs font-bold">SCAN</span>
                            {scanCooldown > 0 && <span className="text-white text-[10px]">{scanCooldown}s</span>}
                        </div>
                    </button>
                </div>
            </div>
        );
        }
        
        if (phase === GamePhase.BATTLE) {
          if (!battleState || (battleState.playerTeam.length === 0 && battleState.enemyTeam.length === 0)) {
            return (
              <div className="h-[100dvh] bg-black flex flex-col items-center justify-center font-press-start text-white p-8 text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl text-yellow-400 mb-4 animate-pulse uppercase tracking-widest">INITIALIZING BATTLE...</h2>
                <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs">
                  Synchronizing with the Rift...<br/>
                  Please wait while we stabilize the connection.
                </p>
                {networkRole === 'client' && (
                   <button 
                    onClick={() => setPhase(GamePhase.OVERWORLD)}
                    className="mt-8 text-[8px] text-blue-400 hover:text-blue-300 underline"
                   >
                    CANCEL & RETURN TO OVERWORLD
                   </button>
                )}
              </div>
            );
          }
        }

        return (
          <div className="h-[100dvh] bg-gray-900 flex flex-col relative overflow-hidden font-press-start">
             {!battleState.backgroundUrl && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                     <div className="text-center">
                         <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                         <p className="text-yellow-400 text-xl animate-pulse">ENTERING BATTLE ARENA...</p>
                     </div>
                 </div>
             )}
             {battleState.backgroundUrl && (
                 <div className="absolute inset-0 z-0">
                     <img
                         src={battleState.backgroundUrl}
                         className="w-full h-full object-cover"
                         referrerPolicy="no-referrer"
                         onError={(e) => {
                             // Final safety net: if whatever bg was picked fails,
                             // fall back to the cel-shaded forest PNG we ship.
                             const target = e.target as HTMLImageElement;
                             const fallback = '/bg/bg_forest.jpg';
                             if (!target.src.endsWith(fallback)) target.src = fallback;
                         }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                     <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/60 to-transparent" />
                 </div>
             )}
             <EmoteOverlay emote={currentEmote} />
             {comboVfx && <div className="absolute inset-0 z-50 bg-white/20 animate-pulse"></div>}
             <motion.div 
                animate={(() => {
                    // Variable-intensity screen shake. Heavy moves kick more
                    // and add a subtle vertical jitter + tiny rotation so the
                    // camera feels punched. Tuned short (180-320ms) so battles
                    // still feel snappy. `true` == legacy payloads == medium.
                    const s = battleState.screenShake;
                    if (!s) return {};
                    if (s === 'heavy') {
                        return { x: [-22, 22, -18, 16, -10, 6, 0], y: [0, -4, 2, -3, 1, 0, 0], rotate: [0, -0.6, 0.4, -0.3, 0.2, 0, 0] };
                    }
                    if (s === 'medium' || s === true) {
                        return { x: [-14, 14, -10, 8, -5, 0], y: [0, -2, 1, 0, 0, 0], rotate: [0, -0.3, 0.2, 0, 0, 0] };
                    }
                    // 'light'
                    return { x: [-8, 8, -5, 3, 0] };
                })()}
                transition={{ duration: battleState.screenShake === 'heavy' ? 0.36 : 0.22, ease: 'easeInOut' }}
                className="flex-1 relative z-10 p-4 flex flex-col justify-between min-h-0 overflow-hidden"
             >
                  {/* Battle-field-wide VFX overlay (type flash, vignette,
                   * shockwave, screen sparks). Mounted once at the battle
                   * container level so it scales to the whole fight, not a
                   * single Pokemon's sprite box. */}
                  <BattleFxOverlay vfx={battleState.vfx} />
                  {battleState.battleStreak > 1 && (
                      <div className="absolute top-4 right-4 z-50">
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-black/60 backdrop-blur-md border border-yellow-500/50 px-4 py-2 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                          >
                              <div className="flex flex-col">
                                  <div className="text-[8px] text-yellow-500 font-black uppercase tracking-tighter leading-none">Battle Streak</div>
                                  <div className="text-xl font-black text-white italic leading-none">{battleState.battleStreak}</div>
                              </div>
                              <div className="w-px h-6 bg-white/20" />
                              <div className="text-[10px] font-bold text-yellow-400">
                                  +{Math.min(100, battleState.battleStreak * 10)}% XP
                              </div>
                          </motion.div>
                      </div>
                  )}
                  {/* Rift Pressure chip — shown whenever the enemies have a
                   *  material stat buff (>=10% above baseline). Colour ramps
                   *  up from amber → crimson so the player can read the
                   *  pressure at a glance. Clicking does nothing; it's a
                   *  diegetic "this fight is harder than vanilla" marker. */}
                  {battleState.riftPressure && battleState.riftPressure >= 1.10 && (() => {
                      const p = battleState.riftPressure;
                      const pct = Math.round((p - 1) * 100);
                      const sev = p >= 1.60 ? 'crimson' : p >= 1.30 ? 'orange' : 'amber';
                      const colors = sev === 'crimson'
                          ? { border: 'border-red-500/60', text: 'text-red-400', label: 'text-red-500', shadow: '0_0_15px_rgba(239,68,68,0.35)' }
                          : sev === 'orange'
                          ? { border: 'border-orange-500/60', text: 'text-orange-400', label: 'text-orange-500', shadow: '0_0_15px_rgba(249,115,22,0.3)' }
                          : { border: 'border-amber-500/60', text: 'text-amber-300', label: 'text-amber-500', shadow: '0_0_15px_rgba(245,158,11,0.3)' };
                      return (
                          <div className={`absolute ${battleState.battleStreak > 1 ? 'top-16' : 'top-4'} right-4 z-50`}>
                              <motion.div
                                  initial={{ scale: 0, opacity: 0, y: -8 }}
                                  animate={{ scale: 1, opacity: 1, y: 0 }}
                                  transition={{ delay: 0.15 }}
                                  title={`Enemies have +${pct}% HP / Attack / Sp. Attack from Rift Pressure. Invest in Rift Stability to soften this.`}
                                  className={`bg-black/60 backdrop-blur-md border ${colors.border} px-3 py-1.5 rounded-full flex items-center gap-2 shadow-[${colors.shadow}]`}
                              >
                                  <div className="flex flex-col leading-none">
                                      <div className={`text-[8px] ${colors.label} font-black uppercase tracking-tighter`}>Rift Pressure</div>
                                      <div className="text-sm font-black text-white italic">×{p.toFixed(2)}</div>
                                  </div>
                                  <div className="w-px h-5 bg-white/20" />
                                  <div className={`text-[10px] font-bold ${colors.text}`}>+{pct}%</div>
                              </motion.div>
                          </div>
                      );
                  })()}
                  {battleState.fusionChargeActive && battleState.phase === 'player_input' && (
                      <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[100]">
                          <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.1 }}
                              onClick={() => {
                                  // Trigger Fusion Move selection
                                  const p1 = battleState.playerTeam[0];
                                  const p2 = battleState.playerTeam[1];
                                  if (p1 && p2 && !p1.isFainted && !p2.isFainted) {
                                      let t1 = p1.types[0];
                                      let t2 = p2.types[0];
                                      
                                      if (p1.ability.name === 'TypeTwist' && p1.types[1]) t1 = p1.types[1];
                                      if (p2.ability.name === 'TypeTwist' && p2.types[1]) t2 = p2.types[1];
                                      
                                      let fusion = getFusionMove(t1, t2);
                                      
                                      if (!fusion && p1.ability.name === 'FusionMaster') {
                                          fusion = getFusionMove(t2, t2);
                                      }
                                      if (!fusion && p2.ability.name === 'FusionMaster') {
                                          fusion = getFusionMove(t1, t1);
                                      }
                                      if (fusion) {
                                          const fusionMove: PokemonMove = {
                                              name: fusion.name,
                                              url: '',
                                              power: fusion.power,
                                              accuracy: fusion.accuracy,
                                              type: fusion.resultType,
                                              damage_class: fusion.category.toLowerCase() as any,
                                              pp: 1,
                                              target: fusion.target,
                                              isFusion: true,
                                              meta: fusion.meta || { ailment: { name: 'none' }, category: { name: 'damage' } }
                                          };
                                          setBattleState(prev => ({
                                              ...prev,
                                              ui: { ...prev.ui, selectionMode: 'TARGET', selectedMove: fusionMove, isFusionNext: true }
                                          }));
                                      }
                                  }
                              }}
                              className="bg-gradient-to-r from-yellow-400 to-orange-600 px-8 py-4 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] text-white font-bold text-xl animate-pulse"
                          >
                              FUSION CHARGE!
                          </motion.button>
                      </div>
                  )}
                  <div className="flex flex-col items-end gap-1 z-10 -mt-4 pr-12">
                        <SyncGauge value={battleState.enemyComboMeter} label="Team Sync" color="red" />
                      <div className="flex justify-end gap-12">
                          {battleState.enemyTeam.slice(0, 2).map((mon, i) => !mon.isFainted && (
                          <div key={i} className="flex flex-col-reverse items-center gap-2 relative">
                              <div className="relative">
                                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-12 rounded-[100%] border-2 blur-[1px] shadow-lg
                                      ${battleState.weather === 'sand' ? 'bg-amber-700/60 border-amber-500/80' : 
                                        battleState.weather === 'hail' ? 'bg-blue-200/60 border-blue-100/80' :
                                        'bg-green-600/60 border-green-400/80'}`} 
                                  />
                                  <PokemonSprite pokemon={mon} isTargetable={isTargeting} onSelect={() => handleTargetSelect(i)} />
                                  <BattlePopupLayer side="enemy" slot={i as 0 | 1} />
                                  <AnimatePresence>
                                      {battleState.vfx && battleState.vfx.target === 'enemy' && battleState.vfx.index === i && (
                                          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                              <MoveVFX vfx={battleState.vfx} />
                                          </div>
                                      )}
                                  </AnimatePresence>
                              </div>
                              <HealthBar 
                                current={mon.currentHp} 
                                max={mon.maxHp} 
                                label={mon.name} 
                                level={mon.level} 
                                status={mon.status} 
                              />
                          </div>
                      ))}
                  </div>
                  </div>
                  
                  <div className="flex flex-col items-start gap-1 z-10 pl-12 pb-96">
                        <SyncGauge value={battleState.comboMeter} label="Team Sync" color="yellow" />
                       <div className="flex justify-start gap-12">
                            {battleState.playerTeam.slice(0, 2).map((mon, i) => !mon.isFainted && (
                          <div key={i} className="flex flex-col-reverse items-center gap-2 relative">
                              <div className="relative">
                                  <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-16 rounded-[100%] border-2 blur-[1px] shadow-xl
                                      ${battleState.weather === 'sand' ? 'bg-amber-700/60 border-amber-500/80' : 
                                        battleState.weather === 'hail' ? 'bg-blue-200/60 border-blue-100/80' :
                                        'bg-green-600/60 border-green-400/80'}`} 
                                  />
                                  <PokemonSprite pokemon={mon} isBack />
                                  <BattlePopupLayer side="player" slot={i as 0 | 1} />
                                  <AnimatePresence>
                                      {battleState.vfx && battleState.vfx.target === 'player' && battleState.vfx.index === i && (
                                          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                              <MoveVFX vfx={battleState.vfx} />
                                          </div>
                                      )}
                                  </AnimatePresence>
                              </div>
                              <HealthBar 
                                current={mon.currentHp} 
                                max={mon.maxHp} 
                                label={mon.name} 
                                level={mon.level} 
                                xp={mon.xp} 
                                maxXp={mon.maxXp} 
                                status={mon.status} 
                              />
                          </div>
                      ))}
                  </div>
              </div>
              </motion.div>
             
             <div className="bg-gray-800 border-t-4 border-gray-600 p-2 md:p-4 h-auto min-h-[16rem] z-20 relative flex-none">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 h-full">
                     <div className="bg-white/5 backdrop-blur-sm p-3 text-[10px] md:text-xs text-gray-300 overflow-y-auto max-h-32 md:max-h-none border-r border-white/10">{battleState.logs.map((l,i)=><div key={i} className="mb-1">{l}</div>)}</div>
                     <div className="col-span-2 bg-gray-700 p-2 md:p-4 rounded-lg overflow-y-auto">
                          {battleState.phase === 'player_input' && activePlayer && !isTargeting && !isBagMode && !isSwitchMode && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                  <div className="grid grid-cols-2 gap-2">
                                      {activePlayer.moves.map((m, i) => {
                                          return (
                                              <MoveButton 
                                                  key={i} 
                                                  move={m} 
                                                  type={m.type || 'normal'} 
                                                  onClick={() => { 
                                                      unlockAudio();
                                                      if (isMyTurn) setBattleState(prev=>({...prev, ui:{selectionMode:'TARGET', selectedMove:m}})) 
                                                  }} 
                                                  disabled={!isMyTurn || (activePlayer.sealedMoveName === m.name && (activePlayer.sealedTurns || 0) > 0)} 
                                              />
                                          );
                                      })}
                                  </div>
                                  <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                                      {(() => {
                                          // Power button only renders when the player
                                          // has unlocked at least one transform in the
                                          // Vault. Each has its own per-battle/per-run
                                          // gating enforced inside the picker below.
                                          const metaV = playerState.meta;
                                          const canTera = hasVaultUnlock(metaV, 'tera');
                                          const canMega = hasVaultUnlock(metaV, 'mega');
                                          const canZ = hasVaultUnlock(metaV, 'zmove');
                                          if (!canTera && !canMega && !canZ) return null;
                                          // Already-used flags -- if the active mon is
                                          // mid-transform or has already popped, hide.
                                          const used = !!activePlayer?.megaActive || !!activePlayer?.teraType || !!activePlayer?.zCharged;
                                          const canMegaNow = canMega && !battleState.playerUsedMegaThisBattle && activePlayer && MEGA_ELIGIBLE.has(activePlayer.id);
                                          const canZNow = canZ && !battleState.playerUsedZThisBattle;
                                          const canTeraNow = canTera; // once per battle per mon; enforced by teraType flag
                                          const anyAvailable = canTeraNow || canMegaNow || canZNow;
                                          return (
                                              <ActionButton
                                                  label={used ? 'POWER·ON' : 'POWER'}
                                                  color="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-amber-500"
                                                  onClick={() => { unlockAudio(); if (isMyTurn && anyAvailable) setTransformPicker('root'); }}
                                                  disabled={!isMyTurn || !anyAvailable || used}
                                              />
                                          );
                                      })()}
                                      <ActionButton label="BAG" color="bg-blue-600" onClick={()=>{ unlockAudio(); if (isMyTurn) setBattleState(prev=>({...prev, ui:{selectionMode:'ITEM', selectedMove:null}})) }} disabled={!isMyTurn} />
                                      <ActionButton label="POKEMON" color="bg-green-600" onClick={()=>{ 
                                          unlockAudio();
                                          if (isMyTurn) {
                                              if (isTrapped) {
                                                  setBattleState(prev => ({...prev, logs: [...prev.logs, `${activePlayer.name} is trapped and cannot switch!`]}));
                                              } else {
                                                  setBattleState(prev=>({...prev, ui:{selectionMode:'SWITCH', selectedMove:null}}));
                                              }
                                          } 
                                      }} disabled={!isMyTurn} />
                                      <ActionButton label="RUN" color="bg-red-600" onClick={() => { unlockAudio(); if (isMyTurn) handleRun() }} disabled={!isMyTurn} />
                                  </div>
                                  {/* Multiplayer Turn Indicator */}
                                  {(networkRole !== 'none' || !isMyTurn) && (
                                      <div className="col-span-full text-center text-xs text-yellow-400 mt-2 animate-pulse">
                                          {hasSelected ? 'Waiting for other player...' : 
                                           (networkRole === 'host' && battleState.activePlayerIndex === 1) ? 'Waiting for Client...' : 
                                           (networkRole === 'client' && battleState.activePlayerIndex === 0) ? 'Waiting for Host...' : ''}
                                      </div>
                                  )}

                              </div>
                          )}

                          {/* Targeting Phase UI */}
                          {isTargeting && (
                              <div className="flex flex-col items-center justify-center h-full gap-4">
                                  <div className="text-yellow-400 text-xl animate-pulse font-bold tracking-widest">
                                      SELECT TARGET
                                  </div>
                                  <button 
                                      onClick={() => setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE', selectedMove: null, selectedItem: null } }))}
                                      className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded border-2 border-gray-400 text-sm transition-colors"
                                  >
                                      BACK
                                  </button>
                              </div>
                          )}
                           {isBagMode && (
                               <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-40">
                                   {playerState.run.capturePermits > 0 && (
                                       <ActionButton 
                                           label={`CAPTURE PERMIT (${playerState.run.capturePermits})`} 
                                           color="bg-orange-500" 
                                           onClick={() => setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'TARGET', selectedItem: 'poke-ball' } }))} 
                                       />
                                   )}
                                   {playerState.inventory.potions > 0 && (
                                       <ActionButton 
                                           label={`POTION (${playerState.inventory.potions})`} 
                                           color="bg-green-600" 
                                           onClick={() => queueAction(battleState.activePlayerIndex, 'potion')} 
                                       />
                                   )}
                                   {playerState.inventory.items.map((itemId, idx) => {
                                       const item = ITEMS[itemId];
                                       if (!item || (item.category !== 'pokeball' && item.category !== 'healing')) return null;
                                       return (
                                           <ActionButton 
                                               key={idx}
                                               label={`${item.name.toUpperCase()}`} 
                                               color={item.category === 'pokeball' ? "bg-orange-600" : "bg-green-700"} 
                                               onClick={() => {
                                                   if (item.category === 'pokeball') {
                                                       setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'TARGET', selectedItem: itemId } }));
                                                   } else {
                                                       queueAction(battleState.activePlayerIndex, itemId);
                                                   }
                                               }} 
                                           />
                                       );
                                   })}
                                   <ActionButton label="BACK" color="bg-gray-500" onClick={() => setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' } }))} />
                                   {networkRole !== 'none' && (
                                       <div className="col-span-full text-center text-xs text-yellow-400 mt-2 animate-pulse">
                                           {(networkRole === 'host' && battleState.activePlayerIndex === 1) ? 'Waiting for Client...' : 
                                            (networkRole === 'client' && battleState.activePlayerIndex === 0) ? 'Waiting for Host...' : ''}
                                       </div>
                                   )}
                               </div>
                           )}
                           {isSwitchMode && (
                               <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-40">
                                   {battleState.playerTeam.map((p, i) => {
                                       const abilityData = NEW_ABILITIES[p.ability.name];
                                       return (
                                           <button 
                                               key={i}
                                               className={`p-2 rounded text-xs font-bold border-2 transition-all ${p.isFainted ? 'bg-gray-600 border-gray-800 opacity-50 cursor-not-allowed' : i === battleState.activePlayerIndex ? 'bg-blue-700 border-yellow-400' : 'bg-blue-500 border-blue-700 hover:bg-blue-400'}`}
                                               onClick={() => {
                                                   if (p.isFainted || i === battleState.activePlayerIndex) return;
                                                   queueAction(battleState.activePlayerIndex, undefined, undefined, false, i);
                                               }}
                                               disabled={p.isFainted || i === battleState.activePlayerIndex}
                                           >
                                               <div className="flex justify-between items-center">
                                                   <span className="truncate mr-1">{p.name}</span>
                                                   <span className="text-[8px] whitespace-nowrap">Lv.{p.level}</span>
                                               </div>
                                               <div className="w-full bg-gray-900 h-1 mt-1 rounded-full overflow-hidden">
                                                   <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(p.currentHp/p.maxHp)*100}%` }}></div>
                                               </div>
                                               <div className="mt-1 text-[8px] text-left text-yellow-200 opacity-90">
                                                   {p.ability.name}
                                               </div>
                                               <div className="text-[7px] text-left text-gray-200 leading-tight line-clamp-2 opacity-75">
                                                   {abilityData?.description || "No description available."}
                                               </div>
                                           </button>
                                       );
                                   })}
                                   <div className="col-span-2">
                                       <ActionButton label="BACK" color="bg-gray-600" onClick={()=>setBattleState(prev=>({...prev, ui:{selectionMode:'MOVE'}}))} disabled={battleState.mustSwitch} />
                                   </div>
                                   {/* Multiplayer Turn Indicator */}
                                   {networkRole !== 'none' && (
                                       <div className="col-span-full text-center text-xs text-yellow-400 mt-2 animate-pulse">
                                           {(networkRole === 'host' && battleState.activePlayerIndex === 1) ? 'Waiting for Client...' : 
                                            (networkRole === 'client' && battleState.activePlayerIndex === 0) ? 'Waiting for Host...' : ''}
                                       </div>
                                   )}
                               </div>
                           )}
                     </div>
                 </div>
             </div>
         </div>
          );
    };

    useEffect(() => {
        const globalUnlock = () => {
            unlockAudio();
            // Don't remove listener immediately, let various clicks try to resume
        };
        window.addEventListener('click', globalUnlock);
        window.addEventListener('touchstart', globalUnlock);
        return () => {
            window.removeEventListener('click', globalUnlock);
            window.removeEventListener('touchstart', globalUnlock);
        };
    }, []);

    // Evolution cinematic always renders on top of whatever phase is
    // active, so rare-candy evolutions in the menu and post-battle level-up
    // evolutions all use the same scene. Consumed one at a time from the
    // queue; the scene's `onComplete` shifts the head off and fires the
    // committed onDone callback from the queueing site.
    const activeEvolution = evolutionQueue[0];
    const handleEvolutionComplete = (result: 'evolved' | 'cancelled') => {
        setEvolutionQueue((prev) => prev.slice(1));
        if (!activeEvolution) return;
        if (result === 'evolved') {
            activeEvolution.onDone?.(activeEvolution.after);
        } else {
            activeEvolution.onDone?.(activeEvolution.before);
        }
    };

    // --- Rift Transform activation helpers ------------------------------
    // These mutate battleState via setter, logging and popup-ing so the
    // player sees feedback. Each transform has its own gating: Mega and Z
    // are per-battle; Tera is per-mon (once you pick a tera type it
    // persists till the mon faints / ends battle).
    const activateMega = () => {
        setBattleState(prev => {
            if (!prev.playerTeam || prev.playerUsedMegaThisBattle) return prev;
            const idx = prev.activePlayerIndex;
            const team = prev.playerTeam.map((m, i) => i === idx ? { ...m, megaActive: true } : m);
            popupCustom('player', idx as 0 | 1, 'MEGA EVO', '#f472b6', '✦');
            return {
                ...prev,
                playerTeam: team,
                playerUsedMegaThisBattle: true,
                logs: [...prev.logs, `${team[idx].name} Mega Evolved!`],
            };
        });
        playSound('https://play.pokemonshowdown.com/audio/sfx/megaevo.mp3', 0.7);
        setTransformPicker(null);
    };
    const activateZ = () => {
        setBattleState(prev => {
            if (!prev.playerTeam || prev.playerUsedZThisBattle) return prev;
            const idx = prev.activePlayerIndex;
            const team = prev.playerTeam.map((m, i) => i === idx ? { ...m, zCharged: true } : m);
            popupCustom('player', idx as 0 | 1, 'Z-POWER', '#fbbf24', '⚡');
            return {
                ...prev,
                playerTeam: team,
                playerUsedZThisBattle: true,
                logs: [...prev.logs, `${team[idx].name} is charged with Z-Power! Next move is a Z-Move!`],
            };
        });
        playSound('https://play.pokemonshowdown.com/audio/sfx/megaevo.mp3', 0.6);
        setTransformPicker(null);
    };
    const activateTera = (type: string) => {
        setBattleState(prev => {
            if (!prev.playerTeam) return prev;
            const idx = prev.activePlayerIndex;
            const team = prev.playerTeam.map((m, i) => i === idx ? { ...m, teraType: type } : m);
            popupCustom('player', idx as 0 | 1, `TERA·${type.toUpperCase()}`, '#c084fc', '◆');
            return {
                ...prev,
                playerTeam: team,
                logs: [...prev.logs, `${team[idx].name} Terastallized into ${type}-type!`],
            };
        });
        playSound('https://play.pokemonshowdown.com/audio/sfx/megaevo.mp3', 0.7);
        setTransformPicker(null);
    };

    return (
        <>
            <AudioWidget />
            {renderContent()}
            {transformPicker && phase === GamePhase.BATTLE && battleState && (() => {
                const idx = battleState.activePlayerIndex;
                const active = battleState.playerTeam?.[idx];
                if (!active) return null;
                const canTera = hasVaultUnlock(playerState.meta, 'tera') && !active.teraType;
                const canMega = hasVaultUnlock(playerState.meta, 'mega') && !battleState.playerUsedMegaThisBattle && MEGA_ELIGIBLE.has(active.id) && !active.megaActive;
                const canZ = hasVaultUnlock(playerState.meta, 'zmove') && !battleState.playerUsedZThisBattle && !active.zCharged;
                return (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setTransformPicker(null)}>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-gradient-to-br from-slate-900 via-purple-950/80 to-slate-900 border-2 border-purple-400/60 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-[0_0_60px_rgba(192,132,252,0.4)]"
                        >
                            <div className="text-center mb-4">
                                <div className="text-[10px] uppercase tracking-[0.4em] text-purple-300 mb-1">Rift Transform</div>
                                <div className="text-2xl md:text-3xl font-black text-white">Channel Power — {active.name}</div>
                                <div className="text-xs text-slate-400 mt-1">One transform per turn. Mega & Z are once per battle.</div>
                            </div>
                            {transformPicker === 'root' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button
                                        disabled={!canMega}
                                        onClick={activateMega}
                                        className={`p-4 rounded-xl border-2 text-left transition ${canMega ? 'bg-pink-900/40 border-pink-400/60 hover:bg-pink-800/60 hover:border-pink-300' : 'bg-slate-800/40 border-slate-700/50 opacity-40 cursor-not-allowed'}`}
                                    >
                                        <div className="text-xs uppercase tracking-wider text-pink-300 mb-1">Mega Evolution</div>
                                        <div className="text-lg font-bold text-white mb-2">+30% Atk · +20% Def</div>
                                        <div className="text-[10px] text-slate-300 leading-tight">
                                            {!hasVaultUnlock(playerState.meta, 'mega') ? 'Locked in Vault.' :
                                             battleState.playerUsedMegaThisBattle ? 'Already used this battle.' :
                                             !MEGA_ELIGIBLE.has(active.id) ? `${active.name} is not Mega-eligible.` :
                                             'For the rest of the battle.'}
                                        </div>
                                    </button>
                                    <button
                                        disabled={!canZ}
                                        onClick={activateZ}
                                        className={`p-4 rounded-xl border-2 text-left transition ${canZ ? 'bg-amber-900/40 border-amber-400/60 hover:bg-amber-800/60 hover:border-amber-300' : 'bg-slate-800/40 border-slate-700/50 opacity-40 cursor-not-allowed'}`}
                                    >
                                        <div className="text-xs uppercase tracking-wider text-amber-300 mb-1">Z-Move</div>
                                        <div className="text-lg font-bold text-white mb-2">Next hit ×1.8</div>
                                        <div className="text-[10px] text-slate-300 leading-tight">
                                            {!hasVaultUnlock(playerState.meta, 'zmove') ? 'Locked in Vault.' :
                                             battleState.playerUsedZThisBattle ? 'Already used this battle.' :
                                             'Pierces Protect. Can\'t miss.'}
                                        </div>
                                    </button>
                                    <button
                                        disabled={!canTera}
                                        onClick={() => setTransformPicker('tera')}
                                        className={`p-4 rounded-xl border-2 text-left transition ${canTera ? 'bg-purple-900/40 border-purple-400/60 hover:bg-purple-800/60 hover:border-purple-300' : 'bg-slate-800/40 border-slate-700/50 opacity-40 cursor-not-allowed'}`}
                                    >
                                        <div className="text-xs uppercase tracking-wider text-purple-300 mb-1">Terastallize</div>
                                        <div className="text-lg font-bold text-white mb-2">Override type</div>
                                        <div className="text-[10px] text-slate-300 leading-tight">
                                            {!hasVaultUnlock(playerState.meta, 'tera') ? 'Locked in Vault.' :
                                             active.teraType ? `Already Tera ${active.teraType}.` :
                                             'Pick any type. 2× STAB on matching moves.'}
                                        </div>
                                    </button>
                                </div>
                            )}
                            {transformPicker === 'tera' && (
                                <div>
                                    <div className="text-xs text-center text-slate-300 mb-3">Pick the type this Pokémon becomes.</div>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {TERA_TYPES.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => activateTera(t)}
                                                className="p-2 rounded-lg bg-slate-800/60 hover:bg-purple-800/60 border border-slate-700 hover:border-purple-400 text-white text-[10px] uppercase tracking-wider font-bold transition"
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setTransformPicker('root')}
                                        className="mt-4 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs uppercase tracking-wider"
                                    >
                                        Back
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setTransformPicker(null)}
                                className="absolute top-3 right-3 text-slate-400 hover:text-white text-xl leading-none"
                            >
                                ×
                            </button>
                        </motion.div>
                    </div>
                );
            })()}
            {activeEvolution && (
                <EvolutionScene
                    key={`evo-${activeEvolution.monUid}-${activeEvolution.after.id}`}
                    before={activeEvolution.before}
                    after={activeEvolution.after}
                    onComplete={handleEvolutionComplete}
                />
            )}
            {tradeSession && (
                <TradeScreen
                    session={tradeSession}
                    state={playerState}
                    onOfferChange={handleTradeOfferChange}
                    onCancel={handleTradeCancel}
                    onCommit={handleTradeCommit}
                />
            )}
        </>
    );
}
