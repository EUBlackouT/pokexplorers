import React, { useState, useMemo } from 'react';
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

const TAB_META: Record<Tab, { label: string; accent: string }> = {
    all:       { label: 'All',        accent: '#fbbf24' },
    pokeball:  { label: 'Poké Balls', accent: '#ef4444' },
    healing:   { label: 'Healing',    accent: '#22c55e' },
    battle:    { label: 'Battle',     accent: '#3b82f6' },
    evolution: { label: 'Evolution',  accent: '#a855f7' },
};

export const ShopMenu: React.FC<{
    onClose: () => void;
    money: number;
    inventory: any;
    onBuy: (item: string, price: number) => void;
    discount?: number;
}> = ({ onClose, money, inventory, onBuy, discount = 0 }) => {
    const [activeTab, setActiveTab] = useState<Tab>('all');
    useEscapeKey(onClose);

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
        return (inventory.items as string[]).filter((i) => i === itemId).length;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-press-start">
            <MenuBackdrop accent="#3b82f6" />

            <MenuCard maxWidth="max-w-4xl" className="h-[88vh] max-h-[860px] flex flex-col">
                {/* Header strip */}
                <div
                    className="relative flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.1) 50%, rgba(30,64,175,0.35) 100%)',
                    }}
                >
                    <PokeballWatermark className="absolute top-4 right-4 w-14 h-14" />
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <BrandEyebrow color="#93c5fd">Poké Mart</BrandEyebrow>
                            <BrandTitle size="md" className="mt-1">SUPPLY TERMINAL</BrandTitle>
                            {discount > 0 && (
                                <div className="text-[9px] uppercase tracking-widest text-emerald-300 mt-2">
                                    Member discount: −{Math.round(discount * 100)}%
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

                {/* Item grid */}
                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
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
                                        {/* Left color rail */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accent }} />

                                        {/* Icon tile */}
                                        <div
                                            className="w-14 h-14 rounded-lg border border-white/10 flex items-center justify-center shrink-0"
                                            style={{ background: 'rgba(2,6,23,0.7)' }}
                                        >
                                            <img
                                                src={item.icon}
                                                className="w-10 h-10 object-contain drop-shadow"
                                                alt={item.name}
                                                referrerPolicy="no-referrer"
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>

                                        {/* Name + desc */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[10px] uppercase font-black tracking-wider truncate text-white">
                                                    {item.name}
                                                </div>
                                                <div
                                                    className="text-[8px] uppercase font-black px-1.5 py-[2px] rounded-full whitespace-nowrap"
                                                    style={{ color: accent, background: `${accent}22`, border: `1px solid ${accent}55` }}
                                                >
                                                    ×{owned}
                                                </div>
                                            </div>
                                            <div className="text-[7px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
                                                {item.description}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-mono font-black text-amber-300 leading-none">
                                                ${item.price}
                                            </div>
                                            <div className="text-[7px] uppercase text-slate-500 tracking-widest mt-0.5">
                                                {canAfford ? 'Buy' : 'Short'}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
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
