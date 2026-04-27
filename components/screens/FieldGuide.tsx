/**
 * Field Guide -- the Trainer's Handbook
 * ======================================
 * A polished in-game tutorial / encyclopedia accessible from the main
 * menu. Designed to answer the question every new player has when they
 * spawn into a procedural Pokemon roguelike with multiplayer co-op:
 * "what the hell do I do?"
 *
 * Visual direction:
 *   - Mirrors the Rift Atelier's master-detail compendium layout so the
 *     three "branch" screens (Atelier, Field Guide, future codex) all
 *     read as one family of content.
 *   - Same MENU_BACKGROUND_URL with a green/cyan tint so the player can
 *     tell at a glance which screen they're on.
 *   - Same BrandTitle + BrandEyebrow + corner brackets + floating
 *     particles primitives the rest of the menus use.
 *
 * Layout:
 *   - Sticky sidebar with the section list (icons + titles + 1-line
 *     summary). Highlights the active section. Collapses to a dropdown
 *     on mobile.
 *   - Main panel renders the active section. Each section is composed
 *     from small reusable building blocks (Hero, FactPanel, ProTip,
 *     KeyRow, PipScale) so the prose is consistent and visually heavy
 *     without being a wall of text.
 *
 * Keyboard:
 *   - ArrowUp/Down or W/S cycles sections.
 *   - Number keys 1-9, 0 jump to sections.
 *   - Escape returns to the menu.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { MENU_BACKGROUND_URL } from '../../services/imageService';
import { BrandTitle, BrandEyebrow, PokeballWatermark } from '../ui/MenuKit';
import { playSound } from '../../services/soundService';

const clickSfx = 'https://www.soundjay.com/button/sounds/button-16.mp3';

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

interface SectionMeta {
    id: string;
    title: string;
    /** Short emoji icon -- intentionally simple so the guide reads on
     *  every viewport without bundling extra images. */
    icon: string;
    /** One-line teaser shown in the sidebar under the title. */
    teaser: string;
    /** Visual accent color that drives the panel hue + sidebar highlight. */
    accent: string;
    /** Renderer for the right-side detail pane. */
    Body: React.FC;
}

// ---------------------------------------------------------------------------
// Reusable content primitives
// ---------------------------------------------------------------------------

const SectionHero: React.FC<{
    accent: string;
    icon: string;
    eyebrow: string;
    title: string;
    blurb: string;
}> = ({ accent, icon, eyebrow, title, blurb }) => (
    <div
        className="relative rounded-2xl p-6 mb-5 overflow-hidden border"
        style={{
            background: `linear-gradient(135deg, ${accent}33 0%, rgba(15,23,42,0.8) 60%, rgba(2,6,23,0.92) 100%)`,
            borderColor: `${accent}55`,
            boxShadow: `0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 1px ${accent}22`,
        }}
    >
        <PokeballWatermark className="absolute -right-6 -top-6 w-32 h-32" opacity={0.06} />
        <div className="flex items-center gap-4">
            <div
                className="w-16 h-16 flex items-center justify-center rounded-2xl text-4xl shrink-0 border"
                style={{
                    background: `linear-gradient(180deg, ${accent}88, ${accent}22)`,
                    borderColor: `${accent}aa`,
                    boxShadow: `0 0 24px ${accent}66`,
                }}
            >
                {icon}
            </div>
            <div>
                <div className="text-[8px] uppercase tracking-[0.4em]" style={{ color: accent }}>{eyebrow}</div>
                <div className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">{title}</div>
                <div className="text-sm text-slate-300/90 mt-1.5 max-w-xl leading-snug">{blurb}</div>
            </div>
        </div>
    </div>
);

const FactPanel: React.FC<{
    title: string;
    accent: string;
    icon?: string;
    children: React.ReactNode;
    className?: string;
}> = ({ title, accent, icon, children, className = '' }) => (
    <div
        className={`rounded-xl border p-4 ${className}`}
        style={{
            background: `linear-gradient(160deg, ${accent}10 0%, rgba(2,6,23,0.7) 100%)`,
            borderColor: `${accent}33`,
        }}
    >
        <div className="flex items-center gap-2 mb-2.5">
            {icon && <span className="text-lg leading-none">{icon}</span>}
            <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>
                {title}
            </h4>
        </div>
        <div className="text-sm text-slate-200/90 space-y-2 leading-relaxed">{children}</div>
    </div>
);

const ProTip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
        className="rounded-xl border p-3.5 flex gap-3 items-start mt-4"
        style={{
            background: 'linear-gradient(160deg, #fbbf2422 0%, rgba(2,6,23,0.65) 100%)',
            borderColor: '#fbbf2455',
        }}
    >
        <span className="text-2xl leading-none shrink-0">💡</span>
        <div>
            <div className="text-[9px] uppercase tracking-[0.35em] font-black text-amber-300 mb-1">Pro Tip</div>
            <div className="text-sm text-amber-50/90 leading-relaxed">{children}</div>
        </div>
    </div>
);

const KeyCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd
        className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-md font-mono font-black text-xs text-slate-100 border-b-[3px] border-slate-700 bg-gradient-to-b from-slate-600 to-slate-800 shadow-[0_2px_0_rgba(0,0,0,0.4)]"
    >
        {children}
    </kbd>
);

const KeyRow: React.FC<{
    keys: string[];
    label: string;
    detail?: string;
}> = ({ keys, label, detail }) => (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-b-0">
        <div className="flex items-center gap-1.5 min-w-[140px]">
            {keys.map((k, i) => (
                <React.Fragment key={i}>
                    <KeyCap>{k}</KeyCap>
                    {i < keys.length - 1 && <span className="text-slate-500 text-[10px]">/</span>}
                </React.Fragment>
            ))}
        </div>
        <div className="flex-1">
            <div className="text-sm text-slate-100 font-bold">{label}</div>
            {detail && <div className="text-[11px] text-slate-400 leading-tight">{detail}</div>}
        </div>
    </div>
);

/** Visual ladder for stacking buffs (Trainer Bond, catch combo, etc.). */
const PipScale: React.FC<{
    pips: number;
    max: number;
    accent: string;
    label?: string;
}> = ({ pips, max, accent, label }) => (
    <div className="flex items-center gap-2">
        {label && <span className="text-[10px] uppercase tracking-widest text-slate-400 mr-1">{label}</span>}
        {Array.from({ length: max }).map((_, i) => (
            <div
                key={i}
                className="w-3 h-3 rounded-full border"
                style={{
                    backgroundColor: i < pips ? accent : 'transparent',
                    borderColor: i < pips ? accent : 'rgba(148,163,184,0.4)',
                    boxShadow: i < pips ? `0 0 6px ${accent}` : 'none',
                }}
            />
        ))}
    </div>
);

const Step: React.FC<{ n: number; title: string; children: React.ReactNode; accent: string }> = ({ n, title, children, accent }) => (
    <div className="flex gap-3">
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
            style={{ background: accent, color: '#0f172a', boxShadow: `0 0 12px ${accent}66` }}
        >
            {n}
        </div>
        <div className="flex-1">
            <div className="font-black text-slate-100 text-sm leading-tight">{title}</div>
            <div className="text-sm text-slate-300/85 mt-1 leading-relaxed">{children}</div>
        </div>
    </div>
);

