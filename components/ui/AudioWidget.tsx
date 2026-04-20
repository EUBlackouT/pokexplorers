import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    unlockAudio,
    getAudioStatus,
    clearAudioFails
} from '../../services/soundService';

export const AudioWidget: React.FC = () => {
    const [status, setStatus] = useState(getAudioStatus());
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setStatus(getAudioStatus()), 1000);
        return () => clearInterval(interval);
    }, []);

    const isError = status.state !== 'running';
    const hasIssues = isError || status.failedResources > 0;

    return (
        <div className="fixed bottom-4 left-4 z-[999999] flex flex-col items-start gap-2 font-press-start">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-slate-900/95 border-2 border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-64 mb-2"
                    >
                        <div className="text-[10px] text-yellow-400 font-black mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
                            Audio Diagnostics
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] text-slate-400 uppercase">State</span>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${status.state === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {status.state.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-[8px] text-slate-300">
                                <span className="uppercase">Cache</span>
                                <span className="text-white">{status.cachedBuffers} Buffers</span>
                            </div>

                            <div className="flex justify-between items-center text-[8px] text-slate-300">
                                <span className="uppercase">Fails</span>
                                <span className={status.failedResources > 0 ? 'text-red-400' : 'text-white'}>
                                    {status.failedResources} URLs
                                </span>
                            </div>

                            {status.lastError && (
                                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-[7px] text-red-300 break-all leading-tight">
                                    ERR: {status.lastError}
                                </div>
                            )}

                            <div className="pt-2 flex flex-col gap-2">
                                <button
                                    onClick={unlockAudio}
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-black py-2 rounded-lg transition-colors uppercase tracking-tight"
                                >
                                    Force Restart
                                </button>
                                <button
                                    onClick={clearAudioFails}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-bold py-2 rounded-lg transition-colors uppercase"
                                >
                                    Clear Fails
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-bold py-2 rounded-lg transition-colors uppercase"
                                >
                                    Minimize
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-2xl shadow-lg transition-all active:scale-90 flex items-center gap-2 border-2 ${hasIssues ? 'bg-red-950/80 border-red-500 animate-pulse' : 'bg-slate-900/80 border-slate-700'}`}
            >
                <span className="text-xl">{hasIssues ? '🔇' : '🔊'}</span>
                {hasIssues && <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">Audio Issues ({status.failedResources})</span>}
            </button>
        </div>
    );
};
