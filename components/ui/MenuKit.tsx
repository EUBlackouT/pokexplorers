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

// ===========================================================================
// MAIN-MENU ICONOGRAPHY
// ---------------------------------------------------------------------------
// Custom SVG icons sized to drop into the MenuCardButton's left art panel.
// They share a viewBox of 0 0 64 64 and a single `accent` color so each one
// can be re-themed by its host card without any per-icon style overrides.
// All icons are designed to read at 48-80px sizes in the menu.
// ===========================================================================

interface IconProps { accent: string; className?: string; }

/** Classic Pokéball, full-fidelity (continue / start adventure CTA). */
export const IconPokeball: React.FC<IconProps> = ({ accent, className = '' }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
            <radialGradient id="ipb-top" cx="35%" cy="32%" r="60%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="55%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
            <radialGradient id="ipb-bot" cx="35%" cy="68%" r="60%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="60%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill={accent} opacity="0.15" />
        <circle cx="32" cy="32" r="26" fill="url(#ipb-top)" />
        <path d="M6 32 a26 26 0 0 0 52 0 z" fill="url(#ipb-bot)" />
        <rect x="6" y="29.5" width="52" height="5" fill="#0f172a" />
        <circle cx="32" cy="32" r="9" fill="#0f172a" />
        <circle cx="32" cy="32" r="6.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="29.5" cy="29.5" r="2" fill="#fff" opacity="0.9" />
    </svg>
);

/** Compass rose: explorer / new adventure. */
export const IconCompass: React.FC<IconProps> = ({ accent, className = '' }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
            <radialGradient id="ic-bg" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={`${accent}aa`} />
                <stop offset="60%" stopColor={`${accent}33`} />
                <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill="url(#ic-bg)" stroke={accent} strokeWidth="2" />
        <circle cx="32" cy="32" r="22" fill="none" stroke={`${accent}88`} strokeWidth="0.7" strokeDasharray="2 3" />
        <polygon points="32,8 36,30 32,34 28,30" fill={accent} />
        <polygon points="32,56 28,34 32,30 36,34" fill="#f8fafc" stroke={accent} strokeWidth="0.5" />
        <polygon points="32,8 36,30 32,34 28,30" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.5" />
        <circle cx="32" cy="32" r="3" fill="#0f172a" stroke={accent} strokeWidth="1.5" />
        <text x="32" y="14" textAnchor="middle" fontSize="6" fill={accent} fontWeight="900" fontFamily="monospace">N</text>
    </svg>
);

/** Cut crystal / Rift Essence gem (atelier upgrades). */
export const IconCrystal: React.FC<IconProps> = ({ accent, className = '' }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="icr-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="50%" stopColor={accent} />
                <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="icr-2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={accent} />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.6" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill={accent} opacity="0.1" />
        <polygon points="32,6 50,24 42,52 22,52 14,24" fill="url(#icr-1)" stroke={accent} strokeWidth="1.5" />
        <polygon points="32,6 50,24 32,30 14,24" fill="url(#icr-2)" opacity="0.7" />
        <polygon points="32,30 42,52 22,52" fill={accent} opacity="0.4" />
        <line x1="14" y1="24" x2="50" y2="24" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.7" />
        <line x1="32" y1="6" x2="32" y2="52" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.5" />
    </svg>
);

