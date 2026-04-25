import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ITEMS } from '../../services/itemData';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
    MenuBackdrop,
    MenuCard,
    BrandTitle,
    BrandEyebrow,
    CurrencyChip,
    PushButton,
    PokeballWatermark,
} from '../ui/MenuKit';

type Tab = 'all' | 'pokeball' | 'healing' | 'battle' | 'evolution';
type Mode = 'buy' | 'sell';

const TAB_META: Record<Tab, { label: string; accent: string }> = {
    all:       { label: 'All',        accent: '#fbbf24' },
    pokeball:  { label: 'Poké Balls', accent: '#ef4444' },
    healing:   { label: 'Healing',    accent: '#22c55e' },
    battle:    { label: 'Battle',     accent: '#3b82f6' },
    evolution: { label: 'Evolution',  accent: '#a855f7' },
};

/** Sell price for an item. Honors `sellPriceOverride` on ITEMS (e.g. the
 *  classic 1g Master Ball / Rare Candy that prevent farming exploits) and
 *  falls back to a 50%-of-buy default for everything else. Floor at 1 so
 *  we don't accidentally hit a free-sell case. */
const sellPriceFor = (item: { price: number; sellPriceOverride?: number }) => {
    if (typeof item.sellPriceOverride === 'number') return Math.max(1, item.sellPriceOverride);
    return Math.max(1, Math.floor(item.price / 2));
};

