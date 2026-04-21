import React, { useMemo } from 'react';

/**
 * Biome-driven ambient particle layer.
 *
 * Renders a pointer-events-none overlay above the tile map (below HUD) with
 * biome-appropriate particles: fireflies in forest at night, pollen motes in
 * lake, ash in canyon, glitching specks in rift, etc. Each particle is one
 * absolutely-positioned div running a pure-transform CSS keyframe from
 * index.css, so the browser can composite them cheaply on the GPU.
 *
 * Deliberately uses `useMemo` with a stable seed per biome/time-of-day so
 * particle positions don't re-randomize every render (which would cause a
 * distracting "shuffle" whenever the player moves).
 */

type TimeOfDay = 'day' | 'sunset' | 'night';

export interface BiomeAmbientProps {
    biome: string | undefined;
    timeOfDay: TimeOfDay;
    /** Disable entirely (interior maps, battle, etc). */
    enabled?: boolean;
}

interface ParticleDef {
    count: number;
    render: (i: number, rand: (n: number) => number) => React.ReactNode;
}

// Small deterministic hash -> PRNG. We need per-particle jitter that stays
// constant across re-renders but varies between biomes.
const makeRand = (seed: number) => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

const buildDef = (biome: string, timeOfDay: TimeOfDay): ParticleDef | null => {
    switch (biome) {
        case 'forest':
            if (timeOfDay === 'night') {
                return {
                    count: 22,
                    render: (i, rand) => {
                        const left = rand(100);
                        const top = 10 + rand(70);
                        const delay = rand(6);
                        const dur = 4 + rand(4);
                        const size = 3 + Math.floor(rand(3));
                        return (
                            <div
                                key={`ff-${i}`}
                                className="absolute rounded-full bg-yellow-200"
                                style={{
                                    left: `${left}vw`,
                                    top: `${top}vh`,
                                    width: size,
                                    height: size,
                                    boxShadow: `0 0 ${size * 3}px rgba(253, 230, 138, 0.9), 0 0 ${size * 6}px rgba(253, 230, 138, 0.4)`,
                                    animation: `firefly-drift ${dur}s ease-in-out ${delay}s infinite`,
                                }}
                            />
                        );
                    },
                };
            }
            // Day/sunset: slow falling leaves, very sparse.
            return {
                count: 14,
                render: (i, rand) => {
                    const left = rand(100);
                    const delay = rand(14);
                    const dur = 10 + rand(8);
                    const hue = [32, 18, 45][Math.floor(rand(3))];
                    const size = 5 + Math.floor(rand(4));
                    return (
                        <div
                            key={`leaf-${i}`}
                            className="absolute"
                            style={{
                                left: `${left}vw`,
                                top: 0,
                                width: size,
                                height: size,
                                backgroundColor: `hsl(${hue}, 65%, 45%)`,
                                borderRadius: '30% 70% 30% 70% / 70% 30% 70% 30%',
                                animation: `leaf-fall ${dur}s linear ${delay}s infinite`,
                                opacity: 0,
                            }}
                        />
                    );
                },
            };

        case 'lake':
            return {
                count: 18,
                render: (i, rand) => {
                    const left = rand(100);
                    const top = 40 + rand(60);
                    const delay = rand(10);
                    const dur = 10 + rand(10);
                    const isDay = timeOfDay !== 'night';
                    const size = 2 + Math.floor(rand(2));
                    return (
                        <div
                            key={`pol-${i}`}
                            className="absolute rounded-full"
                            style={{
                                left: `${left}vw`,
                                top: `${top}vh`,
                                width: size,
                                height: size,
                                backgroundColor: isDay ? '#fde68a' : '#a5f3fc',
                                boxShadow: isDay
                                    ? '0 0 4px rgba(253, 230, 138, 0.6)'
                                    : '0 0 6px rgba(165, 243, 252, 0.9)',
                                animation: `pollen-rise ${dur}s linear ${delay}s infinite`,
                                opacity: 0,
                            }}
                        />
                    );
                },
            };

        case 'canyon':
            return {
                count: 20,
                render: (i, rand) => {
                    const top = rand(100);
                    const delay = rand(8);
                    const dur = 8 + rand(6);
                    const size = 2 + Math.floor(rand(3));
                    return (
                        <div
                            key={`dust-${i}`}
                            className="absolute rounded-full"
                            style={{
                                left: 0,
                                top: `${top}vh`,
                                width: size,
                                height: size,
                                backgroundColor: '#c2a27b',
                                opacity: 0,
                                animation: `dust-swirl ${dur}s linear ${delay}s infinite`,
                            }}
                        />
                    );
                },
            };

        case 'desert':
            // Sandstorm weather already layers a gradient -- add a few heat-
            // shimmer motes + tumbling grit for depth.
            return {
                count: 14,
                render: (i, rand) => {
                    const top = rand(100);
                    const delay = rand(8);
                    const dur = 6 + rand(4);
                    const size = 2 + Math.floor(rand(2));
                    return (
                        <div
                            key={`grit-${i}`}
                            className="absolute rounded-full"
                            style={{
                                left: 0,
                                top: `${top}vh`,
                                width: size,
                                height: size,
                                backgroundColor: '#fbbf24',
                                opacity: 0,
                                animation: `dust-swirl ${dur}s linear ${delay}s infinite`,
                            }}
                        />
                    );
                },
            };

        case 'cave':
            return {
                count: 24,
                render: (i, rand) => {
                    const left = rand(100);
                    const top = rand(100);
                    const delay = rand(6);
                    const dur = 5 + rand(5);
                    const size = 1 + Math.floor(rand(2));
                    return (
                        <div
                            key={`mote-${i}`}
                            className="absolute rounded-full bg-amber-100"
                            style={{
                                left: `${left}vw`,
                                top: `${top}vh`,
                                width: size,
                                height: size,
                                opacity: 0.4,
                                boxShadow: '0 0 2px rgba(255, 240, 200, 0.7)',
                                animation: `firefly-drift ${dur}s ease-in-out ${delay}s infinite`,
                            }}
                        />
                    );
                },
            };

        case 'snow':
            return {
                count: 18,
                render: (i, rand) => {
                    const left = rand(100);
                    const delay = rand(10);
                    const dur = 14 + rand(10);
                    const size = 3 + Math.floor(rand(3));
                    return (
                        <div
                            key={`ash-${i}`}
                            className="absolute"
                            style={{
                                left: `${left}vw`,
                                top: 0,
                                width: size,
                                height: size,
                                backgroundColor: 'rgba(226, 232, 240, 0.9)',
                                borderRadius: '50%',
                                animation: `ash-drift ${dur}s linear ${delay}s infinite`,
                                opacity: 0,
                            }}
                        />
                    );
                },
            };

        case 'rift':
            return {
                count: 28,
                render: (i, rand) => {
                    const left = rand(100);
                    const top = rand(100);
                    const delay = rand(4);
                    const dur = 1.5 + rand(2);
                    const size = 3 + Math.floor(rand(4));
                    const colors = ['#e879f9', '#f87171', '#a78bfa', '#7dd3fc'];
                    const color = colors[Math.floor(rand(colors.length))];
                    return (
                        <div
                            key={`rift-${i}`}
                            className="absolute"
                            style={{
                                left: `${left}vw`,
                                top: `${top}vh`,
                                width: size,
                                height: size,
                                backgroundColor: color,
                                boxShadow: `0 0 ${size * 2}px ${color}`,
                                animation: `glitch-flicker ${dur}s steps(6) ${delay}s infinite`,
                                opacity: 0,
                            }}
                        />
                    );
                },
            };

        case 'town':
            if (timeOfDay === 'night') {
                return {
                    count: 10,
                    render: (i, rand) => {
                        const left = rand(100);
                        const top = 10 + rand(70);
                        const delay = rand(4);
                        const dur = 3 + rand(3);
                        return (
                            <div
                                key={`fly-${i}`}
                                className="absolute rounded-full bg-yellow-100"
                                style={{
                                    left: `${left}vw`,
                                    top: `${top}vh`,
                                    width: 2,
                                    height: 2,
                                    boxShadow: '0 0 6px rgba(253, 224, 71, 0.8)',
                                    animation: `firefly-drift ${dur}s ease-in-out ${delay}s infinite`,
                                }}
                            />
                        );
                    },
                };
            }
            // Daytime town: Pidgey-style bird silhouettes soaring across.
            return {
                count: 5,
                render: (i, rand) => {
                    const top = 4 + rand(40);   // stay up high
                    const delay = rand(20);
                    const dur = 18 + rand(12);
                    const size = 10 + Math.floor(rand(6));
                    return (
                        <div
                            key={`bird-${i}`}
                            className="absolute"
                            style={{
                                top: `${top}vh`,
                                left: 0,
                                width: size,
                                height: Math.ceil(size * 0.35),
                                opacity: 0,
                                animation: `bird-glide ${dur}s linear ${delay}s infinite`,
                                pointerEvents: 'none',
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background:
                                        'radial-gradient(ellipse 45% 100% at 20% 50%, rgba(30,41,59,0.85) 65%, transparent 66%), radial-gradient(ellipse 45% 100% at 80% 50%, rgba(30,41,59,0.85) 65%, transparent 66%)',
                                    animation: 'bird-flap 0.4s ease-in-out infinite alternate',
                                }}
                            />
                        </div>
                    );
                },
            };

        case 'grassland':
        case 'plains':
            if (timeOfDay === 'night') return null;
            // Butterfly drift at head-height. Complements the per-tile
            // butterflies the Overworld itself draws in grass cells.
            return {
                count: 8,
                render: (i, rand) => {
                    const top = 20 + rand(50);
                    const delay = rand(12);
                    const dur = 14 + rand(10);
                    const hueColor = ['#fde68a', '#f472b6', '#fbbf24', '#a78bfa'][Math.floor(rand(4))];
                    return (
                        <div
                            key={`btf-${i}`}
                            className="absolute"
                            style={{
                                top: `${top}vh`,
                                left: 0,
                                width: 12,
                                height: 8,
                                opacity: 0,
                                animation: `bird-glide ${dur}s linear ${delay}s infinite`,
                                pointerEvents: 'none',
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: `radial-gradient(ellipse 40% 90% at 25% 50%, ${hueColor} 65%, transparent 66%), radial-gradient(ellipse 40% 90% at 75% 50%, ${hueColor} 65%, transparent 66%)`,
                                    filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))',
                                    animation: 'bird-flap 0.25s ease-in-out infinite alternate',
                                }}
                            />
                        </div>
                    );
                },
            };

        default:
            return null;
    }
};

export const BiomeAmbient: React.FC<BiomeAmbientProps> = ({ biome, timeOfDay, enabled = true }) => {
    const particles = useMemo(() => {
        if (!enabled || !biome) return null;
        const def = buildDef(biome, timeOfDay);
        if (!def) return null;
        // Seed is a hash of biome string length + TOD index so a given
        // biome+TOD combination renders the same layout across remounts,
        // preventing jittery particle reshuffles when the player moves.
        const seed = biome.length * 17 + (timeOfDay === 'day' ? 0 : timeOfDay === 'sunset' ? 1 : 2) * 53;
        const rand = makeRand(seed);
        const nodes: React.ReactNode[] = [];
        for (let i = 0; i < def.count; i++) {
            nodes.push(def.render(i, (n: number) => rand() * n));
        }
        return nodes;
    }, [biome, timeOfDay, enabled]);

    if (!particles) return null;
    return <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">{particles}</div>;
};
