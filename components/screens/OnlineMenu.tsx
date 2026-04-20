import React, { useState } from 'react';
import { multiplayer } from '../../services/multiplayer';
import { useEscapeKey } from '../../hooks/useEscapeKey';

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
        if (cleanId.length < 4) { setErrorMsg("Enter valid room ID."); return; }
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
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-12 font-sans flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e3a8a_0%,transparent_70%)]"></div>
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
            </div>

            <div className="max-w-md w-full z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        Join Friend
                    </h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Enter the Rift Synchronization Code</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="rift-room-id" className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Room ID</label>
                        <input
                            id="rift-room-id"
                            type="text"
                            value={roomId}
                            autoFocus
                            maxLength={12}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            onKeyDown={(e) => { if (e.key === 'Enter' && roomId.trim().length >= 4 && status !== 'connecting') joinRoom(); }}
                            placeholder="ENTER CODE"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500 placeholder:text-white/20 transition-colors"
                        />
                        <div className="text-[9px] text-gray-600 uppercase tracking-widest text-center font-bold mt-1">Ask your friend for their 4+ character code</div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase p-3 rounded-xl text-center">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={joinRoom}
                            disabled={status === 'connecting' || roomId.trim().length < 4}
                            className={`
                                w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
                                ${status === 'connecting' || roomId.trim().length < 4
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}
                            `}
                        >
                            {status === 'connecting' ? 'Syncing...' : 'Connect to Rift'}
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full py-4 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            Return to Menu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