export const ShopMenu: React.FC<{
    onClose: () => void;
    money: number;
    inventory: any;
    onBuy: (item: string, price: number) => void;
    /** Sell handler: itemId, unit price, qty. Optional for backward compat
     *  with any other entry points -- if absent, the Sell tab is hidden. */
    onSell?: (itemId: string, unitPrice: number, qty: number) => void;
    /** Initial mode (buy/sell). Set by the shopkeeper-NPC choice prompt
     *  so picking "Sell" lands directly on the Sell tab. */
    initialMode?: Mode;
    discount?: number;
}> = ({ onClose, money, inventory, onBuy, onSell, initialMode = 'buy', discount = 0 }) => {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    useEscapeKey(onClose);

    useEffect(() => { setMode(initialMode); }, [initialMode]);

    const shopItems = useMemo(
        () =>
            Object.values(ITEMS)
                .map((item) => ({ ...item, price: Math.floor(item.price * (1 - discount)) }))
                .filter((item) => activeTab === 'all' || item.category === activeTab),
        [activeTab, discount],
    );

    const ownedCount = (itemId: string): number => {
        if (itemId === 'poke-ball') return inventory.pokeballs ?? 0;
        if (itemId === 'potion') return inventory.potions ?? 0;
        if (itemId === 'revive') return inventory.revives ?? 0;
        if (itemId === 'rare-candy') return inventory.rare_candy ?? 0;
        return ((inventory.items as string[]) ?? []).filter((i) => i === itemId).length;
    };

    /** All items in inventory expressed as ITEMS-records (for the Sell
     *  tab). Numeric slots map to known ids; everything else flows from
     *  inventory.items[]. We DON'T sell pokeballs (capture permits) here
     *  because the cashflow loop would be exploitable -- buy a ball, sell
     *  it for half, but they're priced too cheaply for the math to work
     *  fairly across the difficulty curve. */
    const sellableInventory = useMemo(() => {
        const tally: Record<string, number> = {};
        if ((inventory.potions ?? 0) > 0)     tally['potion']     = inventory.potions;
        if ((inventory.revives ?? 0) > 0)     tally['revive']     = inventory.revives;
        if ((inventory.rare_candy ?? 0) > 0)  tally['rare-candy'] = inventory.rare_candy;
        for (const id of (inventory.items as string[] ?? [])) {
            tally[id] = (tally[id] ?? 0) + 1;
        }
        return Object.entries(tally)
            .filter(([id]) => ITEMS[id])
            // Strip out items flagged unsellable (e.g. fusion chase rewards).
            // The filter is here -- not in the buy-side -- so the player can
            // still receive these items as gifts / drops without seeing them
            // listed for resale.
            .filter(([id]) => !ITEMS[id].unsellable)
            .map(([id, qty]) => ({ ...ITEMS[id], owned: qty, sellEach: sellPriceFor(ITEMS[id]) }))
            .filter(item => activeTab === 'all' || item.category === activeTab);
    }, [inventory, activeTab]);

    const accentForMode = mode === 'buy' ? '#3b82f6' : '#22c55e';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-press-start">
            <MenuBackdrop accent={accentForMode} />

            <MenuCard maxWidth="max-w-4xl" className="h-[88vh] max-h-[860px] flex flex-col">
                {/* Header strip */}
                <div
                    className="relative flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5"
                    style={{
                        background: mode === 'buy'
                            ? 'linear-gradient(90deg, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.1) 50%, rgba(30,64,175,0.35) 100%)'
                            : 'linear-gradient(90deg, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0.1) 50%, rgba(22,101,52,0.35) 100%)',
                    }}
                >
                    <PokeballWatermark className="absolute top-4 right-4 w-14 h-14" />
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <BrandEyebrow color={mode === 'buy' ? '#93c5fd' : '#86efac'}>Poké Mart</BrandEyebrow>
                            <BrandTitle size="md" className="mt-1">{mode === 'buy' ? 'SUPPLY TERMINAL' : 'TRADE-IN COUNTER'}</BrandTitle>
                            {discount > 0 && mode === 'buy' && (
                                <div className="text-[9px] uppercase tracking-widest text-emerald-300 mt-2">
                                    Member discount: −{Math.round(discount * 100)}%
                                </div>
                            )}
                            {mode === 'sell' && (
                                <div className="text-[9px] uppercase tracking-widest text-emerald-200 mt-2">
                                    Sell prices: 50% of retail.
                                </div>
                            )}
                        </div>
                        <CurrencyChip
                            label="Credits"
                            value={`$${money.toLocaleString()}`}
                            accent="#fbbf24"
                            icon={<span className="text-black font-black text-base">$</span>}
                        />
                    </div>

                    {/* Mode (Buy/Sell) toggle */}
                    {onSell && (
                        <div className="mt-3 flex gap-1 bg-black/40 p-1 rounded-lg w-fit">
                            {(['buy', 'sell'] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className="px-4 py-1.5 rounded-md text-[9px] uppercase tracking-widest font-black transition-colors"
                                    style={{
                                        backgroundColor: mode === m
                                            ? (m === 'buy' ? '#3b82f6' : '#22c55e')
                                            : 'transparent',
                                        color: mode === m ? '#0f172a' : '#94a3b8',
                                    }}
                                >
                                    {m === 'buy' ? 'Buy' : 'Sell'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tab bar */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
                    {(Object.keys(TAB_META) as Tab[]).map((tab) => {
                        const isActive = activeTab === tab;
                        const meta = TAB_META[tab];
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="relative px-3 py-2 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all shrink-0"
                                style={{
                                    color: isActive ? '#0f172a' : '#94a3b8',
                                    backgroundColor: isActive ? meta.accent : 'rgba(255,255,255,0.04)',
                                    boxShadow: isActive ? `0 0 18px ${meta.accent}66` : 'none',
                                }}
                            >
                                {meta.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="shop-tab-accent"
                                        className="absolute -bottom-0.5 left-2 right-2 h-[2px] rounded-full"
                                        style={{ backgroundColor: meta.accent }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {mode === 'buy' ? (
                            <motion.div
                                key={'buy-' + activeTab}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
                            >
                                {shopItems.length === 0 && (
                                    <div className="md:col-span-2 text-center text-[10px] text-slate-500 uppercase tracking-widest py-16">
                                        Shelf empty in this aisle.
                                    </div>
                                )}
                                {shopItems.map((item) => {
                                    const owned = ownedCount(item.id);
                                    const canAfford = money >= item.price;
                                    const accent = TAB_META[item.category as Tab]?.accent ?? '#fbbf24';
                                    return (
                                        <motion.button
                                            key={item.id}
                                            whileHover={canAfford ? { y: -2, scale: 1.01 } : undefined}
                                            onClick={() => canAfford && onBuy(item.id, item.price)}
                                            disabled={!canAfford}
                                            className="relative p-3 rounded-xl border border-white/10 transition-colors text-left flex items-center gap-3 overflow-hidden"
                                            style={{
                                                background: canAfford
                                                    ? `linear-gradient(90deg, ${accent}18 0%, rgba(2,6,23,0.85) 100%)`
                                                    : 'rgba(2,6,23,0.6)',
                                                opacity: canAfford ? 1 : 0.45,
                                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />
                                            <div className="w-14 h-14 rounded-lg border border-white/10 flex items-center justify-center shrink-0" style={{ background: 'rgba(2,6,23,0.7)' }}>
                                                <img src={item.icon} className="w-10 h-10 object-contain drop-shadow" alt={item.name} referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-[10px] uppercase font-black tracking-wider truncate text-white">{item.name}</div>
                                                    <div className="text-[8px] uppercase font-black px-1.5 py-[2px] rounded-full whitespace-nowrap" style={{ color: accent, background: `${accent}22`, border: `1px solid ${accent}55` }}>×{owned}</div>
                                                </div>
                                                <div className="text-[7px] text-slate-400 leading-tight line-clamp-2 mt-0.5">{item.description}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-mono font-black text-amber-300 leading-none">${item.price}</div>
                                                <div className="text-[7px] uppercase text-slate-500 tracking-widest mt-0.5">{canAfford ? 'Buy' : 'Short'}</div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div
                                key={'sell-' + activeTab}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col gap-2"
                            >
                                {sellableInventory.length === 0 && (
                                    <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest py-16">
                                        Nothing in your bag to sell here.
                                    </div>
                                )}
                                {sellableInventory.map(item => (
                                    <SellRow
                                        key={item.id}
                                        item={item}
                                        onSell={(qty) => onSell?.(item.id, item.sellEach, qty)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-black/20">
                    <PushButton onClick={onClose} color="amber">
                        Close Mart
                    </PushButton>
                </div>
            </MenuCard>
        </div>
    );
};

const SellRow: React.FC<{
    item: { id: string; name: string; description: string; icon: string; sellEach: number; owned: number; category: string };
    onSell: (qty: number) => void;
}> = ({ item, onSell }) => {
    const [qty, setQty] = useState(1);
    const [confirming, setConfirming] = useState(false);
    const accent = TAB_META[item.category as Tab]?.accent ?? '#22c55e';

    useEffect(() => { if (qty > item.owned) setQty(item.owned); }, [item.owned, qty]);

    const total = qty * item.sellEach;
    const dec = () => setQty(q => Math.max(1, q - 1));
    const inc = () => setQty(q => Math.min(item.owned, q + 1));
    const max = () => setQty(item.owned);

    return (
        <div className="relative p-3 rounded-xl border border-white/10 flex items-center gap-3 overflow-hidden bg-slate-900/60">
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />
            <div className="w-14 h-14 rounded-lg border border-white/10 flex items-center justify-center shrink-0" style={{ background: 'rgba(2,6,23,0.7)' }}>
                <img src={item.icon} className="w-10 h-10 object-contain" alt={item.name} referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-black tracking-wider truncate text-white">{item.name}</div>
                <div className="text-[8px] text-slate-400 mt-0.5">Owned ×{item.owned} · ${item.sellEach} each</div>
            </div>
            {!confirming ? (
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-black/40 rounded-md border border-white/10">
                        <button onClick={dec} className="px-2 py-1 text-white hover:bg-white/10">−</button>
                        <div className="px-3 text-[11px] text-white font-mono w-10 text-center">{qty}</div>
                        <button onClick={inc} className="px-2 py-1 text-white hover:bg-white/10">+</button>
                        <button onClick={max} className="px-2 py-1 text-[8px] uppercase text-emerald-300 hover:bg-white/10 border-l border-white/10">Max</button>
                    </div>
                    <button
                        onClick={() => setConfirming(true)}
                        className="px-3 py-2 rounded-md font-black text-[10px] uppercase tracking-widest text-slate-900"
                        style={{ background: accent, boxShadow: `0 0 18px ${accent}55` }}
                    >
                        Sell ${total}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 shrink-0">
                    <div className="text-[9px] text-emerald-200 uppercase tracking-widest">Sell {qty} for ${total}?</div>
                    <button onClick={() => { onSell(qty); setConfirming(false); setQty(1); }} className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-[10px] uppercase">Confirm</button>
                    <button onClick={() => setConfirming(false)} className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-[10px] uppercase">Cancel</button>
                </div>
            )}
        </div>
    );
};