/** Linked planet / network icon (multiplayer). */
export const IconNetwork: React.FC<IconProps> = ({ accent, className = '' }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
            <radialGradient id="in-globe" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="40%" stopColor={accent} />
                <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="20" fill="url(#in-globe)" stroke={accent} strokeWidth="2" />
        <ellipse cx="32" cy="32" rx="20" ry="8" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.7" />
        <ellipse cx="32" cy="32" rx="8" ry="20" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.7" />
        <line x1="12" y1="32" x2="52" y2="32" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.7" />
        <circle cx="14" cy="14" r="5" fill={accent} stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="5" fill={accent} stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="50" cy="14" r="3.5" fill="#fff" stroke={accent} strokeWidth="1.2" />
        <line x1="14" y1="14" x2="32" y2="32" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="50" y1="50" x2="32" y2="32" stroke="#fff" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

/** Open book / handbook icon (how to play). */
export const IconHandbook: React.FC<IconProps> = ({ accent, className = '' }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="ih-page" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill={accent} opacity="0.12" />
        <path d="M8 18 L32 14 L32 54 L8 50 Z" fill="url(#ih-page)" stroke={accent} strokeWidth="1.5" />
        <path d="M56 18 L32 14 L32 54 L56 50 Z" fill="url(#ih-page)" stroke={accent} strokeWidth="1.5" />
        <path d="M32 14 L32 54" stroke={accent} strokeWidth="1.5" />
        <line x1="13" y1="24" x2="28" y2="22" stroke={accent} strokeWidth="1" />
        <line x1="13" y1="29" x2="28" y2="27" stroke={accent} strokeWidth="1" />
        <line x1="13" y1="34" x2="24" y2="32.5" stroke={accent} strokeWidth="1" />
        <line x1="36" y1="22" x2="51" y2="24" stroke={accent} strokeWidth="1" />
        <line x1="36" y1="27" x2="51" y2="29" stroke={accent} strokeWidth="1" />
        <line x1="36" y1="32.5" x2="47" y2="34" stroke={accent} strokeWidth="1" />
        {/* Bookmark ribbon */}
        <path d="M44 14 L48 14 L48 28 L46 26 L44 28 Z" fill={accent} stroke="#0f172a" strokeWidth="0.8" />
    </svg>
);

// ===========================================================================
// MENU CARD BUTTON
// ---------------------------------------------------------------------------
// The hero / standard / compact card buttons used on the main menu. Provides
// a consistent look that scales across CTA tiers:
//   - hero:     ~144px tall, oversized icon, used for THE primary action.
//   - standard: ~104px tall, regular two-line layout for secondary actions.
//   - compact:  ~80px tall, single-line layout for tertiary actions.
//
// Visual recipe:
//   - Outer holographic frame (gradient ring) tinted by `accent`
//   - Inner dark slate panel with subtle inner glow
//   - Left art panel: the supplied icon, big, with a rotating halo
//   - Right text panel: BrandTitle-style gold title + cyan/eyebrow subtitle
//   - Bottom border depth shadow that collapses on press (mainline "snap" feel)
//   - Diagonal shimmer sweep on hover
//   - Optional pulsing glow on `pulse=true` so the primary CTA self-attracts
//
// Per-button accent colors theme the ring, halo, and shimmer without
// touching the typography. The title is ALWAYS gold-on-stroke so the menu
// reads as one Pokemon-game family no matter what tier the card is.
// ===========================================================================

type MenuCardSize = 'hero' | 'standard' | 'compact';

export const MenuCardButton: React.FC<{
    onClick: () => void;
    size?: MenuCardSize;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    eyebrow?: string;
    accent?: string;
    /** Right-side decoration (e.g. essence count, NEW! badge). Goes under
     *  the title block but inside the card. */
    rightSlot?: React.ReactNode;
    /** Full-bleed corner badge (e.g. "NEW! START HERE", currency pip). */
    cornerBadge?: React.ReactNode;
    /** Soft pulsing exterior glow drawing the eye to the primary CTA. */
    pulse?: boolean;
    disabled?: boolean;
    className?: string;
}> = ({
    onClick,
    size = 'standard',
    icon,
    title,
    subtitle,
    eyebrow,
    accent = '#3c5aa6',
    rightSlot,
    cornerBadge,
    pulse,
    disabled,
    className = '',
}) => {
    const sizing = size === 'hero'
        ? { pad: 'p-5', iconWrap: 'w-24 h-24', iconInner: 'w-16 h-16', titleSize: 'text-2xl md:text-3xl', strokeW: '1.6px', shadowDepth: '3px', subSize: 'text-[11px]', eyebrowSize: 'text-[9px]' }
        : size === 'standard'
            ? { pad: 'p-4', iconWrap: 'w-20 h-20', iconInner: 'w-14 h-14', titleSize: 'text-xl md:text-2xl', strokeW: '1.3px', shadowDepth: '2.5px', subSize: 'text-[10px]', eyebrowSize: 'text-[8px]' }
            : { pad: 'p-3', iconWrap: 'w-14 h-14', iconInner: 'w-10 h-10', titleSize: 'text-base md:text-lg',  strokeW: '1px',   shadowDepth: '2px', subSize: 'text-[9px]',  eyebrowSize: 'text-[7px]' };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={disabled ? undefined : { y: -2 }}
            whileTap={disabled ? undefined : { y: 4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className={`group relative w-full text-left rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            style={{
                // Outer holographic frame: a 2px gradient ring + colored
                // shadow so the button reads as a "card" rather than a
                // flat <button>. The double-shadow gives both the bottom
                // depth (mainline button press) and a soft accent glow.
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 35%, #0f172a 60%, ${accent}44 100%)`,
                padding: '2px',
                boxShadow: pulse
                    ? `0 8px 0 ${accent}88, 0 18px 40px ${accent}55, 0 0 36px ${accent}66`
                    : `0 8px 0 ${accent}66, 0 14px 32px rgba(0,0,0,0.55)`,
            }}
        >
            {/* Pulse halo for primary CTA */}
            {pulse && (
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{ boxShadow: [`0 0 0 0 ${accent}55`, `0 0 0 18px ${accent}00`] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
            )}

            {/* Inner card surface */}
            <div
                className={`relative w-full h-full rounded-[15px] overflow-hidden ${sizing.pad}`}
                style={{
                    background: `radial-gradient(ellipse at 0% 0%, ${accent}33 0%, rgba(15,23,42,0.95) 55%, #020617 100%)`,
                    boxShadow: `inset 0 1px 0 0 ${accent}55, inset 0 -2px 0 0 rgba(0,0,0,0.6)`,
                }}
            >
                {/* Faint pokeball watermark for game-feel texture */}
                <PokeballWatermark
                    className="absolute -right-4 -bottom-4 w-24 h-24 rotate-12"
                    opacity={0.05}
                />

                {/* Layout: icon on the left, text block fills the rest */}
                <div className="relative z-10 flex items-center gap-4">
                    {/* Icon plinth: rotating halo + the icon itself */}
                    <div className={`relative ${sizing.iconWrap} shrink-0 flex items-center justify-center`}>
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                            style={{
                                background: `conic-gradient(from 0deg, transparent 0deg, ${accent}55 60deg, transparent 120deg, transparent 240deg, ${accent}55 300deg, transparent 360deg)`,
                                filter: 'blur(2px)',
                                opacity: 0.55,
                            }}
                        />
                        <div
                            className={`relative ${sizing.iconWrap} rounded-full flex items-center justify-center`}
                            style={{
                                background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18) 0%, ${accent}22 50%, rgba(2,6,23,0.85) 100%)`,
                                border: `1.5px solid ${accent}aa`,
                                boxShadow: `inset 0 0 12px ${accent}55, 0 4px 14px rgba(0,0,0,0.45)`,
                            }}
                        >
                            <div className={sizing.iconInner}>{icon}</div>
                        </div>
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                        {eyebrow && (
                            <div
                                className={`${sizing.eyebrowSize} uppercase font-black tracking-[0.32em] mb-1`}
                                style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}
                            >
                                {eyebrow}
                            </div>
                        )}
                        <div
                            className={`${sizing.titleSize} font-black italic tracking-tight leading-none`}
                            style={{
                                color: '#ffcb05',
                                textShadow: `0 ${sizing.shadowDepth} 0 #1e293b, 0 ${parseInt(sizing.shadowDepth) * 2}px 12px rgba(0,0,0,0.55)`,
                                WebkitTextStroke: `${sizing.strokeW} #1e293b`,
                                paintOrder: 'stroke fill',
                            }}
                        >
                            {title}
                        </div>
                        {subtitle && (
                            <div className={`${sizing.subSize} text-slate-300/85 mt-1.5 leading-tight font-medium`}>
                                {subtitle}
                            </div>
                        )}
                    </div>

                    {/* Right slot (e.g. currency pip) */}
                    {rightSlot && <div className="shrink-0">{rightSlot}</div>}
                </div>

                {/* Diagonal shimmer sweep on hover */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"
                />

                {/* Top spec line */}
                <div
                    className="absolute top-0 left-6 right-6 h-px"
                    style={{ background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)` }}
                />
            </div>

            {/* Corner badge (NEW!, currency pip) */}
            {cornerBadge && (
                <div className="absolute -top-2 -right-2 z-20">{cornerBadge}</div>
            )}
        </motion.button>
    );
};
