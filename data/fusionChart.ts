
export interface FusionMove {
    name: string;
    resultType: string;
    category: 'Physical' | 'Special' | 'Status';
    role: string;
    power: number;
    accuracy: number;
    target: string;
    gauge: number;
    secondary: string;
    signatureTwist?: string;
    notes?: string;
    meta?: any;
}

export const FUSION_CHART: Record<string, Record<string, FusionMove>> = {
    "normal": {
        "normal": { name: "Crash Rush Waltz", resultType: "normal", category: "Physical", role: "Multi-hit", power: 35, accuracy: 100, target: "Single", gauge: 100, secondary: "Multi-hit 2-3 times; 3 hits if Tailwind/Trick Room active" },
        "fire": { name: "Drive Kindle", resultType: "fire", category: "Physical", role: "Breaker", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "30% burn; +20 power if user is statused" },
        "water": { name: "Geyser Drive", resultType: "water", category: "Physical", role: "Field", power: 80, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Sets Rain 5T" },
        "electric": { name: "Burst Static Surge", resultType: "electric", category: "Special", role: "Field", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Sets Electric Terrain 5T; 20% Link refund on KO" },
        "grass": { name: "Verdant Bind", resultType: "grass", category: "Physical", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Inflicts Leech Seed; +20 power if already seeded" },
        "ice": { name: "Glacial Rush", resultType: "ice", category: "Physical", role: "Priority", power: 110, accuracy: 90, target: "Single", gauge: 100, secondary: "-1 Speed; +1 priority if user at full HP" },
        "fighting": { name: "Strike Rush", resultType: "fighting", category: "Physical", role: "Breaker", power: 110, accuracy: 95, target: "Single", gauge: 100, secondary: "Breaks screens; 1/4 recoil" },
        "poison": { name: "Echo Miasma", resultType: "poison", category: "Special", role: "Debuff", power: 80, accuracy: 100, target: "Both foes", gauge: 100, secondary: "30% poison; badly poison if target has boosts" },
        "ground": { name: "Faultline Drop", resultType: "ground", category: "Physical", role: "Utility", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Grounds the target" },
        "flying": { name: "Gale Sweep", resultType: "flying", category: "Physical", role: "Support", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Sets Tailwind 4T" },
        "psychic": { name: "Mind Lock", resultType: "psychic", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Quash effect" },
        "bug": { name: "Silk Snare", resultType: "bug", category: "Physical", role: "Field", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Sets Sticky Web" },
        "rock": { name: "Stone Uprising", resultType: "rock", category: "Physical", role: "Field", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Sets Stealth Rock" },
        "ghost": { name: "Wraith Rend", resultType: "ghost", category: "Physical", role: "Control", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "Heal Block 2T" },
        "dragon": { name: "Echo of Fang", resultType: "dragon", category: "Special", role: "Support", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Heals ally for 25% damage dealt" },
        "dark": { name: "DriveShade", resultType: "dark", category: "Physical", role: "Breaker", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Pursuit effect" },
        "steel": { name: "Drive Blade", resultType: "steel", category: "Physical", role: "Support", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "Safeguard 5T" },
        "fairy": { name: "Arc Pixie", resultType: "fairy", category: "Special", role: "Field", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Sets Misty Terrain 5T" }
    },
    "fire": {
        "fire": { name: "Cinder Ash Waltz", resultType: "fire", category: "Special", role: "Breaker", power: 95, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Always crit vs statused; +20 power if user statused" },
        "water": { name: "PyreGeyser", resultType: "water", category: "Special", role: "Debuff", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Dispel Screens/Aurora Veil" },
        "electric": { name: "SmeltCircuit", resultType: "fire", category: "Special", role: "Breaker", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "30% Paralyze; +1 priority if at 100% HP" },
        "grass": { name: "Vine Inferno Waltz", resultType: "grass", category: "Special", role: "Spread", power: 80, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Sun 5T; cannot miss if target faster" },
        "ice": { name: "TorchSleet", resultType: "ice", category: "Special", role: "Debuff", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "-1 Speed; 10% Freeze; +15 power in Hail" },
        "fighting": { name: "Pyre Quake Surge", resultType: "fighting", category: "Physical", role: "Breaker", power: 100, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Ignores Defense boosts" },
        "poison": { name: "Acid Blaze Waltz", resultType: "poison", category: "Special", role: "Debuff", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "30% Poison; +15 power in Sun" },
        "ground": { name: "Plate Ash", resultType: "ground", category: "Physical", role: "Tempo", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Grounds targets; +20 power if user statused" },
        "flying": { name: "InfernoGale", resultType: "flying", category: "Physical", role: "Support", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Tailwind 4T" },
        "psychic": { name: "Focus Pyre Waltz", resultType: "fire", category: "Special", role: "Finisher", power: 110, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Psychic Terrain 5T; +20 power in Trick Room" },
        "bug": { name: "Flare Crawl", resultType: "fire", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; +10% power if ally shares type" },
        "rock": { name: "Blaze Shard", resultType: "rock", category: "Physical", role: "Spread", power: 85, accuracy: 95, target: "Both foes", gauge: 100, secondary: "Set Stealth Rock; cannot miss if target faster" },
        "ghost": { name: "Flare Wraith", resultType: "ghost", category: "Physical", role: "Tempo", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Traps target 4-5 turns" },
        "dragon": { name: "Aether Smelt Waltz", resultType: "dragon", category: "Special", role: "Finisher", power: 105, accuracy: 100, target: "Single", gauge: 100, secondary: "Clear target stat changes; +15 power in Sun" },
        "dark": { name: "Abyss Flare", resultType: "fire", category: "Special", role: "Nuke", power: 135, accuracy: 90, target: "Single", gauge: 100, secondary: "30% Burn; Embargo 3 turns" },
        "steel": { name: "Blade Ember", resultType: "steel", category: "Physical", role: "Tempo", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Grounds target; 20% gauge refund on KO" },
        "fairy": { name: "Blaze Blessing", resultType: "fairy", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "water": {
        "water": { name: "Deluge Tide Waltz", resultType: "water", category: "Special", role: "Utility", power: 80, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Rain 5T; +15 power if already raining" },
        "electric": { name: "TideShock", resultType: "electric", category: "Special", role: "Finisher", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Breaks Protect/Detect; +15 power in Rain" },
        "grass": { name: "Tide Thorn Surge", resultType: "grass", category: "Special", role: "Spread", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Grassy Terrain 5T; +15 power if user statused" },
        "ice": { name: "Deluge Chill", resultType: "ice", category: "Special", role: "Finisher", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "30% Freeze; -1 Speed; +1 priority if at 100% HP" },
        "fighting": { name: "Smash Brine Waltz", resultType: "water", category: "Physical", role: "Spread", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "-1 Defense (both foes)" },
        "poison": { name: "Fume Mist", resultType: "water", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Toxic Spikes (1); 2 layers if raining" },
        "ground": { name: "Cascade Grain", resultType: "ground", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Gravity 5T; Grounds airborne targets" },
        "flying": { name: "Spray Aerial Surge", resultType: "flying", category: "Special", role: "Setup", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Tailwind 4T" },
        "psychic": { name: "Mind Tide Waltz", resultType: "psychic", category: "Special", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Aqua Ring to user and ally; +15 power in Rain" },
        "bug": { name: "Torrent Carapace Surge", resultType: "bug", category: "Physical", role: "Debuff", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Soak (change type to Water); +1 priority if at 100% HP" },
        "rock": { name: "Current of Basalt", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Sandstorm 5T; cannot miss if target faster" },
        "ghost": { name: "Ghoul Mist Waltz", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Disable last move 2T; +15 power in Rain" },
        "dragon": { name: "MistElder", resultType: "dragon", category: "Special", role: "Breaker", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "Clear target stat changes; +15 power if user statused" },
        "dark": { name: "Current Gloom Surge", resultType: "dark", category: "Special", role: "Setup", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Taunt target 3T; +10 power if SE" },
        "steel": { name: "GeyserSteel", resultType: "steel", category: "Physical", role: "Setup", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Reflect 5T; 20% gauge refund on KO" },
        "fairy": { name: "Tide Lilt Surge", resultType: "fairy", category: "Special", role: "Debuff", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +10 power if SE" }
    },
    "electric": {
        "electric": { name: "Volt Circuit", resultType: "electric", category: "Special", role: "Spread", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Electric Terrain 5T; +15 power if active" },
        "grass": { name: "Thorn Arc", resultType: "grass", category: "Special", role: "Breaker", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Grassy Terrain 5T; +15 power if user statused" },
        "ice": { name: "ShockCrystal", resultType: "ice", category: "Special", role: "Finisher", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Trap 4-5 turns; +15 power in Snow/Hail" },
        "fighting": { name: "Volt Focus", resultType: "electric", category: "Special", role: "Breaker", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "Breaks screens; +1 priority if at 100% HP" },
        "poison": { name: "Venom Charge", resultType: "electric", category: "Special", role: "Breaker", power: 100, accuracy: 95, target: "Single", gauge: 100, secondary: "30% Poison; +15 power if already poisoned" },
        "ground": { name: "Rupture Circuit Waltz", resultType: "electric", category: "Special", role: "Tempo", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Gravity 5T; Grounds airborne targets" },
        "flying": { name: "Surge of Aerial", resultType: "electric", category: "Special", role: "Setup", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Tailwind 4T; cannot miss if target faster" },
        "psychic": { name: "Shock Psyche", resultType: "electric", category: "Special", role: "Nuke", power: 115, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Psychic Terrain 5T; 20% gauge refund on KO" },
        "bug": { name: "SurgeSwarm", resultType: "bug", category: "Physical", role: "Utility", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; +1 priority if at 100% HP" },
        "rock": { name: "Surge of Sediment", resultType: "electric", category: "Special", role: "Tempo", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sandstorm 5T; cannot miss if target faster" },
        "ghost": { name: "Lightning Hex Surge", resultType: "ghost", category: "Special", role: "Finisher", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "Power doubles vs statused; +10 power in Electric Terrain/Rain" },
        "dragon": { name: "Arc Fang Surge", resultType: "electric", category: "Special", role: "Nuke", power: 120, accuracy: 90, target: "Single", gauge: 100, secondary: "30% Paralyze; 20% gauge refund on KO" },
        "dark": { name: "Umbral Static Waltz", resultType: "dark", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Embargo 3T; set Electric Terrain if none" },
        "steel": { name: "Volt Mach", resultType: "electric", category: "Special", role: "Support", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; 20% gauge refund on KO" },
        "fairy": { name: "SparkLilt", resultType: "electric", category: "Special", role: "Utility", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; sets even if resisted" }
    },
    "grass": {
        "grass": { name: "Vine of Leaf", resultType: "grass", category: "Special", role: "Utility", power: 75, accuracy: 100, target: "Single", gauge: 100, secondary: "Rapid Clear (remove hazards your side); +15 power if Grassy Terrain active" },
        "ice": { name: "Root of Snow", resultType: "ice", category: "Special", role: "Field", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Snow 5T; +15 power if already snowing" },
        "fighting": { name: "Barrage Spore", resultType: "fighting", category: "Physical", role: "Debuff", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "-1 Speed (both foes); cannot miss if target faster" },
        "poison": { name: "Venom Sap Waltz", resultType: "grass", category: "Special", role: "Control", power: 80, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Toxic Spikes (1); 20% gauge refund on KO" },
        "ground": { name: "Fault Root", resultType: "ground", category: "Special", role: "Setup", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Spikes (2); Grounds airborne targets" },
        "flying": { name: "Bloom Zephyr", resultType: "flying", category: "Special", role: "Support", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Tailwind 4T; +1 priority if at 100% HP" },
        "psychic": { name: "Psi Vine Waltz", resultType: "psychic", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Reflect 5T; 20% gauge refund on KO" },
        "bug": { name: "Briar of Molt", resultType: "bug", category: "Physical", role: "Utility", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; set Grassy Terrain if none" },
        "rock": { name: "Thorn of Slate", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sandstorm 5T; +15 power if user statused" },
        "ghost": { name: "Root of Curse", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 95, target: "Both foes", gauge: 100, secondary: "Spite: -2 PP on last move (both foes)" },
        "dragon": { name: "BriarAether", resultType: "dragon", category: "Special", role: "Finisher", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Clear target stat changes; heals user & ally 1/8" },
        "dark": { name: "Spore of Sin", resultType: "dark", category: "Special", role: "Utility", power: 75, accuracy: 100, target: "Single", gauge: 100, secondary: "Taunt target 3T; Pursuit effect" },
        "steel": { name: "Root Mach Surge", resultType: "steel", category: "Physical", role: "Setup", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; +15 power if user statused" },
        "fairy": { name: "Waltz Grove", resultType: "fairy", category: "Special", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "ice": {
        "ice": { name: "SnowCrystal", resultType: "ice", category: "Special", role: "Field", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Set Snow 5T; +15 power if already snowing" },
        "fighting": { name: "SleetStance", resultType: "fighting", category: "Physical", role: "Debuff", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "-1 Speed (both foes); cannot miss if target faster" },
        "poison": { name: "Icicle of Venom", resultType: "poison", category: "Physical", role: "Tempo", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "30% Poison; -1 Speed in Snow" },
        "ground": { name: "ShardRupture", resultType: "ground", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Grounds targets; cannot miss if target airborne" },
        "flying": { name: "Chill of Soar", resultType: "flying", category: "Special", role: "Support", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Tailwind 4T; +15 power in Snow" },
        "psychic": { name: "Focus Rime Waltz", resultType: "psychic", category: "Special", role: "Field", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Snow 5T; sets even if resisted" },
        "bug": { name: "Rime Larva Surge", resultType: "bug", category: "Physical", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Knock Off; +15 power in Snow" },
        "rock": { name: "Sediment Shard", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Stealth Rock; +15 power in Snow" },
        "ghost": { name: "Icicle Specter", resultType: "ghost", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Disable last move 2T; +15 power in Snow" },
        "dragon": { name: "Roar Hail", resultType: "dragon", category: "Special", role: "Debuff", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Clear target stat changes; +15 power in Snow" },
        "dark": { name: "Ruin Icicle", resultType: "dark", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Embargo 3T; +15 power in Snow" },
        "steel": { name: "Rivet Rime", resultType: "steel", category: "Special", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; also set Reflect in Snow" },
        "fairy": { name: "Shard Waltz Surge", resultType: "fairy", category: "Special", role: "Setup", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "fighting": {
        "fighting": { name: "Pummel Barrage Waltz", resultType: "fighting", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Both foes", gauge: 100, secondary: "Shatters screens on hit" },
        "poison": { name: "Fume Grip", resultType: "poison", category: "Physical", role: "Spread", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "30% Poison; set Toxic Spikes (1)" },
        "ground": { name: "Focus Dust Surge", resultType: "ground", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Gravity 5T; Grounds airborne targets" },
        "flying": { name: "Barrage of Thermal", resultType: "flying", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Tailwind 4T" },
        "psychic": { name: "BarragePsyche", resultType: "psychic", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Quash effect" },
        "bug": { name: "Chitin Rush", resultType: "bug", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Traps target 4-5 turns" },
        "rock": { name: "Stance Ore", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Sandstorm 5T" },
        "ghost": { name: "Quake Ghoul Surge", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Disable last move 2T" },
        "dragon": { name: "Form of Storm", resultType: "dragon", category: "Physical", role: "Control", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage" },
        "dark": { name: "Umbral Quake", resultType: "dark", category: "Physical", role: "Breaker", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Pursuit effect" },
        "steel": { name: "Rush Steel", resultType: "steel", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Reflect 5T" },
        "fairy": { name: "Stance of Faerie", resultType: "fairy", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "poison": {
        "poison": { name: "Corrode Nox", resultType: "poison", category: "Physical", role: "Control", power: 90, accuracy: 95, target: "Both foes", gauge: 100, secondary: "Trap 4-5T; poison both foes" },
        "ground": { name: "Toxic Quake", resultType: "poison", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Grounds target; set Toxic Spikes (1)" },
        "flying": { name: "Miasmic Gust", resultType: "poison", category: "Physical", role: "Support", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Tailwind 4T" },
        "psychic": { name: "Venom Thought", resultType: "poison", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Heal Block 3T; +15 power in Trick Room" },
        "bug": { name: "Spindle Venom", resultType: "bug", category: "Physical", role: "Utility", power: 85, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; +1 priority if at 100% HP" },
        "rock": { name: "Plague of Basalt", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Stealth Rock; +15 power in Sandstorm" },
        "ghost": { name: "Toxic Specter", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Badly poison target; +15 power if already statused" },
        "dragon": { name: "Spiral Toxin", resultType: "dragon", category: "Special", role: "Control", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage; +15 power if poisoned" },
        "dark": { name: "Toxin Gloom", resultType: "dark", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Embargo 3T; +10 power if SE" },
        "steel": { name: "Spore Core Surge", resultType: "steel", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; 20% gauge refund on KO" },
        "fairy": { name: "Seethe Grace", resultType: "fairy", category: "Special", role: "Support", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "ground": {
        "ground": { name: "Grain Rupture", resultType: "ground", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Gravity 5T; Grounds airborne targets" },
        "flying": { name: "Boulder Soar", resultType: "flying", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Grounds target; Set Tailwind 4T" },
        "psychic": { name: "Zen Boulder", resultType: "ground", category: "Physical", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Quash effect; +15 power in Trick Room" },
        "bug": { name: "Boulder Pincer", resultType: "bug", category: "Physical", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; cannot miss if target faster" },
        "rock": { name: "Basalt Quake", resultType: "rock", category: "Physical", role: "Setup", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Sandstorm 5T; +15 power if already active" },
        "ghost": { name: "Hex Terra", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Trap target 4-5T; +15 power if already statused" },
        "dragon": { name: "Storm Burrow", resultType: "dragon", category: "Special", role: "Finisher", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage; cannot miss if airborne" },
        "dark": { name: "Umbral Terra", resultType: "dark", category: "Physical", role: "Breaker", power: 100, accuracy: 95, target: "Single", gauge: 100, secondary: "Pursuit effect" },
        "steel": { name: "QuakeAnvil", resultType: "steel", category: "Physical", role: "Support", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Reflect 5T; +15 power in Sandstorm" },
        "fairy": { name: "Mud Charm", resultType: "fairy", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "flying": {
        "flying": { name: "Skyburst", resultType: "flying", category: "Physical", role: "Nuke", power: 115, accuracy: 95, target: "Single", gauge: 100, secondary: "-1 Defense; +1 priority if at 100% HP" },
        "psychic": { name: "Aura Updraft", resultType: "psychic", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Psychic Terrain 5T; +15 power in Trick Room" },
        "bug": { name: "Silk Downdraft", resultType: "bug", category: "Physical", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; cannot miss if target faster" },
        "rock": { name: "Skystone Drop", resultType: "rock", category: "Physical", role: "Setup", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Stealth Rock; +15 power in Sandstorm" },
        "ghost": { name: "Wraith Crosswind", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Trap target 4-5T; +15 power if already statused" },
        "dragon": { name: "Draconic Cyclone", resultType: "dragon", category: "Special", role: "Finisher", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage; +15 power in Tailwind" },
        "dark": { name: "Night Squall", resultType: "dark", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Taunt target 3T; +10 power if SE" },
        "steel": { name: "Iron Updraft", resultType: "steel", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; 20% gauge refund on KO" },
        "fairy": { name: "Mistral Veil", resultType: "fairy", category: "Physical", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "psychic": {
        "psychic": { name: "Mindscape Waltz", resultType: "psychic", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Psychic Terrain 5T; +15 power in Trick Room" },
        "bug": { name: "Mindweave Web", resultType: "bug", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sticky Web; cannot miss if target faster" },
        "rock": { name: "Runestone Spike", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Stealth Rock; +15 power in Sandstorm" },
        "ghost": { name: "Spectral Edict", resultType: "ghost", category: "Special", role: "Control", power: 100, accuracy: 100, target: "Single", gauge: 100, secondary: "Heal Block 3T; +15 power if already statused" },
        "dragon": { name: "Mindwyrm Purge", resultType: "dragon", category: "Special", role: "Finisher", power: 110, accuracy: 95, target: "Single", gauge: 100, secondary: "Clear target stat changes; +15 power if user statused" },
        "dark": { name: "Omen Lock", resultType: "psychic", category: "Special", role: "Nuke", power: 115, accuracy: 95, target: "Single", gauge: 100, secondary: "Embargo 3T; 20% gauge refund on KO" },
        "steel": { name: "Mindforged Aegis", resultType: "steel", category: "Physical", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; 20% gauge refund on KO" },
        "fairy": { name: "Misty Reverie", resultType: "fairy", category: "Special", role: "Utility", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "bug": {
        "bug": { name: "Weblock", resultType: "bug", category: "Physical", role: "Debuff", power: 85, accuracy: 100, target: "Both foes", gauge: 100, secondary: "-1 Speed (both foes); cannot miss if target faster" },
        "rock": { name: "Scree Scatter", resultType: "rock", category: "Physical", role: "Setup", power: 90, accuracy: 95, target: "Single", gauge: 100, secondary: "Set Stealth Rock; +15 power in Sandstorm" },
        "ghost": { name: "Silk Coffin", resultType: "ghost", category: "Physical", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Trap target 4-5T; +15 power if already statused" },
        "dragon": { name: "Dragline Recall", resultType: "dragon", category: "Physical", role: "Finisher", power: 110, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage; cannot miss if airborne" },
        "dark": { name: "Gloomsnare", resultType: "dark", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Taunt target 3T; +10 power if SE" },
        "steel": { name: "Rivet Swarm", resultType: "steel", category: "Physical", role: "Breaker", power: 100, accuracy: 95, target: "Single", gauge: 100, secondary: "Shatters screens on hit; 20% gauge refund on KO" },
        "fairy": { name: "Gossamer Ward", resultType: "fairy", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "rock": {
        "rock": { name: "Bedrock Stamp", resultType: "rock", category: "Physical", role: "Field", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Sandstorm 5T; +15 power if already active" },
        "ghost": { name: "Tombbind", resultType: "ghost", category: "Physical", role: "Control", power: 95, accuracy: 95, target: "Single", gauge: 100, secondary: "Trap target 4-5T; +15 power if already statused" },
        "dragon": { name: "Cragwyrm Rush", resultType: "dragon", category: "Special", role: "Finisher", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage; +15 power in Sandstorm" },
        "dark": { name: "Obsidian Ban", resultType: "dark", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Embargo 3T; +10 power if SE" },
        "steel": { name: "Iron Rampart", resultType: "steel", category: "Physical", role: "Support", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; +15 power in Sandstorm" },
        "fairy": { name: "Quartz Charm", resultType: "fairy", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "ghost": {
        "ghost": { name: "Wraithbind", resultType: "ghost", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Trap 4-5T; Disable last move if statused" },
        "dragon": { name: "Netherwyrm Recall", resultType: "dragon", category: "Special", role: "Finisher", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Force switch after damage; cannot miss if airborne" },
        "dark": { name: "Umbral Hex", resultType: "dark", category: "Special", role: "Control", power: 95, accuracy: 100, target: "Single", gauge: 100, secondary: "Embargo 3T; +10 power if SE" },
        "steel": { name: "Iron Requiem", resultType: "steel", category: "Physical", role: "Breaker", power: 100, accuracy: 95, target: "Single", gauge: 100, secondary: "Shatters screens on hit; 20% gauge refund on KO" },
        "fairy": { name: "Spirit Veil", resultType: "fairy", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "dragon": {
        "dragon": { name: "Dragonheart Purge", resultType: "dragon", category: "Special", role: "Finisher", power: 110, accuracy: 95, target: "Single", gauge: 100, secondary: "Clear target stat changes; +15 power if user statused" },
        "dark": { name: "Abyssal Roar", resultType: "dragon", category: "Special", role: "Breaker", power: 105, accuracy: 95, target: "Single", gauge: 100, secondary: "Pursuit effect" },
        "steel": { name: "Steelbane Breath", resultType: "dragon", category: "Special", role: "Breaker", power: 110, accuracy: 95, target: "Single", gauge: 100, secondary: "Shatters screens on hit; 20% gauge refund on KO" },
        "fairy": { name: "Faedrake Oath", resultType: "dragon", category: "Special", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "dark": {
        "dark": { name: "Shadow Ambush", resultType: "dark", category: "Physical", role: "Breaker", power: 100, accuracy: 95, target: "Single", gauge: 100, secondary: "Pursuit effect; 20% gauge refund on KO" },
        "steel": { name: "Black Anvil", resultType: "steel", category: "Physical", role: "Breaker", power: 100, accuracy: 95, target: "Single", gauge: 100, secondary: "Shatters screens on hit; +15 power in Sandstorm" },
        "fairy": { name: "Twilight Charm", resultType: "dark", category: "Special", role: "Control", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +10 power if SE" }
    },
    "steel": {
        "steel": { name: "Aegis Matrix", resultType: "steel", category: "Special", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Light Screen 5T; also set Reflect in Sandstorm" },
        "fairy": { name: "Gleamguard", resultType: "fairy", category: "Special", role: "Utility", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Set Misty Terrain 5T; +20 power vs Dragon" }
    },
    "fairy": {
        "fairy": { name: "Evergarden Rite", resultType: "fairy", category: "Special", role: "Support", power: 90, accuracy: 100, target: "Single", gauge: 100, secondary: "Aromatherapy (cure status); +15 power if Misty Terrain active" }
    }
};

export const getFusionMove = (type1: string, type2: string): FusionMove | null => {
    const t1 = type1.toLowerCase();
    const t2 = type2.toLowerCase();
    
    if (FUSION_CHART[t1] && FUSION_CHART[t1][t2]) return FUSION_CHART[t1][t2];
    if (FUSION_CHART[t2] && FUSION_CHART[t2][t1]) return FUSION_CHART[t2][t1];
    
    // Generic fallback if not found
    return {
        name: "Elemental Fusion",
        resultType: t1,
        category: "Special",
        role: "Breaker",
        power: 100,
        accuracy: 100,
        target: "Single",
        gauge: 100,
        secondary: "A powerful combined strike."
    };
};
