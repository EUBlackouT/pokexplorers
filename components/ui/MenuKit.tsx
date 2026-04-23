/**
 * MenuKit
 * -------
 * Shared design primitives for all in-game menu screens. Every screen should
 * reach for these first so the whole game feels cohesive. The look is pulled
 * directly from the main menu:
 *
 *   - Slate / midnight gradient card backgrounds
 *   - Painted radial vignette backdrops (no flat black)
 *   - Pokémon-brand gold + blue title ("BrandTitle")
 *   - Amber "push" primary button with a 6px drop shadow
 *   - Color-accented Panel cards with tiny glowing dots
 *   - Type-color pill badges that read consistently
 *
 * If you reach for raw `bg-gray-800 border-4 border-white`, please stop and
 * use (or extend) one of the primitives below instead.
 */

import React from 'react';
import { motion } from 'motion/react';
import { TYPE_COLORS } from '../../services/pokeService';

// -- Backdrop ---------------------------------------------------------------

/**
 * Full-screen painted vignette. Sits behind any menu card. Covers the world
 * and blurs it out; tinted by an accent color if the screen has a theme
 * (e.g. purple for Rift Upgrades, blue for Poké Mart, indigo for Leaderboard).
 */
export const MenuBackdrop: React.FC<{
    accent?: string;
    onClick?: () => void;
    className?: string;
}> = ({ accent = '#3c5aa6', onClick, className = '' }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClick}
        className={`absolute inset-0 ${className}`}
        style={{
            background: `radial-gradient(ellipse at center, ${accent}22 0%, rgba(2,6,23,0.94) 60%, rgba(2,6,23,0.98) 100%)`,
            backdropFilter: 'blur(6px)',
        }}
    />
);

// -- Card -------------------------------------------------------------------

/**
 * The standard dark slate gradient "floating card" used for every menu.
 * Handles the shared corner radius, border, shadow, and motion entrance.
 */
export const MenuCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}> = ({ children, className = '', maxWidth = 'max-w-3xl' }) => (
    <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className={`relative w-full ${maxWidth} rounded-3xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden ${className}`}
        style={{
            background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 55%, #020617 100%)',
        }}
    >
        {children}
    </motion.div>
);

// -- Brand Title ------------------------------------------------------------

/**
 * Pokémon-branded gold-on-blue title. Identical recipe to the main menu
 * logo, just sized via className. Use as the hero text on every screen so
 * the game reads as one family.
 */
export const BrandTitle: React.FC<{
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}> = ({ children, size = 'md', className = '' }) => {
    const sizeClass =
        size === 'lg' ? 'text-4xl md:text-5xl' :
        size === 'sm' ? 'text-xl md:text-2xl' :
        'text-2xl md:text-3xl';
    const strokeWidth = size === 'lg' ? '2px' : size === 'sm' ? '1.2px' : '1.5px';
    const shadowDepth = size === 'lg' ? '4px' : size === 'sm' ? '2px' : '3px';
    return (
        <h2
            className={`${sizeClass} font-black italic tracking-tight leading-none ${className}`}
            style={{
                color: '#ffcb05',
                textShadow: `0 ${shadowDepth} 0 #3c5aa6, 0 ${parseInt(shadowDepth) * 2}px 14px rgba(0,0,0,0.55)`,
                WebkitTextStroke: `${strokeWidth} #3c5aa6`,
                paintOrder: 'stroke fill',
            }}
        >
            {children}
        </h2>
    );
};

/** Small all-caps subtitle above or below BrandTitle (e.g. "TRAINER CARD"). */
export const BrandEyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#67e8f9' }) => (
    <div className="text-[9px] uppercase tracking-[0.4em]" style={{ color }}>
        {children}
    </div>
);

// -- Panel ------------------------------------------------------------------

/**
 * Titled content block. Accent color drives the title color, glow dot, and
 * left-rule on child items. Keep titles 1-2 words, uppercase.
 */
export const Panel: React.FC<{
    title?: string;
    accent?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    padded?: boolean;
}> = ({ title, accent = '#60a5fa', right, children, className = '', padded = true }) => (
    <div className={`rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-sm ${padded ? 'p-4' : ''} ${className}`}>
        {title && (
            <div className={`flex items-center justify-between gap-2 ${padded ? 'mb-3' : 'px-4 pt-4 mb-3'}`}>
                <div className="flex items-center gap-2">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
                    />
                    <h3 className="text-[9px] uppercase tracking-[0.35em]" style={{ color: accent }}>
                        {title}
                    </h3>
                </div>
                {right}
            </div>
        )}
        {children}
    </div>
);

// -- Buttons ----------------------------------------------------------------

/**
 * Primary CTA. Amber gradient with the mainline "push" border-b shadow.
 * Use for the single headline action on a screen (Close, Confirm, Resume).
 */
