import React from 'react';
import { PlayerGlobalState } from '../../types';
import { playSound, playLevelUpSfx } from '../../services/soundService';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const UPGRADES = [
    { id: 'startingMoney', name: 'Amulet Coin', desc: 'Start with more money', cost: 5, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/amulet-coin.png' },
    { id: 'attackBoost', name: 'Muscle Band', desc: '+5% Damage per level', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/muscle-band.png' },
    { id: 'defenseBoost', name: 'Focus Band', desc: '-5% Damage taken per level', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png' },
    { id: 'speedBoost', name: 'Swift Wing', desc: '+5% Speed per level', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/swift-wing.png' },
    { id: 'critBoost', name: 'Scope Lens', desc: '+2% Crit chance per level', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/scope-lens.png' },
    { id: 'healingBoost', name: 'Shell Bell', desc: '+5% Healing effectiveness', cost: 12, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shell-bell.png' },
    { id: 'xpMultiplier', name: 'Lucky Egg', desc: 'Earn more XP from battles', cost: 8, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png' },
    { id: 'startingPermits', name: 'Permit Bag', desc: 'Start with more Capture Permits', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' },
    { id: 'captureBoost', name: 'Catching Charm', desc: '+5% Catch rate per level', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/catching-charm.png' },
    { id: 'essenceMultiplier', name: 'Relic Gold', desc: '+10% Essence earned per level', cost: 20, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/relic-gold.png' },
    { id: 'shinyChance', name: 'Shiny Charm', desc: 'Higher shiny encounter rate', cost: 12, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-charm.png' },
    { id: 'lootQuality', name: 'Dowsing Machine', desc: 'Better items from battle drops', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dowsing-machine.png' },
    { id: 'riftStability', name: 'Timer Ball', desc: 'Slower overworld level scaling', cost: 20, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/timer-ball.png' },
    { id: 'mercenaryGuild', name: 'Choice Band', desc: 'Start with random held items', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/choice-band.png' },
    { id: 'evolutionaryInsight', name: 'Member Card', desc: 'Cheaper items in all shops', cost: 12, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/member-card.png' },
];

const PACKS = [
    { id: 'sinnoh', name: 'Sinnoh Pack', desc: 'Unlock Turtwig, Chimchar, Piplup', cost: 25, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lunar-wing.png' },
    { id: 'johto', name: 'Johto Pack', desc: 'Unlock Chikorita, Cyndaquil, Totodile', cost: 25, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rainbow-wing.png' },
    { id: 'hoenn', name: 'Hoenn Pack', desc: 'Unlock Treecko, Torchic, Mudkip', cost: 25, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/red-orb.png' },
    { id: 'pseudo', name: 'Dragon Den', desc: 'Unlock Dratini, Larvitar, Bagon', cost: 50, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-fang.png' },
    { id: 'mythic', name: 'Mythical Rift', desc: 'Unlock Mew, Celebi, Jirachi', cost: 100, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/azure-flute.png' },
];

const getUpgradeCost = (baseCost: number, level: number) =>
    Math.floor(baseCost * Math.pow(1.6, level));

export const MetaMenu: React.FC<{
    state: PlayerGlobalState;
    setState: React.Dispatch<React.SetStateAction<PlayerGlobalState>>;
    onBack: () => void;
}> = ({ state, setState, onBack }) => {
    useEscapeKey(onBack);
    const buyUpgrade = (id: string, cost: number) => {
        if (state.meta.riftEssence < cost) return;
        playSound('https://www.soundjay.com/button/sounds/button-16.mp3');
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - cost,
                upgrades: {
                    ...prev.meta.upgrades,
                    [id]: (prev.meta.upgrades[id as keyof typeof prev.meta.upgrades] || 0) + 1
                }
            }
        }));
        playLevelUpSfx();
    };

    const buyPack = (id: string, cost: number) => {
        if (state.meta.riftEssence < cost || state.meta.unlockedPacks.includes(id)) return;
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - cost,
                unlockedPacks: [...prev.meta.unlockedPacks, id]
            }
        }));
        playLevelUpSfx();
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans flex flex-col items-center overflow-y-auto relative">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b0764_0%,transparent_70%)]"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            <div className="max-w-6xl w-full z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            Rift Upgrades
                        </h2>
                        <p className="text-gray-500 text-xs md:text-sm mt-2 uppercase tracking-[0.3em] font-bold">Temporal Enhancement Terminal</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                            <span className="text-xl">💎</span>
                        </div>
                        <div>
                            <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Available Essence</div>
                            <div className="text-2xl font-mono font-bold">{state.meta.riftEssence}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Permanent Enhancements</h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {UPGRADES.map(u => {
                                const level = state.meta.upgrades[u.id as keyof typeof state.meta.upgrades] || 0;
                                const currentCost = getUpgradeCost(u.cost, level);
                                const canAfford = state.meta.riftEssence >= currentCost;

                                return (
                                    <div key={u.id} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <img src={u.icon} alt="" className="w-16 h-16 grayscale" referrerPolicy="no-referrer" />
                                        </div>

                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 shadow-inner p-2">
                                                <img src={u.icon} alt={u.name} className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" referrerPolicy="no-referrer" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">{u.name}</h4>
                                                    <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">LVL {level}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{u.desc}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between gap-4 relative z-10">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, (level / 10) * 100)}%` }}></div>
                                            </div>
                                            <button
                                                onClick={() => buyUpgrade(u.id, currentCost)}
                                                disabled={!canAfford}
                                                className={`
                                                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                                    ${canAfford
                                                        ? 'bg-white text-black hover:bg-purple-400 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}
                                                `}
                                            >
                                                {currentCost} <span className="text-[8px]">ESSENCE</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Starter Packs</h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                        </div>

                        <div className="space-y-4">
                            {PACKS.map(p => {
                                const isUnlocked = state.meta.unlockedPacks.includes(p.id);
                                const canAfford = state.meta.riftEssence >= p.cost;

                                return (
                                    <div key={p.id} className={`
                                        group relative overflow-hidden rounded-2xl border transition-all duration-500
                                        ${isUnlocked
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-white/5 border-white/10 hover:border-white/30'}
                                    `}>
                                        <div className="p-5 flex items-center gap-4">
                                            <div className={`
                                                w-16 h-16 rounded-2xl flex items-center justify-center p-3 transition-transform duration-500 group-hover:scale-110
                                                ${isUnlocked ? 'bg-emerald-500/20' : 'bg-black/40'}
                                            `}>
                                                <img src={p.icon} alt={p.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-black uppercase tracking-tight ${isUnlocked ? 'text-emerald-400' : 'text-white'}`}>{p.name}</h4>
                                                <p className="text-[10px] text-gray-500 mt-1">{p.desc}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => buyPack(p.id, p.cost)}
                                            disabled={isUnlocked || !canAfford}
                                            className={`
                                                w-full py-3 text-[10px] font-black uppercase tracking-widest transition-all
                                                ${isUnlocked
                                                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                                    : canAfford
                                                        ? 'bg-white text-black hover:bg-emerald-400 hover:text-white'
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                            `}
                                        >
                                            {isUnlocked ? '✓ Unlocked' : `Unlock for ${p.cost} Essence`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex justify-center">
                    <button
                        onClick={onBack}
                        className="group relative px-12 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-xs hover:bg-purple-500 hover:text-white transition-all rounded-full overflow-hidden shadow-2xl"
                    >
                        <span className="relative z-10">Return to Terminal</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};
