import React from 'react';

interface Props {
  current: number;
  max: number;
  label: string;
  level?: number;
  xp?: number;
  maxXp?: number;
  status?: string;
}

export const HealthBar: React.FC<Props> = ({ current, max, label, level = 50, xp = 0, maxXp = 100, status }) => {
  const safeCurrent = isNaN(current) ? 0 : current;
  const safeMax = isNaN(max) ? 1 : max;
  const safeLevel = isNaN(level) ? 1 : level;
  const safeXp = isNaN(xp) ? 0 : xp;
  const safeMaxXp = isNaN(maxXp) ? 1 : maxXp;

  const percent = Math.max(0, Math.min(100, (safeCurrent / safeMax) * 100));
  const xpPercent = Math.max(0, Math.min(100, (safeXp / safeMaxXp) * 100));
  
  let colorClass = 'bg-green-500';
  let glowClass = 'shadow-[0_0_10px_rgba(34,197,94,0.5)]';
  if (percent < 50) {
      colorClass = 'bg-yellow-400';
      glowClass = 'shadow-[0_0_10px_rgba(250,204,21,0.5)]';
  }
  if (percent < 20) {
      colorClass = 'bg-red-500';
      glowClass = 'shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  }

  const statusColors: Record<string, string> = {
    burn: 'bg-red-600',
    poison: 'bg-purple-600',
    toxic: 'bg-purple-800',
    paralysis: 'bg-yellow-500',
    sleep: 'bg-gray-500',
    freeze: 'bg-blue-400',
  };

  const statusAbbr: Record<string, string> = {
    burn: 'BRN',
    poison: 'PSN',
    toxic: 'TOX',
    paralysis: 'PAR',
    sleep: 'SLP',
    freeze: 'FRZ',
  };

  return (
    <div className="w-64 md:w-72 p-2 text-white font-bold relative z-20 pointer-events-none transform hover:scale-105 transition-transform duration-300">
      <div className="flex justify-between items-end mb-1 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {status && (
              <span className={`${statusColors[status] || 'bg-gray-600'} text-[9px] px-1.5 py-0.5 rounded-sm uppercase border border-white/30 font-black shadow-sm flex-shrink-0`}>
                {statusAbbr[status] || status.substring(0, 3).toUpperCase()}
              </span>
            )}
            <span className="uppercase tracking-[0.15em] text-xs md:text-sm font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-white/90 truncate">{label}</span>
          </div>
        </div>
        <div className="flex flex-col items-end px-1">
          <span className="text-[7px] text-white/60 font-black uppercase tracking-widest drop-shadow-md">Lv</span>
          <span className="text-sm text-yellow-400 font-black italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{safeLevel}</span>
        </div>
      </div>
      
      {/* HP BAR */}
      <div className="relative mb-1">
        <div className="flex justify-between items-center mb-0.5 px-1">
            <span className="text-[8px] text-white/70 font-black uppercase tracking-[0.2em] drop-shadow-md">HP</span>
            <div className="flex items-baseline gap-1">
                <span className="text-xs font-mono tabular-nums text-white font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{Math.ceil(safeCurrent)}</span>
                <span className="text-[8px] text-white/40 font-bold">/</span>
                <span className="text-[9px] font-mono tabular-nums text-white/60 font-bold">{Math.ceil(safeMax)}</span>
            </div>
        </div>
        <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2.5 md:h-3 border border-white/20 relative overflow-hidden shadow-lg p-[1.5px]">
          <div 
            className={`h-full rounded-full ${colorClass} ${glowClass} z-10 relative overflow-hidden transition-all duration-700 ease-out`} 
            style={{ width: `${percent}%` }}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-shimmer"></div>
          </div>
        </div>
      </div>
      
      {/* XP BAR */}
      {maxXp > 0 && (
        <div className="relative">
          <div className="w-full bg-black/20 rounded-full h-1 border border-white/5 relative overflow-hidden p-[0.5px]">
            <div 
              className="h-full rounded-full bg-blue-500/80 transition-all duration-1000" 
              style={{ width: `${xpPercent}%` }}
            >
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
