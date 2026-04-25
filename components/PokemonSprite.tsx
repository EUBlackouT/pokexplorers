import React, { useState, useEffect } from 'react';
import { Pokemon } from '../types';

interface Props {
  pokemon: Pokemon;
  isBack?: boolean;
  isTargetable?: boolean;
  onSelect?: () => void;
  className?: string; // Allow overriding dimensions
  variant?: 'battle' | 'menu';
}

export const PokemonSprite: React.FC<Props> = ({ pokemon, isBack, isTargetable, onSelect, className, variant = 'battle' }) => {
  // 0: PokeAPI Animated (Gen 5 BW) - Only if available/applicable
  // 1: Showdown Animated (Gen 5 Style)
  // 2: Showdown Static (Gen 5 Style)
  // 3: PokeAPI Static (Fallback)
  const [srcIndex, setSrcIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
      setSrcIndex(0);
      setImgError(false);
  }, [pokemon.id, isBack]);

  const getSources = () => {
      const sources: string[] = [];
      
      // Manual Name Fixes for Showdown
      let cleanName = pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Handle common PokeAPI suffixes that Showdown doesn't use for base sprites
      const suffixes = [
          'disguised', 'redmeteor', 'morpekomorpeko', 'amped', 'ice', 'male', 'female', 
          'incarnate', 'ordinary', 'aria', 'baile', 'midday', 'solo', 'redstriped', '50'
      ];
      suffixes.forEach(s => {
          if (cleanName.endsWith(s) && cleanName.length > s.length) {
              cleanName = cleanName.replace(s, '');
          }
      });

      if (cleanName === 'mimikyu') cleanName = 'mimikyu';
      if (cleanName === 'minior') cleanName = 'minior';
      if (cleanName === 'nidoranf') cleanName = 'nidoranf';
      if (cleanName === 'nidoranm') cleanName = 'nidoranm';
      if (cleanName === 'mrmime') cleanName = 'mrmime';
      if (cleanName === 'mrrime') cleanName = 'mrrime';
      if (cleanName === 'sirfetchd') cleanName = 'sirfetchd';
      if (cleanName === 'farfetchd') cleanName = 'farfetchd';
      if (cleanName === 'typenull') cleanName = 'typenull';
      if (cleanName === 'jangmoo') cleanName = 'jangmoo';
      if (cleanName === 'tapukoko') cleanName = 'tapukoko';
      if (cleanName === 'tapulele') cleanName = 'tapulele';
      if (cleanName === 'tapubulu') cleanName = 'tapubulu';
      if (cleanName === 'tapufini') cleanName = 'tapufini';
      
      // 1. PokeAPI Animated (Reliable for Gen 1-5)
      if (pokemon.id <= 649) {
          const apiAni = isBack 
            ? (pokemon.isShiny ? pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.back_shiny : pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.back_default)
            : (pokemon.isShiny ? pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny : pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default);
          if (apiAni) sources.push(apiAni);
      }

      // 2. Showdown Gen 5 Style Animated (Smogon Sprite Project for Gen 6+)
      // These are the high-quality 2D animated sprites the user wants
      const sdMirrorDir = isBack ? (pokemon.isShiny ? 'gen5ani-back-shiny' : 'gen5ani-back') : (pokemon.isShiny ? 'gen5ani-shiny' : 'gen5ani');
      sources.push(`https://play.pokemonshowdown.com/sprites/${sdMirrorDir}/${cleanName}.gif`);

      // 3. Showdown Official Animated (3D models converted to GIF - often pixelated)
      const sdAniDir = isBack ? (pokemon.isShiny ? 'ani-back-shiny' : 'ani-back') : (pokemon.isShiny ? 'ani-shiny' : 'ani');
      sources.push(`https://play.pokemonshowdown.com/sprites/${sdAniDir}/${cleanName}.gif`);

      // 4. Showdown Static (Gen 5 Style)
      const sdStaticDir = isBack ? (pokemon.isShiny ? 'gen5-back-shiny' : 'gen5-back') : (pokemon.isShiny ? 'gen5-shiny' : 'gen5');
      sources.push(`https://play.pokemonshowdown.com/sprites/${sdStaticDir}/${cleanName}.png`);

      // 4. PokeAPI Static (Ultimate backup)
      const apiStatic = isBack ? pokemon.sprites.back_default : pokemon.sprites.front_default;
      if (apiStatic) sources.push(apiStatic);

      return sources;
  };

  const sources = getSources();
  const currentSrc = sources[srcIndex] || null;
  const is3D = (currentSrc?.includes('/ani/') || currentSrc?.includes('/ani-')) && !currentSrc?.includes('gen5ani');

  const handleError = () => {
      if (srcIndex < sources.length - 1) {
          setSrcIndex(prev => prev + 1);
      } else {
          setImgError(true);
      }
  };

  let animClass = '';
  if (pokemon.animationState === 'attack') {
      animClass = isBack ? 'animate-attack-right' : 'animate-attack-left';
  } else if (pokemon.animationState === 'damage') {
      animClass = 'animate-shake brightness-200 sepia saturate-200 hue-rotate-[-50deg]'; 
  } else if (pokemon.animationState === 'level-up') {
      animClass = 'animate-bounce brightness-125';
  } else {
      animClass = 'animate-float'; 
  }
  
  if (isTargetable) {
      animClass += ' animate-target-pulse';
  }

  let effectClass = '';
  if (pokemon.incomingAttackType && pokemon.animationState === 'damage') {
      effectClass = `effect-${pokemon.incomingAttackType}`;
  }

  const isBattle = variant === 'battle';
  // Default size if not provided - Adjusted for better visibility and layout.
  // Width-based md: breakpoint alone caused 320px player sprites to render
  // on short (<720px tall) ultrawide secondary displays, pushing HP bars
  // behind the action panel. Height-based arbitrary variants below force a
  // compact size on short screens even when the width qualifies as "md".
  const containerClass = className || (isBattle 
    ? (isBack 
        ? "w-40 h-40 md:w-56 md:h-56 [@media(min-height:720px)]:md:w-72 [@media(min-height:720px)]:md:h-72 [@media(min-height:900px)]:md:w-80 [@media(min-height:900px)]:md:h-80" 
        : "w-28 h-28 md:w-44 md:h-44 [@media(min-height:720px)]:md:w-52 [@media(min-height:720px)]:md:h-52 [@media(min-height:900px)]:md:w-56 [@media(min-height:900px)]:md:h-56") 
    : "w-32 h-32 md:w-48 md:h-48");

  if (pokemon.isFainted) {
      return <div className={containerClass}></div>;
  }

  return (
    <div 
        onClick={() => isTargetable && onSelect?.()}
        className={`relative flex ${isBattle ? 'items-end' : 'items-center'} justify-center transition-transform duration-300 ${animClass} ${containerClass}`}
    >
        {/* Shiny Sparkle Effect */}
        {pokemon.isShiny && !pokemon.isFainted && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping delay-75"></div>
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping delay-300"></div>
                <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-white rounded-full animate-ping delay-500"></div>
                <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-yellow-200 rounded-full animate-pulse"></div>
            </div>
        )}

        {!imgError && currentSrc ? (
            <img 
                src={currentSrc} 
                alt={pokemon.name} 
                onError={handleError}
                className={`
                    w-full h-full object-contain ${!is3D ? 'pixel-art' : ''} drop-shadow-2xl z-10
                    ${isBattle ? 'object-bottom origin-bottom' : 'object-center'}
                    ${pokemon.animationState === 'damage' ? 'brightness-150' : ''}
                `}
            />
        ) : (
            <div className="text-white text-[10px] text-center bg-black/50 p-2 rounded border border-white/20 flex flex-col items-center justify-center h-full w-full">
                <span>{pokemon.name}</span>
                <span className="text-[8px] text-gray-400">No Image</span>
            </div>
        )}
        
        {/* Ground Shadow - Adjusted for larger scale, only in battle */}
        {isBattle && (
            <div className="absolute bottom-[2%] w-[80%] h-[15%] bg-black/40 rounded-[50%] blur-md -z-10 animate-plate-float"></div>
        )}

        {/* VFX Overlay */}
        {pokemon.incomingAttackType && pokemon.animationState === 'damage' && (
            <div className={`absolute inset-0 z-20 rounded-full mix-blend-hard-light ${effectClass}`}></div>
        )}

        {/* Status Effects Overlays */}
        {pokemon.status === 'burn' && (
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-red-500/20 animate-pulse rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-orange-600/40 to-transparent animate-bounce"></div>
            </div>
        )}
        {pokemon.status === 'freeze' && (
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-blue-200/30 backdrop-blur-[1px] rounded-lg border border-white/40"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent animate-pulse"></div>
            </div>
        )}
        {pokemon.status === 'paralysis' && (
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-1 h-4 bg-yellow-400 animate-ping"></div>
                <div className="absolute top-1/2 right-1/3 w-1 h-4 bg-yellow-300 animate-ping delay-300"></div>
                <div className="absolute bottom-1/4 left-1/2 w-4 h-1 bg-yellow-400 animate-ping delay-700"></div>
            </div>
        )}
        {(pokemon.status === 'poison' || pokemon.status === 'toxic') && (
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-purple-600/20 animate-pulse rounded-full blur-lg"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            </div>
        )}
        {pokemon.status === 'sleep' && (
            <div className="absolute -top-4 -right-4 z-20 pointer-events-none flex flex-col gap-1">
                <div className="text-white font-bold text-lg animate-bounce">Z</div>
                <div className="text-white font-bold text-sm animate-bounce delay-300 ml-2">z</div>
                <div className="text-white font-bold text-xs animate-bounce delay-700 ml-4">z</div>
            </div>
        )}
        
        {/* Selection Indicator */}
        {isTargetable && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-300 text-3xl animate-bounce drop-shadow-lg font-bold z-30">
                ▼
            </div>
        )}
    </div>
  );
};
