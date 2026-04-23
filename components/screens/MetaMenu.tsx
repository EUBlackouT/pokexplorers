/**
 * Rift Atelier v3 -- "Pokémon game" visual overhaul
 * ---------------------------------------------------
 * Between-run upgrade screen. Three branches:
 *
 *   1. TALENTS  -- one-time buys with run-shaping effects (Essence only).
 *   2. KEYSTONES -- tiered stat/utility tracks (Essence only, level 0..cap).
 *   3. VAULT    -- rare "chase" unlocks (Essence + Rift Tokens). Home of
 *                   the marquee mechanics: Terastallization, Mega Evolution,
 *                   Z-Moves. Plus a handful of utility unlocks.
 *
 * The screen reads every entry from `data/meta.ts` -- this file is pure
 * presentation + purchase/refund handlers. Adding a new talent/keystone/
 * vault item is a one-line edit in `data/meta.ts`.
 *
 * Visual direction:
 *   - Big hero backdrop (same MENU_BACKGROUND_URL as main menu, purple
 *     tinted) with Ken Burns drift + floating rift sparks.
 *   - Pokémon-style gold-on-blue BrandTitle logo.
 *   - Chunky tactile tab buttons with the main-menu "border-b-8 press"
 *     language.
 *   - TCG-style cards: oversized iconography, gem-pip level readouts,
 *     shimmer sweeps on the marquee mechanics.
 *   - Corner bracket accents matching the main menu.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerGlobalState } from '../../types';
import { playSound, playLevelUpSfx } from '../../services/soundService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { MENU_BACKGROUND_URL } from '../../services/imageService';
import {
    BrandTitle,
    BrandEyebrow,
    PokeballWatermark,
} from '../ui/MenuKit';
import {
    TALENTS,
    KEYSTONES,
    VAULT,
    TOKEN_AWARDS,
    getKeystoneLevel,
    getKeystoneCost,
    getKeystoneSpent,
    REFRACT_RATE,
    hasTalent,
    hasVaultUnlock,
    migrateMeta,
    type TalentDef,
    type KeystoneDef,
    type VaultDef,
} from '../../data/meta';

const clickSfx = 'https://www.soundjay.com/button/sounds/button-16.mp3';

type Tab = 'talents' | 'keystones' | 'vault';

// ---------------------------------------------------------------------------
// ROOT
// ---------------------------------------------------------------------------
export const MetaMenu: React.FC<{
    state: PlayerGlobalState;
    setState: React.Dispatch<React.SetStateAction<PlayerGlobalState>>;
    onBack: () => void;
}> = ({ state, setState, onBack }) => {
    useEscapeKey(onBack);
    const [tab, setTab] = useState<Tab>('keystones');
    const [confirmRefund, setConfirmRefund] = useState<
        { kind: 'talent'; id: string } | { kind: 'keystone'; id: string } | null
    >(null);

    // Self-heal: if we're looking at an old-shape meta save, migrate it
    // once on mount. We never want to show the user a half-broken menu
    // just because they loaded an old file.
    React.useEffect(() => {
        const m = state.meta;
        const isV1 =
            !m.talents ||
            !m.vaultUnlocks ||
            !m.keystones ||
            typeof m.riftTokens !== 'number';
        if (isV1) {
            setState(prev => ({ ...prev, meta: migrateMeta(prev.meta) }));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const meta = state.meta;
    const essence = meta.riftEssence;
    const tokens = meta.riftTokens ?? 0;

    // --- Purchase handlers -------------------------------------------------

    const buyTalent = (t: TalentDef) => {
        if (hasTalent(meta, t.id) || essence < t.cost) return;
        if ((t.requires || []).some(r => !hasTalent(meta, r))) return;
        playSound(clickSfx);
        playLevelUpSfx();
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - t.cost,
                talents: [...(prev.meta.talents || []), t.id],
            },
        }));
    };

    const buyKeystone = (k: KeystoneDef) => {
        const level = getKeystoneLevel(meta, k.id);
        if (level >= k.cap) return;
        const cost = getKeystoneCost(k, level);
        if (essence < cost) return;
        playSound(clickSfx);
        playLevelUpSfx();
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - cost,
                keystones: {
                    ...(prev.meta.keystones || {}),
                    [k.id]: (prev.meta.keystones?.[k.id] || 0) + 1,
                },
            },
        }));
    };

    const buyVault = (v: VaultDef) => {
        if (hasVaultUnlock(meta, v.id)) return;
        if (tokens < v.tokenCost || essence < v.essenceCost) return;
        if ((v.requires || []).some(r => !hasVaultUnlock(meta, r))) return;
        playSound(clickSfx);
        playLevelUpSfx();
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - v.essenceCost,
                riftTokens: (prev.meta.riftTokens || 0) - v.tokenCost,
                vaultUnlocks: [...(prev.meta.vaultUnlocks || []), v.id],
            },
        }));
    };

    const refundTalent = (t: TalentDef) => {
        const refund = Math.floor(t.cost * REFRACT_RATE);
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence + refund,
                talents: (prev.meta.talents || []).filter(id => id !== t.id),
            },
        }));
        setConfirmRefund(null);
    };

    const refundKeystone = (k: KeystoneDef) => {
        const level = getKeystoneLevel(meta, k.id);
        const spent = getKeystoneSpent(k, level);
        const refund = Math.floor(spent * REFRACT_RATE);
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence + refund,
                keystones: { ...(prev.meta.keystones || {}), [k.id]: 0 },
            },
        }));
        setConfirmRefund(null);
    };

    // --- Summary strip -----------------------------------------------------

    const summary = useMemo(() => {
        const talentCount = (meta.talents || []).length;
        const vaultCount = (meta.vaultUnlocks || []).length;
        const keystoneTotal = KEYSTONES.reduce(
            (acc, k) => acc + getKeystoneLevel(meta, k.id), 0);
        return { talentCount, vaultCount, keystoneTotal };
    }, [meta]);

    const tabTheme: Record<Tab, { accent: string; shadow: string; border: string; label: string; eyebrow: string }> = {
        keystones: { accent: '#60a5fa', shadow: '#1d4ed8', border: '#1e3a8a', label: 'Keystones', eyebrow: 'Stat Tracks' },
        talents:   { accent: '#c084fc', shadow: '#7c3aed', border: '#5b21b6', label: 'Talents',   eyebrow: 'Run Shapers' },
        vault:     { accent: '#fbbf24', shadow: '#b45309', border: '#78350f', label: 'The Vault', eyebrow: 'Chase Unlocks' },
    };
    const theme = tabTheme[tab];

    return (
        <div className="min-h-screen relative overflow-y-auto font-press-start text-white">
            {/* -- Hero backdrop (same vista as main menu, purple-tinted) -- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: `url(${MENU_BACKGROUND_URL})` }}
                    initial={{ scale: 1.08 }}
                    animate={{ scale: [1.08, 1.14, 1.08] }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Heavy purple rift tint so the screen reads as a different "room" than the main menu */}
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, rgba(49,23,91,0.85) 0%, rgba(17,7,37,0.92) 45%, rgba(2,6,23,0.97) 100%)',
                }} />
                {/* Readability wash */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                {/* Side vignette */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

                {/* Pulsing rift orbs -- big atmospheric blobs */}
                <div className="absolute top-[10%] left-[8%] w-[380px] h-[380px] rounded-full blur-[140px] animate-pulse"
                     style={{ background: 'rgba(168,85,247,0.35)' }} />
                <div className="absolute bottom-[10%] right-[8%] w-[420px] h-[420px] rounded-full blur-[150px] animate-pulse"
                     style={{ background: 'rgba(251,191,36,0.18)', animationDelay: '1.5s' }} />
                <div className="absolute top-[35%] right-[30%] w-[260px] h-[260px] rounded-full blur-[120px] animate-pulse"
                     style={{ background: 'rgba(34,211,238,0.15)', animationDelay: '3s' }} />

                {/* Floating rift sparks */}
                <div className="absolute inset-0 overflow-hidden">
                    {RIFT_SPARKS.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: s.x, y: s.y, opacity: 0 }}
                            animate={{
                                y: [s.y, s.y - 180 - Math.random() * 120],
                                opacity: [0, 0.7, 0],
                                scale: [0, 1, 0],
                            }}
                            transition={{
                                duration: 5 + (i % 5) * 1.4,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: 'easeOut',
                            }}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                                background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#c084fc' : '#67e8f9',
                                boxShadow: `0 0 8px ${i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#c084fc' : '#67e8f9'}`,
                                filter: 'blur(0.5px)',
                            }}
                        />
                    ))}
                </div>

                {/* Corner accent brackets (main menu parity) */}
                <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-purple-400/30 m-6 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-amber-300/30 m-6 rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-amber-300/30 m-6 rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-purple-400/30 m-6 rounded-br-3xl" />
            </div>

            {/* -- Content -- */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-10 py-8 md:py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="relative text-center mb-10"
                >
                    <PokeballWatermark className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-24" opacity={0.08} />
                    <BrandEyebrow color="#fcd34d">
                        <span className="inline-flex items-center gap-2">
                            <span className="inline-block w-6 h-[1px] bg-amber-300/70" />
                            Between-Run Meta Progression
                            <span className="inline-block w-6 h-[1px] bg-amber-300/70" />
                        </span>
                    </BrandEyebrow>

                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="mt-3"
                    >
                        <BrandTitle size="lg">RIFT ATELIER</BrandTitle>
                    </motion.div>

                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="h-[2px] w-14 bg-purple-400/50" />
                        <p className="text-purple-200/80 text-[9px] tracking-[0.45em] uppercase">
                            Forge Your Next Run
                        </p>
                        <div className="h-[2px] w-14 bg-amber-300/50" />
                    </div>
                </motion.div>

                {/* Currency + progress HUD */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
                    <CoinBadge
                        label="Rift Essence"
                        value={essence.toLocaleString()}
                        accent="#c084fc"
                        glyph="◆"
                        className="md:col-span-1"
                    />
                    <CoinBadge
                        label="Rift Tokens"
                        value={tokens.toLocaleString()}
                        accent="#fbbf24"
                        glyph="★"
                        className="md:col-span-1"
                    />
                    <ProgressPip label="Talents"        value={`${summary.talentCount}/${TALENTS.length}`}                                  accent="#c084fc" />
                    <ProgressPip label="Keystone Ranks" value={`${summary.keystoneTotal}/${KEYSTONES.reduce((a, k) => a + k.cap, 0)}`}        accent="#60a5fa" />
                    <ProgressPip label="Vault Unlocks"  value={`${summary.vaultCount}/${VAULT.length}`}                                       accent="#fbbf24" />
                </div>

                {/* Chunky tactile tab buttons (main-menu language) */}
                <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6">
                    {(['keystones', 'talents', 'vault'] as Tab[]).map((t) => (
                        <TabPushButton
                            key={t}
                            tab={t}
                            active={tab === t}
                            theme={tabTheme[t]}
                            onClick={() => { playSound(clickSfx); setTab(t); }}
                        />
                    ))}
                </div>

                {/* Content pane */}
                <div
                    className="rounded-3xl border-2 p-4 md:p-6 relative overflow-hidden"
                    style={{
                        borderColor: `${theme.accent}55`,
                        background: `linear-gradient(160deg, ${theme.accent}10 0%, rgba(15,10,35,0.85) 40%, rgba(2,6,23,0.95) 100%)`,
                        boxShadow: `0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 1px ${theme.accent}22`,
                    }}
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-[3px]"
                        style={{ background: `linear-gradient(90deg, transparent 0%, ${theme.accent} 50%, transparent 100%)` }}
                    />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            {tab === 'keystones' && (
                                <KeystonesTab
                                    meta={meta}
                                    buyKeystone={buyKeystone}
                                    onRefund={(id) => setConfirmRefund({ kind: 'keystone', id })}
                                />
                            )}
                            {tab === 'talents' && (
                                <TalentsTab
                                    meta={meta}
                                    buyTalent={buyTalent}
                                    onRefund={(id) => setConfirmRefund({ kind: 'talent', id })}
                                />
                            )}
                            {tab === 'vault' && (
                                <VaultTab meta={meta} buyVault={buyVault} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer back -- same chunky language as main menu "Continue" */}
                <div className="max-w-sm mx-auto mt-10">
                    <BigPushButton
                        onClick={onBack}
                        color="amber"
                        icon="⟵"
                    >
                        Return to Menu
                    </BigPushButton>
                </div>
            </div>

            {/* Refund confirmation modal */}
            <AnimatePresence>
                {confirmRefund && (
                    <RefundModal
                        confirm={confirmRefund}
                        meta={meta}
                        onCancel={() => setConfirmRefund(null)}
                        onConfirm={(target) => {
                            if (target.kind === 'talent') {
                                const t = TALENTS.find(x => x.id === target.id);
                                if (t) refundTalent(t);
                            } else {
                                const k = KEYSTONES.find(x => x.id === target.id);
                                if (k) refundKeystone(k);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ===========================================================================
// COMPENDIUM LAYOUT -- master (list) + detail (hero) for all three tabs
// ===========================================================================

/**
 * Shared shell: left sticky-ish scrollable list, right large detail pane.
 * On mobile: stacks, list first, detail below.
 */
const CompendiumShell: React.FC<{
    intro: React.ReactNode;
    list: React.ReactNode;
    detail: React.ReactNode;
    extraTop?: React.ReactNode;
}> = ({ intro, list, detail, extraTop }) => (
    <>
        {intro}
        {extraTop}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-5">
            <div className="flex flex-col gap-2 max-h-[68vh] overflow-y-auto pr-1 custom-scrollbar">
                {list}
            </div>
            <AnimatePresence mode="wait">
                {detail}
            </AnimatePresence>
        </div>
    </>
);

// Compact clickable entry row (shared across all three tabs)
const CompendiumRow: React.FC<{
    accent: string;
    selected: boolean;
    owned?: boolean;
    dim?: boolean;
    iconUrl: string;
    name: string;
    eyebrow: string;
    trailing?: React.ReactNode;
    onClick: () => void;
    animationDelay?: number;
}> = ({ accent, selected, owned, dim, iconUrl, name, eyebrow, trailing, onClick, animationDelay = 0 }) => (
    <motion.button
        onClick={onClick}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay }}
        className="relative text-left rounded-xl border-2 px-2.5 py-2 flex items-center gap-2.5 transition-all active:translate-x-0.5 overflow-hidden"
        style={{
            borderColor: selected ? accent : owned ? `${accent}88` : `${accent}33`,
            background: selected
                ? `linear-gradient(90deg, ${accent}45 0%, rgba(15,10,35,0.85) 80%)`
                : owned
                    ? `linear-gradient(90deg, ${accent}22 0%, rgba(10,6,28,0.85) 85%)`
                    : 'linear-gradient(90deg, rgba(15,10,35,0.65) 0%, rgba(2,6,23,0.85) 100%)',
            boxShadow: selected
                ? `inset 0 0 0 1px ${accent}66, 0 0 16px ${accent}44`
                : 'none',
        }}
    >
        {/* selected chevron */}
        {selected && (
            <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
        )}
        <RuneIcon url={iconUrl} accent={accent} size="sm" dim={dim} glow={owned && !dim} />
        <div className="flex-1 min-w-0">
            <div className="text-[7px] uppercase tracking-[0.25em]" style={{ color: `${accent}cc` }}>{eyebrow}</div>
            <div className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: selected ? '#f8fafc' : dim ? '#94a3b8' : '#e2e8f0' }}>
                {name}
            </div>
        </div>
        {trailing}
    </motion.button>
);

// ---------------------------------------------------------------------------
// KEYSTONES TAB -- master-detail compendium
// ---------------------------------------------------------------------------
const KeystonesTab: React.FC<{
    meta: PlayerGlobalState['meta'];
    buyKeystone: (k: KeystoneDef) => void;
    onRefund: (id: string) => void;
}> = ({ meta, buyKeystone, onRefund }) => {
    const [selectedId, setSelectedId] = useState<string>(KEYSTONES[0].id);
    const selected = useMemo(() => KEYSTONES.find(k => k.id === selectedId) ?? KEYSTONES[0], [selectedId]);

    return (
        <CompendiumShell
            intro={
                <SectionIntro
                    color="#60a5fa"
                    title="Keystone Tracks"
                    body="Themed tiered boosts -- damage, speed, economy, scaling, collection, loot. Every rank is chunky. Refract any track to reclaim 80% of the Essence you spent on it."
                />
            }
            list={KEYSTONES.map((k, i) => {
                const level = getKeystoneLevel(meta, k.id);
                const cost = level >= k.cap ? 0 : getKeystoneCost(k, level);
                const canAfford = meta.riftEssence >= cost;
                const maxed = level >= k.cap;
                return (
                    <CompendiumRow
                        key={k.id}
                        accent={k.accent}
                        selected={selectedId === k.id}
                        owned={level > 0}
                        iconUrl={k.icon}
                        name={k.name}
                        eyebrow={maxed ? 'Max Rank' : canAfford ? 'Upgradable' : `${cost} ◆`}
                        onClick={() => { playSound(clickSfx); setSelectedId(k.id); }}
                        animationDelay={i * 0.02}
                        trailing={
                            <div className="flex flex-col items-end gap-0.5">
                                <span
                                    className="text-[8px] font-black tabular-nums px-1.5 py-[1px] rounded-full"
                                    style={{
                                        color: maxed ? '#0f172a' : k.accent,
                                        background: maxed ? k.accent : `${k.accent}22`,
                                        border: `1px solid ${k.accent}66`,
                                        boxShadow: maxed ? `0 0 8px ${k.accent}` : 'none',
                                    }}
                                >
                                    LV {level}/{k.cap}
                                </span>
                            </div>
                        }
                    />
                );
            })}
            detail={
                <KeystoneDetail
                    key={selected.id}
                    k={selected}
                    meta={meta}
                    onBuy={() => buyKeystone(selected)}
                    onRefund={() => onRefund(selected.id)}
                />
            }
        />
    );
};

const KeystoneDetail: React.FC<{
    k: KeystoneDef;
    meta: PlayerGlobalState['meta'];
    onBuy: () => void;
    onRefund: () => void;
}> = ({ k, meta, onBuy, onRefund }) => {
    const level = getKeystoneLevel(meta, k.id);
    const maxed = level >= k.cap;
    const cost = maxed ? 0 : getKeystoneCost(k, level);
    const canAfford = meta.riftEssence >= cost;
    const spent = getKeystoneSpent(k, level);
    const nextRefund = Math.floor(spent * REFRACT_RATE);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="relative rounded-2xl border-2 overflow-hidden"
            style={{
                borderColor: `${k.accent}66`,
                background: `radial-gradient(ellipse at top, ${k.accent}25 0%, rgba(10,6,28,0.92) 55%, rgba(2,6,23,0.98) 100%)`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.55), inset 0 0 0 1px ${k.accent}33`,
            }}
        >
            {/* Pulsing radial aura */}
            <motion.div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
                animate={{ opacity: [0.22, 0.45, 0.22], scale: [1, 1.1, 1] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: k.accent, filter: 'blur(100px)' }}
            />
            {canAfford && !maxed && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                    style={{
                        background: `linear-gradient(110deg, transparent 0%, ${k.accent}22 50%, transparent 100%)`,
                        width: '55%',
                    }}
                />
            )}
            <div className="absolute top-0 left-0 right-0 h-[3px]"
                 style={{ background: `linear-gradient(90deg, transparent 0%, ${k.accent} 50%, transparent 100%)` }} />

            <div className="relative p-5 md:p-6 text-center">
                {/* Giant hex icon */}
                <div className="relative flex justify-center mb-4">
                    <div
                        className="relative w-28 h-28 rounded-2xl flex items-center justify-center rotate-45 border-2"
                        style={{
                            borderColor: k.accent,
                            background: `linear-gradient(135deg, ${k.accent}55 0%, rgba(2,6,23,0.9) 80%)`,
                            boxShadow: `0 0 36px ${k.accent}aa, inset 0 0 0 2px ${k.accent}55`,
                        }}
                    >
                        <div className="-rotate-45">
                            <img
                                src={k.icon}
                                alt=""
                                className="w-20 h-20 object-contain"
                                style={{ imageRendering: 'pixelated' as any, filter: `drop-shadow(0 0 8px ${k.accent}aa)` }}
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    </div>
                </div>

                {/* Name title (mini brand style) */}
                <div className="text-[9px] uppercase tracking-[0.45em] mb-1" style={{ color: `${k.accent}cc` }}>
                    Stat Track · Keystone
                </div>
                <h3
                    className="text-2xl md:text-3xl font-black italic tracking-tight"
                    style={{
                        color: '#ffcb05',
                        textShadow: `0 3px 0 ${k.accent}, 0 6px 14px rgba(0,0,0,0.55)`,
                        WebkitTextStroke: `1.5px ${k.accent}`,
                        paintOrder: 'stroke fill',
                    }}
                >
                    {k.name.toUpperCase()}
                </h3>

                {/* Level pip tree */}
                <div className="mt-5 flex justify-center">
                    <LevelPipTree level={level} cap={k.cap} accent={k.accent} />
                </div>

                {/* Description + per-level effect */}
                <p className="text-[10px] md:text-[11px] text-slate-200/90 leading-relaxed mt-5 max-w-lg mx-auto">
                    {k.desc}
                </p>
                <div
                    className="mt-4 mx-auto inline-block px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-black tracking-wide"
                    style={{
                        background: `linear-gradient(90deg, ${k.accent}25 0%, ${k.accent}10 100%)`,
                        color: k.accent,
                        borderLeft: `3px solid ${k.accent}`,
                        borderRight: `3px solid ${k.accent}`,
                    }}
                >
                    + per level · {k.perLevel}
                </div>

                {/* Economy readout */}
                <div className="grid grid-cols-3 gap-2 mt-5 max-w-md mx-auto">
                    <EconStat label="Next Cost"   value={maxed ? '—'          : `${cost} ◆`}      accent={k.accent} dim={maxed} />
                    <EconStat label="Invested"   value={`${spent} ◆`}                            accent={k.accent} />
                    <EconStat label="Refract"    value={level === 0 ? '—'    : `${nextRefund} ◆`} accent="#fca5a5" dim={level === 0} />
                </div>
            </div>

            <div className="relative px-5 md:px-6 pb-5 md:pb-6 grid grid-cols-4 gap-3">
                <CardPushButton
                    onClick={onBuy}
                    disabled={!canAfford || maxed}
                    accent={k.accent}
                    tall
                    className="col-span-3"
                >
                    {maxed
                        ? 'Max Rank Reached'
                        : canAfford
                            ? <>Upgrade to LV {level + 1} <span className="ml-1 opacity-90">· {cost} ◆</span></>
                            : <>Need {cost} ◆</>}
                </CardPushButton>
                <button
                    onClick={onRefund}
                    disabled={level === 0}
                    title="Refract: refund 80% of Essence spent"
                    className="py-3.5 rounded-xl text-[9px] uppercase font-black tracking-widest bg-slate-800/80 border border-rose-400/20 hover:border-rose-400/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:translate-y-0.5 shadow-[0_4px_0_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_rgba(0,0,0,0.5)]"
                >
                    ↺ Refract
                </button>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// TALENTS TAB -- master-detail compendium
// ---------------------------------------------------------------------------
const TalentsTab: React.FC<{
    meta: PlayerGlobalState['meta'];
    buyTalent: (t: TalentDef) => void;
    onRefund: (id: string) => void;
}> = ({ meta, buyTalent, onRefund }) => {
    const [selectedId, setSelectedId] = useState<string>(TALENTS[0].id);
    const selected = useMemo(() => TALENTS.find(t => t.id === selectedId) ?? TALENTS[0], [selectedId]);

    return (
        <CompendiumShell
            intro={
                <SectionIntro
                    color="#c084fc"
                    title="Talents"
                    body="One-time Essence unlocks that reshape how a run plays. Own it or don't -- no grinding levels. Refract any time to reclaim 80% of what you spent."
                />
            }
            list={TALENTS.map((t, i) => {
                const owned = hasTalent(meta, t.id);
                const locked = (t.requires || []).some(r => !hasTalent(meta, r));
                const canAfford = !owned && meta.riftEssence >= t.cost && !locked;
                return (
                    <CompendiumRow
                        key={t.id}
                        accent={t.accent}
                        selected={selectedId === t.id}
                        owned={owned}
                        dim={!owned && !canAfford}
                        iconUrl={t.icon}
                        name={t.name}
                        eyebrow={owned ? 'Owned' : locked ? 'Locked' : canAfford ? 'Ready' : `${t.cost} ◆`}
                        onClick={() => { playSound(clickSfx); setSelectedId(t.id); }}
                        animationDelay={i * 0.02}
                        trailing={
                            owned ? (
                                <span
                                    className="text-[7px] font-black px-1.5 py-[2px] rounded-full"
                                    style={{ background: t.accent, color: '#0f172a', boxShadow: `0 0 8px ${t.accent}` }}
                                >
                                    ✓
                                </span>
                            ) : locked ? (
                                <span className="text-[10px]">🔒</span>
                            ) : null
                        }
                    />
                );
            })}
            detail={
                <TalentDetail
                    key={selected.id}
                    t={selected}
                    meta={meta}
                    onBuy={() => buyTalent(selected)}
                    onRefund={() => onRefund(selected.id)}
                />
            }
        />
    );
};

const TalentDetail: React.FC<{
    t: TalentDef;
    meta: PlayerGlobalState['meta'];
    onBuy: () => void;
    onRefund: () => void;
}> = ({ t, meta, onBuy, onRefund }) => {
    const owned = hasTalent(meta, t.id);
    const locked = (t.requires || []).some(r => !hasTalent(meta, r));
    const canAfford = !owned && meta.riftEssence >= t.cost && !locked;
    const refund = Math.floor(t.cost * REFRACT_RATE);
    const missing = (t.requires || []).filter(r => !hasTalent(meta, r))
        .map(r => TALENTS.find(x => x.id === r)?.name ?? r);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="relative rounded-2xl border-2 overflow-hidden"
            style={{
                borderColor: owned ? t.accent : `${t.accent}66`,
                background: owned
                    ? `radial-gradient(ellipse at top, ${t.accent}40 0%, rgba(14,8,32,0.92) 55%, rgba(2,6,23,0.98) 100%)`
                    : `radial-gradient(ellipse at top, ${t.accent}22 0%, rgba(10,6,28,0.92) 55%, rgba(2,6,23,0.98) 100%)`,
                boxShadow: owned
                    ? `0 20px 40px ${t.accent}33, inset 0 0 0 1px ${t.accent}99`
                    : `0 20px 40px rgba(0,0,0,0.55), inset 0 0 0 1px ${t.accent}33`,
            }}
        >
            <motion.div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
                animate={{ opacity: [0.22, owned ? 0.65 : 0.45, 0.22], scale: [1, 1.1, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: t.accent, filter: 'blur(100px)' }}
            />
            {canAfford && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                    style={{
                        background: `linear-gradient(110deg, transparent 0%, ${t.accent}30 50%, transparent 100%)`,
                        width: '55%',
                    }}
                />
            )}
            <div className="absolute top-0 left-0 right-0 h-[3px]"
                 style={{ background: `linear-gradient(90deg, transparent 0%, ${t.accent} 50%, transparent 100%)` }} />

            {/* Status flag */}
            {owned && (
                <div className="absolute top-3 right-3 z-10">
                    <OwnedSeal accent={t.accent} label="ACTIVE" />
                </div>
            )}
            {!owned && locked && (
                <div className="absolute top-3 right-3 z-10 text-[8px] font-black px-2 py-[3px] rounded-full border border-rose-400/50 text-rose-200 bg-rose-950/60 uppercase tracking-[0.3em]">
                    🔒 Locked
                </div>
            )}

            <div className="relative p-5 md:p-6 text-center">
                {/* Giant amulet icon (circular for talents) */}
                <div className="relative flex justify-center mb-4">
                    <div
                        className="relative w-28 h-28 rounded-full flex items-center justify-center border-2"
                        style={{
                            borderColor: t.accent,
                            background: `radial-gradient(circle at 30% 30%, ${t.accent}55 0%, rgba(2,6,23,0.9) 75%)`,
                            boxShadow: `0 0 36px ${t.accent}aa, inset 0 0 0 2px ${t.accent}55`,
                        }}
                    >
                        <img
                            src={t.icon}
                            alt=""
                            className="w-20 h-20 object-contain"
                            style={{ imageRendering: 'pixelated' as any, filter: `drop-shadow(0 0 8px ${t.accent}aa)` }}
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        {owned && (
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 pointer-events-none"
                                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
                                transition={{ duration: 2.2, repeat: Infinity }}
                                style={{ borderColor: t.accent, boxShadow: `0 0 20px ${t.accent}` }}
                            />
                        )}
                    </div>
                </div>

                <div className="text-[9px] uppercase tracking-[0.45em] mb-1" style={{ color: `${t.accent}cc` }}>
                    Run Shaper · Talent
                </div>
                <h3
                    className="text-2xl md:text-3xl font-black italic tracking-tight"
                    style={{
                        color: '#ffcb05',
                        textShadow: `0 3px 0 ${t.accent}, 0 6px 14px rgba(0,0,0,0.55)`,
                        WebkitTextStroke: `1.5px ${t.accent}`,
                        paintOrder: 'stroke fill',
                    }}
                >
                    {t.name.toUpperCase()}
                </h3>

                <p className="text-[10px] md:text-[11px] text-slate-200/90 leading-relaxed mt-5 max-w-lg mx-auto">
                    {t.desc}
                </p>
                <p className="text-[10px] italic mt-4 max-w-lg mx-auto" style={{ color: t.accent }}>
                    <span className="opacity-70">"</span>{t.flavor}<span className="opacity-70">"</span>
                </p>

                {missing.length > 0 && (
                    <div
                        className="mt-4 inline-block px-3 py-1.5 rounded-md text-[9px] font-black tracking-wide"
                        style={{
                            background: 'rgba(244,63,94,0.15)',
                            color: '#fca5a5',
                            borderLeft: '3px solid #f43f5e',
                        }}
                    >
                        Requires: {missing.join(' · ')}
                    </div>
                )}
            </div>

            <div className="relative px-5 md:px-6 pb-5 md:pb-6 grid grid-cols-4 gap-3">
                <CardPushButton
                    onClick={onBuy}
                    disabled={owned || !canAfford}
                    accent={t.accent}
                    tall
                    className="col-span-3"
                >
                    {owned
                        ? '✓ Talent Active'
                        : locked
                            ? 'Requires Prereq'
                            : canAfford
                                ? <>Unlock Talent <span className="ml-1 opacity-90">· {t.cost} ◆</span></>
                                : <>Need {t.cost} ◆</>}
                </CardPushButton>
                <button
                    onClick={onRefund}
                    disabled={!owned}
                    title={`Refract: refund ${refund} ◆ (80%)`}
                    className="py-3.5 rounded-xl text-[9px] uppercase font-black tracking-widest bg-slate-800/80 border border-rose-400/20 hover:border-rose-400/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:translate-y-0.5 shadow-[0_4px_0_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_rgba(0,0,0,0.5)]"
                >
                    ↺ Refract
                </button>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// VAULT TAB -- master-detail compendium + collapsible earning ledger
// ---------------------------------------------------------------------------
const VaultTab: React.FC<{
    meta: PlayerGlobalState['meta'];
    buyVault: (v: VaultDef) => void;
}> = ({ meta, buyVault }) => {
    const [selectedId, setSelectedId] = useState<string>(VAULT.find(v => v.tier === 'mechanic')?.id || VAULT[0].id);
    const [ledgerOpen, setLedgerOpen] = useState(false);
    const selected = useMemo(() => VAULT.find(v => v.id === selectedId) ?? VAULT[0], [selectedId]);
    const mechanic = VAULT.filter(v => v.tier === 'mechanic');
    const utility = VAULT.filter(v => v.tier === 'utility');

    return (
        <CompendiumShell
            intro={
                <SectionIntro
                    color="#fbbf24"
                    title="The Vault"
                    body="Rare unlocks paid in Essence AND Rift Tokens. Tokens come from the hardest content: Gyms, Rivals, Alphas, Anomalies, Mass Outbreaks, the Champion."
                />
            }
            extraTop={
                <EarningLedger open={ledgerOpen} onToggle={() => setLedgerOpen(v => !v)} />
            }
            list={
                <>
                    <ListGroupLabel color="#fbbf24" label="Chase Mechanics" pulse />
                    {mechanic.map((v, i) => (
                        <VaultRow
                            key={v.id}
                            v={v}
                            meta={meta}
                            selected={selectedId === v.id}
                            onClick={() => { playSound(clickSfx); setSelectedId(v.id); }}
                            delay={i * 0.02}
                            tierLabel="Mechanic"
                        />
                    ))}
                    <div className="mt-2" />
                    <ListGroupLabel color="#22d3ee" label="Utility Unlocks" />
                    {utility.map((v, i) => (
                        <VaultRow
                            key={v.id}
                            v={v}
                            meta={meta}
                            selected={selectedId === v.id}
                            onClick={() => { playSound(clickSfx); setSelectedId(v.id); }}
                            delay={(mechanic.length + i) * 0.02}
                            tierLabel="Utility"
                        />
                    ))}
                </>
            }
            detail={
                selected.tier === 'mechanic'
                    ? <MechanicDetail key={selected.id} v={selected} meta={meta} buy={() => buyVault(selected)} />
                    : <UtilityDetail key={selected.id} v={selected} meta={meta} buy={() => buyVault(selected)} />
            }
        />
    );
};

// Vault row (extends CompendiumRow with dual-cost trailing pill)
const VaultRow: React.FC<{
    v: VaultDef;
    meta: PlayerGlobalState['meta'];
    selected: boolean;
    onClick: () => void;
    delay: number;
    tierLabel: string;
}> = ({ v, meta, selected, onClick, delay, tierLabel }) => {
    const owned = hasVaultUnlock(meta, v.id);
    const locked = (v.requires || []).some(r => !hasVaultUnlock(meta, r));
    const canAffordTokens = (meta.riftTokens || 0) >= v.tokenCost;
    const canAffordEssence = meta.riftEssence >= v.essenceCost;
    const canAfford = !owned && canAffordTokens && canAffordEssence && !locked;
    return (
        <CompendiumRow
            accent={v.accent}
            selected={selected}
            owned={owned}
            dim={!owned && !canAfford}
            iconUrl={v.icon}
            name={v.name}
            eyebrow={owned ? 'Unlocked' : locked ? 'Locked' : tierLabel}
            onClick={onClick}
            animationDelay={delay}
            trailing={
                owned ? (
                    <span className="text-[7px] font-black px-1.5 py-[2px] rounded-full"
                          style={{ background: v.accent, color: '#0f172a', boxShadow: `0 0 8px ${v.accent}` }}>
                        ✓
                    </span>
                ) : (
                    <div className="flex flex-col items-end gap-[2px]">
                        <span className="text-[7px] font-black tabular-nums" style={{ color: canAffordTokens ? '#fbbf24' : '#64748b' }}>
                            ★ {v.tokenCost}
                        </span>
                        <span className="text-[7px] font-black tabular-nums" style={{ color: canAffordEssence ? '#c084fc' : '#64748b' }}>
                            ◆ {v.essenceCost}
                        </span>
                    </div>
                )
            }
        />
    );
};

// Mechanic detail -- the marquee treatment (Tera/Mega/Z)
const MechanicDetail: React.FC<{
    v: VaultDef;
    meta: PlayerGlobalState['meta'];
    buy: () => void;
}> = ({ v, meta, buy }) => {
    const owned = hasVaultUnlock(meta, v.id);
    const locked = (v.requires || []).some(r => !hasVaultUnlock(meta, r));
    const canAffordTokens = (meta.riftTokens || 0) >= v.tokenCost;
    const canAffordEssence = meta.riftEssence >= v.essenceCost;
    const canAfford = !owned && canAffordTokens && canAffordEssence && !locked;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="relative rounded-2xl border-2 overflow-hidden"
            style={{
                borderColor: owned ? v.accent : `${v.accent}77`,
                background: owned
                    ? `radial-gradient(ellipse at top, ${v.accent}55 0%, rgba(14,6,32,0.92) 55%, rgba(2,6,23,0.98) 100%)`
                    : `radial-gradient(ellipse at top, ${v.accent}28 0%, rgba(10,6,28,0.92) 55%, rgba(2,6,23,0.98) 100%)`,
                boxShadow: owned
                    ? `0 22px 44px ${v.accent}44, inset 0 0 0 1px ${v.accent}aa`
                    : `0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 1px ${v.accent}44`,
            }}
        >
            <motion.div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
                animate={{ opacity: [0.28, owned ? 0.7 : 0.55, 0.28], scale: [1, 1.12, 1] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: v.accent, filter: 'blur(110px)' }}
            />
            {canAfford && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
                    style={{
                        background: `linear-gradient(110deg, transparent 0%, ${v.accent}33 50%, transparent 100%)`,
                        width: '55%',
                    }}
                />
            )}
            <div className="absolute top-0 left-0 right-0 h-[3px]"
                 style={{ background: `linear-gradient(90deg, transparent 0%, ${v.accent} 50%, transparent 100%)` }} />

            {/* Corner flag */}
            <div
                className="absolute top-3 right-3 text-[7px] uppercase font-black tracking-[0.35em] px-2 py-[3px] rounded-full border z-10"
                style={{
                    color: v.accent, borderColor: `${v.accent}88`, background: `${v.accent}20`,
                    boxShadow: `0 0 10px ${v.accent}55`,
                }}
            >
                ⟐ Mechanic
            </div>

            <div className="relative p-6 md:p-8 text-center">
                {/* Giant crystalline icon */}
                <div className="relative flex justify-center mb-5">
                    <div
                        className="relative w-32 h-32 rounded-2xl flex items-center justify-center rotate-45 border-2"
                        style={{
                            borderColor: v.accent,
                            background: `linear-gradient(135deg, ${v.accent}55 0%, rgba(2,6,23,0.9) 80%)`,
                            boxShadow: `0 0 44px ${v.accent}aa, inset 0 0 0 2px ${v.accent}55`,
                        }}
                    >
                        <div className="-rotate-45">
                            <img
                                src={v.icon}
                                alt=""
                                className="w-24 h-24 object-contain"
                                style={{ imageRendering: 'pixelated' as any, filter: `drop-shadow(0 0 10px ${v.accent}cc)` }}
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                        {owned && (
                            <motion.div
                                className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2.2, repeat: Infinity }}
                                style={{ borderColor: v.accent, boxShadow: `0 0 28px ${v.accent}` }}
                            />
                        )}
                    </div>
                </div>

                <div className="text-[9px] uppercase tracking-[0.45em] mb-1" style={{ color: `${v.accent}cc` }}>
                    Chase Mechanic · Vault
                </div>
                <h3
                    className="text-3xl md:text-4xl font-black italic tracking-tight"
                    style={{
                        color: '#ffcb05',
                        textShadow: `0 4px 0 ${v.accent}, 0 8px 16px rgba(0,0,0,0.6)`,
                        WebkitTextStroke: `2px ${v.accent}`,
                        paintOrder: 'stroke fill',
                    }}
                >
                    {v.name.toUpperCase()}
                </h3>

                <p className="text-[10px] md:text-[11px] text-slate-200/90 leading-relaxed mt-5 max-w-xl mx-auto">
                    {v.desc}
                </p>
                <p className="text-[10px] md:text-[11px] italic mt-3 max-w-xl mx-auto" style={{ color: v.accent }}>
                    <span className="opacity-70">"</span>{v.flavor}<span className="opacity-70">"</span>
                </p>

                <div className="flex items-center justify-center gap-3 mt-6">
                    <CostPill icon="★" label="Tokens"  value={v.tokenCost}   accent="#fbbf24" satisfied={canAffordTokens || owned} />
                    <CostPill icon="◆" label="Essence" value={v.essenceCost} accent="#c084fc" satisfied={canAffordEssence || owned} />
                </div>
            </div>

            <div className="relative px-6 md:px-8 pb-6 md:pb-8">
                {owned ? (
                    <div
                        className="w-full py-4 rounded-xl text-center text-[11px] uppercase font-black tracking-[0.4em]"
                        style={{
                            background: `linear-gradient(180deg, ${v.accent} 0%, ${v.accent}cc 100%)`,
                            color: '#0f172a',
                            boxShadow: `0 6px 0 ${v.accent}66, 0 0 28px ${v.accent}77`,
                        }}
                    >
                        ✓ Permanently Unlocked
                    </div>
                ) : (
                    <CardPushButton onClick={buy} disabled={!canAfford} accent={v.accent} tall>
                        {locked ? 'Requires Prereq' : canAfford ? 'Unlock Mechanic' : 'Not Enough Resources'}
                    </CardPushButton>
                )}
            </div>
        </motion.div>
    );
};

// Utility detail -- same structure, less extravagant
const UtilityDetail: React.FC<{
    v: VaultDef;
    meta: PlayerGlobalState['meta'];
    buy: () => void;
}> = ({ v, meta, buy }) => {
    const owned = hasVaultUnlock(meta, v.id);
    const locked = (v.requires || []).some(r => !hasVaultUnlock(meta, r));
    const canAffordTokens = (meta.riftTokens || 0) >= v.tokenCost;
    const canAffordEssence = meta.riftEssence >= v.essenceCost;
    const canAfford = !owned && canAffordTokens && canAffordEssence && !locked;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="relative rounded-2xl border-2 overflow-hidden"
            style={{
                borderColor: owned ? v.accent : `${v.accent}66`,
                background: owned
                    ? `radial-gradient(ellipse at top, ${v.accent}35 0%, rgba(12,8,30,0.92) 55%, rgba(2,6,23,0.98) 100%)`
                    : `radial-gradient(ellipse at top, ${v.accent}20 0%, rgba(10,6,28,0.92) 55%, rgba(2,6,23,0.98) 100%)`,
                boxShadow: owned
                    ? `0 18px 36px ${v.accent}33, inset 0 0 0 1px ${v.accent}99`
                    : `0 18px 36px rgba(0,0,0,0.55), inset 0 0 0 1px ${v.accent}33`,
            }}
        >
            <motion.div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
                animate={{ opacity: [0.18, 0.4, 0.18], scale: [1, 1.1, 1] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: v.accent, filter: 'blur(90px)' }}
            />
            <div className="absolute top-0 left-0 right-0 h-[3px]"
                 style={{ background: `linear-gradient(90deg, transparent 0%, ${v.accent} 50%, transparent 100%)` }} />
            {owned && (
                <div className="absolute top-3 right-3 z-10">
                    <OwnedSeal accent={v.accent} label="UNLOCKED" />
                </div>
            )}

            <div className="relative p-5 md:p-6 text-center">
                <div className="relative flex justify-center mb-4">
                    <div
                        className="relative w-24 h-24 rounded-xl flex items-center justify-center border-2"
                        style={{
                            borderColor: v.accent,
                            background: `radial-gradient(circle at 30% 30%, ${v.accent}55 0%, rgba(2,6,23,0.9) 75%)`,
                            boxShadow: `0 0 28px ${v.accent}aa, inset 0 0 0 2px ${v.accent}55`,
                        }}
                    >
                        <img
                            src={v.icon}
                            alt=""
                            className="w-16 h-16 object-contain"
                            style={{ imageRendering: 'pixelated' as any, filter: `drop-shadow(0 0 8px ${v.accent}aa)` }}
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                </div>

                <div className="text-[9px] uppercase tracking-[0.45em] mb-1" style={{ color: `${v.accent}cc` }}>
                    Utility · Vault
                </div>
                <h3
                    className="text-xl md:text-2xl font-black italic tracking-tight"
                    style={{
                        color: '#ffcb05',
                        textShadow: `0 3px 0 ${v.accent}, 0 6px 12px rgba(0,0,0,0.55)`,
                        WebkitTextStroke: `1.2px ${v.accent}`,
                        paintOrder: 'stroke fill',
                    }}
                >
                    {v.name.toUpperCase()}
                </h3>

                <p className="text-[10px] md:text-[11px] text-slate-200/90 leading-relaxed mt-4 max-w-lg mx-auto">
                    {v.desc}
                </p>
                <p className="text-[10px] italic mt-3 max-w-lg mx-auto" style={{ color: v.accent }}>
                    <span className="opacity-70">"</span>{v.flavor}<span className="opacity-70">"</span>
                </p>

                <div className="flex items-center justify-center gap-3 mt-5">
                    <CostPill icon="★" label="Tokens"  value={v.tokenCost}   accent="#fbbf24" satisfied={canAffordTokens || owned} />
                    <CostPill icon="◆" label="Essence" value={v.essenceCost} accent="#c084fc" satisfied={canAffordEssence || owned} />
                </div>
            </div>
            <div className="relative px-5 md:px-6 pb-5 md:pb-6">
                {owned ? (
                    <div
                        className="w-full py-3 rounded-xl text-center text-[10px] uppercase font-black tracking-[0.4em]"
                        style={{
                            background: `linear-gradient(180deg, ${v.accent} 0%, ${v.accent}cc 100%)`,
                            color: '#0f172a',
                            boxShadow: `0 4px 0 ${v.accent}55, 0 0 22px ${v.accent}66`,
                        }}
                    >
                        ✓ Unlocked
                    </div>
                ) : (
                    <CardPushButton onClick={buy} disabled={!canAfford} accent={v.accent} tall>
                        {locked ? 'Requires Prereq' : canAfford ? 'Unlock Utility' : 'Not Enough Resources'}
                    </CardPushButton>
                )}
            </div>
        </motion.div>
    );
};

// -- Collapsible earning ledger --------------------------------------------
const EarningLedger: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border-2 mb-4 overflow-hidden"
        style={{
            borderColor: '#fbbf2455',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(10,6,28,0.9) 50%, rgba(2,6,23,0.97) 100%)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.5), inset 0 0 0 1px #fbbf2422',
        }}
    >
        <button
            onClick={onToggle}
            className="w-full flex items-center gap-3 p-3 md:p-4 text-left hover:bg-amber-400/10 transition-colors"
        >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black shrink-0"
                 style={{ background: 'linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)', boxShadow: '0 0 14px #fbbf2488' }}>
                ★
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[8px] uppercase tracking-[0.35em] text-amber-300">Earning Ledger</div>
                <h4 className="text-[10px] md:text-[11px] uppercase font-black tracking-wide text-amber-200">
                    How to Earn Rift Tokens
                </h4>
            </div>
            <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-amber-300 text-sm font-black"
            >
                ▾
            </motion.span>
        </button>
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                >
                    <div className="px-3 md:px-4 pb-3 md:pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-[8px]">
                        <TokenSource label="Gym Leader"          value={`+${TOKEN_AWARDS.gymLeader}`} />
                        <TokenSource label="Rival Milestone"     value={`+${TOKEN_AWARDS.rivalMilestone}`} />
                        <TokenSource label="Alpha Catch"         value={`+${TOKEN_AWARDS.alphaCatch}`} />
                        <TokenSource label="Anomaly Catch"       value={`+${TOKEN_AWARDS.anomalyCatch}`} />
                        <TokenSource label="Mass Outbreak"       value={`+${TOKEN_AWARDS.outbreakFirstEncounter}`} />
                        <TokenSource label="Rift Trial Clear"    value={`+${TOKEN_AWARDS.riftTrialClear}`} />
                        <TokenSource label="Rift Champion"       value={`+${TOKEN_AWARDS.championClear}`} highlight />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

// -- Group label inside the compendium list --------------------------------
const ListGroupLabel: React.FC<{ color: string; label: string; pulse?: boolean }> = ({ color, label, pulse }) => (
    <div className="flex items-center gap-2 px-1 pt-1 pb-0.5">
        <motion.span
            animate={pulse ? { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] } : undefined}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        <h5 className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color }}>{label}</h5>
        <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(to right, ${color}66, transparent)` }} />
    </div>
);


// ---------------------------------------------------------------------------
// REFUND MODAL
// ---------------------------------------------------------------------------
const RefundModal: React.FC<{
    confirm: { kind: 'talent' | 'keystone'; id: string };
    meta: PlayerGlobalState['meta'];
    onCancel: () => void;
    onConfirm: (target: { kind: 'talent' | 'keystone'; id: string }) => void;
}> = ({ confirm, meta, onCancel, onConfirm }) => {
    const { name, refund, desc } = useMemo(() => {
        if (confirm.kind === 'talent') {
            const t = TALENTS.find(x => x.id === confirm.id)!;
            return { name: t.name, refund: Math.floor(t.cost * REFRACT_RATE), desc: 'This talent will be removed.' };
        }
        const k = KEYSTONES.find(x => x.id === confirm.id)!;
        const level = getKeystoneLevel(meta, k.id);
        const spent = getKeystoneSpent(k, level);
        return { name: k.name, refund: Math.floor(spent * REFRACT_RATE), desc: `All ${level} rank(s) will be reset.` };
    }, [confirm, meta]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-press-start"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 16 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="max-w-md w-full rounded-3xl border-2 border-rose-400/40 p-6 text-center relative overflow-hidden"
                style={{ background: 'radial-gradient(ellipse at top, rgba(244,63,94,0.22) 0%, rgba(15,10,35,0.95) 55%, rgba(2,6,23,0.98) 100%)' }}
                onClick={e => e.stopPropagation()}
            >
                <PokeballWatermark className="absolute -top-2 -right-2 w-20 h-20" opacity={0.08} />
                <BrandEyebrow color="#fca5a5">Refract Essence</BrandEyebrow>
                <h3 className="text-xl font-black italic tracking-tight mt-2"
                    style={{
                        color: '#ffcb05',
                        textShadow: '0 3px 0 #be123c, 0 6px 12px rgba(0,0,0,0.5)',
                        WebkitTextStroke: '1.5px #be123c',
                        paintOrder: 'stroke fill',
                    }}>
                    {name}
                </h3>
                <p className="text-[10px] text-slate-200 mt-4">{desc}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                    You'll reclaim <span className="text-purple-300 font-black">{refund} ◆ Essence</span>
                    <span className="opacity-60"> · {Math.floor(REFRACT_RATE * 100)}% rate</span>
                </p>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="py-3 rounded-xl text-[10px] uppercase font-black tracking-widest bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(confirm)}
                        className="py-3 rounded-xl text-[10px] uppercase font-black tracking-widest text-black border-b-4 active:border-b-0 active:translate-y-1 transition-all"
                        style={{
                            background: 'linear-gradient(180deg, #fda4af 0%, #e11d48 100%)',
                            borderColor: '#881337',
                        }}
                    >
                        ↺ Refract
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ===========================================================================
// Small presentational helpers (scoped to this screen)
// ===========================================================================

/** Pre-seeded spark positions so we don't churn `Math.random` across renders. */
const RIFT_SPARKS = Array.from({ length: 28 }, (_, i) => ({
    x: ((i * 137) % 1000) * 0.001 * (typeof window !== 'undefined' ? window.innerWidth : 1000),
    y: ((i * 229) % 1000) * 0.001 * (typeof window !== 'undefined' ? window.innerHeight : 800),
}));

// --- Currency coin badge (top of screen) ----------------------------------
const CoinBadge: React.FC<{
    label: string;
    value: string;
    accent: string;
    glyph: string;
    className?: string;
}> = ({ label, value, accent, glyph, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative rounded-2xl border-2 px-3 py-2 flex items-center gap-3 overflow-hidden ${className}`}
        style={{
            borderColor: `${accent}66`,
            background: `linear-gradient(135deg, ${accent}25 0%, rgba(12,8,30,0.9) 60%, rgba(2,6,23,0.95) 100%)`,
            boxShadow: `0 10px 20px rgba(0,0,0,0.4), inset 0 0 0 1px ${accent}33`,
        }}
    >
        <motion.div
            className="w-11 h-11 rounded-full flex items-center justify-center font-black relative shrink-0"
            animate={{ boxShadow: [`0 0 12px ${accent}66`, `0 0 22px ${accent}aa`, `0 0 12px ${accent}66`] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{
                background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${accent} 55%, ${accent}aa 100%)`,
                color: '#0f172a',
                fontSize: '18px',
                lineHeight: 1,
                border: `2px solid ${accent}`,
            }}
        >
            {glyph}
        </motion.div>
        <div className="min-w-0">
            <div className="text-[7px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>{label}</div>
            <div className="text-lg md:text-xl font-mono font-black text-white leading-none mt-0.5 tabular-nums">{value}</div>
        </div>
    </motion.div>
);

const ProgressPip: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
    <div
        className="rounded-2xl border border-white/10 px-3 py-2 flex items-center justify-between gap-2"
        style={{ background: `linear-gradient(135deg, ${accent}10 0%, rgba(12,8,30,0.85) 60%, rgba(2,6,23,0.95) 100%)` }}
    >
        <div className="text-[7px] md:text-[8px] uppercase tracking-[0.25em] text-slate-400 truncate">{label}</div>
        <div className="text-sm md:text-base font-black tabular-nums" style={{ color: accent }}>{value}</div>
    </div>
);

// --- Tab push button (tactile, main-menu styling) -------------------------
const TabPushButton: React.FC<{
    tab: Tab;
    active: boolean;
    theme: { accent: string; shadow: string; border: string; label: string; eyebrow: string };
    onClick: () => void;
}> = ({ active, theme, onClick }) => (
    <button
        onClick={onClick}
        className={`relative rounded-2xl px-4 py-3 md:py-4 text-center font-black uppercase overflow-hidden transition-all active:translate-y-1 ${
            active ? 'translate-y-0.5' : ''
        }`}
        style={{
            background: active
                ? `linear-gradient(180deg, ${theme.accent} 0%, ${theme.shadow} 100%)`
                : `linear-gradient(180deg, ${theme.accent}30 0%, ${theme.accent}10 100%)`,
            color: active ? '#0f172a' : '#e2e8f0',
            borderBottom: active ? `4px solid ${theme.border}` : `6px solid ${theme.border}`,
            boxShadow: active
                ? `inset 0 0 0 2px ${theme.accent}, 0 0 24px ${theme.accent}66`
                : `0 2px 0 ${theme.border}`,
        }}
    >
        <div className="text-[8px] tracking-[0.35em] opacity-80">{theme.eyebrow}</div>
        <div className="text-sm md:text-base tracking-[0.3em] mt-0.5">{theme.label}</div>
        {/* shimmer sweep on active */}
        {active && (
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                style={{
                    background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                    width: '50%',
                }}
            />
        )}
    </button>
);

// --- Big primary "Return" button (matches main-menu press language) -------
const BigPushButton: React.FC<{
    onClick: () => void;
    color: 'amber' | 'blue' | 'emerald' | 'rose' | 'purple';
    icon?: string;
    children: React.ReactNode;
}> = ({ onClick, color, icon, children }) => {
    const palette: Record<string, { bg: string; hover: string; shadow: string; border: string; text: string }> = {
        amber:   { bg: 'bg-amber-500',   hover: 'hover:bg-amber-400',   shadow: 'shadow-[0_20px_50px_rgba(245,158,11,0.3)]', border: 'border-amber-700',   text: 'text-black' },
        blue:    { bg: 'bg-blue-600',    hover: 'hover:bg-blue-500',    shadow: 'shadow-[0_20px_50px_rgba(37,99,235,0.3)]',  border: 'border-blue-800',    text: 'text-white' },
        emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', shadow: 'shadow-[0_20px_50px_rgba(16,185,129,0.3)]', border: 'border-emerald-800', text: 'text-white' },
        rose:    { bg: 'bg-rose-600',    hover: 'hover:bg-rose-500',    shadow: 'shadow-[0_20px_50px_rgba(225,29,72,0.3)]',  border: 'border-rose-800',    text: 'text-white' },
        purple:  { bg: 'bg-purple-600',  hover: 'hover:bg-purple-500',  shadow: 'shadow-[0_20px_50px_rgba(147,51,234,0.3)]', border: 'border-purple-800',  text: 'text-white' },
    };
    const p = palette[color];
    return (
        <button
            onClick={onClick}
            className={`group relative ${p.bg} ${p.hover} px-6 py-4 rounded-2xl text-sm border-b-8 ${p.border} active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden ${p.shadow} ${p.text}`}
        >
            <span className="relative z-10 flex items-center justify-center gap-3 tracking-[0.3em]">
                {icon && <span className="text-lg">{icon}</span>}
                {children}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
    );
};

// --- Card-scoped push button ---------------------------------------------
const CardPushButton: React.FC<{
    onClick?: () => void;
    disabled?: boolean;
    accent: string;
    className?: string;
    tall?: boolean;
    compact?: boolean;
    children: React.ReactNode;
}> = ({ onClick, disabled, accent, className = '', tall, compact, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`${tall ? 'py-3.5 text-[11px]' : compact ? 'py-2 px-3 text-[8px]' : 'py-3 text-[10px]'} rounded-xl font-black uppercase tracking-[0.3em] shadow transition-all active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed w-full ${className}`}
        style={
            disabled
                ? { background: 'rgba(30,41,59,0.7)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
                : {
                    background: `linear-gradient(180deg, ${accent} 0%, ${accent}cc 100%)`,
                    color: '#0f172a',
                    borderBottom: `4px solid ${shade(accent, -0.4)}`,
                    boxShadow: `0 0 18px ${accent}40`,
                }
        }
    >
        {children}
    </button>
);

// Tiny color shade helper -- darker/lighter variant for button border-bottom.
function shade(hex: string, amount: number): string {
    // Works only on 6-char hex, returns rgba.
    const h = hex.replace('#', '');
    if (h.length !== 6) return hex;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + 255 * amount)));
    return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

// --- Owned seal (embossed) ------------------------------------------------
const OwnedSeal: React.FC<{ accent: string; label: string; compact?: boolean }> = ({ accent, label, compact }) => (
    <motion.span
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 16 }}
        className={`${compact ? 'text-[7px] px-1.5 py-[2px]' : 'text-[8px] px-2 py-[3px]'} font-black uppercase tracking-[0.25em] rounded-full whitespace-nowrap inline-flex items-center gap-1`}
        style={{
            background: `linear-gradient(180deg, ${accent} 0%, ${accent}cc 100%)`,
            color: '#0f172a',
            boxShadow: `0 0 12px ${accent}88, inset 0 0 0 1px rgba(255,255,255,0.35)`,
        }}
    >
        <span>✓</span>{label}
    </motion.span>
);

