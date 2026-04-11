
export interface LearnsetAddition {
    move: string;
    level: number;
}

export interface PokemonAssignment {
    pokemon: string;
    availability: 'early' | 'mid' | 'late';
    abilities_new: string[];
    learnset_additions: LearnsetAddition[];
}

export const POKEMON_ASSIGNMENTS: PokemonAssignment[] = [
    {
      "pokemon": "Farfetch’d",
      "availability": "early",
      "abilities_new": ["Wardrum", "Slipstream"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 18 },
        { "move": "Flying Surge of Spiral Dive", "level": 22 },
        { "move": "Crosswind", "level": 32 }
      ]
    },
    {
      "pokemon": "Delibird",
      "availability": "early",
      "abilities_new": ["Jetstream", "HotBlooded"],
      "learnset_additions": [
        { "move": "Ice Shard", "level": 16 },
        { "move": "Ice Torrent of Biting Cold", "level": 24 },
        { "move": "Swarm Storm", "level": 30 }
      ]
    },
    {
      "pokemon": "Luvdisc",
      "availability": "early",
      "abilities_new": ["WhirlpoolHeart", "Shoreline"],
      "learnset_additions": [
        { "move": "Water Wave", "level": 12 },
        { "move": "Water Wave of Foaming Tide", "level": 18 }
      ]
    },
    {
      "pokemon": "Dunsparce",
      "availability": "mid",
      "abilities_new": ["StoneVeil", "RuneWard"],
      "learnset_additions": [
        { "move": "Rock Wave of Falling Scree", "level": 20 },
        { "move": "Ground Surge of Muddy Surge", "level": 24 }
      ]
    },
    {
      "pokemon": "Sunflora",
      "availability": "mid",
      "abilities_new": ["Photosynth", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 14 }
      ]
    },
    {
      "pokemon": "Ariados",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "RazorTread"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 18 }
      ]
    },
    {
      "pokemon": "Ledian",
      "availability": "mid",
      "abilities_new": ["SoundChannel", "LuckyBark"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 14 },
        { "move": "Bug Torrent of Hive Surge", "level": 18 },
        { "move": "Swarm Storm", "level": 32 }
      ]
    },
    {
      "pokemon": "Corsola",
      "availability": "mid",
      "abilities_new": ["Shellblood", "SpiritTether"],
      "learnset_additions": [
        { "move": "Rock Wave of Falling Scree", "level": 18 }
      ]
    },
    {
      "pokemon": "Stantler",
      "availability": "mid",
      "abilities_new": ["Slipstream", "GavePact"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 16 }
      ]
    },
    {
      "pokemon": "Parasect",
      "availability": "early",
      "abilities_new": ["AmberCore", "RazorTread"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 18 }
      ]
    },
    {
      "pokemon": "Snorlax",
      "availability": "late",
      "abilities_new": ["ShieldWall", "HeavyStance"],
      "learnset_additions": [
        { "move": "Shield Bash", "level": 30 }
      ]
    },
    {
      "pokemon": "Porygon-Z",
      "availability": "late",
      "abilities_new": ["EnergyCore", "BatteryPack"],
      "learnset_additions": [
        { "move": "Gauge Drain", "level": 35 }
      ]
    },
    {
      "pokemon": "Steelix",
      "availability": "mid",
      "abilities_new": ["Vanguard", "HeavyStance"],
      "learnset_additions": [
        { "move": "Shield Bash", "level": 25 }
      ]
    },
    {
      "pokemon": "Garchomp",
      "availability": "late",
      "abilities_new": ["TremorSense", "Counterweight"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 44 },
        { "move": "Dragon Torrent of Scaled Fury", "level": 48 }
      ]
    },
    {
      "pokemon": "Dragonite",
      "availability": "late",
      "abilities_new": ["Jetstream", "AetherSkin"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 62 },
        { "move": "Flying Torrent of Spiral Dive", "level": 48 }
      ]
    },
    {
      "pokemon": "Tyranitar",
      "availability": "late",
      "abilities_new": ["StoneHarvest", "RuneDrive"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 55 },
        { "move": "Rock Wave of Falling Scree", "level": 65 }
      ]
    },
    {
      "pokemon": "Heatran",
      "availability": "late",
      "abilities_new": ["ResinCoat", "BoilingPoint"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 50 }
      ]
    },
    {
      "pokemon": "Ferrothorn",
      "availability": "mid",
      "abilities_new": ["SourSap", "ThornField"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 30 }
      ]
    },
    {
      "pokemon": "Landorus-Therian",
      "availability": "late",
      "abilities_new": ["BlindingSand", "Counterweight"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 44 }
      ]
    },
    {
      "pokemon": "Greninja",
      "availability": "mid",
      "abilities_new": ["Overclock", "SmogLung"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 36 }
      ]
    },
    {
      "pokemon": "Dragapult",
      "availability": "late",
      "abilities_new": ["PiercingWill", "Jetstream"],
      "learnset_additions": [
        { "move": "Gravebind", "level": 48 },
        { "move": "Aether Roar", "level": 60 }
      ]
    },
    {
      "pokemon": "Clefable",
      "availability": "mid",
      "abilities_new": ["RuneBloom", "GloomWard"],
      "learnset_additions": [
        { "move": "Fairy Torrent of Pixie Flit", "level": 34 }
      ]
    },
    {
      "pokemon": "Zigzagoon",
      "availability": "early",
      "abilities_new": ["HarmonyEngine", "LuckyBark"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 10 }
      ]
    },
    {
      "pokemon": "Pidgey",
      "availability": "early",
      "abilities_new": ["Jetstream", "Slipstream"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 12 }
      ]
    },
    {
      "pokemon": "Rattata",
      "availability": "early",
      "abilities_new": ["Overclock", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 14 }
      ]
    },
    {
      "pokemon": "Caterpie",
      "availability": "early",
      "abilities_new": ["PollenSurge", "AmberCore"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 8 }
      ]
    },
    {
      "pokemon": "Weedle",
      "availability": "early",
      "abilities_new": ["VenomousAura", "RazorTread"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 8 }
      ]
    },
    {
      "pokemon": "Poochyena",
      "availability": "early",
      "abilities_new": ["SyncPulse", "LuckyBark"],
      "learnset_additions": [
        { "move": "Dark Wave", "level": 12 }
      ]
    },
    {
      "pokemon": "Wingull",
      "availability": "early",
      "abilities_new": ["SyncBoost", "Jetstream"],
      "learnset_additions": [
        { "move": "Water Wave", "level": 10 }
      ]
    },
    {
      "pokemon": "Lotad",
      "availability": "early",
      "abilities_new": ["SyncPulse", "RainDishPlus"],
      "learnset_additions": [
        { "move": "Water Wave", "level": 10 }
      ]
    },
    {
      "pokemon": "Seedot",
      "availability": "early",
      "abilities_new": ["SyncBoost", "ChlorophyllPlus"],
      "learnset_additions": [
        { "move": "Grass Surge", "level": 10 }
      ]
    },
    {
      "pokemon": "Zigzagoon",
      "availability": "early",
      "abilities_new": ["HarmonyEngine", "LuckyBark"],
      "learnset_additions": [
        { "move": "Lucky Bark", "level": 5 }
      ]
    },
    {
      "pokemon": "Taillow",
      "availability": "early",
      "abilities_new": ["SyncPulse", "Jetstream"],
      "learnset_additions": [
        { "move": "Crosswind", "level": 15 }
      ]
    },
    {
      "pokemon": "Shroomish",
      "availability": "early",
      "abilities_new": ["SyncBoost", "GrassSurge"],
      "learnset_additions": [
        { "move": "Grass Surge", "level": 12 }
      ]
    },
    {
      "pokemon": "Slakoth",
      "availability": "early",
      "abilities_new": ["SyncShield", "LuckyBark"],
      "learnset_additions": [
        { "move": "Lucky Bark", "level": 8 }
      ]
    },
    {
      "pokemon": "Whismur",
      "availability": "early",
      "abilities_new": ["Amplifier", "SoundChannel"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 20 }
      ]
    },
    {
      "pokemon": "Makuhita",
      "availability": "early",
      "abilities_new": ["Battery", "Wardrum"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 18 }
      ]
    },
    {
      "pokemon": "Ralts",
      "availability": "early",
      "abilities_new": ["SyncShield", "Resonance"],
      "learnset_additions": [
        { "move": "Mind Fracture", "level": 15 }
      ]
    },
    {
      "pokemon": "Nincada",
      "availability": "early",
      "abilities_new": ["SyncPulse", "RazorTread"],
      "learnset_additions": [
        { "move": "Swarm Storm", "level": 10 }
      ]
    },
    {
      "pokemon": "Aron",
      "availability": "early",
      "abilities_new": ["Battery", "Ironstorm"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 15 }
      ]
    },
    {
      "pokemon": "Scizor",
      "availability": "mid",
      "abilities_new": ["BladeDance", "ArmorMelt"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 36 }
      ]
    },
    {
      "pokemon": "Pidgeot",
      "availability": "mid",
      "abilities_new": ["Jetstream", "Slipstream"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 36 },
        { "move": "Crosswind", "level": 42 }
      ]
    },
    {
      "pokemon": "Arcanine",
      "availability": "mid",
      "abilities_new": ["ArcSurge", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 45 }
      ]
    },
    {
      "pokemon": "Gyarados",
      "availability": "mid",
      "abilities_new": ["HeavyStance", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 40 }
      ]
    },
    {
      "pokemon": "Pikachu",
      "availability": "early",
      "abilities_new": ["LagShock", "ContactCharge"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 26 }
      ]
    },
    {
      "pokemon": "Raichu",
      "availability": "mid",
      "abilities_new": ["LagShock", "Overclock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    },
    {
      "pokemon": "Charizard",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 36 }
      ]
    },
    {
      "pokemon": "Blastoise",
      "availability": "mid",
      "abilities_new": ["InterceptShell", "Foil"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 36 }
      ]
    },
    {
      "pokemon": "Venusaur",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 36 }
      ]
    },
    {
      "pokemon": "Alakazam",
      "availability": "mid",
      "abilities_new": ["MindFracture", "SyncPulse"],
      "learnset_additions": [
        { "move": "Mind Fracture", "level": 36 }
      ]
    },
    {
      "pokemon": "Machamp",
      "availability": "mid",
      "abilities_new": ["ThreeHitWonder", "Duelist"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 36 }
      ]
    },
    {
      "pokemon": "Gengar",
      "availability": "mid",
      "abilities_new": ["GavePact", "HollowEcho"],
      "learnset_additions": [
        { "move": "Gravebind", "level": 36 }
      ]
    },
    {
      "pokemon": "Snorlax",
      "availability": "mid",
      "abilities_new": ["HeavyStance", "BacklineGuard"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 35 }
      ]
    },
    {
      "pokemon": "Mewtwo",
      "availability": "late",
      "abilities_new": ["AetherRoar", "PressurePoint"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 70 }
      ]
    },
    {
      "pokemon": "Umbreon",
      "availability": "mid",
      "abilities_new": ["QuietZone", "ShadowShield"],
      "learnset_additions": [
        { "move": "Dark Wave", "level": 25 }
      ]
    },
    {
      "pokemon": "Espeon",
      "availability": "mid",
      "abilities_new": ["SyncPulse", "MirrorFocus"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 25 }
      ]
    },
    {
      "pokemon": "Lucario",
      "availability": "mid",
      "abilities_new": ["DuelistSWill", "SyncStrike"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 32 }
      ]
    },
    {
      "pokemon": "Zoroark",
      "availability": "mid",
      "abilities_new": ["Blindside", "SlipCover"],
      "learnset_additions": [
        { "move": "Dark Wave", "level": 30 }
      ]
    },
    {
      "pokemon": "Gardevoir",
      "availability": "mid",
      "abilities_new": ["SoulResonance", "RuneBloom"],
      "learnset_additions": [
        { "move": "Soul Resonance", "level": 30 }
      ]
    },
    {
      "pokemon": "Gallade",
      "availability": "mid",
      "abilities_new": ["BladeDance", "Duelist"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 30 }
      ]
    },
    {
      "pokemon": "Metagross",
      "availability": "late",
      "abilities_new": ["ThreatMatrix", "ArmorMelt"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 45 }
      ]
    },
    {
      "pokemon": "Salamence",
      "availability": "late",
      "abilities_new": ["AetherRoar", "Jetstream"],
      "learnset_additions": [
        { "move": "Dragon Torrent of Scaled Fury", "level": 50 }
      ]
    },
    {
      "pokemon": "Volcarona",
      "availability": "late",
      "abilities_new": ["KeenFlare", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Swarm Storm", "level": 59 }
      ]
    },
    {
      "pokemon": "Toxapex",
      "availability": "mid",
      "abilities_new": ["VenomousAura", "Shellblood"],
      "learnset_additions": [
        { "move": "Water Wave", "level": 20 }
      ]
    },
    {
      "pokemon": "Corviknight",
      "availability": "mid",
      "abilities_new": ["InterceptShell", "Foil"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 38 }
      ]
    },
    {
      "pokemon": "Meowscarada",
      "availability": "mid",
      "abilities_new": ["SelectiveFire", "SlipCover"],
      "learnset_additions": [
        { "move": "Grass Surge", "level": 36 }
      ]
    },
    {
      "pokemon": "Skeledirge",
      "availability": "mid",
      "abilities_new": ["CavernRoar", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 36 }
      ]
    },
    {
      "pokemon": "Quaquaval",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Water Wave", "level": 36 }
      ]
    },
    {
      "pokemon": "Beedrill",
      "availability": "early",
      "abilities_new": ["RazorTread", "ThreeHitWonder"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 10 }
      ]
    },
    {
      "pokemon": "Butterfree",
      "availability": "early",
      "abilities_new": ["PollenSurge", "CompoundEyes"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 10 }
      ]
    },
    {
      "pokemon": "Arbok",
      "availability": "early",
      "abilities_new": ["VenomousAura", "DecayTouch"],
      "learnset_additions": [
        { "move": "Poison Torrent of Toxic Spume", "level": 22 }
      ]
    },
    {
      "pokemon": "Sandslash",
      "availability": "early",
      "abilities_new": ["BlindingSand", "RazorTread"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 22 }
      ]
    },
    {
      "pokemon": "Ninetales",
      "availability": "mid",
      "abilities_new": ["SolarGuard", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 1 }
      ]
    },
    {
      "pokemon": "Vileplume",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Dugtrio",
      "availability": "mid",
      "abilities_new": ["TremorSense", "AngleShot"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 26 }
      ]
    },
    {
      "pokemon": "Persian",
      "availability": "mid",
      "abilities_new": ["SelectiveFire", "LuckyBark"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 28 }
      ]
    },
    {
      "pokemon": "Golduck",
      "availability": "mid",
      "abilities_new": ["SyncPulse", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 33 }
      ]
    },
    {
      "pokemon": "Primeape",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 28 }
      ]
    },
    {
      "pokemon": "Poliwrath",
      "availability": "mid",
      "abilities_new": ["Battery", "Wardrum"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Victreebel",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Tentacruel",
      "availability": "mid",
      "abilities_new": ["VenomousAura", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 30 }
      ]
    },
    {
      "pokemon": "Golem",
      "availability": "mid",
      "abilities_new": ["HeavyStance", "BasaltBurst"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 34 }
      ]
    },
    {
      "pokemon": "Rapidash",
      "availability": "mid",
      "abilities_new": ["Jetstream", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 40 }
      ]
    },
    {
      "pokemon": "Slowbro",
      "availability": "mid",
      "abilities_new": ["SlowPulse", "QuietZone"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 37 }
      ]
    },
    {
      "pokemon": "Magneton",
      "availability": "mid",
      "abilities_new": ["ContactCharge", "ArcSurge"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 30 }
      ]
    },
    {
      "pokemon": "Dodrio",
      "availability": "mid",
      "abilities_new": ["ThreeHitWonder", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 31 }
      ]
    },
    {
      "pokemon": "Dewgong",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 34 }
      ]
    },
    {
      "pokemon": "Muk",
      "availability": "mid",
      "abilities_new": ["DecayTouch", "SmogLung"],
      "learnset_additions": [
        { "move": "Poison Torrent of Toxic Spume", "level": 38 }
      ]
    },
    {
      "pokemon": "Cloyster",
      "availability": "mid",
      "abilities_new": ["ShellArmor", "ThreeHitWonder"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Hypno",
      "availability": "mid",
      "abilities_new": ["MindFracture", "QuietZone"],
      "learnset_additions": [
        { "move": "Mind Fracture", "level": 26 }
      ]
    },
    {
      "pokemon": "Kingler",
      "availability": "mid",
      "abilities_new": ["PanelBreaker", "Shellblood"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 28 }
      ]
    },
    {
      "pokemon": "Electrode",
      "availability": "mid",
      "abilities_new": ["Overclock", "LagShock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 30 }
      ]
    },
    {
      "pokemon": "Exeggutor",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "SyncPulse"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Marowak",
      "availability": "mid",
      "abilities_new": ["GravePact", "Counterweight"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 28 }
      ]
    },
    {
      "pokemon": "Hitmonlee",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 20 }
      ]
    },
    {
      "pokemon": "Hitmonchan",
      "availability": "mid",
      "abilities_new": ["ThreeHitWonder", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 20 }
      ]
    },
    {
      "pokemon": "Lickitung",
      "availability": "mid",
      "abilities_new": ["LuckyBark", "HeavyStance"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Weezing",
      "availability": "mid",
      "abilities_new": ["SmogLung", "QuietZone"],
      "learnset_additions": [
        { "move": "Poison Torrent of Toxic Spume", "level": 35 }
      ]
    },
    {
      "pokemon": "Rhydon",
      "availability": "mid",
      "abilities_new": ["SolidRock", "BasaltBurst"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 42 }
      ]
    },
    {
      "pokemon": "Chansey",
      "availability": "mid",
      "abilities_new": ["BacklineGuard", "LuckyBark"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Tangela",
      "availability": "mid",
      "abilities_new": ["SourSap", "Regenerator"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Kangaskhan",
      "availability": "mid",
      "abilities_new": ["AmmoShare", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 22 }
      ]
    },
    {
      "pokemon": "Seaking",
      "availability": "mid",
      "abilities_new": ["WhirlpoolHeart", "Shoreline"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 33 }
      ]
    },
    {
      "pokemon": "Starmie",
      "availability": "mid",
      "abilities_new": ["SyncPulse", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Mr. Mime",
      "availability": "mid",
      "abilities_new": ["MirrorFocus", "QuietZone"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 1 }
      ]
    },
    {
      "pokemon": "Jynx",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "MindFracture"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Electabuzz",
      "availability": "mid",
      "abilities_new": ["ContactCharge", "LagShock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 30 }
      ]
    },
    {
      "pokemon": "Magmar",
      "availability": "mid",
      "abilities_new": ["BoilingPoint", "CrossfireBurn"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 30 }
      ]
    },
    {
      "pokemon": "Pinsir",
      "availability": "mid",
      "abilities_new": ["BladeDance", "PanelBreaker"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 21 }
      ]
    },
    {
      "pokemon": "Tauros",
      "availability": "mid",
      "abilities_new": ["RecklessTempo", "HotBlooded"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Lapras",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Ditto",
      "availability": "mid",
      "abilities_new": ["TypeTwist", "SyncBoost"],
      "learnset_additions": []
    },
    {
      "pokemon": "Eevee",
      "availability": "early",
      "abilities_new": ["HarmonyEngine", "SyncPulse"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Vaporeon",
      "availability": "mid",
      "abilities_new": ["WhirlpoolHeart", "Shoreline"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Jolteon",
      "availability": "mid",
      "abilities_new": ["LagShock", "Overclock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    },
    {
      "pokemon": "Flareon",
      "availability": "mid",
      "abilities_new": ["CrossfireBurn", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 1 }
      ]
    },
    {
      "pokemon": "Porygon",
      "availability": "mid",
      "abilities_new": ["Overclock", "SyncPulse"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Omastar",
      "availability": "mid",
      "abilities_new": ["Shellblood", "AngleShot"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 40 }
      ]
    },
    {
      "pokemon": "Kabutops",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RazorTread"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 40 }
      ]
    },
    {
      "pokemon": "Aerodactyl",
      "availability": "mid",
      "abilities_new": ["Jetstream", "AngleShot"],
      "learnset_additions": [
        { "move": "Rock Wave of Falling Scree", "level": 1 }
      ]
    },
    {
      "pokemon": "Articuno",
      "availability": "late",
      "abilities_new": ["BorealCoat", "QuietZone"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 50 }
      ]
    },
    {
      "pokemon": "Zapdos",
      "availability": "late",
      "abilities_new": ["LagShock", "QuietZone"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 50 }
      ]
    },
    {
      "pokemon": "Moltres",
      "availability": "late",
      "abilities_new": ["CrossfireBurn", "QuietZone"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 50 }
      ]
    },
    {
      "pokemon": "Mew",
      "availability": "late",
      "abilities_new": ["SyncBoost", "HarmonyEngine"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Meganium",
      "availability": "mid",
      "abilities_new": ["Lifebloom", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 32 }
      ]
    },
    {
      "pokemon": "Typhlosion",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "CrossfireBurn"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 36 }
      ]
    },
    {
      "pokemon": "Feraligatr",
      "availability": "mid",
      "abilities_new": ["BladeDance", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 30 }
      ]
    },
    {
      "pokemon": "Noctowl",
      "availability": "early",
      "abilities_new": ["QuietZone", "MindFracture"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 20 }
      ]
    },
    {
      "pokemon": "Ampharos",
      "availability": "mid",
      "abilities_new": ["LagShock", "SyncPulse"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 30 }
      ]
    },
    {
      "pokemon": "Azumarill",
      "availability": "early",
      "abilities_new": ["ThickFat", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 18 }
      ]
    },
    {
      "pokemon": "Sudowoodo",
      "availability": "early",
      "abilities_new": ["StoneVeil", "HeavyStance"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 24 }
      ]
    },
    {
      "pokemon": "Politoed",
      "availability": "mid",
      "abilities_new": ["WhirlpoolHeart", "RainDishPlus"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Quagsire",
      "availability": "mid",
      "abilities_new": ["SiltArmor", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Steelix",
      "availability": "mid",
      "abilities_new": ["SolidRock", "HeavyStance"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 1 }
      ]
    },
    {
      "pokemon": "Heracross",
      "availability": "mid",
      "abilities_new": ["BladeDance", "PanelBreaker"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 25 }
      ]
    },
    {
      "pokemon": "Skarmory",
      "availability": "mid",
      "abilities_new": ["InterceptShell", "Foil"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 30 }
      ]
    },
    {
      "pokemon": "Houndoom",
      "availability": "mid",
      "abilities_new": ["CrossfireBurn", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 24 }
      ]
    },
    {
      "pokemon": "Kingdra",
      "availability": "mid",
      "abilities_new": ["SyncPulse", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Donphan",
      "availability": "mid",
      "abilities_new": ["HeavyStance", "BasaltBurst"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 25 }
      ]
    },
    {
      "pokemon": "Blissey",
      "availability": "mid",
      "abilities_new": ["BacklineGuard", "LuckyBark"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Raikou",
      "availability": "late",
      "abilities_new": ["LagShock", "Jetstream"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 40 }
      ]
    },
    {
      "pokemon": "Entei",
      "availability": "late",
      "abilities_new": ["CrossfireBurn", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 40 }
      ]
    },
    {
      "pokemon": "Suicune",
      "availability": "late",
      "abilities_new": ["WhirlpoolHeart", "QuietZone"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 40 }
      ]
    },
    {
      "pokemon": "Lugia",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 60 }
      ]
    },
    {
      "pokemon": "Ho-Oh",
      "availability": "late",
      "abilities_new": ["AetherRoar", "HotBlooded"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 60 }
      ]
    },
    {
      "pokemon": "Celebi",
      "availability": "late",
      "abilities_new": ["Lifebloom", "SyncPulse"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Sceptile",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RazorTread"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 36 }
      ]
    },
    {
      "pokemon": "Blaziken",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 36 }
      ]
    },
    {
      "pokemon": "Swampert",
      "availability": "mid",
      "abilities_new": ["SiltArmor", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 36 }
      ]
    },
    {
      "pokemon": "Breloom",
      "availability": "mid",
      "abilities_new": ["BladeDance", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 23 }
      ]
    },
    {
      "pokemon": "Slaking",
      "availability": "mid",
      "abilities_new": ["HeavyStance", "Duelist"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 36 }
      ]
    },
    {
      "pokemon": "Exploud",
      "availability": "mid",
      "abilities_new": ["CavernRoar", "Amplifier"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 40 }
      ]
    },
    {
      "pokemon": "Hariyama",
      "availability": "mid",
      "abilities_new": ["Battery", "Wardrum"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 24 }
      ]
    },
    {
      "pokemon": "Aggron",
      "availability": "mid",
      "abilities_new": ["SolidRock", "HeavyStance"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 42 }
      ]
    },
    {
      "pokemon": "Manectric",
      "availability": "mid",
      "abilities_new": ["LagShock", "Overclock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 26 }
      ]
    },
    {
      "pokemon": "Sharpedo",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 30 }
      ]
    },
    {
      "pokemon": "Wailord",
      "availability": "mid",
      "abilities_new": ["Foil", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 40 }
      ]
    },
    {
      "pokemon": "Camerupt",
      "availability": "mid",
      "abilities_new": ["BoilingPoint", "BasaltBurst"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 33 }
      ]
    },
    {
      "pokemon": "Torkoal",
      "availability": "mid",
      "abilities_new": ["SolarGuard", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 1 }
      ]
    },
    {
      "pokemon": "Flygon",
      "availability": "mid",
      "abilities_new": ["TremorSense", "AngleShot"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 45 }
      ]
    },
    {
      "pokemon": "Altaria",
      "availability": "mid",
      "abilities_new": ["AetherSkin", "QuietZone"],
      "learnset_additions": [
        { "move": "Dragon Torrent of Scaled Fury", "level": 35 }
      ]
    },
    {
      "pokemon": "Zangoose",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Seviper",
      "availability": "mid",
      "abilities_new": ["VenomousAura", "DecayTouch"],
      "learnset_additions": [
        { "move": "Poison Torrent of Toxic Spume", "level": 1 }
      ]
    },
    {
      "pokemon": "Milotic",
      "availability": "mid",
      "abilities_new": ["WhirlpoolHeart", "QuietZone"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Absol",
      "availability": "mid",
      "abilities_new": ["SuperLuck", "SlipCover"],
      "learnset_additions": [
        { "move": "Dark Wave", "level": 1 }
      ]
    },
    {
      "pokemon": "Walrein",
      "availability": "mid",
      "abilities_new": ["ThickFat", "BorealCoat"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 44 }
      ]
    },
    {
      "pokemon": "Regirock",
      "availability": "late",
      "abilities_new": ["SolidRock", "HeavyStance"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 1 }
      ]
    },
    {
      "pokemon": "Regice",
      "availability": "late",
      "abilities_new": ["BorealCoat", "QuietZone"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Registeel",
      "availability": "late",
      "abilities_new": ["Filter", "InterceptShell"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 1 }
      ]
    },
    {
      "pokemon": "Latias",
      "availability": "late",
      "abilities_new": ["SyncPulse", "AetherRoar"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 40 }
      ]
    },
    {
      "pokemon": "Latios",
      "availability": "late",
      "abilities_new": ["SyncPulse", "AetherRoar"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 40 }
      ]
    },
    {
      "pokemon": "Kyogre",
      "availability": "late",
      "abilities_new": ["WhirlpoolHeart", "QuietZone"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 50 }
      ]
    },
    {
      "pokemon": "Groudon",
      "availability": "late",
      "abilities_new": ["SolarGuard", "QuietZone"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 50 }
      ]
    },
    {
      "pokemon": "Rayquaza",
      "availability": "late",
      "abilities_new": ["OzoneLayer", "QuietZone"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 50 }
      ]
    },
    {
      "pokemon": "Jirachi",
      "availability": "late",
      "abilities_new": ["SereneGrace", "SyncPulse"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 1 }
      ]
    },
    {
      "pokemon": "Deoxys",
      "availability": "late",
      "abilities_new": ["Overclock", "SyncPulse"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 1 }
      ]
    },
    {
      "pokemon": "Torterra",
      "availability": "mid",
      "abilities_new": ["RootedSpirit", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 32 }
      ]
    },
    {
      "pokemon": "Infernape",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "BladeDance"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 36 }
      ]
    },
    {
      "pokemon": "Empoleon",
      "availability": "mid",
      "abilities_new": ["InterceptShell", "Foil"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 36 }
      ]
    },
    {
      "pokemon": "Staraptor",
      "availability": "mid",
      "abilities_new": ["RecklessTempo", "Jetstream"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 34 }
      ]
    },
    {
      "pokemon": "Luxray",
      "availability": "mid",
      "abilities_new": ["ThreatMatrix", "LagShock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 30 }
      ]
    },
    {
      "pokemon": "Roserade",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Hippowdon",
      "availability": "mid",
      "abilities_new": ["BlindingSand", "HeavyStance"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 1 }
      ]
    },
    {
      "pokemon": "Drapion",
      "availability": "mid",
      "abilities_new": ["VenomousAura", "BladeDance"],
      "learnset_additions": [
        { "move": "Poison Torrent of Toxic Spume", "level": 1 }
      ]
    },
    {
      "pokemon": "Abomasnow",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "SourSap"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Weavile",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Magnezone",
      "availability": "mid",
      "abilities_new": ["ContactCharge", "ArcSurge"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    },
    {
      "pokemon": "Lickilicky",
      "availability": "mid",
      "abilities_new": ["LuckyBark", "HeavyStance"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Rhyperior",
      "availability": "mid",
      "abilities_new": ["SolidRock", "BasaltBurst"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 1 }
      ]
    },
    {
      "pokemon": "Tangrowth",
      "availability": "mid",
      "abilities_new": ["SourSap", "Regenerator"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Electivire",
      "availability": "mid",
      "abilities_new": ["ContactCharge", "LagShock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    },
    {
      "pokemon": "Magmortar",
      "availability": "mid",
      "abilities_new": ["BoilingPoint", "CrossfireBurn"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 1 }
      ]
    },
    {
      "pokemon": "Togekiss",
      "availability": "mid",
      "abilities_new": ["SereneGrace", "AetherSkin"],
      "learnset_additions": [
        { "move": "Fairy Torrent of Pixie Flit", "level": 1 }
      ]
    },
    {
      "pokemon": "Yanmega",
      "availability": "mid",
      "abilities_new": ["PollenSurge", "Overclock"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 1 }
      ]
    },
    {
      "pokemon": "Leafeon",
      "availability": "mid",
      "abilities_new": ["Lifebloom", "SourSap"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Glaceon",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "BorealCoat"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Gliscor",
      "availability": "mid",
      "abilities_new": ["TremorSense", "DecayTouch"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 1 }
      ]
    },
    {
      "pokemon": "Mamoswine",
      "availability": "mid",
      "abilities_new": ["ThickFat", "HeavyStance"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Porygon-Z",
      "availability": "mid",
      "abilities_new": ["Overclock", "SyncPulse"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Probopass",
      "availability": "mid",
      "abilities_new": ["MagneticField", "HeavyStance"],
      "learnset_additions": [
        { "move": "Rock Wave of Falling Scree", "level": 1 }
      ]
    },
    {
      "pokemon": "Dusknoir",
      "availability": "mid",
      "abilities_new": ["GravePact", "HollowEcho"],
      "learnset_additions": [
        { "move": "Gravebind", "level": 1 }
      ]
    },
    {
      "pokemon": "Froslass",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "SlipCover"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 1 }
      ]
    },
    {
      "pokemon": "Rotom",
      "availability": "mid",
      "abilities_new": ["LagShock", "Overclock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    },
    {
      "pokemon": "Dialga",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Palkia",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Giratina",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Darkrai",
      "availability": "late",
      "abilities_new": ["QuietZone", "Blindside"],
      "learnset_additions": [
        { "move": "Dark Wave", "level": 1 }
      ]
    },
    {
      "pokemon": "Shaymin",
      "availability": "late",
      "abilities_new": ["Lifebloom", "SyncPulse"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Arceus",
      "availability": "late",
      "abilities_new": ["HarmonyEngine", "SyncBoost"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Serperior",
      "availability": "mid",
      "abilities_new": ["SourSap", "BladeDance"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 36 }
      ]
    },
    {
      "pokemon": "Emboar",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 36 }
      ]
    },
    {
      "pokemon": "Samurott",
      "availability": "mid",
      "abilities_new": ["BladeDance", "WhirlpoolHeart"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 36 }
      ]
    },
    {
      "pokemon": "Stoutland",
      "availability": "early",
      "abilities_new": ["LuckyBark", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 32 }
      ]
    },
    {
      "pokemon": "Zebstrika",
      "availability": "early",
      "abilities_new": ["LagShock", "Overclock"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 27 }
      ]
    },
    {
      "pokemon": "Gigalith",
      "availability": "mid",
      "abilities_new": ["SolidRock", "HeavyStance"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 25 }
      ]
    },
    {
      "pokemon": "Excadrill",
      "availability": "mid",
      "abilities_new": ["RazorTread", "BlindingSand"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 31 }
      ]
    },
    {
      "pokemon": "Conkeldurr",
      "availability": "mid",
      "abilities_new": ["Duelist", "Wardrum"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 25 }
      ]
    },
    {
      "pokemon": "Krookodile",
      "availability": "mid",
      "abilities_new": ["TremorSense", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 40 }
      ]
    },
    {
      "pokemon": "Darmanitan",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 35 }
      ]
    },
    {
      "pokemon": "Sigilyph",
      "availability": "mid",
      "abilities_new": ["QuietZone", "AetherSkin"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 1 }
      ]
    },
    {
      "pokemon": "Reuniclus",
      "availability": "mid",
      "abilities_new": ["SyncPulse", "QuietZone"],
      "learnset_additions": [
        { "move": "Psychic Wave of Bending Thought", "level": 32 }
      ]
    },
    {
      "pokemon": "Chandelure",
      "availability": "mid",
      "abilities_new": ["HotBlooded", "GravePact"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 41 }
      ]
    },
    {
      "pokemon": "Haxorus",
      "availability": "mid",
      "abilities_new": ["BladeDance", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Dragon Torrent of Scaled Fury", "level": 48 }
      ]
    },
    {
      "pokemon": "Beartic",
      "availability": "mid",
      "abilities_new": ["BorealCoat", "HeavyStance"],
      "learnset_additions": [
        { "move": "Ice Torrent of Biting Cold", "level": 37 }
      ]
    },
    {
      "pokemon": "Bisharp",
      "availability": "mid",
      "abilities_new": ["BladeDance", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 52 }
      ]
    },
    {
      "pokemon": "Braviary",
      "availability": "mid",
      "abilities_new": ["Jetstream", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 54 }
      ]
    },
    {
      "pokemon": "Hydreigon",
      "availability": "late",
      "abilities_new": ["AetherRoar", "AngleShot"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 64 }
      ]
    },
    {
      "pokemon": "Cobalion",
      "availability": "late",
      "abilities_new": ["DuelistSWill", "SyncStrike"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 1 }
      ]
    },
    {
      "pokemon": "Terrakion",
      "availability": "late",
      "abilities_new": ["DuelistSWill", "SyncStrike"],
      "learnset_additions": [
        { "move": "Basalt Burst", "level": 1 }
      ]
    },
    {
      "pokemon": "Virizion",
      "availability": "late",
      "abilities_new": ["DuelistSWill", "SyncStrike"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Reshiram",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Zekrom",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Kyurem",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Keldeo",
      "availability": "late",
      "abilities_new": ["BladeDance", "SyncPulse"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Meloetta",
      "availability": "late",
      "abilities_new": ["HarmonyEngine", "SyncPulse"],
      "learnset_additions": [
        { "move": "Normal Wave of Quick Step", "level": 1 }
      ]
    },
    {
      "pokemon": "Genesect",
      "availability": "late",
      "abilities_new": ["Overclock", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Bug Torrent of Hive Surge", "level": 1 }
      ]
    },
    {
      "pokemon": "Talonflame",
      "availability": "mid",
      "abilities_new": ["GaleHarness", "Jetstream"],
      "learnset_additions": [
        { "move": "Flying Surge of Spiral Dive", "level": 35 }
      ]
    },
    {
      "pokemon": "Aegislash",
      "availability": "mid",
      "abilities_new": ["AegisField", "GuardianCore"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 1 }
      ]
    },
    {
      "pokemon": "Sylveon",
      "availability": "mid",
      "abilities_new": ["RuneBloom", "AetherSkin"],
      "learnset_additions": [
        { "move": "Fairy Torrent of Pixie Flit", "level": 1 }
      ]
    },
    {
      "pokemon": "Xerneas",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Yveltal",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Zygarde",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Ground Surge of Muddy Surge", "level": 1 }
      ]
    },
    {
      "pokemon": "Decidueye",
      "availability": "mid",
      "abilities_new": ["Blindside", "SelectiveFire"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 34 }
      ]
    },
    {
      "pokemon": "Incineroar",
      "availability": "mid",
      "abilities_new": ["Intimidate", "HotBlooded"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 34 }
      ]
    },
    {
      "pokemon": "Primarina",
      "availability": "mid",
      "abilities_new": ["WhirlpoolHeart", "SoundChannel"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 34 }
      ]
    },
    {
      "pokemon": "Mimikyu",
      "availability": "mid",
      "abilities_new": ["MysticHusk", "SlipCover"],
      "learnset_additions": [
        { "move": "Gravebind", "level": 1 }
      ]
    },
    {
      "pokemon": "Tapu Koko",
      "availability": "late",
      "abilities_new": ["SyncPulse", "AetherRoar"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    },
    {
      "pokemon": "Tapu Lele",
      "availability": "late",
      "abilities_new": ["SyncPulse", "AetherRoar"],
      "learnset_additions": [
        { "move": "Mind Fracture", "level": 1 }
      ]
    },
    {
      "pokemon": "Tapu Bulu",
      "availability": "late",
      "abilities_new": ["SyncPulse", "AetherRoar"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 1 }
      ]
    },
    {
      "pokemon": "Tapu Fini",
      "availability": "late",
      "abilities_new": ["SyncPulse", "AetherRoar"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 1 }
      ]
    },
    {
      "pokemon": "Solgaleo",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Lunala",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Necrozma",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Aether Roar", "level": 1 }
      ]
    },
    {
      "pokemon": "Rillaboom",
      "availability": "mid",
      "abilities_new": ["RootedSpirit", "Wardrum"],
      "learnset_additions": [
        { "move": "Grass Surge of Razor Leaves", "level": 35 }
      ]
    },
    {
      "pokemon": "Cinderace",
      "availability": "mid",
      "abilities_new": ["SelectiveFire", "RecklessTempo"],
      "learnset_additions": [
        { "move": "Emberlance", "level": 35 }
      ]
    },
    {
      "pokemon": "Inteleon",
      "availability": "mid",
      "abilities_new": ["SelectiveFire", "Overclock"],
      "learnset_additions": [
        { "move": "Water Wave of Foaming Tide", "level": 35 }
      ]
    },
    {
      "pokemon": "Zacian",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 1 }
      ]
    },
    {
      "pokemon": "Zamazenta",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 1 }
      ]
    },
    {
      "pokemon": "Eternatus",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Dragon Torrent of Scaled Fury", "level": 1 }
      ]
    },
    {
      "pokemon": "Tinkaton",
      "availability": "mid",
      "abilities_new": ["PanelBreaker", "HeavyStance"],
      "learnset_additions": [
        { "move": "Iron Waltz", "level": 38 }
      ]
    },
    {
      "pokemon": "Koraidon",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Fighting Snap of Driving Strike", "level": 1 }
      ]
    },
    {
      "pokemon": "Miraidon",
      "availability": "late",
      "abilities_new": ["AetherRoar", "QuietZone"],
      "learnset_additions": [
        { "move": "Arc Cannon", "level": 1 }
      ]
    }
];
