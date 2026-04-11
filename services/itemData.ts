
export interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    category: 'pokeball' | 'healing' | 'battle' | 'evolution' | 'key';
}

export const ITEMS: Record<string, Item> = {
    'poke-ball': {
        id: 'poke-ball',
        name: 'Poké Ball',
        description: 'A device for catching wild Pokémon.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/pokeball.png',
        category: 'pokeball'
    },
    'great-ball': {
        id: 'great-ball',
        name: 'Great Ball',
        description: 'A good, high-performance Poké Ball.',
        price: 600,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/greatball.png',
        category: 'pokeball'
    },
    'ultra-ball': {
        id: 'ultra-ball',
        name: 'Ultra Ball',
        description: 'An ultra-performance Poké Ball.',
        price: 1200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/ultraball.png',
        category: 'pokeball'
    },
    'master-ball': {
        id: 'master-ball',
        name: 'Master Ball',
        description: 'The best Ball with the ultimate level of performance. It will catch any wild Pokémon without fail.',
        price: 50000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/masterball.png',
        category: 'pokeball'
    },
    'potion': {
        id: 'potion',
        name: 'Potion',
        description: 'Restores 20 HP to a Pokémon.',
        price: 300,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/potion.png',
        category: 'healing'
    },
    'super-potion': {
        id: 'super-potion',
        name: 'Super Potion',
        description: 'Restores 60 HP to a Pokémon.',
        price: 700,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/superpotion.png',
        category: 'healing'
    },
    'hyper-potion': {
        id: 'hyper-potion',
        name: 'Hyper Potion',
        description: 'Restores 120 HP to a Pokémon.',
        price: 1500,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/hyperpotion.png',
        category: 'healing'
    },
    'max-potion': {
        id: 'max-potion',
        name: 'Max Potion',
        description: 'Fully restores HP to a Pokémon.',
        price: 2500,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/maxpotion.png',
        category: 'healing'
    },
    'revive': {
        id: 'revive',
        name: 'Revive',
        description: 'Revives a fainted Pokémon with half HP.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/revive.png',
        category: 'healing'
    },
    'full-restore': {
        id: 'full-restore',
        name: 'Full Restore',
        description: 'Fully restores HP and status.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/fullrestore.png',
        category: 'healing'
    },
    // Battle Items
    'leftovers': {
        id: 'leftovers',
        name: 'Leftovers',
        description: 'Heals the holder slightly every turn.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/leftovers.png',
        category: 'battle'
    },
    'choice-band': {
        id: 'choice-band',
        name: 'Choice Band',
        description: 'Boosts Attack by 50% but locks the holder into one move.',
        price: 8000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/choiceband.png',
        category: 'battle'
    },
    'choice-specs': {
        id: 'choice-specs',
        name: 'Choice Specs',
        description: 'Boosts Sp. Atk by 50% but locks the holder into one move.',
        price: 8000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/choicespecs.png',
        category: 'battle'
    },
    'choice-scarf': {
        id: 'choice-scarf',
        name: 'Choice Scarf',
        description: 'Boosts Speed by 50% but locks the holder into one move.',
        price: 8000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/choicescarf.png',
        category: 'battle'
    },
    'life-orb': {
        id: 'life-orb',
        name: 'Life Orb',
        description: 'Boosts damage by 30% but costs 10% HP every turn.',
        price: 10000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/lifeorb.png',
        category: 'battle'
    },
    'focus-sash': {
        id: 'focus-sash',
        name: 'Focus Sash',
        description: 'Prevents fainting from full HP once.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/focussash.png',
        category: 'battle'
    },
    'rocky-helmet': {
        id: 'rocky-helmet',
        name: 'Rocky Helmet',
        description: 'Damages attackers who make contact.',
        price: 6000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/rockyhelmet.png',
        category: 'battle'
    },
    'assault-vest': {
        id: 'assault-vest',
        name: 'Assault Vest',
        description: 'Boosts Sp. Def by 50% but prevents status moves.',
        price: 7000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/assaultvest.png',
        category: 'battle'
    },
    'expert-belt': {
        id: 'expert-belt',
        name: 'Expert Belt',
        description: 'Boosts super-effective moves by 20%.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/expertbelt.png',
        category: 'battle'
    },
    'eviolite': {
        id: 'eviolite',
        name: 'Eviolite',
        description: 'Boosts Def and Sp. Def of unevolved Pokémon by 50%.',
        price: 9000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/eviolite.png',
        category: 'battle'
    },
    'black-sludge': {
        id: 'black-sludge',
        name: 'Black Sludge',
        description: 'Heals Poison-types, hurts others.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/blacksludge.png',
        category: 'battle'
    },
    'muscle-band': {
        id: 'muscle-band',
        name: 'Muscle Band',
        description: 'Boosts physical moves by 10%.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/muscleband.png',
        category: 'battle'
    },
    'wise-glasses': {
        id: 'wise-glasses',
        name: 'Wise Glasses',
        description: 'Boosts special moves by 10%.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/wiseglasses.png',
        category: 'battle'
    },
    'air-balloon': {
        id: 'air-balloon',
        name: 'Air Balloon',
        description: 'Makes the holder immune to Ground moves until hit.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/airballoon.png',
        category: 'battle'
    },
    // Evolution Items
    'firestone': {
        id: 'firestone',
        name: 'Fire Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/firestone.png',
        category: 'evolution'
    },
    'waterstone': {
        id: 'waterstone',
        name: 'Water Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/waterstone.png',
        category: 'evolution'
    },
    'thunderstone': {
        id: 'thunderstone',
        name: 'Thunder Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/thunderstone.png',
        category: 'evolution'
    },
    'leafstone': {
        id: 'leafstone',
        name: 'Leaf Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/leafstone.png',
        category: 'evolution'
    },
    'moonstone': {
        id: 'moonstone',
        name: 'Moon Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/moonstone.png',
        category: 'evolution'
    },
    'sunstone': {
        id: 'sunstone',
        name: 'Sun Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/sunstone.png',
        category: 'evolution'
    },
    'shinystone': {
        id: 'shinystone',
        name: 'Shiny Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/shinystone.png',
        category: 'evolution'
    },
    'duskstone': {
        id: 'duskstone',
        name: 'Dusk Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/duskstone.png',
        category: 'evolution'
    },
    'dawnstone': {
        id: 'dawnstone',
        name: 'Dawn Stone',
        description: 'A peculiar stone that can make certain species of Pokémon evolve.',
        price: 2100,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/dawnstone.png',
        category: 'evolution'
    },
    'sitrus-berry': {
        id: 'sitrus-berry',
        name: 'Sitrus Berry',
        description: 'Restores 25% HP when HP falls below 50%.',
        price: 500,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/sitrusberry.png',
        category: 'battle'
    },
    'lum-berry': {
        id: 'lum-berry',
        name: 'Lum Berry',
        description: 'Cures any status condition once.',
        price: 500,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/lumberry.png',
        category: 'battle'
    },
    'focus-band': {
        id: 'focus-band',
        name: 'Focus Band',
        description: 'May prevent fainting with 1 HP (10% chance).',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/focusband.png',
        category: 'battle'
    },
    'quick-claw': {
        id: 'quick-claw',
        name: 'Quick Claw',
        description: 'May allow the holder to move first (20% chance).',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/quickclaw.png',
        category: 'battle'
    },
    'scope-lens': {
        id: 'scope-lens',
        name: 'Scope Lens',
        description: 'Boosts the critical-hit ratio.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/scopelens.png',
        category: 'battle'
    },
    'silk-scarf': {
        id: 'silk-scarf',
        name: 'Silk Scarf',
        description: 'Boosts Normal-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/silkscarf.png',
        category: 'battle'
    },
    'charcoal': {
        id: 'charcoal',
        name: 'Charcoal',
        description: 'Boosts Fire-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/charcoal.png',
        category: 'battle'
    },
    'mystic-water': {
        id: 'mystic-water',
        name: 'Mystic Water',
        description: 'Boosts Water-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/mysticwater.png',
        category: 'battle'
    },
    'miracle-seed': {
        id: 'miracle-seed',
        name: 'Miracle Seed',
        description: 'Boosts Grass-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/miracleseed.png',
        category: 'battle'
    },
    'magnet': {
        id: 'magnet',
        name: 'Magnet',
        description: 'Boosts Electric-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/magnet.png',
        category: 'battle'
    },
    'never-melt-ice': {
        id: 'never-melt-ice',
        name: 'Never-Melt Ice',
        description: 'Boosts Ice-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/nevermeltice.png',
        category: 'battle'
    },
    'black-belt': {
        id: 'black-belt',
        name: 'Black Belt',
        description: 'Boosts Fighting-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/blackbelt.png',
        category: 'battle'
    },
    'poison-barb': {
        id: 'poison-barb',
        name: 'Poison Barb',
        description: 'Boosts Poison-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/poisonbarb.png',
        category: 'battle'
    },
    'soft-sand': {
        id: 'soft-sand',
        name: 'Soft Sand',
        description: 'Boosts Ground-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/softsand.png',
        category: 'battle'
    },
    'sharp-beak': {
        id: 'sharp-beak',
        name: 'Sharp Beak',
        description: 'Boosts Flying-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/sharpbeak.png',
        category: 'battle'
    },
    'twisted-spoon': {
        id: 'twisted-spoon',
        name: 'Twisted Spoon',
        description: 'Boosts Psychic-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/twistedspoon.png',
        category: 'battle'
    },
    'silver-powder': {
        id: 'silver-powder',
        name: 'Silver Powder',
        description: 'Boosts Bug-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/silverpowder.png',
        category: 'battle'
    },
    'hard-stone': {
        id: 'hard-stone',
        name: 'Hard Stone',
        description: 'Boosts Rock-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/hardstone.png',
        category: 'battle'
    },
    'spell-tag': {
        id: 'spell-tag',
        name: 'Spell Tag',
        description: 'Boosts Ghost-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/spelltag.png',
        category: 'battle'
    },
    'dragon-fang': {
        id: 'dragon-fang',
        name: 'Dragon Fang',
        description: 'Boosts Dragon-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/dragonfang.png',
        category: 'battle'
    },
    'big-root': {
        id: 'big-root',
        name: 'Big Root',
        description: 'Boosts HP restoration from draining moves by 30%.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/bigroot.png',
        category: 'battle'
    },
    'black-glasses': {
        id: 'black-glasses',
        name: 'Black Glasses',
        description: 'Boosts Dark-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/blackglasses.png',
        category: 'battle'
    },
    'metal-coat': {
        id: 'metal-coat',
        name: 'Metal Coat',
        description: 'Boosts Steel-type moves by 20%.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/metalcoat.png',
        category: 'battle'
    },
    'rare-candy': {
        id: 'rare-candy',
        name: 'Rare Candy',
        description: 'A candy that is packed with energy. It raises the level of a single Pokémon by one.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/rarecandy.png',
        category: 'healing'
    },
    'full-heal': {
        id: 'full-heal',
        name: 'Full Heal',
        description: 'A spray-type medicine that heals all status conditions.',
        price: 600,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/fullheal.png',
        category: 'healing'
    },
    'shell-bell': {
        id: 'shell-bell',
        name: 'Shell Bell',
        description: 'The holder restores a little HP every time it inflicts damage on others.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/shellbell.png',
        category: 'battle'
    },
    'amulet-coin': {
        id: 'amulet-coin',
        name: 'Amulet Coin',
        description: 'An item to be held by a Pokémon. It doubles any prize money received if the holding Pokémon joins a battle.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/amuletcoin.png',
        category: 'battle'
    },
    'lucky-egg': {
        id: 'lucky-egg',
        name: 'Lucky Egg',
        description: 'An item to be held by a Pokémon. It is an egg filled with happiness that earns extra Exp. Points in battle.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/luckyegg.png',
        category: 'battle'
    },
    'cleanse-tag': {
        id: 'cleanse-tag',
        name: 'Cleanse Tag',
        description: 'An item to be held by a Pokémon. It helps keep wild Pokémon away if the holder is the first Pokémon in the party.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/cleansetag.png',
        category: 'battle'
    },
    'smoke-ball': {
        id: 'smoke-ball',
        name: 'Smoke Ball',
        description: 'An item to be held by a Pokémon. It enables the holder to flee from any wild Pokémon encounter without fail.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/smokeball.png',
        category: 'battle'
    },
    'eject-button': {
        id: 'eject-button',
        name: 'Eject Button',
        description: 'An item to be held by a Pokémon. If the holder is hit by an attack, it will be switched out of battle.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/ejectbutton.png',
        category: 'battle'
    },
    'red-card': {
        id: 'red-card',
        name: 'Red Card',
        description: 'An item to be held by a Pokémon. If the holder is hit by an attack, it will force the attacker to switch out.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/redcard.png',
        category: 'battle'
    },
    'binding-band': {
        id: 'binding-band',
        name: 'Binding Band',
        description: 'An item to be held by a Pokémon. It is a band that increases the power of binding moves used by the holder.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/bindingband.png',
        category: 'battle'
    },
    'grip-claw': {
        id: 'grip-claw',
        name: 'Grip Claw',
        description: 'An item to be held by a Pokémon. It is a claw that extends the duration of multi-turn moves like Bind and Wrap.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/gripclaw.png',
        category: 'battle'
    },
    'everstone': {
        id: 'everstone',
        name: 'Everstone',
        description: 'An item to be held by a Pokémon. A Pokémon holding this peculiar stone is prevented from evolving.',
        price: 1000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/everstone.png',
        category: 'battle'
    },
    'light-ball': {
        id: 'light-ball',
        name: 'Light Ball',
        description: 'An item to be held by Pikachu. It is a puzzling orb that boosts the Attack and Sp. Atk stats.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/lightball.png',
        category: 'battle'
    },
    'thick-club': {
        id: 'thick-club',
        name: 'Thick Club',
        description: 'An item to be held by Cubone or Marowak. It is a hard bone of some sort that boosts the Attack stat.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/thickclub.png',
        category: 'battle'
    },
    'loaded-dice': {
        id: 'loaded-dice',
        name: 'Loaded Dice',
        description: 'An item to be held by a Pokémon. This loaded die ensures that multi-strike moves hit more times.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/loadeddice.png',
        category: 'battle'
    },
    'punching-glove': {
        id: 'punching-glove',
        name: 'Punching Glove',
        description: 'A protective glove that boosts the power of punching moves and prevents direct contact with targets.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/punchingglove.png',
        category: 'battle'
    },
    'covert-cloak': {
        id: 'covert-cloak',
        name: 'Covert Cloak',
        description: 'A hooded cloak that conceals the holder, protecting it from the additional effects of moves.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/covertcloak.png',
        category: 'battle'
    },
    'clear-amulet': {
        id: 'clear-amulet',
        name: 'Clear Amulet',
        description: 'An amulet that clarifies the holder’s vision, protecting it from having its stats lowered by other Pokémon.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/clearamulet.png',
        category: 'battle'
    },
    'mirror-herb': {
        id: 'mirror-herb',
        name: 'Mirror Herb',
        description: 'An herb that allows the holder to mirror an opponent’s stat increases. It is consumed after use.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/mirrorherb.png',
        category: 'battle'
    },
    'metronome': {
        id: 'metronome',
        name: 'Metronome',
        description: 'It boosts the power of a move used consecutively. The effect is reset if another move is used.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/metronome.png',
        category: 'battle'
    },
    'kings-rock': {
        id: 'kings-rock',
        name: "King's Rock",
        description: 'When the holder inflicts damage, it may cause the target to flinch.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/kingsrock.png',
        category: 'battle'
    },
    'razor-fang': {
        id: 'razor-fang',
        name: 'Razor Fang',
        description: 'When the holder inflicts damage, it may cause the target to flinch.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/razorfang.png',
        category: 'battle'
    },
    'bright-powder': {
        id: 'bright-powder',
        name: 'Bright Powder',
        description: 'It is a tricky powder that glows. It lowers the opposing Pokémon’s accuracy.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/brightpowder.png',
        category: 'battle'
    },
    'wide-lens': {
        id: 'wide-lens',
        name: 'Wide Lens',
        description: 'It is a magnifying lens that slightly boosts the accuracy of moves.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/widelens.png',
        category: 'battle'
    },
    'zoom-lens': {
        id: 'zoom-lens',
        name: 'Zoom Lens',
        description: 'If the holder moves after the target, its accuracy will be boosted.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/zoomlens.png',
        category: 'battle'
    },
    'lagging-tail': {
        id: 'lagging-tail',
        name: 'Lagging Tail',
        description: 'An item to be held by a Pokémon. It is tremendously heavy and makes the holder move slower.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/laggingtail.png',
        category: 'battle'
    },
    'iron-ball': {
        id: 'iron-ball',
        name: 'Iron Ball',
        description: 'A heavy ball that cuts Speed and makes Flying-types and those with Levitate vulnerable to Ground moves.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/ironball.png',
        category: 'battle'
    },
    'sticky-barb': {
        id: 'sticky-barb',
        name: 'Sticky Barb',
        description: 'An item that damages the holder every turn. It may latch on to a Pokémon that touches the holder.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/stickybarb.png',
        category: 'battle'
    },
    'flame-orb': {
        id: 'flame-orb',
        name: 'Flame Orb',
        description: 'A bizarre orb that inflicts a burn on the holder during battle.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/flameorb.png',
        category: 'battle'
    },
    'toxic-orb': {
        id: 'toxic-orb',
        name: 'Toxic Orb',
        description: 'A bizarre orb that badly poisons the holder during battle.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/toxicorb.png',
        category: 'battle'
    },
    'oran-berry': {
        id: 'oran-berry',
        name: 'Oran Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user by 10 HP.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/oranberry.png',
        category: 'battle'
    },
    'pecha-berry': {
        id: 'pecha-berry',
        name: 'Pecha Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user from poisoning.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/pechaberry.png',
        category: 'battle'
    },
    'cheri-berry': {
        id: 'cheri-berry',
        name: 'Cheri Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user from paralysis.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/cheriberry.png',
        category: 'battle'
    },
    'chesto-berry': {
        id: 'chesto-berry',
        name: 'Chesto Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user from sleep.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/chestoberry.png',
        category: 'battle'
    },
    'rawst-berry': {
        id: 'rawst-berry',
        name: 'Rawst Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user from a burn.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/rawstberry.png',
        category: 'battle'
    },
    'aspear-berry': {
        id: 'aspear-berry',
        name: 'Aspear Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user from being frozen.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/aspearberry.png',
        category: 'battle'
    },
    'persim-berry': {
        id: 'persim-berry',
        name: 'Persim Berry',
        description: 'A Berry to be consumed by a Pokémon. If held by a Pokémon, it heals the user from confusion.',
        price: 200,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/persimberry.png',
        category: 'battle'
    },
    'booster-energy': {
        id: 'booster-energy',
        name: 'Booster Energy',
        description: 'An item to be held by a Pokémon with the Protosynthesis or Quark Drive Ability. It boosts the Pokémon’s most proficient stat.',
        price: 10000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/boosterenergy.png',
        category: 'battle'
    },
    'ability-shield': {
        id: 'ability-shield',
        name: 'Ability Shield',
        description: 'An item to be held by a Pokémon. This protective card seals away the Pokémon’s Ability, preventing it from being changed or suppressed.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/abilityshield.png',
        category: 'battle'
    },
    'protective-pads': {
        id: 'protective-pads',
        name: 'Protective Pads',
        description: 'An item to be held by a Pokémon. These pads protect the holder from effects caused by making direct contact with the target.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/protectivepads.png',
        category: 'battle'
    },
    'blunder-policy': {
        id: 'blunder-policy',
        name: 'Blunder Policy',
        description: 'An item to be held by a Pokémon. It sharply boosts the holder’s Speed stat if the Pokémon misses with a move because of low accuracy.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/blunderpolicy.png',
        category: 'battle'
    },
    'heavy-duty-boots': {
        id: 'heavy-duty-boots',
        name: 'Heavy-Duty Boots',
        description: 'An item to be held by a Pokémon. These boots prevent the holder from being affected by traps set on the battlefield.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/heavydutyboots.png',
        category: 'battle'
    },
    'utility-umbrella': {
        id: 'utility-umbrella',
        name: 'Utility Umbrella',
        description: 'An item to be held by a Pokémon. This umbrella protects the holder from the effects of weather.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/utilityumbrella.png',
        category: 'battle'
    },
    'eject-pack': {
        id: 'eject-pack',
        name: 'Eject Pack',
        description: 'An item to be held by a Pokémon. If the holder’s stats are lowered, it will be switched out of battle.',
        price: 4000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/ejectpack.png',
        category: 'battle'
    },
    'room-service': {
        id: 'room-service',
        name: 'Room Service',
        description: 'An item to be held by a Pokémon. If Trick Room is in effect, the holder’s Speed stat will be lowered.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/roomservice.png',
        category: 'battle'
    },
    'weakness-policy': {
        id: 'weakness-policy',
        name: 'Weakness Policy',
        description: 'An item to be held by a Pokémon. Attack and Sp. Atk sharply increase if the holder is hit with a move to which it is weak.',
        price: 5000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/weaknesspolicy.png',
        category: 'battle'
    },
    'throat-spray': {
        id: 'throat-spray',
        name: 'Throat Spray',
        description: 'An item to be held by a Pokémon. It raises the holder’s Sp. Atk stat if it uses a sound-based move.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/throatspray.png',
        category: 'battle'
    },
    'light-clay': {
        id: 'light-clay',
        name: 'Light Clay',
        description: 'An item to be held by a Pokémon. Protective barriers like Reflect and Light Screen last longer than usual.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/lightclay.png',
        category: 'battle'
    },
    'damp-rock': {
        id: 'damp-rock',
        name: 'Damp Rock',
        description: 'An item to be held by a Pokémon. It extends the duration of the rain caused by the holder.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/damprock.png',
        category: 'battle'
    },
    'heat-rock': {
        id: 'heat-rock',
        name: 'Heat Rock',
        description: 'An item to be held by a Pokémon. It extends the duration of the sunshine caused by the holder.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/heatrock.png',
        category: 'battle'
    },
    'smooth-rock': {
        id: 'smooth-rock',
        name: 'Smooth Rock',
        description: 'An item to be held by a Pokémon. It extends the duration of the sandstorm caused by the holder.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/smoothrock.png',
        category: 'battle'
    },
    'icy-rock': {
        id: 'icy-rock',
        name: 'Icy Rock',
        description: 'An item to be held by a Pokémon. It extends the duration of the hail or snow caused by the holder.',
        price: 2000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/icyrock.png',
        category: 'battle'
    },
    'terrain-extender': {
        id: 'terrain-extender',
        name: 'Terrain Extender',
        description: 'An item to be held by a Pokémon. It extends the duration of the terrain caused by the holder.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/terrainextender.png',
        category: 'battle'
    },
    'adrenaline-orb': {
        id: 'adrenaline-orb',
        name: 'Adrenaline Orb',
        description: 'An item to be held by a Pokémon. It raises Speed if the holder is Intimidated.',
        price: 3000,
        icon: 'https://play.pokemonshowdown.com/sprites/itemicons/adrenalineorb.png',
        category: 'battle'
    }
};
