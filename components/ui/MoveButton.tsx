import React from 'react';
import { PokemonMove } from '../../types';
import { TYPE_COLORS } from '../../services/pokeService';
import { describeMove } from '../../utils/moveDescriptions';

export interface MoveButtonProps {
    move: PokemonMove;
    onClick: () => void;
    disabled: boolean;
    type: string;
}

export const MoveButton: React.FC<MoveButtonProps> = ({ move, onClick, disabled, type }) => {
    const color = TYPE_COLORS[type.toLowerCase()] || '#777';
    const desc = describeMove(move);
    const moveType = (type || 'normal').toUpperCase();
    const powerText = move.power && move.power > 0 ? `PWR ${move.power}` : 'PWR --';
    const accText = Number.isFinite(move.accuracy as number) ? `ACC ${move.accuracy}` : 'ACC --';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={desc}
            style={{ backgroundColor: color, borderColor: `${color}88` }}
            className="group relative w-full min-h-[84px] md:min-h-[92px] px-2 py-2 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.3)] text-white font-bold text-[10px] md:text-xs uppercase border-b-4 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="flex flex-col items-start text-left gap-0.5">
                <span className="font-black text-[11px] md:text-xs leading-tight">{move.name.replace('-', ' ')}</span>
                <div className="flex items-center gap-2 text-[8px] opacity-90">
                    <span>{moveType}</span>
                    <span>{powerText}</span>
                    <span>{accText}</span>
                </div>
                <span className="text-[8px] normal-case opacity-90 leading-snug max-h-7 overflow-hidden">{desc}</span>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-64 -translate-x-1/2 rounded-lg border border-white/20 bg-slate-900/95 p-2 text-left text-[10px] normal-case text-slate-100 shadow-2xl group-hover:block">
                {desc}
            </div>
        </button>
    );
};
