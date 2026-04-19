
import React, { useEffect, useState, useRef } from 'react';
import { Coordinate, Chunk } from '../types';
import { MAPS, generateChunk, CHUNK_SIZE } from '../services/mapData';

interface Props {
    p1Pos: Coordinate;
    p2Pos: Coordinate;
    mapId: string;
    loadedChunks: Record<string, Chunk>;
    customLayout?: number[][];
    myPlayerId: 1 | 2;
    networkRole?: 'host' | 'client' | null;
    onInteract?: (x: number, y: number) => void;
    onChallenge?: (playerId: string, playerInfo: any) => void;
    remotePlayers?: Map<string, any>;
    storyFlags?: string[];
    badges?: number;
    isScanning?: boolean;
}

const PlayerCharacter: React.FC<{ pos: Coordinate, isLocal: boolean, spriteUrl: string, label: string, onClick?: () => void }> = ({ pos, isLocal, spriteUrl, label, onClick }) => {
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const [isMoving, setIsMoving] = useState(false);
    const prevPos = useRef(pos);
    const TILE_SIZE = 64;

    useEffect(() => {
        if (prevPos.current.x !== pos.x || prevPos.current.y !== pos.y) {
            if (pos.x < prevPos.current.x) setDirection('left');
            if (pos.x > prevPos.current.x) setDirection('right');
            setIsMoving(true);
            const timer = setTimeout(() => setIsMoving(false), 300); 
            prevPos.current = pos;
            return () => clearTimeout(timer);
        }
    }, [pos]);

    // Use a more reliable sprite URL if the provided one looks like a PokeAPI raw link
    const finalSpriteUrl = spriteUrl.includes('raw.githubusercontent.com') 
        ? 'https://play.pokemonshowdown.com/sprites/trainers/red.png' 
        : spriteUrl;

    return (
        <div 
            className={`absolute top-0 left-0 transition-all duration-300 ease-linear z-30 will-change-transform ${onClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
            style={{ 
                transform: `translate(${pos.x * TILE_SIZE}px, ${pos.y * TILE_SIZE - 32}px)`,
                width: TILE_SIZE,
                height: TILE_SIZE + 32
            }}
            onClick={onClick}
            data-player-label={label}
        >
            <div className={`w-full h-full relative flex items-end justify-center pb-2`}>
                <div className="absolute bottom-2 w-12 h-4 bg-black/40 rounded-[50%] blur-[2px]"></div>
                {isLocal && (
                    <div className="absolute -top-8 text-yellow-300 font-bold text-[10px] animate-bounce z-40 drop-shadow-md border-black font-mono">▼</div>
                )}
                {!isLocal && (
                    <div className="absolute -top-12 whitespace-nowrap bg-black/60 text-white text-[8px] px-2 py-1 rounded border border-white/20 z-40">
                        {label}
                    </div>
                )}
                <div className={`${direction === 'left' ? 'scale-x-[-1]' : ''} relative z-10`}>
                    <img 
                        src={finalSpriteUrl} 
                        alt="Player"
                        referrerPolicy="no-referrer"
                        className={`w-16 h-20 object-contain ${isMoving ? 'animate-walk' : ''}`}
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://play.pokemonshowdown.com/sprites/trainers/blue.png';
                        }}
                    />
                </div>
            </div>
        </div>
    );
};


export const Overworld: React.FC<Props> = ({ p1Pos, p2Pos, mapId, loadedChunks, customLayout, myPlayerId, networkRole = null, onInteract, onChallenge, remotePlayers = new Map(), storyFlags = [], badges = 0, isScanning = false }) => {
    const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
    const [weather, setWeather] = useState<'none' | 'rain' | 'snow' | 'sandstorm'>('none');
    const containerRef = useRef<HTMLDivElement>(null);
    const TILE_SIZE = 64;
    const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateCamera = () => {
             const myPos = myPlayerId === 1 ? p1Pos : p2Pos;
             const viewportW = window.innerWidth;
             const viewportH = window.innerHeight;
             const targetX = myPos.x * TILE_SIZE + TILE_SIZE / 2;
             const targetY = myPos.y * TILE_SIZE + TILE_SIZE / 2;
             setCameraOffset({ x: Math.floor(viewportW / 2 - targetX), y: Math.floor(viewportH / 2 - targetY) });
        };
        window.addEventListener('resize', updateCamera);
        updateCamera();
        return () => window.removeEventListener('resize', updateCamera);
    }, [p1Pos, p2Pos, myPlayerId]);

    useEffect(() => {
        const tick = () => {
            if (mapId.includes('interior') || mapId.includes('center') || mapId.includes('mart') || mapId.includes('cave')) { 
                setTimeOfDay('day'); 
                setWeather('none');
                return; 
            }
            const now = new Date();
            const sec = Math.floor(now.getTime() / 1000) % 60; 
            if (sec < 30) setTimeOfDay('day'); else if (sec < 45) setTimeOfDay('sunset'); else setTimeOfDay('night');

            // Weather based on biome
            if (currentMap?.biome === 'snow') setWeather('snow');
            else if (currentMap?.biome === 'desert') setWeather('sandstorm');
            else if (currentMap?.biome === 'lake' && sec % 20 < 10) setWeather('rain');
            else setWeather('none');
        };
        const interval = setInterval(tick, 1000);
        tick();
        return () => clearInterval(interval);
    }, [mapId, loadedChunks]);
    
    let currentMap: any;
    if (mapId.startsWith('chunk_')) {
        currentMap = loadedChunks[mapId];
        if (!currentMap) {
            const [,cx,cy] = mapId.split('_');
            currentMap = generateChunk(parseInt(cx), parseInt(cy));
        }
    } else {
        currentMap = MAPS[mapId];
    }

    const layout = currentMap ? (customLayout || currentMap.layout) : null;

    const [showInteractPrompt, setShowInteractPrompt] = useState(false);
    const [interactPos, setInteractPos] = useState<Coordinate | null>(null);

    useEffect(() => {
        if (!currentMap || !layout) return;
        const checkInteraction = () => {
            const myPos = myPlayerId === 1 ? p1Pos : p2Pos;
            const neighbors = [
                { x: myPos.x, y: myPos.y - 1 },
                { x: myPos.x, y: myPos.y + 1 },
                { x: myPos.x - 1, y: myPos.y },
                { x: myPos.x + 1, y: myPos.y }
            ];

            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                const hasTrainer = currentMap.trainers?.[key];
                const hasNPC = currentMap.npcs?.[key];
                const hasInteractable = currentMap.interactables?.[key];
                
                let hasTileInteract = false;
                if (layout[n.y] && layout[n.y][n.x] !== undefined) {
                    const t = layout[n.y][n.x];
                    if ([12, 53, 56, 5, 10, 68].includes(t)) hasTileInteract = true;
                }

                if (hasTrainer || hasNPC || hasInteractable || hasTileInteract) {
                    setShowInteractPrompt(true);
                    setInteractPos(n);
                    return;
                }
            }
            setShowInteractPrompt(false);
            setInteractPos(null);
        };
        checkInteraction();
    }, [p1Pos, p2Pos, myPlayerId, currentMap, layout]);

    if (!currentMap) return <div className="text-white">Map Error: {mapId}</div>;

    const renderTile = (tile: number, x: number, y: number) => {
        const key = `${x},${y}`;
        let className = "tile-base ";
        let content = null;

        const itemFlag = `item_${mapId}_${x}_${y}`;
        const isCollected = storyFlags.includes(itemFlag);
        const effectiveTile = (tile === 12 && isCollected) ? 4 : tile; 

        const trainer = currentMap.trainers?.[key];
        const npc = currentMap.npcs?.[key];
        
        const myPos = myPlayerId === 1 ? p1Pos : p2Pos;
        const dx = Math.abs(x - myPos.x);
        const dy = Math.abs(y - myPos.y);
        const isAdjacent = (dx + dy === 1);

        if (isScanning) {
            const isTallGrass = effectiveTile === 2;
            const isItem = effectiveTile === 12;
            if (isTallGrass || isItem) {
                className += " scan-highlight ";
            }
        }

        if (trainer) {
             content = (
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-auto cursor-pointer" style={{ width: TILE_SIZE * 1.5 }} onClick={() => onInteract?.(x, y)}>
                     {trainer.isGymLeader && (
                         <div className="bg-yellow-400 text-black text-[10px] font-bold px-2 rounded border border-black mb-1 animate-pulse">GYM LEADER</div>
                     )}
                     <div className="text-red-500 font-bold animate-bounce text-lg mb-1">!</div>
                     <div className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 whitespace-nowrap border border-white/30 shadow-lg">
                         {trainer.name}
                         <span className="ml-1 text-yellow-400 font-bold">Lv.{trainer.level}</span>
                     </div>
                     <img 
                        src={trainer.sprite || 'https://play.pokemonshowdown.com/sprites/trainers/red.png'} 
                        className="w-20 h-20 object-contain drop-shadow-xl scale-110 -translate-y-2" 
                        alt="Trainer" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://play.pokemonshowdown.com/sprites/trainers/blue.png'; }}
                     />
                 </div>
             );
        } else if (npc) {
             content = (
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-auto cursor-pointer" style={{ width: TILE_SIZE * 1.5 }} onClick={() => onInteract?.(x, y)}>
                     {npc.challenge && (
                         <div className="bg-blue-500 text-white text-[10px] font-bold px-2 rounded border border-white mb-1 animate-bounce">CHALLENGE</div>
                     )}
                     {isAdjacent && <div className="animate-bounce bg-white text-black rounded-full px-3 py-1 text-xs mb-1 border border-black font-bold shadow-lg">💬</div>}
                     <div className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 whitespace-nowrap border border-white/30 shadow-lg">
                         {npc.name}
                     </div>
                     <img 
                        src={npc.sprite && npc.sprite.length > 2 ? npc.sprite : 'https://play.pokemonshowdown.com/sprites/trainers/lass.png'} 
                        className="w-20 h-20 object-contain drop-shadow-xl scale-110 -translate-y-2" 
                        alt="NPC" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://play.pokemonshowdown.com/sprites/trainers/beauty.png'; }}
                     />
                 </div>
             );
        }

        const biome = currentMap?.biome || 'forest';
        let bgClass = "tile-grass";
        if (biome === 'desert') bgClass = "tile-sand";
        else if (biome === 'snow') bgClass = "tile-snow";
        else if (biome === 'canyon') bgClass = "tile-sand";
        else if (biome === 'cave') bgClass = "tile-cave-floor";
        else if (biome === 'lake') bgClass = "tile-grass";

        switch (effectiveTile) {
            case 0: className += "tile-grass"; break;
            case 1: className += "tile-tree tile-grass"; break;
            case 2: className += "tile-tall-grass tile-grass"; break; 
            case 3: className += "tile-water"; break;
            case 4: className += "tile-path"; break;
            case 5: 
                className += "tile-checkered"; 
                content = (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-14 bg-stone-300 rounded-t-xl border-x-4 border-t-4 border-stone-500 shadow-xl flex flex-col items-center">
                        <div className="w-8 h-8 bg-pink-400 rounded-full border-4 border-pink-600 shadow-inner mt-2 animate-pulse flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                        </div>
                        <div className="w-full h-2 bg-stone-400 mt-auto"></div>
                    </div>
                ); 
                break;
            case 7: className += "tile-cave-floor"; break; 
            case 8: className += "tile-fence tile-grass"; break;
            case 9: className += "tile-path"; content = <div className="absolute inset-0 bg-purple-900/50 animate-pulse"></div>; break;
            case 10: className += "tile-checkered"; content = <div className="absolute bottom-0 w-full h-3/4 bg-blue-600 border-t-4 border-blue-400"></div>; break;
            case 12: // Item Ball
                className += bgClass; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto cursor-pointer" onClick={() => onInteract?.(x, y)}>
                        <img 
                            src="https://play.pokemonshowdown.com/sprites/itemicons/pokeball.png" 
                            className="w-10 h-10 object-contain drop-shadow-md animate-bounce" 
                            alt="Item Ball" 
                            referrerPolicy="no-referrer"
                        />
                    </div>
                );
                break;
            case 13: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-6 h-6">
                            <div className="absolute inset-0 bg-pink-400 rounded-full shadow-sm"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 rounded-full"></div>
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-3 bg-pink-300 rounded-full rotate-0"></div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-3 bg-pink-300 rounded-full rotate-0"></div>
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-2 bg-pink-300 rounded-full rotate-0"></div>
                            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-2 bg-pink-300 rounded-full rotate-0"></div>
                        </div>
                    </div>
                ); 
                break;
            case 14: className += "tile-ledge tile-grass"; break;
            case 15: className += "tile-wood"; break;
            case 17: className += "tile-checkered"; break;
            case 19: className += "tile-danger"; break;
            case 20: className += "tile-stone"; break;
            case 21: className += "tile-pillar tile-stone"; break;
            case 22: className += "tile-statue tile-stone"; break;
            case 23: className += "tile-tree-dark tile-grass"; break;
            case 24: className += "tile-rock-wall"; break; 
            case 25: className += "tile-sand"; break;
            case 26: className += "tile-snow"; break;
            case 27: className += "tile-ice"; break;
            case 28: className += "tile-lava"; break;
            case 29: className += "tile-bridge"; break;
            case 30: case 31: case 32: 
                className += "tile-roof-red tile-grass"; 
                if (tile === 31) content = <div className="tile-poke-center-sign">P</div>;
                break;
            case 33: case 35: case 83: case 85: className += "tile-wall-house tile-grass"; break;
            case 34: className += "tile-window tile-wall-house tile-grass"; break;
            case 40: case 41: case 42: 
                className += "tile-roof-blue tile-grass"; 
                if (tile === 41) content = <div className="tile-poke-mart-sign">M</div>;
                break;
            case 43: case 45: className += "tile-wall-house bg-gray-200 tile-grass"; break;
            case 80: case 81: case 82: className += "tile-roof-orange tile-grass"; break;
            case 50: 
                className += "tile-mat"; 
                content = (
                    <div className="absolute inset-x-1 bottom-0 top-2 bg-blue-100/40 border-2 border-gray-400 rounded-t-sm flex items-center justify-center shadow-inner backdrop-blur-[1px]">
                        <div className="w-0.5 h-full bg-gray-400/50"></div>
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-600 rounded-full shadow-sm"></div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-600 rounded-full shadow-sm"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                    </div>
                );
                break;
            case 51: className += "tile-grass"; content = <div className="campfire-container"><div className="campfire-flame"></div><div className="campfire-logs"></div></div>; break;
            case 52: className += "tile-tent tile-grass"; break;
            case 53: 
                className += "tile-sign tile-grass"; 
                content = (
                    <div className="absolute inset-x-2 bottom-2 top-4 bg-amber-700 border-2 border-amber-900 rounded-sm shadow-md">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-amber-900"></div>
                    </div>
                );
                break;
            case 54: 
                className += "tile-well tile-grass"; 
                content = (
                    <div className="absolute inset-1 border-4 border-stone-500 rounded-full bg-stone-700 shadow-inner overflow-hidden">
                        <div className="absolute inset-2 bg-blue-900/50 rounded-full animate-pulse"></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-stone-400/30"></div>
                    </div>
                );
                break;
            case 55: 
                className += "tile-fountain tile-grass"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-4 border-stone-400 bg-blue-400 shadow-inner">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/50 rounded-full animate-ping"></div>
                        </div>
                    </div>
                );
                break;
            case 56: 
                className += "tile-berry-tree tile-grass"; 
                content = (
                    <div className="absolute inset-x-2 bottom-0 top-2 flex flex-col items-center pointer-events-auto cursor-pointer" onClick={() => onInteract?.(x, y)}>
                        <div className="w-12 h-12 bg-green-600 rounded-full border-4 border-green-800 shadow-lg relative">
                            <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse"></div>
                            <div className="absolute bottom-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 rounded-full blur-[1px]"></div>
                        </div>
                        <div className="w-2 h-4 bg-amber-900 border-x-2 border-amber-950"></div>
                    </div>
                );
                break;
            case 57: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-6 bg-stone-500 rounded-full border-b-4 border-stone-700 shadow-lg flex items-center justify-center overflow-hidden">
                        <div className="absolute top-0 left-1 w-4 h-2 bg-stone-400/40 rounded-full blur-[1px]"></div>
                        <div className="absolute bottom-1 right-1 w-2 h-1 bg-stone-800/30 rounded-full"></div>
                    </div>
                ); 
                break;
            case 58: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-green-700 rounded-full border-2 border-green-900 shadow-md flex items-center justify-center overflow-hidden">
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-600 rounded-full opacity-40"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-800 rounded-full opacity-40"></div>
                        <div className="w-4 h-4 bg-green-500/30 rounded-full blur-[2px]"></div>
                    </div>
                ); 
                break;
            case 59: className += "tile-grass"; content = <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-4 bg-amber-900 rounded-sm border border-amber-950 rotate-12 shadow-md"></div>; break;
            case 60: className += "tile-wood"; content = <div className="deco-table"></div>; break;
            case 61: className += "tile-wood"; content = <div className="deco-tv"></div>; break;
            case 62: className += "tile-wood"; content = <div className="deco-bed"></div>; break;
            case 63: className += "tile-wood"; content = <div className="deco-bookshelf"></div>; break;
            case 64: className += "tile-wood"; content = <div className="deco-plant"></div>; break;
            case 65: 
                className += "tile-stone"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-blue-500/30 border-2 border-blue-300 rounded-lg animate-pulse flex items-center justify-center">
                            <div className="text-white text-xl">⚡</div>
                        </div>
                    </div>
                );
                break;
            case 66: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-cyan-400/40 rounded-full border-4 border-cyan-200 animate-pulse flex items-center justify-center">
                            <div className="text-white text-2xl">✨</div>
                        </div>
                    </div>
                );
                break;
            case 67: 
                className += "tile-stone"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-500/30 border-2 border-red-300 rounded-lg animate-pulse flex items-center justify-center">
                            <div className="text-white text-xl">🔥</div>
                        </div>
                    </div>
                );
                break;
            case 68: 
                className += "tile-danger"; 
                content = (
                    <div className="absolute inset-0 bg-black overflow-hidden">
                        <div className="absolute inset-0 bg-purple-600/40 animate-pulse scale-150 blur-xl"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-purple-400 rounded-full animate-spin"></div>
                        </div>
                    </div>
                );
                break;
            case 70: className += "tile-ice"; break;
            case 71: 
                className += "tile-stone"; 
                content = (
                    <div className="absolute inset-1 bg-stone-600 border-4 border-stone-800 rounded shadow-2xl flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-stone-400/30 rounded-full"></div>
                    </div>
                );
                break;
            case 72: 
                className += "tile-cave-floor"; 
                content = <div className="absolute inset-3 bg-black rounded-full shadow-inner"></div>;
                break;
            case 73: className += "tile-wood"; content = <div className="absolute inset-1 bg-red-800/40 border border-red-900/20 rounded shadow-inner"></div>; break;
            case 74: 
                className += "tile-reward"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                        <div className="w-8 h-8 bg-yellow-500 border-2 border-yellow-700 rounded shadow-lg flex items-center justify-center">
                            <div className="w-4 h-1 bg-yellow-900"></div>
                        </div>
                    </div>
                );
                break;
            case 75: case 76: case 77:
                className += "tile-grass";
                const flowerColor = tile === 75 ? 'bg-red-500' : (tile === 76 ? 'bg-blue-500' : 'bg-yellow-400');
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-3 h-3 ${flowerColor} rounded-full shadow-sm animate-pulse`}></div>
                        <div className={`absolute top-2 left-2 w-2 h-2 ${flowerColor} rounded-full opacity-60`}></div>
                        <div className={`absolute bottom-2 right-2 w-2 h-2 ${flowerColor} rounded-full opacity-60`}></div>
                    </div>
                );
                break;
            case 78:
                className += (mapId.startsWith('cave_') ? "tile-cave-floor" : "tile-grass");
                content = (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-6 h-4 bg-red-600 rounded-t-full border-2 border-red-800 relative">
                            <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-60"></div>
                        </div>
                        <div className="w-2 h-2 bg-stone-200"></div>
                    </div>
                );
                break;
            case 79:
                className += "tile-sand";
                content = (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-6 h-10 bg-green-700 border-x-2 border-t-2 border-green-900 rounded-t-lg relative">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-green-900/30"></div>
                            <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                );
                break;
            case 86:
                className += "tile-snow";
                content = <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-white rounded-t-full shadow-inner border-b-2 border-blue-100"></div>;
                break;
            case 87:
                className += (mapId.startsWith('cave_') ? "tile-cave-floor" : "tile-snow");
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-10 bg-cyan-300/60 border border-cyan-100 rotate-45 animate-pulse shadow-[0_0_10px_rgba(165,243,252,0.5)]"></div>
                    </div>
                );
                break;
            case 88:
                className += "tile-water";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-8 bg-green-800/80 rounded-[40%] border-2 border-green-950 relative">
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-400 rounded-full blur-[1px] opacity-60"></div>
                        </div>
                    </div>
                );
                break;
            case 89:
                className += "tile-sand";
                content = (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
                        <div className="w-1 h-10 bg-amber-900 rounded-full -rotate-6"></div>
                        <div className="w-1 h-8 bg-amber-800 rounded-full rotate-3"></div>
                        <div className="w-1 h-12 bg-amber-950 rounded-full rotate-12"></div>
                    </div>
                );
                break;
            case 90:
                className += "tile-water";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <div className="w-1 h-full bg-green-500/40 animate-wave rounded-full"></div>
                        <div className="w-1 h-full bg-green-600/30 animate-wave-delayed rounded-full"></div>
                    </div>
                );
                break;
            case 91:
                className += "tile-sand";
                content = (
                    <div className="absolute inset-0">
                        <div className="absolute top-2 left-3 w-2 h-2 bg-white rounded-full opacity-80"></div>
                        <div className="absolute bottom-3 right-4 w-2 h-2 bg-pink-200 rounded-full opacity-80"></div>
                        <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-orange-100 rounded-full opacity-80"></div>
                    </div>
                );
                break;
            case 92:
                className += (biome === 'desert' ? "tile-sand" : "tile-stone");
                content = (
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/2 w-px h-full bg-black rotate-12"></div>
                        <div className="absolute left-0 top-1/2 w-full h-px bg-black -rotate-12"></div>
                    </div>
                );
                break;
            case 93: // Rift Crystal (Small)
                className += (biome === 'cave' ? "tile-cave-floor" : "tile-stone");
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-6 bg-purple-500/80 rounded-full blur-[2px] animate-pulse"></div>
                        <div className="absolute w-3 h-5 bg-purple-300 rotate-45 skew-x-12 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    </div>
                );
                break;
            case 94: // Rift Crystal (Large)
                className += (biome === 'cave' ? "tile-cave-floor" : "tile-stone");
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-10 bg-purple-600/60 rounded-full blur-[4px] animate-pulse"></div>
                        <div className="absolute w-6 h-10 bg-purple-400 rotate-12 -skew-x-12 shadow-[0_0_20px_rgba(168,85,247,1)]"></div>
                        <div className="absolute w-4 h-8 bg-purple-200 -rotate-12 skew-y-12 opacity-80"></div>
                    </div>
                );
                break;
            case 95: // Ancient Pillar (Broken)
                className += "tile-stone";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-6 bg-gray-400 border-2 border-gray-600 rounded-sm rotate-45 shadow-lg"></div>
                        <div className="absolute w-8 h-4 bg-gray-500 border border-gray-700 -rotate-12 translate-x-2 translate-y-2"></div>
                    </div>
                );
                break;
            case 96: // Ancient Pillar (Intact)
                className += "tile-stone";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-14 bg-gray-300 border-x-4 border-gray-500 shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-400"></div>
                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-400"></div>
                            <div className="absolute inset-2 border border-gray-400/30"></div>
                        </div>
                    </div>
                );
                break;
            default: className += "tile-grass"; break;
        }

        return <div key={`${x}-${y}`} className={className}>{content}</div>;
    };

    return (
        <div className="w-full h-full relative bg-[#0f172a] overflow-hidden">
            <style>{`
                .tile-base { position: relative; width: ${TILE_SIZE}px; height: ${TILE_SIZE}px; box-sizing: border-box; image-rendering: pixelated; }
                
                .tile-grass { 
                  background-color: #4ade80; 
                  background-image: 
                    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 10%),
                    radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 0%, transparent 10%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 50c0-2 1-4 3-4s3 2 3 4M30 50c0-3 2-6 5-6s5 3 5 6M50 50c0-2 1-4 3-4s3 2 3 4M20 20c0-1 1-2 2-2s2 1 2 2M40 20c0-1 1-2 2-2s2 1 2 2' stroke='%2322c55e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M12 52c0-1 0.5-2 1.5-2s1.5 1 1.5 2M35 52c0-1.5 1-3 2.5-3s2.5 1.5 2.5 3' stroke='%2316a34a' stroke-width='1' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 100% 100%, ${TILE_SIZE}px ${TILE_SIZE}px; 
                }
                .tile-stone { 
                  background-color: #94a3b8; 
                  background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='28' height='28' x='2' y='2' rx='4' fill='%2364748b'/%3E%3Cpath d='M4 4h24v24H4z' stroke='%23475569' stroke-width='2' fill='none'/%3E%3Cpath d='M8 8l4 4M20 20l4 4' stroke='%2394a3b8' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E");
                  background-size: 32px 32px; 
                }
                
                .tile-cave-floor { 
                  background-color: #44403c; 
                  background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='32' cy='32' r='4' fill='%23292524'/%3E%3Ccircle cx='8' cy='8' r='2' fill='%23292524'/%3E%3Ccircle cx='56' cy='56' r='3' fill='%23292524'/%3E%3Cpath d='M0 0l64 64M64 0L0 64' stroke='%23292524' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E");
                  box-shadow: inset 0 0 30px rgba(0,0,0,0.6); 
                }
                
                .tile-tall-grass { 
                  position: relative; 
                  background-color: #4ade80;
                  z-index: 1;
                }
                .tile-tall-grass::before {
                  content: '';
                  position: absolute;
                  top: 4px; left: 1px; right: 1px; bottom: 0;
                  background: linear-gradient(180deg, #166534 0%, #064e3b 100%);
                  border-radius: 4px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1);
                }
                .tile-tall-grass::after { 
                  content: ''; 
                  position: absolute; 
                  top: -12px; left: -2px; right: -2px; bottom: 0; 
                  background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 40c0-15 4-30 10-30s10 15 10 30M28 40c0-12 4-24 8-24s8 12 8 24M4 40c0-10 3-20 6-20s6 10 6 20' stroke='%2386efac' stroke-width='2' fill='%23166534' stroke-linecap='round'/%3E%3C/svg%3E");
                  background-size: 100% 100%;
                  pointer-events: none;
                  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
                }
                
                .tile-path { 
                  background-color: #e7e5e4; 
                  background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='4' cy='4' r='1' fill='%23d6d3d1'/%3E%3Ccircle cx='28' cy='28' r='1.5' fill='%23d6d3d1'/%3E%3Ccircle cx='16' cy='16' r='1' fill='%23d6d3d1'/%3E%3Cpath d='M0 0l32 32M32 0L0 32' stroke='%23d6d3d1' stroke-width='0.5' opacity='0.2'/%3E%3C/svg%3E");
                  background-size: 32px 32px; 
                  box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
                }
                .tile-water { 
                  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); 
                  background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24c12-8 12 8 24 0s12-8 24 0' stroke='rgba(255,255,255,0.3)' stroke-width='3' fill='none'/%3E%3Cpath d='M0 12c12-8 12 8 24 0s12-8 24 0' stroke='rgba(255,255,255,0.15)' stroke-width='2' fill='none'/%3E%3C/svg%3E");
                  animation: flow 1.5s infinite linear; 
                  box-shadow: inset 0 0 15px rgba(0,0,0,0.1);
                }
                .tile-sand { 
                  background-color: #fcd34d; 
                  background-image: url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='8' cy='8' r='1' fill='%23fbbf24'/%3E%3Ccircle cx='24' cy='24' r='1.5' fill='%23fbbf24'/%3E%3Cpath d='M4 28c4-2 8 2 12 0s8-2 12 0' stroke='%23fbbf24' stroke-width='0.5' fill='none'/%3E%3C/svg%3E");
                  background-size: 32px 32px;
                }
                .tile-snow { 
                  background-color: #f8fafc; 
                  background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='32' cy='32' r='2' fill='%23e2e8f0'/%3E%3Ccircle cx='16' cy='16' r='1' fill='%23e2e8f0'/%3E%3Ccircle cx='48' cy='48' r='1.5' fill='%23e2e8f0'/%3E%3C/svg%3E");
                  box-shadow: inset 0 0 20px white;
                }
                .tile-ice { 
                  background-color: #bae6fd; 
                  background-image: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(0,0,0,0.15) 100%);
                  box-shadow: inset 0 0 15px rgba(255,255,255,0.9), 0 0 5px rgba(186,230,253,0.5); 
                  border: 1px solid rgba(255,255,255,0.3);
                }
                .tile-lava { 
                  background: #dc2626; 
                  background-image: radial-gradient(#991b1b 30%, transparent 31%), radial-gradient(rgba(251,191,36,0.4) 10%, transparent 11%); 
                  background-size: 16px 16px, 32px 32px; 
                  animation: pulse-lava 1.5s infinite alternate; 
                  box-shadow: inset 0 0 20px #7f1d1d;
                }
                .tile-rock { 
                  background-color: #57534e; 
                  background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10l28 5-5 23-23-5z' fill='%2344403c'/%3E%3C/svg%3E");
                  border-radius: 4px; 
                  box-shadow: inset 0 0 10px rgba(0,0,0,0.5); 
                  border: 2px solid #292524; 
                  z-index: 5; 
                }
                .tile-cave-floor { 
                  background-color: #44403c; 
                  background-image: radial-gradient(rgba(0,0,0,0.2) 10%, transparent 11%), radial-gradient(rgba(255,255,255,0.05) 5%, transparent 6%);
                  background-size: 16px 16px, 32px 32px;
                  box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
                }
                .tile-rock-wall { 
                  background-color: #292524; 
                  background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l48 48M48 0L0 48' stroke='rgba(0,0,0,0.2)' stroke-width='2'/%3E%3Cpath d='M24 0v48M0 24h48' stroke='rgba(0,0,0,0.1)' stroke-width='1'/%3E%3C/svg%3E");
                  border: 2px solid #1c1917;
                  box-shadow: inset 0 0 15px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.4);
                  z-index: 10;
                }
                
                .tile-danger { background: repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 10px, #991b1b 10px, #991b1b 20px); border: 1px solid #000; }
                
                .tile-fence { position: relative; }
                .tile-fence::after { content: ''; position: absolute; top: 10px; left: 0; right: 0; height: 6px; background: #78350f; z-index: 2; border-bottom: 2px solid #451a03; }
                .tile-fence::before { content: ''; position: absolute; top: 22px; left: 0; right: 0; height: 6px; background: #78350f; z-index: 2; border-bottom: 2px solid #451a03; }
                .tile-fence-post { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 8px; background: #92400e; z-index: 1; border: 1px solid #451a03; }
                .tile-ledge { 
                  background: #15803d; 
                  background-image: linear-gradient(180deg, #4ade80 0%, #15803d 50%, #14532d 100%);
                  border-bottom: 6px solid #052e16;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.4);
                  border-radius: 0 0 4px 4px;
                }
                .tile-tree { position: relative; z-index: 5; }
                .tile-tree::before { content: ''; position: absolute; bottom: 4px; left: 18px; width: 12px; height: 20px; background: linear-gradient(90deg, #5d4037, #3e2723); border-radius: 2px; z-index: 1; border: 1px solid #2d1b16; }
                .tile-tree::after { content: ''; position: absolute; bottom: 16px; left: -4px; width: 56px; height: 56px; background: radial-gradient(circle at 30% 30%, #4ade80, #15803d 70%, #14532d); z-index: 2; border-radius: 50%; box-shadow: 0 6px 0 #052e16, 0 10px 15px rgba(0,0,0,0.3); border: 2px solid #052e16; }
                .tile-tree-dark::before { content: ''; position: absolute; bottom: 4px; left: 18px; width: 12px; height: 20px; background: linear-gradient(90deg, #3e2723, #1a0f0d); border-radius: 2px; z-index: 1; border: 1px solid #000; }
                .tile-tree-dark::after { content: ''; position: absolute; bottom: 16px; left: -4px; width: 56px; height: 56px; background: radial-gradient(circle at 30% 30%, #1e40af, #172554 70%, #0f172a); z-index: 2; border-radius: 50%; box-shadow: 0 6px 0 #020617, 0 10px 15px rgba(0,0,0,0.4); border: 2px solid #020617; }
                .tile-wood { background: #78350f; background-image: linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%); box-shadow: inset 0 0 0 1px #451a03, inset 0 0 10px rgba(0,0,0,0.2); }
                .tile-bridge { background: #92400e; border-top: 3px solid #451a03; border-bottom: 3px solid #451a03; background-image: repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(0,0,0,0.3) 12px, rgba(0,0,0,0.3) 14px); box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
                
                @keyframes wave {
                    0%, 100% { transform: skewX(-5deg); }
                    50% { transform: skewX(5deg); }
                }
                @keyframes wave-delayed {
                    0%, 100% { transform: skewX(5deg); }
                    50% { transform: skewX(-5deg); }
                }
                .animate-wave { animation: wave 3s infinite ease-in-out; }
                .animate-wave-delayed { animation: wave-delayed 3.5s infinite ease-in-out; }

                .tile-checkered { 
                  background-color: #f3f4f6;
                  background-image: 
                    linear-gradient(45deg, #d1d5db 25%, transparent 25%), 
                    linear-gradient(-45deg, #d1d5db 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #d1d5db 75%), 
                    linear-gradient(-45deg, transparent 75%, #d1d5db 75%);
                  background-size: 32px 32px;
                  background-position: 0 0, 0 16px, 16px -16px, -16px 0px;
                  border: 1px solid rgba(0,0,0,0.1);
                  box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
                }
                .tile-mat { 
                  background: #9ca3af; 
                  box-shadow: inset 0 0 15px rgba(0,0,0,0.2); 
                  position: relative;
                }
                .tile-wall-house { background: #f9fafb; border-bottom: 8px solid #9ca3af; box-shadow: inset 0 -6px 0 rgba(0,0,0,0.1); position: relative; }
                .tile-wall-house::after { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24h48M24 0v48' stroke='rgba(0,0,0,0.07)' stroke-width='1'/%3E%3C/svg%3E"); }
                
                .tile-roof-red { 
                  background-color: #b91c1c;
                  background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px),
                    repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px),
                    linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
                  border-bottom: 6px solid #7f1d1d; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2);
                }
                .tile-roof-blue { 
                  background-color: #1e40af;
                  background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px),
                    repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px),
                    linear-gradient(180deg, #3b82f6 0%, #1e40af 100%);
                  border-bottom: 4px solid #1e3a8a; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1);
                }
                .tile-roof-orange { 
                  background-color: #c2410c;
                  background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px),
                    repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px),
                    linear-gradient(180deg, #f97316 0%, #c2410c 100%);
                  border-bottom: 4px solid #7c2d12; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1);
                }
                .tile-window { 
                  background: #93c5fd; 
                  border: 3px solid #1e40af; 
                  box-shadow: inset 0 0 10px #3b82f6, 0 0 5px rgba(147,197,253,0.5); 
                  position: relative; 
                  overflow: hidden;
                }
                .tile-window::after { 
                  content: ''; 
                  position: absolute; 
                  top: -50%; 
                  left: -50%; 
                  width: 200%; 
                  height: 200%; 
                  background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.4) 50%, transparent 55%); 
                  transform: rotate(45deg); 
                }
                .tile-window::before {
                  content: '';
                  position: absolute;
                  top: 0; left: 50%; width: 2px; height: 100%; background: #1e3a8a;
                  z-index: 1;
                }
                
                .tile-poke-center-sign {
                  position: absolute;
                  top: -12px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: white;
                  border: 3px solid #ef4444;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: #ef4444;
                  font-size: 14px;
                  z-index: 20;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .tile-poke-center-sign::after {
                  content: 'P';
                  font-family: sans-serif;
                }
                .tile-poke-mart-sign {
                  position: absolute;
                  top: -12px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                  z-index: 20;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .tile-poke-mart-sign::after {
                  content: 'M';
                  font-family: sans-serif;
                }
                
                .tile-pillar { position: relative; }
                .tile-pillar::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 8px; 
                  right: 8px; 
                  top: -12px; 
                  background: linear-gradient(90deg, #94a3b8, #cbd5e1, #94a3b8); 
                  border: 2px solid #475569; 
                  border-radius: 2px; 
                  box-shadow: 0 4px 0 #1e293b, 0 6px 10px rgba(0,0,0,0.3); 
                }
                .tile-statue { position: relative; }
                .tile-statue::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  right: 4px; 
                  top: -20px; 
                  background: linear-gradient(135deg, #64748b, #475569); 
                  border: 2px solid #1e293b; 
                  border-radius: 8px 8px 2px 2px; 
                  box-shadow: 0 6px 0 #0f172a, 0 10px 15px rgba(0,0,0,0.4);
                }
                .tile-tent { position: relative; }
                .tile-tent::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: -4px; 
                  right: -4px; 
                  top: -24px; 
                  background: linear-gradient(135deg, #f87171, #dc2626); 
                  clip-path: polygon(50% 0%, 0% 100%, 100% 100%); 
                  border: 2px solid #7f1d1d; 
                  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                }
                .tile-sign { position: relative; }
                .tile-sign::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 8px; 
                  right: 8px; 
                  top: 0px; 
                  background: linear-gradient(180deg, #d97706, #92400e); 
                  border: 2px solid #451a03; 
                  border-radius: 2px; 
                  box-shadow: 0 4px 0 #451a03, 0 6px 10px rgba(0,0,0,0.3);
                }
                .tile-well { position: relative; }
                .tile-well::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  right: 4px; 
                  top: -12px; 
                  background: #475569; 
                  border: 4px solid #1e293b; 
                  border-radius: 50%; 
                  box-shadow: 0 6px 12px rgba(0,0,0,0.4), inset 0 0 15px #0f172a; 
                }
                .tile-fountain { position: relative; }
                .tile-fountain::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  right: 4px; 
                  top: -12px; 
                  background: #3b82f6; 
                  border: 4px solid #94a3b8; 
                  border-radius: 50%; 
                  animation: pulse-fountain 1.5s infinite alternate; 
                  box-shadow: 0 6px 12px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.5);
                }

                .tile-berry-tree { position: relative; z-index: 5; }
                .tile-berry-tree::before { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 18px; 
                  width: 12px; 
                  height: 16px; 
                  background: linear-gradient(90deg, #5d4037, #3e2723); 
                  border-radius: 2px; 
                  border: 1px solid #2d1b16;
                }
                .tile-berry-tree::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 12px; 
                  left: -4px; 
                  width: 56px; 
                  height: 56px; 
                  background: radial-gradient(circle at 30% 30%, #4ade80, #15803d 70%, #14532d); 
                  border-radius: 50%; 
                  box-shadow: 0 6px 0 #052e16, 0 10px 15px rgba(0,0,0,0.3); 
                  border: 2px solid #052e16;
                }
                .tile-berry-tree .berries { 
                  position: absolute; 
                  top: 12px; 
                  left: 10px; 
                  width: 28px; 
                  height: 28px; 
                  z-index: 10; 
                  display: flex; 
                  flex-wrap: wrap; 
                  gap: 4px; 
                  justify-content: center; 
                }
                .tile-berry-tree .berry { 
                  width: 8px; 
                  height: 8px; 
                  background: radial-gradient(circle at 30% 30%, #f87171, #ef4444); 
                  border-radius: 50%; 
                  box-shadow: 0 2px 0 #7f1d1d; 
                  border: 1px solid #7f1d1d;
                }

                .tile-small-rock { position: relative; }
                .tile-small-rock::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 8px; 
                  left: 12px; 
                  width: 24px; 
                  height: 16px; 
                  background: linear-gradient(135deg, #cbd5e1, #94a3b8); 
                  border: 2px solid #475569; 
                  border-radius: 8px 12px 6px 10px; 
                  box-shadow: 0 4px 0 #1e293b, 0 4px 8px rgba(0,0,0,0.3); 
                }
                
                .tile-bush { position: relative; }
                .tile-bush::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 6px; 
                  left: 6px; 
                  width: 36px; 
                  height: 24px; 
                  background: radial-gradient(circle at 30% 30%, #4ade80, #22c55e); 
                  border: 2px solid #166534; 
                  border-radius: 12px 16px 10px 14px; 
                  box-shadow: 0 4px 0 #14532d, 0 6px 10px rgba(0,0,0,0.3); 
                }
                
                .tile-log { position: relative; }
                .tile-log::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 10px; 
                  left: 4px; 
                  width: 40px; 
                  height: 12px; 
                  background: linear-gradient(180deg, #92400e, #78350f); 
                  border: 2px solid #451a03; 
                  border-radius: 4px; 
                  box-shadow: 0 3px 0 #2d1002, 0 4px 8px rgba(0,0,0,0.3); 
                  background-image: repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 10px);
                }

                @keyframes flow { 0% { background-position: 0 0; } 100% { background-position: 24px 0; } }
                @keyframes pulse-lava { 0% { opacity: 0.8; transform: scale(1); } 100% { opacity: 1; transform: scale(1.05); } }
                
                .campfire-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
                .campfire-flame { width: 16px; height: 24px; background: #f97316; border-radius: 50% 50% 20% 20%; animation: flame 0.5s infinite alternate; box-shadow: 0 0 10px #ef4444; }
                .campfire-logs { position: absolute; bottom: 8px; width: 24px; height: 8px; background: #451a03; border-radius: 4px; }
                @keyframes flame { 0% { transform: scale(1) translateY(0); background: #f97316; } 100% { transform: scale(1.2) translateY(-4px); background: #ef4444; } }
                
                @keyframes rain { from { background-position: 0 0; } to { background-position: 0 1000px; } }
                @keyframes snow { from { background-position: 0 0; } to { background-position: 100px 1000px; } }
                @keyframes sand { from { background-position: -100% 0; } to { background-position: 100% 0; } }
                
                .animate-rain { animation: rain 0.5s linear infinite; }
                .animate-snow { animation: snow 10s linear infinite; }
                .animate-sand { animation: sand 2s linear infinite; }

                .deco-tv { width: 40px; height: 28px; background: #1f2937; margin: auto; border: 4px solid #111; border-radius: 4px; box-shadow: 0 4px 0 rgba(0,0,0,0.3); position: relative; }
                .deco-tv::after { content: ''; position: absolute; right: 4px; top: 4px; width: 4px; height: 4px; background: #ef4444; border-radius: 50%; }
                .deco-bookshelf { width: 40px; height: 44px; background: #78350f; margin: auto; border-radius: 2px; border: 2px solid #451a03; display: flex; flex-direction: column; gap: 4px; padding: 2px; }
                .deco-bookshelf::before { content: ''; flex: 1; background: repeating-linear-gradient(90deg, #fcd34d 0, #fcd34d 4px, #ef4444 4px, #ef4444 8px, #3b82f6 8px, #3b82f6 12px); }
                .deco-plant { width: 32px; height: 40px; background: radial-gradient(circle at 50% 20%, #4ade80 40%, #166534 80%); margin: auto; border-radius: 16px; border: 2px solid #14532d; position: relative; top: -4px; }
                .deco-plant::after { content: ''; position: absolute; bottom: -4px; left: 8px; width: 16px; height: 12px; background: #b45309; border-radius: 0 0 4px 4px; }
                .deco-bed { width: 44px; height: 40px; background: #60a5fa; margin: auto; border-radius: 4px; border-top: 12px solid #eff6ff; box-shadow: 0 2px 0 #1e3a8a; }
                .deco-table { width: 40px; height: 32px; background: #a16207; margin: auto; border: 2px solid #713f12; border-radius: 4px; box-shadow: 0 4px 0 rgba(0,0,0,0.2); }

                .tile-shrine-weather { position: relative; }
                .tile-shrine-weather::after { content: '🌀'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; animation: spin 4s linear infinite; }
                .tile-spring { position: relative; }
                .tile-spring::after { content: ''; position: absolute; inset: 4px; background: #60a5fa; border: 4px solid #fff; border-radius: 50%; box-shadow: 0 0 10px #60a5fa; }
                .tile-shrine-power { position: relative; }
                .tile-shrine-power::after { content: '⚡'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; animation: pulse-lava 1s infinite alternate; }
                .tile-rift { position: relative; background: #000; overflow: hidden; }
                .tile-rift::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, #7e22ce, transparent); animation: pulse-lava 0.5s infinite alternate; }
                
                .tile-boulder { 
                    background-color: #78716c; 
                    border-radius: 50%; 
                    border: 4px solid #44403c; 
                    box-shadow: 0 4px 0 #1c1917, inset 0 4px 8px rgba(255,255,255,0.2);
                    z-index: 15;
                }
                .tile-hole { 
                    background-color: #1c1917; 
                    border-radius: 50%; 
                    box-shadow: inset 0 4px 10px rgba(0,0,0,0.8);
                }
                .tile-switch { 
                    background-color: #ef4444; 
                    border-radius: 4px; 
                    border: 2px solid #7f1d1d; 
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
                }
                .tile-reward { 
                    background-color: #e7e5e4; 
                    background-image: radial-gradient(circle, rgba(255,255,0,0.2), transparent);
                }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes walk {
                  0% { transform: translateY(0) rotate(0deg); }
                  25% { transform: translateY(-4px) rotate(-3deg); }
                  50% { transform: translateY(0) rotate(0deg); }
                  75% { transform: translateY(-4px) rotate(3deg); }
                  100% { transform: translateY(0) rotate(0deg); }
                }
                .animate-walk { animation: walk 0.3s infinite ease-in-out; }
                
                .scan-highlight {
                    position: relative;
                }
                .scan-highlight::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
                    animation: scan-pulse 1s infinite alternate;
                    z-index: 20;
                    pointer-events: none;
                }
                @keyframes scan-pulse {
                    from { opacity: 0.3; transform: scale(0.9); }
                    to { opacity: 0.8; transform: scale(1.1); }
                }
            `}</style>
            
            {showInteractPrompt && interactPos && (
                <div 
                    className="absolute z-50 pointer-events-auto cursor-pointer flex flex-col items-center transition-all duration-300 animate-bounce"
                    style={{ 
                        transform: `translate(${interactPos.x * TILE_SIZE}px, ${interactPos.y * TILE_SIZE - 40}px)`,
                        width: TILE_SIZE
                    }}
                    onClick={() => onInteract?.(interactPos.x, interactPos.y)}
                >
                    <div className="bg-yellow-400 text-black font-bold text-[10px] px-2 py-1 rounded border-2 border-black shadow-lg flex items-center gap-1">
                        <span className="bg-black text-white px-1 rounded text-[8px]">E</span>
                        INTERACT
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                </div>
            )}

            <div className="fixed inset-0 z-30 pointer-events-none transition-colors duration-[2000ms] mix-blend-multiply" style={{ backgroundColor: timeOfDay === 'day' ? 'rgba(255,255,255,0)' : timeOfDay === 'sunset' ? 'rgba(253,186,116,0.2)' : 'rgba(15,23,42,0.5)' }}></div>
            
            {weather === 'rain' && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 animate-rain opacity-40" style={{ background: 'repeating-linear-gradient(170deg, transparent, transparent 40px, #94a3b8 40px, #94a3b8 41px)', backgroundSize: '100% 200%' }}></div>
                </div>
            )}
            {weather === 'snow' && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 animate-snow opacity-60" style={{ background: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                </div>
            )}
            {weather === 'sandstorm' && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden bg-orange-900/10">
                    <div className="absolute inset-0 animate-sand opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #b45309 50%, transparent)', backgroundSize: '200% 100%' }}></div>
                </div>
            )}

            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-xl flex flex-col items-center">
                <h2 className="text-yellow-400 font-bold uppercase text-sm">{currentMap.name}</h2>
                {currentMap.biome && <span className="text-[8px] text-gray-400 uppercase tracking-widest">{currentMap.biome} BIOME</span>}
                {badges > 0 && (
                    <div className="flex gap-1 mt-1">
                        {Array.from({ length: badges }).map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full border border-white shadow-[0_0_5px_rgba(255,255,0,0.5)]"></div>
                        ))}
                    </div>
                )}
            </div>
            <div ref={containerRef} className="absolute transition-transform duration-300 ease-out" style={{ transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)` }}>
                <div className="relative shadow-2xl bg-black flex flex-col" style={{ width: (layout && layout[0] ? layout[0].length : 0) * TILE_SIZE, height: (layout ? layout.length : 0) * TILE_SIZE }}>
                    {layout && layout.map((row, y) => <div key={y} className="flex">{row && row.map((tile, x) => renderTile(tile, x, y))}</div>)}
                </div>

                {/* Remote Players (Other than P1/P2) */}
                {Array.from(remotePlayers.entries()).map(([id, player]) => {
                    // In a 2-player game, we skip the other player because we render them via p1Pos/p2Pos
                    if (networkRole === 'host' && !player.isHost) return null;
                    if (networkRole === 'client' && player.isHost) return null;
                    
                    return player.mapId === mapId && (
                        <PlayerCharacter 
                            key={id} 
                            pos={player.position} 
                            isLocal={false} 
                            label={player.name || "Trainer"}
                            spriteUrl={player.spriteUrl || "https://play.pokemonshowdown.com/sprites/trainers/blue.png"}
                            onClick={() => onChallenge?.(id, player)}
                        />
                    );
                })}

                {/* Local Players (P1 and P2) - Real-time sync */}
                { p1Pos.x !== -100 && (
                    <PlayerCharacter 
                        pos={p1Pos} 
                        isLocal={myPlayerId === 1} 
                        label={myPlayerId === 1 ? "Me" : "Host"}
                        spriteUrl="https://play.pokemonshowdown.com/sprites/trainers/red.png" 
                    />
                )}
                
                { p2Pos.x !== -100 && (
                    <PlayerCharacter 
                        pos={p2Pos} 
                        isLocal={myPlayerId === 2} 
                        label={myPlayerId === 2 ? "Me" : "Friend"}
                        spriteUrl="https://play.pokemonshowdown.com/sprites/trainers/leaf.png" 
                    />
                )}
            </div>
        </div>
    );
};