// --- Icon tile (rune-style hex wrapper) -----------------------------------
const RuneIcon: React.FC<{
    url: string;
    accent: string;
    size?: 'sm' | 'md' | 'lg';
    dim?: boolean;
    glow?: boolean;
}> = ({ url, accent, size = 'md', dim, glow }) => {
    const outer = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
    const inner = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    return (
        <div
            className={`${outer} shrink-0 rounded-xl flex items-center justify-center border-2 relative`}
            style={{
                background: dim
                    ? 'rgba(2,6,23,0.7)'
                    : `radial-gradient(circle at 30% 30%, ${accent}55 0%, rgba(2,6,23,0.8) 75%)`,
                borderColor: dim ? 'rgba(255,255,255,0.08)' : accent,
                boxShadow: dim
                    ? 'none'
                    : glow
                        ? `0 0 20px ${accent}99, inset 0 0 0 1px ${accent}66`
                        : `0 0 10px ${accent}55, inset 0 0 0 1px ${accent}44`,
            }}
        >
            <img
                src={url}
                alt=""
                className={`${inner} object-contain ${dim ? 'opacity-55' : ''}`}
                style={{ imageRendering: 'pixelated' as any, filter: glow ? `drop-shadow(0 0 6px ${accent})` : undefined }}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Tiny corner shine */}
            {!dim && (
                <span
                    className="absolute top-1 left-1 w-2 h-[3px] rounded-full opacity-75"
                    style={{ background: 'rgba(255,255,255,0.8)' }}
                />
            )}
        </div>
    );
};

