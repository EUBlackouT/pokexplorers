// =============================================================================
// Move VFX: sprite + animation-style mapping
// =============================================================================
// Real attack-animation sprites from Pokémon Showdown's public FX library,
// hotlinked from their CDN. The `MoveVFX` React component picks a sprite and
// an animation style for every move the game fires:
//
//   1. Exact move slug match in MOVE_VFX_SPRITES          (best fidelity)
//   2. Type-colored default in TYPE_VFX_SPRITES           (reasonable fallback)
//   3. The legacy type-colored blur circle                (final fallback)
//
// Animation styles control how the sprite travels from attacker to defender:
//   - projectile : parabolic arc (thrown object)
//   - beam       : straight-line stretch-and-fade (beam/ray)
//   - aura       : expanding pulse on the defender (no travel)
//   - self       : bloom on the attacker (status / buff / self-targeted)
//   - contact    : short punch/slash at the defender
//   - rain       : multi-drop from above (multi-hit / weather-style)
// =============================================================================

export const MOVE_VFX_BASE = 'https://play.pokemonshowdown.com/fx/';

export type VFXStyle = 'projectile' | 'beam' | 'aura' | 'self' | 'contact' | 'rain';

export interface MoveVFXSpec {
  sprite: string;
  style: VFXStyle;
}

