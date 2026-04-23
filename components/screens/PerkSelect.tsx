import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrandTitle, BrandEyebrow, MenuBackdrop } from '../ui/MenuKit';

type Perk = {
    id: string;
    name: string;
    desc: string;
    flavor: string;
    icon: React.ReactNode;
    accent: string;
};

// Hand-drawn SVG glyphs -- keeps the card style consistent with the rest of
// the menu family and avoids the emoji mishmash the perks used to show.
const PERKS: Perk[] = [
    {
        id: 'vampirism',
        name: 'Vampirism',
        desc: 'Heal 10% HP on every hit',
        flavor: 'Drain force from your enemies with every strike.',
        accent: '#ef4444',
        icon: (
            <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
                <path d="M24 42c-9 0-16-7-16-16 0-12 16-22 16-22s16 10 16 22c0 9-7 16-16 16z" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
                <path d="M24 14v20M14 24h20" stroke="#fff" strokeWidth="2" opacity="0.55" />
            </svg>
        ),
    },
    {
        id: 'swiftness',
        name: 'Swiftness',
        desc: 'Permanent +1 Speed in battle',
        flavor: 'Outpace anything on the battlefield.',
        accent: '#22d3ee',
        icon: (
            <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
                <path d="M27 6L10 28h11L17 42l19-24H25z" fill="#fde047" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'scholar',
        name: 'Scholar',
        desc: 'Double XP from all sources',
        flavor: 'Learn twice as fast. Knowledge is a multiplier.',
        accent: '#a78bfa',
        icon: (
            <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
                <path d="M6 28l18-10 18 10-18 10z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                <path d="M24 18v14M15 26v7l9 5 9-5v-7" stroke="#a78bfa" strokeWidth="2" fill="none" />
                <circle cx="24" cy="18" r="2" fill="#fde047" />
            </svg>
        ),
    },
    {
        id: 'juggernaut',
        name: 'Juggernaut',
        desc: '+20% Max HP for all team',
        flavor: 'Thicken your whole squad.',
        accent: '#60a5fa',
        icon: (
            <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
                <path d="M24 4l16 6v12c0 11-7 19-16 22-9-3-16-11-16-22V10z" fill="#1e40af" stroke="#0f172a" strokeWidth="2" />
                <path d="M18 22l5 5 8-10" stroke="#fde047" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'berserker',
        name: 'Berserker',
        desc: '+20% Damage when below 50% HP',
        flavor: 'Hurt more the harder you bleed.',
        accent: '#f97316',
        icon: (
            <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
                <path d="M10 40l14-6 14 6-4-10 4-12-14 6-14-6 4 12z" fill="#f97316" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
                <path d="M20 20l4 4 4-4" stroke="#0f172a" strokeWidth="2" fill="none" />
            </svg>
        ),
    },
];

export const PerkSelect: React.FC<{ onSelect: (perk: string) => void }> = ({ onSelect }) => {
    const [choices] = useState<Perk[]>(() => {
        const shuffled = [...PERKS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    });
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-press-start overflow-hidden">
            <MenuBackdrop accent="#fbbf24" />

            {/* Floating sparkle particles -- cheap, doesn't need real assets */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(16)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: 0,
                        }}
                        animate={{
                            y: [null, Math.random() * -150 - 40],
                            opacity: [0, 0.8, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{ duration: 4 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 5 }}
                        className="absolute w-1 h-1 bg-amber-300 rounded-full blur-[1px]"
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <BrandEyebrow color="#fbbf24">Rift Anomaly Detected</BrandEyebrow>
                    <BrandTitle size="lg" className="mt-2">Choose a Perk</BrandTitle>
                    <p className="text-slate-400 text-[9px] uppercase tracking-[0.4em] mt-3">One of these will bond to your expedition</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {choices.map((p, i) => {
                        const isHovered = hovered === p.id;
                        return (
                            <motion.button
                                key={p.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, type: 'spring', stiffness: 240, damping: 22 }}
                                whileHover={{ y: -6, scale: 1.02 }}
                                onHoverStart={() => setHovered(p.id)}
                                onHoverEnd={() => setHovered(null)}
                                onClick={() => onSelect(p.id)}
                                className="group relative rounded-3xl p-8 text-center overflow-hidden transition-shadow border"
                                style={{
                                    background: `linear-gradient(160deg, ${p.accent}25 0%, rgba(15,23,42,0.9) 55%, rgba(2,6,23,0.98) 100%)`,
                                    borderColor: isHovered ? `${p.accent}aa` : 'rgba(255,255,255,0.1)',
                                    boxShadow: isHovered
                                        ? `0 0 60px ${p.accent}44, 0 20px 40px rgba(0,0,0,0.5)`
                                        : '0 20px 40px rgba(0,0,0,0.35)',
                                }}
                            >
                                {/* Painted glow behind the icon */}
                                <motion.div
                                    className="absolute -top-16 left-1/2 w-48 h-48 rounded-full pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle, ${p.accent}55 0%, transparent 70%)`,
                                        translateX: '-50%',
                                    }}
                                    animate={{ scale: isHovered ? 1.2 : 1, opacity: isHovered ? 0.8 : 0.5 }}
                                />

                                {/* Icon */}
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <motion.div
                                        className="w-full h-full"
                                        animate={{ rotate: isHovered ? [0, -5, 5, 0] : 0 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        {p.icon}
                                    </motion.div>
                                </div>

                                <div
                                    className="text-xl font-black uppercase tracking-wide mb-3 transition-colors"
                                    style={{ color: isHovered ? p.accent : '#f8fafc' }}
                                >
                                    {p.name}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-300 mb-2">{p.desc}</div>
                                <div className="text-[9px] text-slate-500 italic leading-relaxed">{p.flavor}</div>

                                <div
                                    className="mt-5 inline-block px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.35em] font-black"
                                    style={{
                                        background: isHovered ? p.accent : 'rgba(255,255,255,0.06)',
                                        color: isHovered ? '#0f172a' : '#94a3b8',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Claim
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
