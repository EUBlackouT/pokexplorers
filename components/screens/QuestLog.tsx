import React from 'react';
import { PlayerGlobalState } from '../../types';
import { MAIN_QUESTS } from '../../data/quests';

export const QuestLog: React.FC<{ state: PlayerGlobalState }> = ({ state }) => {
    const distance = Math.floor(Math.sqrt(state.chunkPos.x ** 2 + state.chunkPos.y ** 2));

    const currentQuest = MAIN_QUESTS.find(q => q.id === state.meta.mainQuestProgress.currentQuestId) || MAIN_QUESTS[0];
    const questValue = currentQuest.type === 'distance' ? distance : state.badges;
    const progress = Math.min(100, (questValue / currentQuest.target) * 100);

    return (
        <div className="absolute bottom-6 right-6 z-40 w-72 bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_3s_linear_infinite] opacity-50"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Main Quest</h3>
                    </div>
                    <div className="text-[8px] font-mono text-white/40">ID: {currentQuest.id}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="text-xs font-black uppercase tracking-tight mb-1">{currentQuest.title}</div>
                        <div className="text-[9px] text-gray-400 leading-relaxed uppercase font-bold tracking-wider italic">{currentQuest.desc}</div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="text-[10px] font-mono font-bold text-blue-400">
                                {questValue} / {currentQuest.target}
                                <span className="text-[8px] text-gray-600 ml-1">{currentQuest.type.toUpperCase()}</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold">{Math.floor(progress)}%</div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Total Badges</div>
                            <div className="text-xs font-mono font-bold text-yellow-400">{state.badges} / 8</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Rift Depth</div>
                            <div className="text-xs font-mono font-bold text-blue-400">{distance}m</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: translateY(160px); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