export const MOVE_VFX_SPRITES: Record<string, MoveVFXSpec> = {
  // FIRE
  'ember':          { sprite: 'fireball.png',       style: 'projectile' },
  'flamethrower':   { sprite: 'fireball.png',       style: 'beam' },
  'fire-blast':     { sprite: 'bluefireball.png',   style: 'projectile' },
  'fire-spin':      { sprite: 'fireball.png',       style: 'aura' },
  'heat-wave':      { sprite: 'fireball.png',       style: 'beam' },
  'overheat':       { sprite: 'bluefireball.png',   style: 'beam' },
  'eruption':       { sprite: 'fireball.png',       style: 'rain' },
  'flare-blitz':    { sprite: 'bluefireball.png',   style: 'contact' },
  'inferno':        { sprite: 'flareball.png',      style: 'projectile' },
  'will-o-wisp':    { sprite: 'wisp.png',           style: 'projectile' },
  'fire-punch':     { sprite: 'fist.png',           style: 'contact' },
  'blue-flare':     { sprite: 'bluefireball.png',   style: 'projectile' },
  'sacred-fire':    { sprite: 'flareball.png',      style: 'beam' },
  'v-create':       { sprite: 'bluefireball.png',   style: 'contact' },

  // WATER
  'water-gun':      { sprite: 'waterwisp.png',      style: 'beam' },
  'hydro-pump':     { sprite: 'waterwisp.png',      style: 'beam' },
  'surf':           { sprite: 'waterwisp.png',      style: 'aura' },
  'bubble':         { sprite: 'waterwisp.png',      style: 'projectile' },
  'bubble-beam':    { sprite: 'waterwisp.png',      style: 'beam' },
  'water-pulse':    { sprite: 'waterwisp.png',      style: 'projectile' },
  'hydro-cannon':   { sprite: 'waterwisp.png',      style: 'beam' },
  'aqua-jet':       { sprite: 'waterwisp.png',      style: 'contact' },
  'aqua-tail':      { sprite: 'waterwisp.png',      style: 'contact' },
  'scald':          { sprite: 'waterwisp.png',      style: 'beam' },
  'waterfall':      { sprite: 'waterwisp.png',      style: 'contact' },
  'liquidation':    { sprite: 'waterwisp.png',      style: 'contact' },
  'origin-pulse':   { sprite: 'waterwisp.png',      style: 'beam' },

  // ELECTRIC
  'thunder-shock':  { sprite: 'lightning.png',      style: 'beam' },
  'thunderbolt':    { sprite: 'lightning.png',      style: 'beam' },
  'thunder':        { sprite: 'lightning.png',      style: 'rain' },
  'zap-cannon':     { sprite: 'electroball.png',    style: 'projectile' },
  'electro-ball':   { sprite: 'electroball.png',    style: 'projectile' },
  'discharge':      { sprite: 'lightning.png',      style: 'aura' },
  'volt-tackle':    { sprite: 'lightning.png',      style: 'contact' },
  'thunder-punch':  { sprite: 'fist.png',           style: 'contact' },
  'thunder-wave':   { sprite: 'lightning.png',      style: 'aura' },
  'shock-wave':     { sprite: 'lightning.png',      style: 'beam' },
  'spark':          { sprite: 'lightning.png',      style: 'contact' },
  'wild-charge':    { sprite: 'lightning.png',      style: 'contact' },

  // GRASS
  'razor-leaf':     { sprite: 'leaf1.png',          style: 'rain' },
  'leaf-blade':     { sprite: 'leaf1.png',          style: 'contact' },
  'magical-leaf':   { sprite: 'leaf2.png',          style: 'rain' },
  'petal-dance':    { sprite: 'petal.png',          style: 'rain' },
  'petal-blizzard': { sprite: 'petal.png',          style: 'rain' },
  'energy-ball':    { sprite: 'energyball.png',     style: 'projectile' },
  'solar-beam':     { sprite: 'energyball.png',     style: 'beam' },
  'vine-whip':      { sprite: 'leaf1.png',          style: 'contact' },
  'giga-drain':     { sprite: 'leaf2.png',          style: 'beam' },
  'seed-bomb':      { sprite: 'leaf1.png',          style: 'projectile' },
  'bullet-seed':    { sprite: 'leaf1.png',          style: 'projectile' },
  'leaf-storm':     { sprite: 'leaf2.png',          style: 'rain' },
  'frenzy-plant':   { sprite: 'leaf1.png',          style: 'aura' },

  // ICE
  'ice-beam':       { sprite: 'iceball.png',        style: 'beam' },
  'blizzard':       { sprite: 'icicle.png',         style: 'rain' },
  'icy-wind':       { sprite: 'icicle.png',         style: 'beam' },
  'icicle-spear':   { sprite: 'icicle.png',         style: 'projectile' },
  'icicle-crash':   { sprite: 'icicle.png',         style: 'rain' },
  'frost-breath':   { sprite: 'iceball.png',        style: 'beam' },
  'aurora-beam':    { sprite: 'iceball.png',        style: 'beam' },
  'freeze-dry':     { sprite: 'icicle-pink.png',    style: 'beam' },
  'glaciate':       { sprite: 'icicle.png',         style: 'aura' },
  'ice-punch':      { sprite: 'fist.png',           style: 'contact' },

  // PSYCHIC
  'psychic':        { sprite: 'mistball.png',       style: 'aura' },
  'psybeam':        { sprite: 'mistball.png',       style: 'beam' },
  'psycho-cut':     { sprite: 'mistball.png',       style: 'contact' },
  'confusion':      { sprite: 'mistball.png',       style: 'aura' },
  'future-sight':   { sprite: 'mistball.png',       style: 'aura' },
  'zen-headbutt':   { sprite: 'mistball.png',       style: 'contact' },
  'stored-power':   { sprite: 'mistball.png',       style: 'projectile' },
  'psyshock':       { sprite: 'mistball.png',       style: 'projectile' },
  'calm-mind':      { sprite: 'mistball.png',       style: 'self' },

  // DARK
  'dark-pulse':     { sprite: 'blackwisp.png',      style: 'beam' },
  'night-slash':    { sprite: 'leftslash.png',      style: 'contact' },
  'bite':           { sprite: 'topbite.png',        style: 'contact' },
  'crunch':         { sprite: 'topbite.png',        style: 'contact' },
  'foul-play':      { sprite: 'leftslash.png',      style: 'contact' },
  'knock-off':      { sprite: 'leftchop.png',       style: 'contact' },
  'sucker-punch':   { sprite: 'fist.png',           style: 'contact' },
  'snarl':          { sprite: 'sound.png',          style: 'beam' },
  'nasty-plot':     { sprite: 'blackwisp.png',      style: 'self' },
  'taunt':          { sprite: 'angry.png',          style: 'self' },

  // GHOST
  'shadow-ball':    { sprite: 'shadowball.png',     style: 'projectile' },
  'shadow-punch':   { sprite: 'fist.png',           style: 'contact' },
  'shadow-claw':    { sprite: 'rightclaw.png',      style: 'contact' },
  'night-shade':    { sprite: 'blackwisp.png',      style: 'beam' },
  'hex':            { sprite: 'blackwisp.png',      style: 'aura' },
  'lick':           { sprite: 'topbite.png',        style: 'contact' },
  'phantom-force':  { sprite: 'blackwisp.png',      style: 'contact' },
  'shadow-sneak':   { sprite: 'blackwisp.png',      style: 'contact' },

  // ROCK
  'rock-throw':     { sprite: 'rock1.png',          style: 'projectile' },
  'rock-blast':     { sprite: 'rocks.png',          style: 'projectile' },
  'rock-slide':     { sprite: 'rocks.png',          style: 'rain' },
  'stone-edge':     { sprite: 'rock2.png',          style: 'projectile' },
  'rock-tomb':      { sprite: 'rock3.png',          style: 'projectile' },
  'ancient-power':  { sprite: 'rock1.png',          style: 'rain' },
  'power-gem':      { sprite: 'shine.png',          style: 'projectile' },
  'head-smash':     { sprite: 'rock2.png',          style: 'contact' },

  // GROUND
  'earthquake':     { sprite: 'rocks.png',          style: 'rain' },
  'earth-power':    { sprite: 'mudwisp.png',        style: 'aura' },
  'mud-slap':       { sprite: 'mudwisp.png',        style: 'projectile' },
  'muddy-water':    { sprite: 'mudwisp.png',        style: 'beam' },
  'mud-bomb':       { sprite: 'mudwisp.png',        style: 'projectile' },
  'bonemerang':     { sprite: 'bone.png',           style: 'projectile' },
  'bone-rush':      { sprite: 'bone.png',           style: 'projectile' },
  'bone-club':      { sprite: 'bone.png',           style: 'contact' },
  'dig':            { sprite: 'mudwisp.png',        style: 'contact' },
  'precipice-blades': { sprite: 'rock2.png',        style: 'rain' },

  // POISON
  'sludge-bomb':    { sprite: 'poisonwisp.png',     style: 'projectile' },
  'sludge-wave':    { sprite: 'poisonwisp.png',     style: 'aura' },
  'poison-sting':   { sprite: 'poisonwisp.png',     style: 'projectile' },
  'acid':           { sprite: 'poisonwisp.png',     style: 'beam' },
  'acid-spray':     { sprite: 'poisonwisp.png',     style: 'beam' },
  'toxic':          { sprite: 'poisonwisp.png',     style: 'aura' },
  'toxic-spikes':   { sprite: 'poisoncaltrop.png',  style: 'rain' },
  'poison-jab':     { sprite: 'poisonwisp.png',     style: 'contact' },
  'gunk-shot':      { sprite: 'poisonwisp.png',     style: 'projectile' },

  // BUG
  'bug-buzz':       { sprite: 'sound.png',          style: 'beam' },
  'x-scissor':      { sprite: 'rightslash.png',     style: 'contact' },
  'u-turn':         { sprite: 'leaf2.png',          style: 'contact' },
  'string-shot':    { sprite: 'web.png',            style: 'beam' },
  'sticky-web':     { sprite: 'web.png',            style: 'rain' },
  'signal-beam':    { sprite: 'mistball.png',       style: 'beam' },
  'megahorn':       { sprite: 'hitmarker.png',      style: 'contact' },
  'attack-order':   { sprite: 'sound.png',          style: 'beam' },

  // STEEL
  'iron-head':      { sprite: 'fist.png',           style: 'contact' },
  'iron-tail':      { sprite: 'sword.png',          style: 'contact' },
  'flash-cannon':   { sprite: 'greenmetal1.png',    style: 'beam' },
  'meteor-mash':    { sprite: 'fist1.png',          style: 'contact' },
  'bullet-punch':   { sprite: 'fist.png',           style: 'contact' },
  'gyro-ball':      { sprite: 'gear.png',           style: 'projectile' },
  'steel-wing':     { sprite: 'greenmetal2.png',    style: 'contact' },
  'metal-claw':     { sprite: 'rightclaw.png',      style: 'contact' },
  'smart-strike':   { sprite: 'sword.png',          style: 'contact' },

  // FIGHTING
  'close-combat':   { sprite: 'fist1.png',          style: 'contact' },
  'brick-break':    { sprite: 'leftchop.png',       style: 'contact' },
  'karate-chop':    { sprite: 'rightchop.png',      style: 'contact' },
  'focus-blast':    { sprite: 'energyball.png',     style: 'projectile' },
  'aura-sphere':    { sprite: 'energyball.png',     style: 'projectile' },
  'low-kick':       { sprite: 'foot.png',           style: 'contact' },
  'high-jump-kick': { sprite: 'foot.png',           style: 'contact' },
  'jump-kick':      { sprite: 'foot.png',           style: 'contact' },
  'drain-punch':    { sprite: 'fist.png',           style: 'contact' },
  'dynamic-punch':  { sprite: 'fist1.png',          style: 'contact' },
  'mach-punch':     { sprite: 'fist.png',           style: 'contact' },
  'power-up-punch': { sprite: 'fist1.png',          style: 'contact' },
  'cross-chop':     { sprite: 'leftchop.png',       style: 'contact' },

  // FLYING
  'aerial-ace':     { sprite: 'feather.png',        style: 'contact' },
  'air-slash':      { sprite: 'feather.png',        style: 'projectile' },
  'brave-bird':     { sprite: 'feather.png',        style: 'contact' },
  'drill-peck':     { sprite: 'feather.png',        style: 'contact' },
  'wing-attack':    { sprite: 'feather.png',        style: 'contact' },
  'gust':           { sprite: 'feather.png',        style: 'beam' },
  'hurricane':      { sprite: 'feather.png',        style: 'aura' },
  'air-cutter':     { sprite: 'feather.png',        style: 'projectile' },
  'oblivion-wing':  { sprite: 'feather.png',        style: 'beam' },
  'dragon-ascent':  { sprite: 'feather.png',        style: 'contact' },

  // DRAGON
  'dragon-pulse':   { sprite: 'energyball.png',     style: 'beam' },
  'dragon-claw':    { sprite: 'rightclaw.png',      style: 'contact' },
  'draco-meteor':   { sprite: 'rocks.png',          style: 'rain' },
  'outrage':        { sprite: 'angry.png',          style: 'contact' },
  'dragon-breath':  { sprite: 'mistball.png',       style: 'beam' },
  'dragon-rush':    { sprite: 'fist1.png',          style: 'contact' },
  'twister':        { sprite: 'mistball.png',       style: 'aura' },
  'roar-of-time':   { sprite: 'shine.png',          style: 'beam' },
  'spacial-rend':   { sprite: 'rightslash.png',     style: 'contact' },
  'clanging-scales':{ sprite: 'sound.png',          style: 'beam' },

  // FAIRY
  'moonblast':      { sprite: 'moon.png',           style: 'projectile' },
  'dazzling-gleam': { sprite: 'shine.png',          style: 'aura' },
  'play-rough':     { sprite: 'heart.png',          style: 'contact' },
  'disarming-voice':{ sprite: 'sound.png',          style: 'beam' },
  'charm':          { sprite: 'heart.png',          style: 'self' },
  'fairy-wind':     { sprite: 'shine.png',          style: 'beam' },
  'draining-kiss':  { sprite: 'heart.png',          style: 'contact' },

  // NORMAL
  'tackle':         { sprite: 'hitmarker.png',      style: 'contact' },
  'body-slam':      { sprite: 'hitmarker.png',      style: 'contact' },
  'quick-attack':   { sprite: 'hitmarker.png',      style: 'contact' },
  'hyper-beam':     { sprite: 'lightning.png',      style: 'beam' },
  'giga-impact':    { sprite: 'hitmarker.png',      style: 'contact' },
  'slash':          { sprite: 'leftslash.png',      style: 'contact' },
  'cut':            { sprite: 'leftslash.png',      style: 'contact' },
  'scratch':        { sprite: 'rightclaw.png',      style: 'contact' },
  'fury-swipes':    { sprite: 'rightclaw.png',      style: 'contact' },
  'double-slap':    { sprite: 'leftchop.png',       style: 'contact' },
  'pound':          { sprite: 'hitmarker.png',      style: 'contact' },
  'headbutt':       { sprite: 'hitmarker.png',      style: 'contact' },
  'mega-punch':     { sprite: 'fist1.png',          style: 'contact' },
  'mega-kick':      { sprite: 'foot.png',           style: 'contact' },
  'extreme-speed':  { sprite: 'hitmarker.png',      style: 'contact' },
  'return':         { sprite: 'heart.png',          style: 'contact' },
  'hyper-voice':    { sprite: 'sound.png',          style: 'beam' },
  'boomburst':      { sprite: 'sound.png',          style: 'aura' },

  // STATUS / SELF
  'swords-dance':   { sprite: 'sword.png',          style: 'self' },
  'dragon-dance':   { sprite: 'angry.png',          style: 'self' },
  'bulk-up':        { sprite: 'fist1.png',          style: 'self' },
  'agility':        { sprite: 'shine.png',          style: 'self' },
  'nasty-plot-alt': { sprite: 'blackwisp.png',      style: 'self' },
  'rain-dance':     { sprite: 'waterwisp.png',      style: 'aura' },
  'sunny-day':      { sprite: 'fireball.png',       style: 'aura' },
  'sandstorm':      { sprite: 'weather-sandstorm.png', style: 'aura' },
  'hail':           { sprite: 'weather-hail.png',   style: 'aura' },
  'snowscape':      { sprite: 'weather-hail.png',   style: 'aura' },
  'roost':          { sprite: 'feather.png',        style: 'self' },
  'recover':        { sprite: 'shine.png',          style: 'self' },
  'heal-bell':      { sprite: 'heart.png',          style: 'self' },
  'rest':           { sprite: 'shine.png',          style: 'self' },
  'stealth-rock':   { sprite: 'rock1.png',          style: 'rain' },
  'spikes':         { sprite: 'caltrop.png',        style: 'rain' },
  'electric-terrain': { sprite: 'weather-electricterrain.png', style: 'aura' },
  'grassy-terrain':   { sprite: 'weather-grassyterrain.png',   style: 'aura' },
  'misty-terrain':    { sprite: 'weather-mistyterrain.png',    style: 'aura' },
  'psychic-terrain':  { sprite: 'weather-psychicterrain.png',  style: 'aura' },
};

