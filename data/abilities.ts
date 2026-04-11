
export interface AbilityData {
    category: string;
    description: string;
    tags: string[];
    notes?: string;
}

export const NEW_ABILITIES: Record<string, AbilityData> = {
  "RainDishPlus": {
    "category": "General",
    "description": "In rain, restores 1/16 HP and boosts Sync Gauge by 2% each turn.",
    "tags": ["rain", "heal", "gauge"]
  },
  "ChlorophyllPlus": {
    "category": "General",
    "description": "In sun, doubles Speed and boosts Sync Gauge by 2% each turn.",
    "tags": ["sun", "speed", "gauge"]
  },
  "ArcSurge": {
    "category": "General",
    "description": "On switch-in, creates a one-turn electric squall: Electric moves deal 1.2× damage this turn and Flying-types take 1/8 max HP damage.",
    "tags": ["electric", "field"]
  },
  "FusionMaster": {
    "category": "Signature",
    "description": "For Link calculations, this Pokémon may count its primary type as matching its ally if no match exists.",
    "tags": ["link", "glue"]
  },
  "Wardrum": {
    "category": "General",
    "description": "After using a Fighting move, has a 30% chance to raise ally’s Attack by 1 stage.",
    "tags": ["fighting", "ally-buff"]
  },
  "TremorSense": {
    "category": "General",
    "description": "Ground moves used by this Pokémon cannot miss and hit through evasion boosts.",
    "tags": ["ground", "accuracy"]
  },
  "RuneBloom": {
    "category": "General",
    "description": "Fairy status moves used by this Pokémon also raise its Speed by 1 stage (once per turn).",
    "tags": ["fairy", "status"]
  },
  "Jetstream": {
    "category": "General",
    "description": "On switch-in, sets a one-turn Tailwind (once per battle).",
    "tags": ["tailwind", "entry"]
  },
  "SourSap": {
    "category": "General",
    "description": "Grass moves used by this Pokémon may lower the target’s Sp. Def by 1 stage (20%).",
    "tags": ["grass", "spdef-drop"]
  },
  "IronBlood": {
    "category": "General",
    "description": "Cannot be poisoned. When hit by a Poison move, restores 1/16 max HP.",
    "tags": ["poison", "heal"]
  },
  "BlindingSand": {
    "category": "General",
    "description": "In Sandstorm, this Pokémon’s moves have a 10% chance to lower target’s Accuracy.",
    "tags": ["sand", "accuracy"]
  },
  "Overclock": {
    "category": "General",
    "description": "If this Pokémon moves first, its special moves deal 1.2× damage.",
    "tags": ["speed", "special"]
  },
  "HeavyStance": {
    "category": "General",
    "description": "When this Pokémon takes contact damage, its Speed falls by 1 stage and its Defense rises by 1 stage.",
    "tags": ["tank", "tradeoff"]
  },
  "VenomousAura": {
    "category": "General",
    "description": "On switch-in, 30% chance to poison each adjacent foe. Poison inflicted by this aura deals 1/8 max HP per turn.",
    "tags": ["poison", "entry"]
  },
  "LinkConduit": {
    "category": "Link",
    "description": "While this Pokémon is in the backline, if it knows a type used in a Link, it contributes as if it were on the field. (Once per battle.)",
    "tags": ["link", "support"]
  },
  "BondBreaker": {
    "category": "Link",
    "description": "This Pokémon’s moves deal 1.2× damage to targets that performed a Link Move last turn.",
    "tags": ["link", "anti-link"]
  },
  "PartnerBoost": {
    "category": "Link",
    "description": "When ally uses a Link Move, this Pokémon’s Speed rises by 1 stage.",
    "tags": ["link", "tempo"]
  },
  "SyncPulse": {
    "category": "Link",
    "description": "After this Pokémon uses a move, has a 30% chance to grant +10 to the Sync Gauge.",
    "tags": ["link", "gauge"]
  },
  "SyncBoost": {
    "category": "Link",
    "description": "Grants an initial +10 boost to the Sync Gauge at the start of battle if this Pokémon is in the lead.",
    "tags": ["link", "entry"]
  },
  "Resonance": {
    "category": "Link",
    "description": "Increases the power of Fusion moves by 50%.",
    "tags": ["link", "damage"]
  },
  "SyncShield": {
    "category": "Link",
    "description": "Reduces damage taken by 25% when the Sync Gauge is above 50%.",
    "tags": ["link", "defense"]
  },
  "SyncStrike": {
    "category": "Link",
    "description": "Increases critical hit ratio when the Sync Gauge is above 50%.",
    "tags": ["link", "crit"]
  },
  "Battery": {
    "category": "Link",
    "description": "Boosts the Sync Gauge by 5% when hit by an attack.",
    "tags": ["link", "gauge"]
  },
  "Amplifier": {
    "category": "Link",
    "description": "Increases the activation chance of Sync Pulse to 60%.",
    "tags": ["link", "gauge"]
  },
  "Feedback": {
    "category": "Link",
    "description": "Boosts the Sync Gauge by 20% when the user knocks out a target.",
    "tags": ["link", "gauge"]
  },
  "TypeTwist": {
    "category": "Link",
    "description": "During Link calculation, treat this Pokémon’s contributing type as its *secondary* type instead of primary.",
    "tags": ["link", "weird"]
  },
  "Aftershock": {
    "category": "Link",
    "description": "When this Pokémon participates in a Link Move, it also deals 1/8 max-HP damage to both foes after damage is dealt.",
    "tags": ["link", "chip"]
  },
  "HarmonyEngine": {
    "category": "Link",
    "description": "If both allies share a primary type, Link Gauge gains +20 on hit.",
    "tags": ["link", "gauge"]
  },
  "TempoSync": {
    "category": "Link",
    "description": "The team’s Link Move this battle uses the higher of the two users’ Speeds. (Once per battle.)",
    "tags": ["link", "speed"]
  },
  "AnchorSync": {
    "category": "Link",
    "description": "The team’s next Link Move uses the lower of the two users’ Speeds but deals 10% more damage. (Once per battle.)",
    "tags": ["link", "speed"]
  },
  "VenomSpite": {
    "category": "General",
    "description": "When a poisoned foe hits this Pokémon, that foe’s Special Defense falls by 1 stage.",
    "tags": ["poison", "punish"]
  },
  "WoundLeak": {
    "category": "General",
    "description": "Attackers that make contact with this Pokémon take recoil equal to 1/16 of their max HP.",
    "tags": ["contact", "punish"]
  },
  "FeverRush": {
    "category": "General",
    "description": "While burned, this Pokémon’s Speed is doubled.",
    "tags": ["status", "speed"]
  },
  "SaltVeins": {
    "category": "General",
    "description": "If paralyzed, this Pokémon restores 1/16 max HP at the end of each turn.",
    "tags": ["para", "heal"]
  },
  "AshenBody": {
    "category": "General",
    "description": "When this Pokémon faints, both adjacent foes are burned.",
    "tags": ["death", "burn"]
  },
  "GrimRecovery": {
    "category": "General",
    "description": "This Pokémon restores 25% of its max HP when it knocks out a statused target.",
    "tags": ["ko", "heal"]
  },
  "HexDrive": {
    "category": "General",
    "description": "Moves used by this Pokémon gain +1 critical-hit stage against statused targets.",
    "tags": ["crit", "status"]
  },
  "FrostbiteSkin": {
    "category": "General",
    "description": "Contact with this Pokémon has a 20% chance to freeze the attacker.",
    "tags": ["contact", "freeze"]
  },
  "SoulLink": {
    "category": "General",
    "description": "When this Pokémon’s ally faints, this Pokémon restores HP equal to 25% of its max HP.",
    "tags": ["ally", "heal"]
  },
  "SolarGuard": {
    "category": "General",
    "description": "In harsh sunlight, super-effective hits against this Pokémon deal 25% less damage.",
    "tags": ["sun", "defense"]
  },
  "MoonlightCall": {
    "category": "General",
    "description": "When no weather or terrain is active, this Pokémon restores 1/16 of its max HP each turn.",
    "tags": ["neutral", "heal"]
  },
  "StormRider": {
    "category": "General",
    "description": "This Pokémon is immune to Electric-type moves during rain. If hit by one, its Speed rises by 1 stage.",
    "tags": ["rain", "electric", "speed"]
  },
  "Ashstorm": {
    "category": "General",
    "description": "On switch-in, stirs a volcanic ash field for 3 turns: Fire moves deal 10% more damage and the accuracy of all moves is reduced by 5%.",
    "tags": ["field", "fire"]
  },
  "ThornField": {
    "category": "General",
    "description": "While Grassy Terrain is active, this Pokémon’s Ground-type moves hit Flying-types for neutral damage.",
    "tags": ["terrain", "ground"]
  },
  "GaleHarness": {
    "category": "General",
    "description": "While Tailwind is active, this Pokémon’s Flying-type moves deal 1.3× damage.",
    "tags": ["tailwind", "flying"]
  },
  "AuroraSpirit": {
    "category": "General",
    "description": "During snow, this Pokémon’s Fairy-type moves deal 1.2× damage.",
    "tags": ["snow", "fairy"]
  },
  "EarthenVeil": {
    "category": "General",
    "description": "During a sandstorm, this Pokémon cannot be struck by critical hits.",
    "tags": ["sand", "anti-crit"]
  },
  "MysticFog": {
    "category": "General",
    "description": "At the start of battle, lowers the Accuracy of all Pokémon by 1 stage. Clears when terrain is set.",
    "tags": ["battle-start", "fog"]
  },
  "Shoreline": {
    "category": "General",
    "description": "When rain ends, this Pokémon restores 25% of its max HP.",
    "tags": ["rain", "heal"]
  },
  "HazardEater": {
    "category": "General",
    "description": "When this Pokémon switches in and is damaged by entry hazards, it restores 1/8 of its max HP. (Once per battle.)",
    "tags": ["hazard", "heal"]
  },
  "SpikeCloak": {
    "category": "General",
    "description": "This Pokémon is immune to entry hazards, but it cannot be cured of status conditions.",
    "tags": ["hazard", "tradeoff"]
  },
  "AntiCrit": {
    "category": "General",
    "description": "Critical hits against this Pokémon deal only 1.25× damage.",
    "tags": ["anti-crit"]
  },
  "ItemShatter": {
    "category": "General",
    "description": "When this Pokémon hits with a contact move, it removes the target’s held item.",
    "tags": ["item", "contact"]
  },
  "ArmorMelt": {
    "category": "General",
    "description": "This Pokémon’s special attacks ignore one stage of the target’s Defense boosts.",
    "tags": ["breaker"]
  },
  "PhaseStep": {
    "category": "General",
    "description": "This Pokémon is immune to trapping effects and can always switch out.",
    "tags": ["trap-immunity"]
  },
  "AnchorGrip": {
    "category": "General",
    "description": "This Pokémon cannot be forced out by moves or items.",
    "tags": ["phaze-immunity"]
  },
  "AegisField": {
    "category": "General",
    "description": "When this Pokémon switches in, allies take 25% less damage until the end of the turn.",
    "tags": ["switch", "teamdef"]
  },
  "LifeSteal": {
    "category": "General",
    "description": "Contact moves used by this Pokémon restore HP equal to 1/16 of its max HP.",
    "tags": ["contact", "drain"]
  },
  "PressurePoint": {
    "category": "General",
    "description": "When this Pokémon is hit super-effectively, the attacker’s move loses 2 extra PP.",
    "tags": ["pp", "anti-meta"]
  },
  "RecklessTempo": {
    "category": "General",
    "description": "After this Pokémon knocks out a target, its Speed rises by 1 stage.",
    "tags": ["snowball", "speed"]
  },
  "PiercingWill": {
    "category": "General",
    "description": "This Pokémon’s damaging moves hit through Substitute.",
    "tags": ["sub-pierce"]
  },
  "KeenFlare": {
    "category": "General",
    "description": "The first damaging move this Pokémon uses in battle is a guaranteed critical hit.",
    "tags": ["opener", "crit"]
  },
  "LastGambitPlus": {
    "category": "General",
    "description": "At or below 25% HP, this Pokémon’s damaging moves gain +20 power but it takes recoil equal to 1/8 of its max HP.",
    "tags": ["comeback", "recoil"]
  },
  "BladeDance": {
    "category": "General",
    "description": "When this Pokémon uses a multi-hit move, the final hit gains +1 critical-hit stage.",
    "tags": ["multihit", "crit"]
  },
  "Ironstorm": {
    "category": "General",
    "description": "Steel-type moves used by this Pokémon deal 25% damage through Protect.",
    "tags": ["steel", "protect-break"]
  },
  "DeathWail": {
    "category": "General",
    "description": "When this Pokémon faints, lowers the Attack of both adjacent foes by 1 stage.",
    "tags": ["death", "intimidate-like"]
  },
  "Relentless": {
    "category": "General",
    "description": "This Pokémon’s moves’ accuracy cannot be lowered below 100%.",
    "tags": ["accuracy"]
  },
  "WildHunt": {
    "category": "General",
    "description": "When an opposing Pokémon switches out, this Pokémon’s Speed rises by 1 stage.",
    "tags": ["pivot-punish"]
  },
  "DuelistSWill": {
    "category": "General",
    "description": "When only one opposing Pokémon remains, this Pokémon’s damaging moves deal 1.2× damage.",
    "tags": ["endgame"]
  },
  "GuardianCore": {
    "category": "General",
    "description": "When this Pokémon takes a super-effective hit, its ally’s Defense and Sp. Def each rise by 1 stage.",
    "tags": ["ally", "defense"]
  },
  "Shellblood": {
    "category": "General",
    "description": "At or below 50% HP, this Pokémon restores 1/16 HP at the end of each turn.",
    "tags": ["regen"]
  },
  "MysticHusk": {
    "category": "General",
    "description": "This Pokémon ignores chip damage from weather, Leech Seed, and poison while above 75% HP.",
    "tags": ["chip-immunity"]
  },
  "LivingShield": {
    "category": "General",
    "description": "This Pokémon redirects all single-target status moves to itself.",
    "tags": ["redirection", "status"]
  },
  "RuneWard": {
    "category": "General",
    "description": "At the start of battle, protects allies from stat drops for 5 turns.",
    "tags": ["team", "anti-debuff"]
  },
  "SlowPulse": {
    "category": "General",
    "description": "If this Pokémon is slower than its target, its damaging moves deal 1.2× damage.",
    "tags": ["speed", "comeback"]
  },
  "SacrificialGuard": {
    "category": "General",
    "description": "If an ally would be knocked out by a damaging move, this Pokémon takes the hit instead (once per battle).",
    "tags": ["guardian"]
  },
  "Lifebloom": {
    "category": "General",
    "description": "While this Pokémon is active, allies restore 1/16 of their max HP each turn.",
    "tags": ["aura", "heal"]
  },
  "DecayTouch": {
    "category": "General",
    "description": "Contact against this Pokémon lowers the attacker’s Attack by 1 stage.",
    "tags": ["contact", "attack-drop"]
  },
  "StoneVeil": {
    "category": "General",
    "description": "While at full HP, this Pokémon cannot be struck by critical hits.",
    "tags": ["anti-crit", "fullhp"]
  },
  "PollenSurge": {
    "category": "General",
    "description": "Bug- and Grass-type moves used by this Pokémon have a 20% chance to lower the target’s Speed by 1 stage.",
    "tags": ["bug", "grass", "debuff"]
  },
  "SiltArmor": {
    "category": "General",
    "description": "This Pokémon takes 25% less damage from Water and Ground moves.",
    "tags": ["defense", "type-mod"]
  },
  "RootedSpirit": {
    "category": "General",
    "description": "This Pokémon cannot be flinched while on Grassy Terrain.",
    "tags": ["terrain", "anti-flinch"]
  },
  "WhirlpoolHeart": {
    "category": "General",
    "description": "Water-type moves used by this Pokémon heal its ally for 1/16 HP.",
    "tags": ["water", "ally-heal"]
  },
  "Sparkjump": {
    "category": "General",
    "description": "When this Pokémon uses a priority move, its Speed rises by 1 stage.",
    "tags": ["priority", "speed"]
  },
  "Counterweight": {
    "category": "General",
    "description": "If this Pokémon moves last, its Physical moves deal 1.2× damage.",
    "tags": ["speed", "physical"]
  },
  "ResinCoat": {
    "category": "General",
    "description": "Fire damage taken is reduced by 25%; if hit by Fire, this Pokémon’s next Grass move deals 1.3× damage.",
    "tags": ["fire-resist", "grass-boost"]
  },
  "SoundChannel": {
    "category": "General",
    "description": "This Pokémon’s sound-based moves have +1 priority.",
    "tags": ["sound", "priority"]
  },
  "BrittleFreeze": {
    "category": "General",
    "description": "Ice-type moves used by this Pokémon have +10% critical-hit chance.",
    "tags": ["ice", "crit"]
  },
  "Bleakwind": {
    "category": "General",
    "description": "At the end of each turn during snow, lowers Speed of adjacent foes by 1 stage.",
    "tags": ["snow", "speed-drop"]
  },
  "HotBlooded": {
    "category": "General",
    "description": "Burn damage heals this Pokémon instead of harming it.",
    "tags": ["burn", "heal"]
  },
  "ShimmerHide": {
    "category": "General",
    "description": "Fairy-type moves used by this Pokémon lower the target’s Attack by 1 stage on a critical hit.",
    "tags": ["fairy", "crit"]
  },
  "RazorTread": {
    "category": "General",
    "description": "This Pokémon’s contact moves set a one-turn hazard that deals 1/16 on switch-in (stacks with hazards).",
    "tags": ["hazard", "contact"]
  },
  "SpiralGuard": {
    "category": "General",
    "description": "Dragons’ moves deal 25% less damage to this Pokémon while its HP is above 50%.",
    "tags": ["dragon-resist"]
  },
  "StoneHarvest": {
    "category": "General",
    "description": "At the end of Sandstorm turns, restores 1/16 HP and raises Defense by 1 stage (once per sand).",
    "tags": ["sand", "heal", "defense"]
  },
  "TorrentSync": {
    "category": "General",
    "description": "If its ally uses a Water move, this Pokémon’s next attack deals 1.2× damage.",
    "tags": ["ally-sync", "water"]
  },
  "Photosynth": {
    "category": "General",
    "description": "Restores an extra 1/16 HP at the end of turn in Sun.",
    "tags": ["sun", "heal"]
  },
  "GavePact": {
    "category": "General",
    "description": "When this Pokémon knocks out a target, that slot suffers a -1 Speed on the next switch-in.",
    "tags": ["slot-debuff"]
  },
  "ShadowTagger": {
    "category": "General",
    "description": "Opponents cannot switch if this Pokémon has more HP than them. (Bosses ignored.)",
    "tags": ["trap", "conditional"]
  },
  "ShieldWall": {
    "category": "Tank",
    "description": "While this Pokémon is above 50% HP, it and its ally take 20% less damage from physical attacks.",
    "tags": ["tank", "team-defense"]
  },
  "EnergyCore": {
    "category": "Gauge",
    "description": "At the end of each turn, if this Pokémon didn't take damage, gain +5% Sync Gauge.",
    "tags": ["gauge", "passive"]
  },
  "Vanguard": {
    "category": "Tank",
    "description": "This Pokémon takes 50% less damage from the first hit it receives each time it switches in.",
    "tags": ["tank", "switch-in"]
  },
  "BatteryPack": {
    "category": "Gauge",
    "description": "When this Pokémon uses a move that costs 3 or more PP, gain +10% Sync Gauge.",
    "tags": ["gauge", "active"]
  },
  "LuckyBark": {
    "category": "General",
    "description": "This Pokémon’s moves have a 10% increased chance to apply their secondary effects.",
    "tags": ["sec-chance"]
  },
  "Slipstream": {
    "category": "General",
    "description": "After using a Flying move, this Pokémon’s Speed rises by 1 stage.",
    "tags": ["flying", "speed"]
  },
  "BoilingPoint": {
    "category": "General",
    "description": "At 3 turns of Sun, the next Fire move used by this Pokémon is 1.5× power.",
    "tags": ["sun", "charge"]
  },
  "AbyssalPull": {
    "category": "General",
    "description": "This Pokémon’s Water moves ignore the effects of Water immunity abilities.",
    "tags": ["water", "moldbreaker-ish"]
  },
  "SmogLung": {
    "category": "General",
    "description": "Poison moves used by this Pokémon cannot miss and ignore evasion boosts.",
    "tags": ["poison", "accuracy"]
  },
  "BorealCoat": {
    "category": "General",
    "description": "This Pokémon takes 25% less damage from Ice moves and cannot be frozen.",
    "tags": ["ice-resist"]
  },
  "ThunderousStep": {
    "category": "General",
    "description": "Electric-type moves used by this Pokémon have +1 priority if its HP is full.",
    "tags": ["electric", "priority", "fullhp"]
  },
  "MudForged": {
    "category": "General",
    "description": "This Pokémon’s Steel moves become Ground-type in Sandstorm (power unchanged).",
    "tags": ["type-swap", "sand"]
  },
  "CrystalMemory": {
    "category": "General",
    "description": "The first move that hits this Pokémon each battle has -1 PP cost for the user (refunds).",
    "tags": ["pp-weird"]
  },
  "HollowEcho": {
    "category": "General",
    "description": "Ghost moves used by this Pokémon lower the target’s PP by 2 on a critical hit.",
    "tags": ["ghost", "pp"]
  },
  "NightBloom": {
    "category": "General",
    "description": "In darkness (no weather/terrain), this Pokémon’s Dark and Grass moves deal 1.2× damage.",
    "tags": ["dark", "grass"]
  },
  "FossilDrive": {
    "category": "General",
    "description": "If holding a fossil-related item, this Pokémon’s Rock moves gain +10 power.",
    "tags": ["item-synergy"]
  },
  "TrickMirror": {
    "category": "General",
    "description": "Status moves that target this Pokémon are reflected back at the user once per battle.",
    "tags": ["status-reflect"]
  },
  "ScaleAegis": {
    "category": "General",
    "description": "This Pokémon cannot have its Defense lowered by foes.",
    "tags": ["anti-debuff"]
  },
  "RuneDrive": {
    "category": "General",
    "description": "This Pokémon’s moves ignore screens.",
    "tags": ["screen-pierce"]
  },
  "CavernRoar": {
    "category": "General",
    "description": "Sound-based moves used by this Pokémon lower the target’s Defense by 1 stage 20% of the time.",
    "tags": ["sound", "def-drop"]
  },
  "AmberCore": {
    "category": "General",
    "description": "Bug-type moves used by this Pokémon heal it for 1/16 HP.",
    "tags": ["bug", "heal"]
  },
  "TideTurner": {
    "category": "General",
    "description": "When Rain starts while this Pokémon is active, its Speed rises by 1 stage.",
    "tags": ["rain", "speed"]
  },
  "Hearthguard": {
    "category": "General",
    "description": "Allies take 25% less burn damage while this Pokémon is active.",
    "tags": ["ally", "burn"]
  },
  "GrudgeEngine": {
    "category": "General",
    "description": "When an ally faints, this Pokémon’s next attack is a guaranteed critical hit.",
    "tags": ["ally", "crit"]
  },
  "SpiritTether": {
    "category": "General",
    "description": "If this Pokémon is KO’d, its ally restores 50% of its max HP.",
    "tags": ["death", "ally-heal"]
  },
  "OzoneLayer": {
    "category": "General",
    "description": "Flying-type moves against this Pokémon deal 25% less damage.",
    "tags": ["flying-resist"]
  },
  "AetherSkin": {
    "category": "General",
    "description": "Dragon moves used by this Pokémon ignore stat boosts on the target’s Sp. Def.",
    "tags": ["dragon", "breaker"]
  },
  "GloomWard": {
    "category": "General",
    "description": "This Pokémon cannot be confused or put to sleep.",
    "tags": ["status-immunity"]
  },
  "GaugeThrottle": {
    "category": "Link",
    "description": "When any move on your side fails due to immunity, Protect/Detect, or Substitute, your side gains +1 Link (max once per turn).",
    "tags": ["link", "failure", "protect", "substitute"]
  },
  "ClutchMeter": {
    "category": "Link",
    "description": "If this Pokémon acts last among all four battlers this turn, gain +1 Link.",
    "tags": ["link", "turn-order"]
  },
  "FuseSpark": {
    "category": "Link",
    "description": "The first time per battle both partners hit the same foe with different types that are each super-effective, gain +2 Link.",
    "tags": ["link", "type-synergy", "super-effective"]
  },
  "OverchargeCycle": {
    "category": "Link",
    "description": "Two-turn moves from this Pokémon contribute +1 Link at each phase (charge + release).",
    "tags": ["link", "two-turn", "charge"]
  },
  "BackdraftClause": {
    "category": "Link",
    "description": "If your Link move was reduced by Protect/Detect this turn, your side gets +2 Link after damage; your next Link move ignores Protect reduction (once per battle).",
    "tags": ["link", "protect", "link-bonus"]
  },
  "SynchronyTax": {
    "category": "Link",
    "description": "If both partners use the same move name in a turn, gain +1 Link and store a Sync counter. At 2 counters, your next Link move gets +20% BP, then counters clear.",
    "tags": ["link", "sync", "move-name"]
  },
  "LastAnchor": {
    "category": "Link",
    "description": "When your ally faints, immediately gain +2 Link.",
    "tags": ["link", "faint"]
  },
  "LinkSaver": {
    "category": "Link",
    "description": "After your side uses a Link move, refund 2 PP to each contributor’s last used move.",
    "tags": ["link", "pp", "economy"]
  },
  "Coalescence": {
    "category": "Link",
    "description": "If both partners hit different foes in the same turn, gain +1 Link.",
    "tags": ["link", "split-targeting"]
  },
  "MeterShield": {
    "category": "Link",
    "description": "If this Pokémon flinches or is fully paralyzed, gain +1 Link (once per turn).",
    "tags": ["link", "flinch", "paralysis"]
  },
  "LinkPivot": {
    "category": "Link",
    "description": "After your side uses a Link move, this Pokémon may switch out at end of turn ignoring trapping (once per battle).",
    "tags": ["link", "pivot", "switch"]
  },
  "FuseInsurance": {
    "category": "Link",
    "description": "If your side fails to launch a Link move because one contributor couldn’t act, carry +2 Link into next turn.",
    "tags": ["link", "fail-safe"]
  },
  "SelectiveFire": {
    "category": "Doubles",
    "description": "Your spread moves don’t hit your ally and deal 0.85× to foes instead of the usual 0.75× spread penalty.",
    "tags": ["spread", "ally-safe"]
  },
  "AngleShot": {
    "category": "Doubles",
    "description": "You may direct a spread move to focus on a single foe as two separate half-power hits.",
    "tags": ["spread", "retarget", "multi-hit"]
  },
  "CrossPriority": {
    "category": "Doubles",
    "description": "If your ally uses a +1 or higher priority move, your single-target move auto-retargets the other foe and gains +0.5 priority (acts after the ally).",
    "tags": ["priority", "retarget"]
  },
  "InterceptShell": {
    "category": "Doubles",
    "description": "The first enemy single-target status move aimed at your ally each turn is redirected to this Pokémon and negated.",
    "tags": ["redirect", "status"]
  },
  "Foil": {
    "category": "Doubles",
    "description": "For enemy team-wide stat-drop moves (e.g., Snarl), your ally is immune; this Pokémon takes the drop at 2× the magnitude instead.",
    "tags": ["stat-drop", "redirection"]
  },
  "Blindside": {
    "category": "Doubles",
    "description": "Your damaging moves ignore positive Evasion on targets.",
    "tags": ["accuracy", "evasion"]
  },
  "PanelBreaker": {
    "category": "Doubles",
    "description": "Damage you deal with spread moves ignores Reflect and Light Screen.",
    "tags": ["screens", "spread"]
  },
  "BacklineGuard": {
    "category": "Doubles",
    "description": "Enemy moves cannot critically hit your ally while this Pokémon is active.",
    "tags": ["anti-crit", "spread"]
  },
  "QuietZone": {
    "category": "Doubles",
    "description": "If last turn neither you nor your ally used a sound move, opponents can’t use sound moves this turn.",
    "tags": ["sound", "lockout"]
  },
  "TandemAim": {
    "category": "Doubles",
    "description": "When you and your ally target the same foe, your move ignores move-based redirection (Follow Me/Rage Powder).",
    "tags": ["redirection", "focus-fire"]
  },
  "Symmetry": {
    "category": "Items/PP",
    "description": "When this Pokémon consumes a Berry, the ally gains the same effect without consuming an item.",
    "tags": ["berry", "ally-share"]
  },
  "Stash": {
    "category": "Items/PP",
    "description": "When your ally consumes a Berry, this Pokémon creates a one-use copy as its new held item if it is itemless.",
    "tags": ["berry", "item-copy"]
  },
  "CarryOver": {
    "category": "Items/PP",
    "description": "On fainting, this Pokémon hands its held item to the ally (ally must be itemless).",
    "tags": ["item-pass", "faint"]
  },
  "CooldownCover": {
    "category": "Items/PP",
    "description": "If this Pokémon must recharge next turn (Hyper Beam-style), the ally gains flinch immunity and +1 priority on status moves for that turn.",
    "tags": ["recharge", "support", "priority"]
  },
  "AmmoShare": {
    "category": "Items/PP",
    "description": "When a move on this Pokémon hits 0 PP, if the ally knows the same move, steal 2 PP from theirs; otherwise grant +1 Link.",
    "tags": ["pp", "share", "link"]
  },
  "RecoilBond": {
    "category": "Items/PP",
    "description": "Recoil damage taken by this Pokémon heals the ally for the same amount.",
    "tags": ["recoil", "ally-heal"]
  },
  "KnockGuard": {
    "category": "Items/PP",
    "description": "While this Pokémon is active, the ally’s item cannot be removed by opposing effects (can still be consumed).",
    "tags": ["item-protect"]
  },
  "ContactCharge": {
    "category": "Items/PP",
    "description": "When hit by a contact move, the attacker loses 1 PP for that move and your ally’s next move this turn deals +10% (once per turn).",
    "tags": ["contact", "pp-drain", "ally-buff"]
  },
  "TagCleanse": {
    "category": "Status",
    "description": "End of turn, remove one random volatile condition from the ally (Leech Seed, Encore, Taunt, Torment, Disable, partial-trap).",
    "tags": ["cleanse", "ally"]
  },
  "SharedNerves": {
    "category": "Status",
    "description": "If the ally flinches, this Pokémon becomes immune to flinch for the rest of the battle and you gain +1 Link (once per battle).",
    "tags": ["flinch", "link"]
  },
  "CrossfireBurn": {
    "category": "Status",
    "description": "When you burn a foe, the other foe’s physical moves deal 20% less next turn.",
    "tags": ["burn", "debuff"]
  },
  "LagShock": {
    "category": "Status",
    "description": "When you paralyze a foe, the other foe’s next move has its priority reduced by 1 (min –7).",
    "tags": ["paralysis", "priority"]
  },
  "AntibodyRelay": {
    "category": "Status",
    "description": "When you cure yourself of a major status, cure the ally of the same status.",
    "tags": ["status", "ally-share"]
  },
  "SplitAgony": {
    "category": "Status",
    "description": "If this Pokémon becomes badly poisoned, convert it to regular poison and apply regular poison to the ally instead (once per battle).",
    "tags": ["poison", "distribution"]
  },
  "DrowsyGuard": {
    "category": "Status",
    "description": "While this Pokémon is asleep, the ally takes 30% less damage.",
    "tags": ["sleep", "ally-guard"]
  },
  "Withstand": {
    "category": "Status",
    "description": "If the ally would be KO’d by end-of-turn effects (poison/burn/Leech Seed), leave it at 1 HP instead (once per battle).",
    "tags": ["sash", "end-of-turn"]
  },
  "MirrorFocus": {
    "category": "Misc",
    "description": "If the ally uses a charge or semi-invulnerable move this turn, your move ignores accuracy/evasion stage changes and weather accuracy penalties; also multiplies your move’s base accuracy by 1.2. Does not affect OHKO moves and does not grant perfect accuracy.",
    "tags": ["accuracy", "charge-synergy"]
  },
  "SlipCover": {
    "category": "Misc",
    "description": "If the ally used Protect/Detect this turn, your single-target damaging move becomes a non-ally-hitting spread at 0.75×.",
    "tags": ["protect", "spread"]
  },
  "ThreatMatrix": {
    "category": "Misc (Nerfed)",
    "description": "When an opposing Pokémon targets your ally with the same move two turns in a row, the second attempt against your ally fails. Does not affect spread or field moves.",
    "tags": ["targeting", "lockout"]
  },
  "ThreeHitWonder": {
    "category": "Misc",
    "description": "Multi-hit moves used by this Pokémon that normally strike 2 times hit exactly 3 times.",
    "tags": ["signature", "multi-hit"]
  },
  "GladiatorSSpirit": {
    "category": "Doubles",
    "description": "After this Pokémon knocks out a foe, raise its Defense by 1 and grant the ally 1/16 max HP at end of turn.",
    "tags": ["on-KO", "defense", "ally-heal"]
  },
  "Duelist": {
    "category": "Doubles",
    "description": "This Pokémon deals 20% more damage if only one opposing Pokémon remains on the field.",
    "tags": ["endgame", "damage"]
  },
  "SpectatorSRoar": {
    "category": "Doubles",
    "description": "When this Pokémon lands a critical hit, both it and its ally gain +1 Speed (once per turn).",
    "tags": ["crit", "speed", "ally-buff"]
  },
  "Intimidate": {
    "category": "General",
    "description": "On switch-in, lowers the Attack of all adjacent foes by 1 stage.",
    "tags": ["attack-drop", "entry"]
  },
  "Levitate": {
    "category": "General",
    "description": "This Pokémon is immune to Ground-type moves.",
    "tags": ["ground-immunity"]
  },
  "Sturdy": {
    "category": "General",
    "description": "Cannot be knocked out by a single hit if at full HP. Immune to OHKO moves.",
    "tags": ["survival", "ohko-immunity"]
  },
  "FlashFire": {
    "category": "General",
    "description": "Immune to Fire moves. If hit by one, Fire-type moves deal 1.5× damage.",
    "tags": ["fire-immunity", "fire-boost"]
  },
  "WaterAbsorb": {
    "category": "General",
    "description": "Immune to Water moves. If hit by one, restores 25% max HP.",
    "tags": ["water-immunity", "heal"]
  },
  "VoltAbsorb": {
    "category": "General",
    "description": "Immune to Electric moves. If hit by one, restores 25% max HP.",
    "tags": ["electric-immunity", "heal"]
  },
  "Guts": {
    "category": "General",
    "description": "Boosts Attack by 50% if the Pokémon has a status condition.",
    "tags": ["status", "attack-boost"]
  },
  "HugePower": {
    "category": "General",
    "description": "Doubles the Pokémon's Attack stat.",
    "tags": ["attack-boost"]
  },
  "MagicGuard": {
    "category": "General",
    "description": "The Pokémon only takes damage from direct attacks.",
    "tags": ["chip-immunity"]
  },
  "SereneGrace": {
    "category": "General",
    "description": "Doubles the chance of moves' secondary effects occurring.",
    "tags": ["sec-chance"]
  },
  "Technician": {
    "category": "General",
    "description": "Powers up moves with 60 BP or less by 50%.",
    "tags": ["damage-boost"]
  },
  "Moxie": {
    "category": "General",
    "description": "Boosts Attack by 1 stage after knocking out a Pokémon.",
    "tags": ["snowball", "attack-boost"]
  },
  "Regenerator": {
    "category": "General",
    "description": "Restores 1/3 of max HP when switching out.",
    "tags": ["switch", "heal"]
  },
  "Multiscale": {
    "category": "General",
    "description": "Reduces damage taken by 50% when at full HP.",
    "tags": ["defense", "fullhp"]
  }
};
