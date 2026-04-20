import React from 'react';
import { PokemonMove } from '../../types';
import { TYPE_COLORS } from '../../services/pokeService';

export interface MoveButtonProps {
    move: PokemonMove;
    onClick: () => void;
    disabled: boolean;
    type: string;
}

export const MoveButton: React.FC<MoveButtonProps> = ({ move, onClick, disabled, type }) => {
    const color = TYPE_COLORS[type.toLowerCase()] || '#777';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{ backgroundColor: color, borderColor: `${color}88` }}
            className="w-full py-3 md:py-4 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.3)] text-white font-bold text-[10px] md:text-xs uppercase border-b-4 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="flex flex-col items-center">
                <span>{move.name.replace('-', ' ')}</span>
                <span className="text-[8px] opacity-80">{type}</span>
            </div>
        </button>
    );
};
