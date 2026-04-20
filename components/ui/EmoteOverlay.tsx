import React from 'react';

export const EmoteOverlay: React.FC<{ emote: string | null }> = ({ emote }) => {
    if (!emote) return null;
    return (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 animate-bounce text-6xl">
            {emote}
        </div>
    );
};
