import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SyncGauge: React.FC<{
    value: number;
    label: string;
    color: 'yellow' | 'red';
}> = ({ value, label, color }) => {
    const safeValue = isNaN(value) ? 0 : value;
    const isFull = safeValue >= 100;

    return (
        <div className="relative z-50 pointer-events-none mb-1">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <AnimatePresence>
                    {isFull && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`absolute -inset-6 ${color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'} blur-3xl rounded-full`}
                        />
                    )}
                </AnimatePresence>

                <div className={`p-2 transition-all duration-500 min-w-[180px]`}>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color === 'yellow' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'} shadow-lg border border-white/20 transform -rotate-2`}>
                                <span className="text-[10px] font-black italic">S</span>
                            </div>
                            <div className="flex flex-col">
                                <motion.span
                                    animate={isFull ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className={`text-[9px] font-black uppercase tracking-[0.2em] ${color === 'yellow' ? 'text-yellow-400' : 'text-red-400'} drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                                >
                                    {label}
                                </motion.span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[7px] text-white/60 font-bold tracking-widest uppercase drop-shadow-md">Sync Link</span>
                                    <div className={`h-[1px] w-8 ${color === 'yellow' ? 'bg-yellow-400/20' : 'bg-red-400/20'}`}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 px-1">
                            <motion.span
                                key={Math.floor(safeValue)}
                                initial={{ y: -5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={`text-lg font-black ${color === 'yellow' ? 'text-yellow-400' : 'text-red-400'} italic tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                            >
                                {Math.floor(safeValue)}
                            </motion.span>
                            <span className={`text-[8px] font-bold ${color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} drop-shadow-md`}>%</span>
                        </div>
                    </div>

                    <div className="relative h-3 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/10 p-[1.5px] shadow-lg">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${safeValue}%` }}
                            transition={{ type: 'spring', stiffness: 40, damping: 12 }}
                            className={`h-full rounded-full relative overflow-hidden
                                ${isFull
                                    ? (color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 via-orange-300 to-white' : 'bg-gradient-to-r from-red-600 via-red-400 to-white')
                                    : (color === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-orange-500' : 'bg-gradient-to-r from-red-800 to-red-500')
                                }`}
                        >
                            <motion.div
                                animate={{ x: ['-100%', '400%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/4 skew-x-[45deg]"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