const Callout: React.FC<{ icon: string; title: string; children: React.ReactNode; tone?: 'info' | 'warn' | 'good' }> = ({
    icon,
    title,
    children,
    tone = 'info',
}) => {
    const toneColor = tone === 'warn' ? '#fb7185' : tone === 'good' ? '#34d399' : '#60a5fa';
    return (
        <div
            className="rounded-lg border p-3 flex gap-3 items-start"
            style={{
                background: `linear-gradient(160deg, ${toneColor}15, rgba(2,6,23,0.5))`,
                borderColor: `${toneColor}40`,
            }}
        >
            <span className="text-xl leading-none shrink-0">{icon}</span>
            <div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-black mb-0.5" style={{ color: toneColor }}>
                    {title}
                </div>
                <div className="text-sm text-slate-200/85 leading-relaxed">{children}</div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// SECTION BODIES
// ---------------------------------------------------------------------------

const WelcomeBody: React.FC = () => (
    <>
        <SectionHero
            accent="#67e8f9"
            icon="🌌"
            eyebrow="Welcome, Trainer"
            title="What is Pokémon Explorers?"
            blurb="A roguelike Pokémon expedition. Pick a starter, push deeper into the Rift, beat gym leaders, and survive long enough to spend Rift Essence on permanent upgrades for your next run."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <FactPanel title="One Run" accent="#67e8f9" icon="🧭">
                Each run starts at chunk (0,0). Walk in any direction and the world generates around you.
                The further you push, the harder enemies become but the better the loot.
            </FactPanel>
            <FactPanel title="Death Resets" accent="#fb7185" icon="💀">
                If your whole team faints in battle you lose the run -- but you keep your Rift
                Essence and Tokens, plus any Vault unlocks you bought between runs.
            </FactPanel>
            <FactPanel title="Battles Are Doubles" accent="#a78bfa" icon="⚔️">
                Every battle is 2v2. In single-player you control both slots. In co-op each player
                pilots one Pokémon and fights as a partnership.
            </FactPanel>
            <FactPanel title="Goal" accent="#fbbf24" icon="🏆">
                Beat 8 Gym Leaders, then the Rift Champion. Along the way every choice you make
                (catches, items, talents) shapes how far you go.
            </FactPanel>
        </div>

        <ProTip>
            If this is your first run, focus on Section <b>The Loop</b> and <b>Battles</b> first.
            Everything else (held items, Rift Atelier, multiplayer) layers on once you have the basics.
        </ProTip>
    </>
);

const ControlsBody: React.FC = () => (
    <>
        <SectionHero
            accent="#34d399"
            icon="🎮"
            eyebrow="Inputs"
            title="Controls & Shortcuts"
            blurb="Mouse, keyboard, or both. The game is fully keyboard-playable and most actions have a click target too. Hold Shift to run -- no stamina, no cooldown."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FactPanel title="Overworld" accent="#34d399">
                <KeyRow keys={['W', 'A', 'S', 'D']} label="Move" detail="Or arrow keys. One step per press; hold for repeat." />
                <KeyRow keys={['Shift']} label="Run" detail="Hold while moving for ~2x speed." />
                <KeyRow keys={['Space', 'E']} label="Interact" detail="Talk to NPCs, open doors, read signposts, use PCs." />
                <KeyRow keys={['Enter']} label="Pause Menu" detail="Team, items, save, settings, leaderboard." />
            </FactPanel>

            <FactPanel title="Battles & Menus" accent="#60a5fa">
                <KeyRow keys={['↑', '↓', '←', '→']} label="Navigate" detail="Move the cursor through moves, items, or Pokémon." />
                <KeyRow keys={['Enter', 'Space']} label="Confirm" detail="Lock in a move, advance dialogue, accept choice." />
                <KeyRow keys={['Esc']} label="Back / Close" detail="Return to the previous screen or menu." />
                <KeyRow keys={['Y', 'N']} label="Yes / No" detail="On confirm prompts (release Pokémon, evolve, etc.)." />
            </FactPanel>
        </div>

        <ProTip>
            The pause menu (<b>Enter</b>) has tabs for Team, Items, Quests, and Save. The PC at any
            Pokémon Center deposits / withdraws Pokémon from your storage boxes.
        </ProTip>
    </>
);

const LoopBody: React.FC = () => (
    <>
        <SectionHero
            accent="#fbbf24"
            icon="🔁"
            eyebrow="Core Gameplay"
            title="The Loop"
            blurb="Pokémon Explorers is a chase-the-horizon game. Every chunk you cross adds distance, and distance scales rewards, danger, and gym proximity."
        />

        <div className="space-y-4">
            <Step n={1} accent="#fbbf24" title="Pick a starter">
                You get six options drawn from random regions. Look at the type, ability, and stats --
                speed and a useful ability matter more early than raw attack.
            </Step>
            <Step n={2} accent="#fbbf24" title="Walk through chunks">
                Tall grass triggers wild encounters. Trainers stand in fixed spots; talk to them to
                fight. Signposts hint at the next gym's direction.
            </Step>
            <Step n={3} accent="#fbbf24" title="Catch and grow your team">
                You start with 2 Capture Permits and earn more by beating trainers. Permits gate
                catches -- one per Pokémon you actually keep. (Wild battles still award XP either way.)
            </Step>
            <Step n={4} accent="#fbbf24" title="Find the Gym, beat the leader">
                Gyms appear inside their badge's home biome (Bug-type gym lives in forests, etc.).
                Beating the leader gives a Badge, 2 Capture Permits, 5 Essence, and unlocks the next tier.
            </Step>
            <Step n={5} accent="#fbbf24" title="Push deeper">
                Each Badge bumps the level cap and the world's danger. Bounties, signposts, and random
                events scale up. Repeat until you fall (or hit Champion).
            </Step>
            <Step n={6} accent="#fbbf24" title="Spend Essence, run again">
                Run ends → Rift Atelier opens. Spend Essence on permanent talents, keystone ranks,
                and chase Vault unlocks like Terastallization, Mega Evolution, and Z-Moves.
            </Step>
        </div>

        <ProTip>
            Don't waste Capture Permits on duplicates. The PC box at any Pokémon Center holds spare
            mons indefinitely -- catch one of every species you find, swap in for type matchups.
        </ProTip>
    </>
);

const BattlesBody: React.FC = () => (
    <>
        <SectionHero
            accent="#a78bfa"
            icon="⚔️"
            eyebrow="Combat"
            title="Battles"
            blurb="Turn-based 2v2. You and your partner (or you and you, in solo) each pick a move; speed determines order; types and stat stages decide damage."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <FactPanel title="Turn Order" accent="#a78bfa" icon="⚡">
                Both sides queue all 4 actions, then they resolve fastest-to-slowest.
                Priority moves (Quick Attack, Extreme Speed) jump ahead of normal moves regardless of speed.
            </FactPanel>
            <FactPanel title="Type Effectiveness" accent="#fb7185" icon="🔥">
                Standard Gen-9 type chart. <b>Super-effective</b> hits do 2x; <b>resisted</b> hits do 0.5x;
                <b> immunities</b> deal 0 damage. Dual-type defenders multiply both modifiers.
            </FactPanel>
            <FactPanel title="Stat Stages" accent="#34d399" icon="📈">
                Buffs and debuffs stack from -6 to +6. +1 Attack ≈ 1.5x damage, +2 ≈ 2x, etc.
                Watch the colored arrows over each Pokémon -- they're the fastest read on whose
                turn is about to swing.
            </FactPanel>
            <FactPanel title="Fusion (Co-op only)" accent="#67e8f9" icon="🌀">
                When the team Sync gauge fills, both partners can spend a turn to fuse their active
                Pokémon into a single hybrid for one massive, type-crashing strike.
            </FactPanel>
        </div>

        <FactPanel title="Item & Switch Actions" accent="#60a5fa" icon="🎒">
            <p>Each turn you can use a bag item (Potion, Pokéball, Capture Permit, etc.) <i>instead</i> of attacking.
            Switching uses your turn slot too -- so think before you swap mid-battle.</p>
            <p className="text-slate-400/80 text-xs">In co-op, items and switches are routed through the host. If you
            see a brief "waiting for opponent..." state it means your partner hasn't picked yet.</p>
        </FactPanel>

        <ProTip>
            Build the battle streak. Each consecutive win adds <b>+10% money</b> and <b>+10% XP</b> (capped at +100%).
            The streak resets on defeat, run end, or fleeing.
        </ProTip>
    </>
);

const CatchingBody: React.FC = () => (
    <>
        <SectionHero
            accent="#f472b6"
            icon="🎯"
            eyebrow="Capturing"
            title="Catching Pokémon"
            blurb="Every Pokémon you keep costs one Capture Permit. The Permit gates *which* mons you take home; the Poké Ball decides *if* the catch lands."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <FactPanel title="Capture Permits" accent="#fbbf24" icon="🪪">
                You start with 2 Permits per run. Beating a trainer awards 1 (Gym Leaders give 2).
                Wild victories chip in 1 every 6 wins (streak-based). Permits don't carry between runs.
            </FactPanel>
            <FactPanel title="Poké Balls" accent="#fb7185" icon="⚪">
                Different balls have different catch rates: Poké &lt; Great &lt; Ultra &lt; Master.
                Lower the wild's HP and inflict status (Sleep, Paralysis) to push catch chance.
            </FactPanel>
            <FactPanel title="Catch Chains" accent="#67e8f9" icon="🔗">
                Catching the same species in a row builds a Chain. Hits milestones at <b>5 / 10 / 20 / 30 / 50</b>:
                each tier raises the shiny rate AND grants a guaranteed item drop on the next catch.
            </FactPanel>
            <FactPanel title="Shinies" accent="#fcd34d" icon="✨">
                Base shiny rate is rough; chains push it up to 1-in-100 territory. A shiny encounter
                shows up with sparkle FX -- if you let it run, you don't get a second shot at that ID.
            </FactPanel>
        </div>

        <Callout icon="⚠️" title="Run-Ending Catch">
            Throwing a ball uses a Permit if the Pokémon faints OR you flee mid-throw. Make sure your
            target is weakened first.
        </Callout>

        <ProTip>
            Open the PC at any Pokémon Center to deposit / withdraw stored mons. You can hold every
            unique species you've ever caught -- no run-time slot pressure.
        </ProTip>
    </>
);

const TrainerBondBody: React.FC = () => (
    <>
        <SectionHero
            accent="#fb923c"
            icon="🤝"
            eyebrow="Engagement Buff"
            title="Trainer Bond"
            blurb="A stacking buff that builds from trainer victories and decays as you walk past combat. Pure carrot: skip trainers and you simply don't get the bonus."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <FactPanel title="How It Builds" accent="#fb923c" icon="📈">
                <p>+1 pip per trainer you defeat (capped at <b>10</b>). Gauntlet chains count once
                per encounter, not per fight in the chain.</p>
                <div className="mt-3"><PipScale pips={6} max={10} accent="#fb923c" label="Sample" /></div>
            </FactPanel>
            <FactPanel title="What Each Pip Gives" accent="#fbbf24" icon="🎁">
                <ul className="list-disc list-inside space-y-1">
                    <li>+8% XP</li>
                    <li>+8% money</li>
                    <li>+5pp held-item drop chance</li>
                </ul>
                <p className="text-xs text-slate-400 mt-2">10 pips ⇒ <b>+80% XP, +80% money, +50pp drop chance</b>.</p>
            </FactPanel>
            <FactPanel title="How It Decays" accent="#fb7185" icon="⏳">
                You lose <b>1 pip every 4 chunks</b> of new max-distance traveled without engaging
                another trainer. Wild grinding can't sustain it -- only trainers refresh the timer.
            </FactPanel>
            <FactPanel title="Wipe Triggers" accent="#fb7185" icon="💥">
                A run-ending defeat zeros all pips. (Surviving a defeat in co-op is fine -- the bond
                only resets between runs.)
            </FactPanel>
        </div>

        <FactPanel title="Tier Glow-Ups" accent="#fcd34d" icon="🏅">
            <p>The HUD pill changes color as you stack:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs mt-1">
                <li><span className="text-amber-700 font-black">Bronze</span> · 1-2 pips</li>
                <li><span className="text-slate-300 font-black">Silver</span> · 3-4 pips</li>
                <li><span className="text-yellow-300 font-black">Gold</span> · 5-7 pips (toast at 5)</li>
                <li><span className="text-orange-300 font-black">Legendary</span> · 8-10 pips (toast at 10)</li>
            </ul>
        </FactPanel>

        <ProTip>
            The Bond multiplies XP for <i>every</i> battle while it's active -- including wild
            encounters. Stacking the bond before a tough gym means a pre-fight grind suddenly pays
            its way. Just don't wander 40 chunks looking for a Rare Candy and let it decay to zero.
        </ProTip>
    </>
);

const WorldBody: React.FC = () => (
    <>
        <SectionHero
            accent="#22d3ee"
            icon="🌍"
            eyebrow="Exploration"
            title="The World"
            blurb="Procedurally generated chunks tiled in every direction. Biomes shape encounters; signposts guide you to gyms; random events pepper longer treks."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <FactPanel title="Biomes" accent="#34d399" icon="🌳">
                Forest, mountain, desert, volcano, swamp, beach, cave, snow, ruins, rift. Each biome
                spawns themed wild Pokémon and houses one gym leader's territory.
            </FactPanel>
            <FactPanel title="Buildings" accent="#60a5fa" icon="🏠">
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><b className="text-rose-300">Pokémon Centers</b> -- free full heal + PC boxes.</li>
                    <li><b className="text-sky-300">Poké Marts</b> -- buy / sell items, talk to clerks for tips.</li>
                    <li><b className="text-amber-200">Houses</b> -- random NPC quests, rumors, free items.</li>
                    <li><b className="text-purple-300">Gyms</b> -- mooks → leader → Badge.</li>
                </ul>
            </FactPanel>
            <FactPanel title="Signposts" accent="#fbbf24" icon="🪧">
                Yellow signposts point toward the next un-cleared gym. The further you stray, the
                more often they appear -- so getting lost is recoverable.
            </FactPanel>
            <FactPanel title="Random Events" accent="#a78bfa" icon="🎲">
                Mid-chunk you might run into bounty boards, treasure caches, traveling merchants,
                rival appearances, or weather shifts. Most are opt-in (interact to trigger).
            </FactPanel>
        </div>

        <FactPanel title="Chunk Coordinates & Distance" accent="#67e8f9" icon="📐">
            <p>The HUD shows your <b>(x, y)</b> chunk coordinate and computed distance from origin.
            Distance scales loot tier, level cap, and gym difficulty -- so it's the closest thing
            this game has to a "level."</p>
        </FactPanel>

        <ProTip>
            Don't be afraid of going off-axis. Going diagonal NE / SW etc. usually finds new biomes
            faster than walking a single cardinal direction in a straight line.
        </ProTip>
    </>
);

const ItemsBody: React.FC = () => (
    <>
        <SectionHero
            accent="#84cc16"
            icon="🎒"
            eyebrow="Inventory"
            title="Items & Held Items"
            blurb="Two layers: a generic bag (potions, balls, rare candies) and per-Pokémon Held Items that change how that mon plays."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <FactPanel title="Healing & Status" accent="#34d399" icon="💚">
                Potions, Super/Hyper/Full Restore, Revives. Status cures (Antidote, Awakening, etc.)
                lift specific conditions; Full Restore cures everything in one go.
            </FactPanel>
            <FactPanel title="Capture Items" accent="#fb7185" icon="🔴">
                Poké / Great / Ultra / Master Balls. Specialty balls (Net, Dusk, Quick) trigger on
                conditions you'll learn from clerks at the Mart.
            </FactPanel>
            <FactPanel title="Held Items" accent="#a78bfa" icon="📿">
                Hand a Pokémon a Held Item (in the Pause Menu's Team tab) and it stays on them across
                battles. <b>Leftovers</b> heals 1/16 HP per turn; <b>Choice Band</b> +50% Attack but
                locks one move; <b>Lucky Egg</b> +50% XP gain.
            </FactPanel>
            <FactPanel title="Stones & Evolution" accent="#fbbf24" icon="🌟">
                Drop a Fire Stone on Vulpix and it evolves immediately. Most stones drop from
                trainers and end-of-chunk caches. Some species need level + a held item too.
            </FactPanel>
        </div>

        <ProTip>
            <b>Lucky Egg + Trainer Bond</b> is the standard XP combo. Lucky Egg multiplies the bond's
            +80% bonus, so a fully-stacked bond on a Lucky Egg holder pulls in roughly <b>2.7x</b> XP.
        </ProTip>
    </>
);

const AtelierBody: React.FC = () => (
    <>
        <SectionHero
            accent="#c084fc"
            icon="💎"
            eyebrow="Meta Progression"
            title="The Rift Atelier"
            blurb="The between-run upgrade screen. Spend Rift Essence (earned from any run) and Rift Tokens (earned from gym leaders, rivals, champions) on permanent upgrades."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <FactPanel title="Talents" accent="#c084fc" icon="🌿">
                One-time buys with run-shaping effects. Most cost a flat amount of Essence. Many
                gate other talents -- the tree branches.
            </FactPanel>
            <FactPanel title="Keystones" accent="#60a5fa" icon="🔷">
                Tiered tracks (e.g. Essence Purse Lv.1-5). Each rank costs more Essence than the last
                but gives a small permanent bonus -- speed, money, item drops, etc.
            </FactPanel>
            <FactPanel title="Vault" accent="#fbbf24" icon="🏦">
                Chase unlocks. Costs Essence <b>+ Tokens</b>. Home of the marquee mechanics:
                <b className="text-fuchsia-300"> Terastallization</b>, <b className="text-rose-300">Mega Evolution</b>,
                <b className="text-yellow-300"> Z-Moves</b>, plus a few utility unlocks.
            </FactPanel>
        </div>

        <FactPanel title="Currencies" accent="#67e8f9" icon="💱">
            <ul className="list-disc list-inside space-y-1 text-sm">
                <li><b className="text-purple-300">Rift Essence</b> -- the main currency. Earned from distance traveled,
                badges earned, and trainer victories. Spent on Talents and Keystones.</li>
                <li><b className="text-amber-300">Rift Tokens</b> -- the rare currency. Drops from Gym Leaders (+5),
                rival milestones (+3), and the Champion (+10). Required for Vault unlocks.</li>
            </ul>
        </FactPanel>

        <ProTip>
            Don't over-invest in any one keystone before grabbing a few cheap talents. The talents
            shape your <i>build</i>; the keystones polish it. A keystone you can't use is dead Essence.
        </ProTip>
    </>
);

const MultiplayerBody: React.FC = () => (
    <>
        <SectionHero
            accent="#10b981"
            icon="🌐"
            eyebrow="Co-op"
            title="Multiplayer"
            blurb="Real-time two-player co-op over Firebase. Both players share one team and one inventory; battles split control 50/50."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <FactPanel title="Hosting a Game" accent="#10b981" icon="🚀">
                <ol className="list-decimal list-inside space-y-1">
                    <li>From the main menu, click <b>Start Adventure</b>.</li>
                    <li>On the Starter Select screen, click <b>Invite Friend</b>.</li>
                    <li>Share the room code with your friend.</li>
                    <li>Pick a starter each. Run begins when both are locked in.</li>
                </ol>
            </FactPanel>
            <FactPanel title="Joining a Game" accent="#34d399" icon="🚪">
                <ol className="list-decimal list-inside space-y-1">
                    <li>From the main menu, click <b>Join Friend</b>.</li>
                    <li>Paste the host's room code.</li>
                    <li>Sign in (Google or guest -- whichever the prompt offers).</li>
                    <li>Pick your starter -- the host's selection appears next to yours.</li>
                </ol>
            </FactPanel>
            <FactPanel title="In Battle" accent="#a78bfa" icon="⚔️">
                Each player controls one of the two active Pokémon. You queue your action, the host
                queues theirs, and the battle resolves once both are in. Items, switches, and run
                actions all sync.
            </FactPanel>
            <FactPanel title="Outside Battle" accent="#60a5fa" icon="🌎">
                Both players move independently. The HOST owns the world state; the client follows.
                You can split up across a chunk, but battles only trigger when both are present.
            </FactPanel>
        </div>

        <Callout icon="🛡️" title="If something hangs">
            Invite or join stuck on a spinner? After ~10s the game auto-recovers and surfaces an
            error. Refresh the page and try again -- room codes expire after 24h of inactivity.
        </Callout>

        <ProTip>
            Co-op runs are HARDER than solo: HP pools are bigger, damage is split, and you can't
            cover all four enemy slots alone. Coordinate type matchups in chat before locking in.
        </ProTip>
    </>
);

const TipsBody: React.FC = () => (
    <>
        <SectionHero
            accent="#f59e0b"
            icon="🧠"
            eyebrow="Power Moves"
            title="Tips & Non-Obvious Stuff"
            blurb="Things the game won't teach you, in roughly the order they'll matter."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FactPanel title="Save Often" accent="#10b981" icon="💾">
                The Pause Menu's <b>Save</b> tab snapshots your full state to local storage. You can
                also save at any Pokémon Center counter via the nurse. Save before pushing into a new
                gym.
            </FactPanel>
            <FactPanel title="Sell at the Mart" accent="#fbbf24" icon="🏪">
                Marts have a Sell tab. Stones, duplicates, and held items you don't use sell for half
                their buy price -- a great way to fund Master Balls.
            </FactPanel>
            <FactPanel title="Bounty Boards" accent="#a78bfa" icon="📜">
                Buildings sometimes contain bounty boards. Active bounties are tracked passively
                (catch X of type Y, beat Z trainers, etc.) -- you don't have to "accept" them.
            </FactPanel>
            <FactPanel title="Type Coverage" accent="#fb7185" icon="🎯">
                Build your team for type spread, not power. Two Water-type aces fold to one Grass
                gym. Keep a Pokémon of every gym's weakness on the bench -- swap in for Badge runs.
            </FactPanel>
            <FactPanel title="Run Away" accent="#94a3b8" icon="🏃">
                Fleeing is always an option (one slot in the battle menu). It costs your battle
                streak but not the run. If a wild encounter outclasses you by 5+ levels, RUN.
            </FactPanel>
            <FactPanel title="Double Up Items" accent="#67e8f9" icon="🎁">
                Loot drops scale with: Streak + Trainer Bond + Scavenger Cache keystone. Late-run,
                <b> 50%+</b> of trainer wins drop a Held Item. Don't sell rare drops; bench them.
            </FactPanel>
        </div>

        <ProTip>
            <b>The "perfect run" sequence:</b> stack Trainer Bond by clearing every trainer in your
            first 3 chunks → engage a fight wearing Lucky Egg → push toward your gym while the bond
            and battle streak compound. By Badge 3 you'll be 1.5x ahead of the level curve.
        </ProTip>

        <Callout icon="🎮" title="Found a bug?" tone="info">
            The Pause Menu's <b>Save → Export</b> button copies a JSON dump of your run. If something
            goes weird, share that file with the dev to make the next patch better.
        </Callout>
    </>
);

// ---------------------------------------------------------------------------
// SECTION REGISTRY
// ---------------------------------------------------------------------------

const SECTIONS: SectionMeta[] = [
    { id: 'welcome',    title: 'Welcome',         icon: '🌌', accent: '#67e8f9', teaser: "What this game is, in 30 seconds.",                  Body: WelcomeBody },
    { id: 'controls',   title: 'Controls',        icon: '🎮', accent: '#34d399', teaser: 'Every key, every shortcut.',                         Body: ControlsBody },
    { id: 'loop',       title: 'The Loop',        icon: '🔁', accent: '#fbbf24', teaser: 'Pick → walk → fight → catch → repeat.',              Body: LoopBody },
    { id: 'battles',    title: 'Battles',         icon: '⚔️', accent: '#a78bfa', teaser: 'Doubles, types, fusion, stat stages.',               Body: BattlesBody },
    { id: 'catching',   title: 'Catching',        icon: '🎯', accent: '#f472b6', teaser: 'Permits, balls, chains, shinies.',                   Body: CatchingBody },
    { id: 'bond',       title: 'Trainer Bond',    icon: '🤝', accent: '#fb923c', teaser: 'The buff that rewards engaging trainers.',           Body: TrainerBondBody },
    { id: 'world',      title: 'The World',       icon: '🌍', accent: '#22d3ee', teaser: 'Biomes, buildings, signposts, events.',              Body: WorldBody },
    { id: 'items',      title: 'Items',           icon: '🎒', accent: '#84cc16', teaser: 'Bag, held items, evolution stones.',                 Body: ItemsBody },
    { id: 'atelier',    title: 'Rift Atelier',    icon: '💎', accent: '#c084fc', teaser: 'Permanent upgrades between runs.',                   Body: AtelierBody },
    { id: 'multi',      title: 'Multiplayer',     icon: '🌐', accent: '#10b981', teaser: 'Invite a friend, fight as a team.',                  Body: MultiplayerBody },
    { id: 'tips',       title: 'Tips & Tricks',   icon: '🧠', accent: '#f59e0b', teaser: 'Non-obvious power moves.',                           Body: TipsBody },
];

// ---------------------------------------------------------------------------
// ROOT
// ---------------------------------------------------------------------------

export const FieldGuide: React.FC<{
    /** Initial section to focus -- handy for context-sensitive launches
     *  ("you just unlocked Tera, here's the page about it"). */
    initialSectionId?: string;
    onBack: () => void;
}> = ({ initialSectionId, onBack }) => {
    useEscapeKey(onBack);
    const [activeId, setActiveId] = useState<string>(() => {
        if (initialSectionId && SECTIONS.some(s => s.id === initialSectionId)) return initialSectionId;
        return SECTIONS[0].id;
    });

    const active = useMemo(() => SECTIONS.find(s => s.id === activeId) ?? SECTIONS[0], [activeId]);

    // Keyboard nav: arrows / WS to move, number keys to jump.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping = !!target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            );
            if (isTyping) return;

            const idx = SECTIONS.findIndex(s => s.id === activeId);
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                const next = SECTIONS[(idx + 1) % SECTIONS.length];
                playSound(clickSfx);
                setActiveId(next.id);
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                const next = SECTIONS[(idx - 1 + SECTIONS.length) % SECTIONS.length];
                playSound(clickSfx);
                setActiveId(next.id);
            } else if (/^[0-9]$/.test(e.key)) {
                // 1..9 => 0..8, 0 => 9, then wrap modulo. Skips silently if
                // the number is past the section count.
                const n = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
                if (SECTIONS[n]) {
                    playSound(clickSfx);
                    setActiveId(SECTIONS[n].id);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeId]);

    const ActiveBody = active.Body;

    return (
        <div className="absolute inset-0 z-[200] overflow-y-auto custom-scrollbar bg-[#020617]">
            {/* Backdrop matches the menu family with a green/cyan tint to
                signal "this is the help / encyclopedia screen". */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.85) 0%, rgba(6,15,30,0.94) 100%), url(${MENU_BACKGROUND_URL})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.55, 0.85, 0.55] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        background: 'radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(56,189,248,0.18) 0%, transparent 55%)',
                    }}
                />

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(28)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: `${(i * 137) % 100}%`,
                                y: `${(i * 91) % 100}%`,
                                opacity: 0,
                            }}
                            animate={{
                                y: [`${(i * 91) % 100}%`, `${((i * 91) % 100) - 30}%`],
                                opacity: [0, 0.65, 0],
                            }}
                            transition={{
                                duration: 6 + (i % 5) * 1.4,
                                repeat: Infinity,
                                delay: i * 0.25,
                                ease: 'easeOut',
                            }}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                                background: i % 3 === 0 ? '#34d399' : i % 3 === 1 ? '#67e8f9' : '#fbbf24',
                                boxShadow: `0 0 10px ${i % 3 === 0 ? '#34d399' : i % 3 === 1 ? '#67e8f9' : '#fbbf24'}`,
                                filter: 'blur(0.5px)',
                            }}
                        />
                    ))}
                </div>

                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-emerald-400/30 m-6 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-cyan-300/30 m-6 rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-cyan-300/30 m-6 rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-emerald-400/30 m-6 rounded-br-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="relative text-center mb-8"
                >
                    <PokeballWatermark className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-24" opacity={0.08} />
                    <BrandEyebrow color="#34d399">
                        <span className="inline-flex items-center gap-2">
                            <span className="inline-block w-6 h-[1px] bg-emerald-300/70" />
                            How To Play & Game Reference
                            <span className="inline-block w-6 h-[1px] bg-emerald-300/70" />
                        </span>
                    </BrandEyebrow>

                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="mt-3"
                    >
                        <BrandTitle size="lg">TRAINER'S HANDBOOK</BrandTitle>
                    </motion.div>

                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="h-[2px] w-14 bg-emerald-400/50" />
                        <p className="text-emerald-200/80 text-[9px] tracking-[0.45em] uppercase">
                            Everything You Need To Survive
                        </p>
                        <div className="h-[2px] w-14 bg-cyan-300/50" />
                    </div>
                </motion.div>

                {/* Master-detail layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
                    {/* Sidebar */}
                    <div className="flex flex-col gap-2 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1 custom-scrollbar">
                        {SECTIONS.map((s, i) => {
                            const isActive = s.id === activeId;
                            return (
                                <motion.button
                                    key={s.id}
                                    onClick={() => { playSound(clickSfx); setActiveId(s.id); }}
                                    className="text-left rounded-xl border p-3 transition-all relative overflow-hidden group"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.03 }}
                                    style={{
                                        background: isActive
                                            ? `linear-gradient(135deg, ${s.accent}33 0%, rgba(2,6,23,0.92) 100%)`
                                            : 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(2,6,23,0.85) 100%)',
                                        borderColor: isActive ? `${s.accent}aa` : 'rgba(148,163,184,0.15)',
                                        boxShadow: isActive ? `0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px ${s.accent}55` : undefined,
                                    }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-rule"
                                            className="absolute left-0 top-0 bottom-0 w-1"
                                            style={{ background: s.accent, boxShadow: `0 0 12px ${s.accent}` }}
                                        />
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                                            style={{
                                                background: isActive
                                                    ? `linear-gradient(180deg, ${s.accent}cc, ${s.accent}55)`
                                                    : 'rgba(15,23,42,0.7)',
                                                border: `1px solid ${isActive ? s.accent : 'rgba(148,163,184,0.2)'}`,
                                            }}
                                        >
                                            {s.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono tabular-nums opacity-50">
                                                    {String(SECTIONS.indexOf(s) + 1).padStart(2, '0')}
                                                </span>
                                                <span
                                                    className="font-black text-sm uppercase tracking-wider truncate"
                                                    style={{ color: isActive ? s.accent : '#e2e8f0' }}
                                                >
                                                    {s.title}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400/85 mt-0.5 leading-tight">
                                                {s.teaser}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}

                        {/* Back button anchored at bottom of sidebar on desktop */}
                        <button
                            onClick={() => { playSound(clickSfx); onBack(); }}
                            className="mt-3 group relative bg-amber-500 hover:bg-amber-400 px-4 py-3 rounded-xl text-xs border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all font-black uppercase tracking-[0.3em] overflow-hidden text-black"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                ⟵ Main Menu
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </button>
                    </div>

                    {/* Detail panel */}
                    <div
                        className="rounded-3xl border-2 p-4 md:p-6 relative overflow-hidden lg:max-h-[72vh] lg:overflow-y-auto custom-scrollbar"
                        style={{
                            borderColor: `${active.accent}55`,
                            background: `linear-gradient(160deg, ${active.accent}10 0%, rgba(15,10,35,0.85) 40%, rgba(2,6,23,0.95) 100%)`,
                            boxShadow: `0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 1px ${active.accent}22`,
                        }}
                    >
                        <div
                            className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{ background: `linear-gradient(90deg, transparent 0%, ${active.accent} 50%, transparent 100%)` }}
                        />
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.28 }}
                            >
                                <ActiveBody />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer hint row */}
                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-slate-500 uppercase tracking-[0.3em]">
                    <span className="flex items-center gap-1.5"><KeyCap>↑</KeyCap><KeyCap>↓</KeyCap> navigate</span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center gap-1.5"><KeyCap>1</KeyCap>-<KeyCap>9</KeyCap> jump</span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center gap-1.5"><KeyCap>Esc</KeyCap> back</span>
                </div>
            </div>
        </div>
    );
};