export const PushButton: React.FC<{
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    color?: 'amber' | 'emerald' | 'blue' | 'rose';
    type?: 'button' | 'submit';
}> = ({ onClick, disabled, children, className = '', color = 'amber', type = 'button' }) => {
    const palette: Record<string, { bg: string; shadow: string; text: string }> = {
        amber:   { bg: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)', shadow: '0 6px 0 #92400e, 0 10px 20px rgba(0,0,0,0.5)', text: '#0f172a' },
        emerald: { bg: 'linear-gradient(180deg, #6ee7b7 0%, #059669 100%)', shadow: '0 6px 0 #064e3b, 0 10px 20px rgba(0,0,0,0.5)', text: '#0f172a' },
        blue:    { bg: 'linear-gradient(180deg, #7dd3fc 0%, #0284c7 100%)', shadow: '0 6px 0 #075985, 0 10px 20px rgba(0,0,0,0.5)', text: '#0f172a' },
        rose:    { bg: 'linear-gradient(180deg, #fda4af 0%, #e11d48 100%)', shadow: '0 6px 0 #881337, 0 10px 20px rgba(0,0,0,0.5)', text: '#ffffff' },
    };
    const p = palette[color];
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-3 rounded-xl font-black uppercase tracking-[0.35em] text-xs shadow-lg transition-all active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
            style={{ background: p.bg, boxShadow: p.shadow, color: p.text }}
        >
            {children}
        </button>
    );
};

/** Smaller secondary button. Flat color + tracking. */
export type PillColor = 'blue' | 'cyan' | 'purple' | 'indigo' | 'rose' | 'emerald' | 'slate' | 'amber';
const PILL_COLORS: Record<PillColor, string> = {
    blue: 'bg-blue-600 hover:bg-blue-500',
    cyan: 'bg-cyan-600 hover:bg-cyan-500',
    purple: 'bg-purple-600 hover:bg-purple-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-500',
    rose: 'bg-rose-600 hover:bg-rose-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-500',
    slate: 'bg-slate-700 hover:bg-slate-600',
    amber: 'bg-amber-500 hover:bg-amber-400 text-black',
};
export const PillButton: React.FC<{
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
    color: PillColor;
    fullSpan?: boolean;
    className?: string;
    children: React.ReactNode;
}> = ({ onClick, disabled, title, color, fullSpan, className = '', children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`${PILL_COLORS[color]} disabled:bg-slate-700 disabled:opacity-40 py-2 px-3 text-[9px] uppercase font-black tracking-widest rounded-lg shadow transition-all active:translate-y-0.5 ${fullSpan ? 'col-span-full' : ''} ${className}`}
    >
        {children}
    </button>
);

// -- Chips & tiles ----------------------------------------------------------

export const TypeBadge: React.FC<{ type: string; size?: 'xs' | 'sm' | 'md' }> = ({ type, size = 'sm' }) => {
    const pad = size === 'md' ? 'px-2.5 py-1 text-[10px]' : size === 'xs' ? 'px-1.5 py-[1px] text-[7px]' : 'px-2 py-[2px] text-[9px]';
    return (
        <span
            className={`rounded-full ${pad} uppercase tracking-[0.2em] font-black border border-black/30 shadow-sm`}
            style={{ backgroundColor: TYPE_COLORS[type] ?? '#64748b', color: '#0f172a' }}
        >
            {type}
        </span>
    );
};

export const StatPill: React.FC<{
    label: string;
    value: React.ReactNode;
    accent: string;
    className?: string;
}> = ({ label, value, accent, className = '' }) => (
    <div
        className={`rounded-xl border border-white/10 px-3 py-2 shadow-inner ${className}`}
        style={{
            background: `linear-gradient(180deg, ${accent}18 0%, rgba(2,6,23,0.6) 100%)`,
        }}
    >
        <div className="text-[8px] uppercase tracking-[0.3em] text-slate-400">{label}</div>
        <div className="text-lg font-black leading-tight" style={{ color: accent }}>
            {value}
        </div>
    </div>
);

/** Currency chip for the top-right of a screen ("$400" / "12 essence"). */
export const CurrencyChip: React.FC<{
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    accent?: string;
}> = ({ label, value, icon, accent = '#ffcb05' }) => (
    <div
        className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5"
        style={{
            background: `linear-gradient(90deg, ${accent}15 0%, rgba(15,23,42,0.75) 100%)`,
            boxShadow: `inset 0 0 0 1px ${accent}22`,
        }}
    >
        {icon && (
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: accent, boxShadow: `0 0 14px ${accent}66` }}
            >
                {icon}
            </div>
        )}
        <div>
            <div className="text-[8px] uppercase font-black tracking-[0.25em]" style={{ color: accent }}>
                {label}
            </div>
            <div className="text-lg font-mono font-black text-white leading-none">{value}</div>
        </div>
    </div>
);

// -- HP helpers -------------------------------------------------------------

export const hpColor = (ratio: number) =>
    ratio > 0.5 ? 'from-emerald-400 to-emerald-600'
    : ratio > 0.25 ? 'from-amber-400 to-amber-600'
    : 'from-rose-500 to-rose-700';

// -- Close ("X") button for top-right corners -------------------------------

export const CloseX: React.FC<{ onClose: () => void; className?: string }> = ({ onClose, className = '' }) => (
    <button
        onClick={onClose}
        aria-label="Close"
        className={`w-9 h-9 flex items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white text-lg font-black shadow-lg transition-colors ${className}`}
    >
        ×
    </button>
);

// -- Decorative Poké Ball watermark -----------------------------------------

export const PokeballWatermark: React.FC<{ className?: string; opacity?: number }> = ({ className = '', opacity = 0.3 }) => (
    <svg viewBox="0 0 24 24" className={`pointer-events-none ${className}`} style={{ opacity }} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#dc2626" />
        <path d="M2 12h20" stroke="#0f172a" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.4" fill="#f9fafb" stroke="#0f172a" strokeWidth="2" />
    </svg>
);