/** Type-based fallback when the specific move slug isn't mapped. */
export const TYPE_VFX_SPRITES: Record<string, MoveVFXSpec> = {
  fire:     { sprite: 'fireball.png',     style: 'projectile' },
  water:    { sprite: 'waterwisp.png',    style: 'beam' },
  electric: { sprite: 'lightning.png',    style: 'beam' },
  grass:    { sprite: 'leaf1.png',        style: 'projectile' },
  ice:      { sprite: 'iceball.png',      style: 'projectile' },
  psychic:  { sprite: 'mistball.png',     style: 'projectile' },
  dark:     { sprite: 'blackwisp.png',    style: 'projectile' },
  ghost:    { sprite: 'shadowball.png',   style: 'projectile' },
  poison:   { sprite: 'poisonwisp.png',   style: 'projectile' },
  ground:   { sprite: 'mudwisp.png',      style: 'projectile' },
  rock:     { sprite: 'rocks.png',        style: 'projectile' },
  bug:      { sprite: 'sound.png',        style: 'beam' },
  steel:    { sprite: 'greenmetal1.png',  style: 'projectile' },
  fighting: { sprite: 'fist1.png',        style: 'contact' },
  flying:   { sprite: 'feather.png',      style: 'projectile' },
  dragon:   { sprite: 'energyball.png',   style: 'beam' },
  fairy:    { sprite: 'shine.png',        style: 'projectile' },
  normal:   { sprite: 'hitmarker.png',    style: 'contact' },
};

/**
 * Resolve a move to its VFX spec. Name is a PokeAPI slug (kebab-case) OR a
 * free-form display name; we normalize before lookup. Falls back to the type
 * mapping, and finally to null (callers should render their legacy visual).
 */
export const getMoveVFX = (moveName?: string, moveType?: string): MoveVFXSpec | null => {
  if (moveName) {
    const slug = moveName
      .toLowerCase()
      .trim()
      .replace(/['’`]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (MOVE_VFX_SPRITES[slug]) return MOVE_VFX_SPRITES[slug];
  }
  if (moveType) {
    const t = moveType.toLowerCase();
    if (TYPE_VFX_SPRITES[t]) return TYPE_VFX_SPRITES[t];
  }
  return null;
};
