import React, { useState } from 'react';
import { motion } from 'motion/react';

const PERKS = [
    { id: 'vampirism', name: 'Vampirism', desc: 'Heal 10% HP on every hit', icon: '🧛' },
    { id: 'swiftness', name: 'Swiftness', desc: 'Permanent +1 Speed in battle', icon: '👟' },
    { id: 'scholar', name: 'Scholar', desc: 'Double XP from all sources', icon: '🎓' },
    { id: 'juggernaut', name: 'Juggernaut', desc: '+20% Max HP for all team', icon: '🛡️' },
    { id: 'berserker', name: 'Berserker', desc: '+20% Damage when below 50% HP', icon: '🪓' },
];

export const PerkSelect: React.FC<{ onSelect: (perk: string) => void }> = ({ onSelect }) => {
    const [choices] = useState(() => {
        const shuffled = [...PERKS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-600">
                        Rift Anomaly Detected
                    </h2>
                    <p className="text-gray-500 text-xs md:text-sm uppercase tracking-[0.5em] font-black mt-4">Select a Temporal Perk</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {choices.map((p, i) => (
                        <motion.button
                            key={p.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => onSelect(p.id)}
                            className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-10 text-center transition-all duration-500 hover:bg-white/10 hover:border-yellow-400/50 hover:scale-105 hover:shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="text-7xl mb-8 transform group-hover:scale-110 transition-transform duration-500">{p.icon}</div>
                            <div className="text-2xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">{p.name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed font-medium">{p.desc}</div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};
