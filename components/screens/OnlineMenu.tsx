import React, { useState } from 'react';
import { motion } from 'motion/react';
import { multiplayer } from '../../services/multiplayer';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { MenuBackdrop, MenuCard, BrandTitle, BrandEyebrow, PushButton } from '../ui/MenuKit';

export const OnlineMenu: React.FC<{
    onBack: () => void;
    onStartGame: () => void;
}> = ({ onBack, onStartGame }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [roomId, setRoomId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    useEscapeKey(onBack, status === 'idle');

    const joinRoom = async () => {
        const cleanId = roomId.trim().toUpperCase();
        if (cleanId.length < 4) { setErrorMsg('Enter a valid room ID.'); return; }
        setStatus('connecting');
        setErrorMsg('');
        try {
            await multiplayer.joinRoom(cleanId);
            setStatus('connected');
            onStartGame();
        } catch (e: any) {
            setErrorMsg(e.message || 'Connection failed.');
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 font-press-start relative overflow-hidden text-white">
            {/* Painted room backdrop */}
            <div className="fixed inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, rgba(2,6,23,0.98) 55%, #020617 100%)',
            }} />
            <div className="fixed inset-0 pointer-events-none opacity-40">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * (typeof window === 'undefined' ? 800 : window.innerWidth),
                            y: Math.random() * (typeof window === 'undefined' ? 600 : window.innerHeight),
                            opacity: 0,
                        }}
                        animate={{
                            y: [null, Math.random() * -200 - 40],
                            opacity: [0, 0.5, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{ duration: 5 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 4 }}
                        className="absolute w-1 h-1 bg-cyan-300 rounded-full blur-sm"
                    />
                ))}
            </div>

            <MenuBackdrop accent="#60a5fa" />

            <MenuCard maxWidth="max-w-md">
                <div
                    className="relative px-6 pt-6 pb-4 border-b border-white/5"
                    style={{
                        background: 'linear-gradient(90deg, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.1) 60%, transparent 100%)',
                    }}
                >
                    <BrandEyebrow color="#93c5fd">Co-op Rift Link</BrandEyebrow>
                    <BrandTitle size="md" className="mt-1">JOIN A FRIEND</BrandTitle>
                    <p className="text-[9px] uppercase tracking-[0.35em] text-slate-400 mt-2">Enter the 4+ character room code</p>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label htmlFor="rift-room-id" className="block text-[9px] font-black uppercase tracking-[0.35em] text-slate-300 mb-2">
                            Room ID
                        </label>
                        <input
                            id="rift-room-id"
                            type="text"
                            value={roomId}
                            autoFocus
                            maxLength={12}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            onKeyDown={(e) => { if (e.key === 'Enter' && roomId.trim().length >= 4 && status !== 'connecting') joinRoom(); }}
                            placeholder="CODE"
                            className="w-full bg-black/50 border-2 border-white/10 rounded-xl px-6 py-4 text-center text-2xl font-mono font-black tracking-[0.4em] focus:outline-none focus:border-blue-400 placeholder:text-white/15 transition-colors"
                        />
                        <div className="text-[8px] text-slate-500 uppercase tracking-[0.3em] text-center font-bold mt-2">
                            Ask your friend to share theirs
                        </div>
                    </div>

                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-widest p-3 rounded-lg text-center"
                        >
                            {errorMsg}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <PushButton
                            onClick={joinRoom}
                            disabled={status === 'connecting' || roomId.trim().length < 4}
                            color="blue"
                        >
                            {status === 'connecting' ? 'Syncing…' : 'Connect to Rift'}
                        </PushButton>
                        <button
                            onClick={onBack}
                            className="w-full py-3 text-[9px] font-black uppercase tracking-[0.35em] text-slate-400 hover:text-white transition-colors"
                        >
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            </MenuCard>
        </div>
    );
};
