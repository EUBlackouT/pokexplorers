import React, { useState } from 'react';
import { ITEMS } from '../../services/itemData';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const ShopMenu: React.FC<{
    onClose: () => void;
    money: number;
    inventory: any;
    onBuy: (item: string, price: number) => void;
    discount?: number;
}> = ({ onClose, money, inventory, onBuy, discount = 0 }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pokeball' | 'healing' | 'battle' | 'evolution'>('all');
    useEscapeKey(onClose);

    const shopItems = Object.values(ITEMS)
        .map(item => ({ ...item, price: Math.floor(item.price * (1 - discount)) }))
        .filter(item => activeTab === 'all' || item.category === activeTab);

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-4xl text-white flex flex-col h-[85vh] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Poké Mart
                        </h2>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Authorized Supply Terminal</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            <span className="text-xl">💰</span>
                        </div>
                        <div>
                            <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Credits</div>
                            <div className="text-2xl font-mono font-bold">${money}</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide relative z-10">
                    {(['all', 'pokeball', 'healing', 'battle', 'evolution'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all border ${
                                activeTab === tab
                                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    {shopItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onBuy(item.id, item.price)}
                            disabled={money < item.price}
                            className={`group relative p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between overflow-hidden ${
                                money >= item.price
                                    ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]'
                                    : 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center p-3 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                    <img src={item.icon} className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" alt={item.name} referrerPolicy="no-referrer" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black uppercase text-xs tracking-tight group-hover:text-blue-400 transition-colors">{item.name}</div>
                                    <div className="text-[9px] text-gray-500 max-w-[180px] leading-relaxed mt-1 line-clamp-2">{item.description}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="text-[8px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                            Owned: {
                                                item.id === 'poke-ball' ? inventory.pokeballs :
                                                item.id === 'potion' ? inventory.potions :
                                                item.id === 'revive' ? inventory.revives :
                                                item.id === 'rare-candy' ? inventory.rare_candy :
                                                inventory.items.filter((i: string) => i === item.id).length
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <div className="text-xl font-mono font-bold text-white group-hover:text-yellow-400 transition-colors">${item.price}</div>
                                <div className="text-[8px] font-black uppercase text-gray-600 mt-1">Purchase</div>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex justify-center relative z-10">
                    <button
                        onClick={onClose}
                        className="group relative px-16 py-4 bg-white text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-red-600 hover:text-white transition-all rounded-full overflow-hidden shadow-2xl"
                    >
                        <span className="relative z-10">Close Terminal</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};