// --- Level pip tree (oversized, for the detail pane) ----------------------
// Renders a row of big glowing gem pips with a connector line behind them,
// giving the keystone a "tree" feel even though it's linear.
const LevelPipTree: React.FC<{ level: number; cap: number; accent: string }> = ({ level, cap, accent }) => {
    const filledPct = cap === 0 ? 0 : Math.max(0, Math.min(1, level / cap));
    return (
        <div className="relative inline-flex flex-col items-center gap-2">
            <div className="relative flex items-center">
                {/* Connector track */}
                <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
                    style={{ background: 'rgba(148,163,184,0.18)' }}
                />
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${filledPct * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
                />
                {Array.from({ length: cap }).map((_, i) => {
                    const filled = i < level;
                    return (
                        <div
                            key={i}
                            className="relative"
                            style={{ paddingLeft: i === 0 ? 0 : 12, paddingRight: i === cap - 1 ? 0 : 12 }}
                        >
                            <motion.span
                                initial={{ scale: 0, rotate: 0 }}
                                animate={{ scale: 1, rotate: 45 }}
                                transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 20 }}
                                className="block w-5 h-5 rounded-[3px]"
                                style={{
                                    background: filled
                                        ? `linear-gradient(135deg, #fef3c7 0%, ${accent} 55%, ${accent}cc 100%)`
                                        : 'rgba(148,163,184,0.15)',
                                    border: filled ? `1.5px solid ${accent}` : '1.5px solid rgba(148,163,184,0.35)',
                                    boxShadow: filled
                                        ? `0 0 14px ${accent}, inset 0 0 0 1px rgba(255,255,255,0.4)`
                                        : 'none',
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <span className="text-[9px] uppercase tracking-[0.4em] font-black tabular-nums" style={{ color: accent }}>
                LV {level}/{cap}
            </span>
        </div>
    );
};

// --- Economy readout cell (cost / spent / refund trio) --------------------
const EconStat: React.FC<{ label: string; value: string; accent: string; dim?: boolean }> = ({ label, value, accent, dim }) => (
    <div
        className="rounded-lg border px-2 py-1.5"
        style={{
            borderColor: dim ? 'rgba(148,163,184,0.18)' : `${accent}44`,
            background: dim ? 'rgba(15,23,42,0.5)' : `linear-gradient(180deg, ${accent}18 0%, rgba(15,23,42,0.6) 100%)`,
        }}
    >
        <div className="text-[7px] uppercase tracking-[0.3em] text-slate-400">{label}</div>
        <div className="text-sm font-black tabular-nums" style={{ color: dim ? '#64748b' : accent }}>
            {value}
        </div>
    </div>
);

// --- Cost pill -------------------------------------------------------------
const CostPill: React.FC<{
    icon: string;
    label: string;
    value: number;
    accent: string;
    satisfied: boolean;
    compact?: boolean;
}> = ({ icon, label, value, accent, satisfied, compact }) => (
    <div
        className={`flex items-center gap-1.5 rounded-full border ${compact ? 'px-2 py-[3px] text-[8px]' : 'px-3 py-1.5 text-[9px]'} font-black`}
        style={{
            borderColor: satisfied ? `${accent}66` : 'rgba(148,163,184,0.25)',
            background: satisfied ? `${accent}18` : 'rgba(30,41,59,0.6)',
            color: satisfied ? accent : '#64748b',
            boxShadow: satisfied ? `0 0 10px ${accent}33` : 'none',
        }}
    >
        <span className="text-sm leading-none">{icon}</span>
        <span className="tabular-nums">{value}</span>
        {label && <span className="opacity-70 uppercase tracking-widest text-[7px] ml-0.5">{label}</span>}
    </div>
);

// --- Section intro ruler --------------------------------------------------
const SectionIntro: React.FC<{ title: string; body: string; color: string }> = ({ title, body, color }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] flex-1" style={{ background: `linear-gradient(to right, transparent, ${color}66)` }} />
            <h3 className="text-[10px] uppercase tracking-[0.45em]" style={{ color }}>{title}</h3>
            <div className="h-[2px] flex-1" style={{ background: `linear-gradient(to left, transparent, ${color}66)` }} />
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed text-center italic max-w-2xl mx-auto">{body}</p>
    </div>
);

// --- Token source cell ----------------------------------------------------
const TokenSource: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div
        className="flex items-center justify-between rounded-md px-2 py-1.5"
        style={{
            border: highlight ? '1px solid #fbbf24aa' : '1px solid rgba(255,255,255,0.08)',
            background: highlight
                ? 'linear-gradient(90deg, rgba(251,191,36,0.16) 0%, rgba(30,41,59,0.5) 100%)'
                : 'rgba(30,41,59,0.55)',
            boxShadow: highlight ? '0 0 12px #fbbf2433' : 'none',
        }}
    >
        <span className="uppercase tracking-wider truncate pr-2 text-slate-300">{label}</span>
        <span className="font-black text-amber-300 tabular-nums">{value}</span>
    </div>
);
