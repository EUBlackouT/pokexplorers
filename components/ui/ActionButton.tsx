import React from 'react';

export interface ActionButtonProps {
    label: string;
    onClick: () => void;
    disabled: boolean;
    color: string;
    subLabel?: string;
    pulse?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    label, onClick, disabled, color, subLabel, pulse
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`${color} w-full py-3 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.3)] text-white font-bold text-xs uppercase tracking-wide border-b-4 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group ${pulse ? 'animate-pulse' : ''}`}
    >
        <span className="relative z-10">{label}</span>
        {subLabel && <span className="block text-[8px] opacity-80 relative z-10">{subLabel}</span>}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
);
