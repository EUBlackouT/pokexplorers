import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pokemon } from '../../types';
import { playEvolutionStart, playEvolutionPulse, playEvolutionComplete, playCry, getBgmVolume, setBgmVolume } from '../../services/soundService';

type Phase = 'intro' | 'pulse' | 'reveal' | 'finale';

interface Props {
    /** The Pokemon before evolving. */
    before: Pokemon;
    /** The fully-built evolved Pokemon (post `evolvePokemon` call). */
    after: Pokemon;
    /**
     * Called once the cinematic is dismissed by the player.
     * `result === 'evolved'` -> commit the evolution to state.
     * `result === 'cancelled'` -> keep the `before` form (mainline B-button cancel).
     */
    onComplete: (result: 'evolved' | 'cancelled') => void;
}

/**
 * Evolution cinematic, styled after mainline Pokemon games.
 *
 * Timeline:
 *  - `intro` (0 -> 700ms):   player sees the unevolved sprite; arpeggio fires.
 *  - `pulse` (700 -> 5000ms): sprite flickers between `before` and `after`
 *    silhouettes (white). Each flip briefly scales up; pulses accelerate.
 *    Player can press B / click Cancel to abort during this window only.
 *  - `reveal` (5000 -> 6000ms): big white flash; the evolved sprite cross-
 *    fades in at full color; post-evo cry plays.
 *  - `finale`: "Congratulations!" banner + Continue button; waits for input.
 *
 * BGM is ducked to 25% volume while the scene runs and restored on unmount.
 */
export const EvolutionScene: React.FC<Props> = ({ before, after, onComplete }) => {
    const [phase, setPhase] = useState<Phase>('intro');
    const [flip, setFlip] = useState<boolean>(false);
    const [silhouette, setSilhouette] = useState<boolean>(true);
    const [cancelled, setCancelled] = useState<boolean>(false);
    const flipTimer = useRef<number | null>(null);
    const bgmRestore = useRef<number>(1);

    const beforeSprite = before.sprites.front_default;
    const afterSprite = after.sprites.front_default;

    // Duck BGM for the duration so the evolution fanfare sits on top.
    useEffect(() => {
        bgmRestore.current = getBgmVolume();
        setBgmVolume(Math.min(bgmRestore.current, 0.25));
        return () => { setBgmVolume(bgmRestore.current); };
    }, []);

    // Drive the animation state machine on a single long-running timer chain.
    useEffect(() => {
        playEvolutionStart();
        const t1 = window.setTimeout(() => setPhase('pulse'), 700);
        const t2 = window.setTimeout(() => {
            if (cancelled) return;
            setPhase('reveal');
            playEvolutionComplete();
            // Post-evolution cry lands on the reveal frame for extra drama.
            playCry(after.id, after.name);
        }, 5000);
        const t3 = window.setTimeout(() => {
            if (cancelled) return;
            setPhase('finale');
        }, 6000);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
        };
    // `cancelled` intentionally not in deps -- the timers check it at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Silhouette flip loop during the pulse phase. Accelerates over time so
    // the build-up feels tense, just like the mainline animation.
    useEffect(() => {
        if (phase !== 'pulse') return;
        let interval = 420;
        let elapsed = 0;
        const tick = () => {
            setFlip((f) => !f);
            setSilhouette((s) => !s);
            playEvolutionPulse();
            elapsed += interval;
            // Tighten the flicker on each beat.
            interval = Math.max(90, interval - 30);
            if (elapsed < 4200) flipTimer.current = window.setTimeout(tick, interval);
        };
        flipTimer.current = window.setTimeout(tick, interval);
        return () => {
            if (flipTimer.current !== null) window.clearTimeout(flipTimer.current);
        };
    }, [phase]);

    // Keyboard: B / Esc = cancel during pulse phase, Enter/Space = skip to finale.
    // Registered in the capture phase so we can swallow the event before any
    // lower-priority listener (pause menu's Esc, overworld's Enter toggle,
    // dialogue advance, etc.) reacts to it -- otherwise dismissing the
    // evolution would simultaneously close the pause menu.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (phase === 'pulse' && (e.key === 'b' || e.key === 'B' || e.key === 'Escape')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                setCancelled(true);
                setPhase('finale');
            } else if (phase === 'finale' && (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                onComplete(cancelled ? 'cancelled' : 'evolved');
            } else if (phase === 'intro' || phase === 'pulse' || phase === 'reveal') {
                // While the cinematic is mid-flight, swallow Enter/Space so
                // the overworld toggles don't pop the menu underneath us.
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [phase, cancelled, onComplete]);

    const currentSprite = phase === 'reveal' || phase === 'finale'
        ? afterSprite
        : phase === 'pulse' && flip ? afterSprite : beforeSprite;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden font-press-start">
            {/* Deep space backdrop -- radial gradient + twinkling stars */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,#14213d_0%,#050a1a_70%,#000_100%)]" />
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(60)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-cyan-200"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: 1 + Math.random() * 2,
                            height: 1 + Math.random() * 2,
                        }}
                        animate={{ opacity: [0.1, 0.9, 0.1] }}
                        transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    />
                ))}
            </div>

            {/* Orbital energy rings during pulse/reveal */}
            {(phase === 'pulse' || phase === 'reveal') && (
                <>
                    {[0, 0.4, 0.8].map((delay) => (
                        <motion.div
                            key={delay}
                            className="absolute rounded-full border-2 border-cyan-300/60 pointer-events-none"
                            initial={{ width: 60, height: 60, opacity: 0.9 }}
                            animate={{ width: 600, height: 600, opacity: 0 }}
                            transition={{ duration: 1.4, repeat: Infinity, delay, ease: 'easeOut' }}
                        />
                    ))}
                </>
            )}

            {/* Rising sparkles */}
            {phase !== 'intro' && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(24)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bottom-0 w-1.5 h-1.5 bg-yellow-200 rounded-full blur-[1px]"
                            style={{ left: `${(i * 7) % 100}%` }}
                            animate={{
                                y: [0, -window.innerHeight * 0.9],
                                opacity: [0, 1, 0],
                                scale: [0.5, 1, 0.2],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 1.5,
                                repeat: Infinity,
                                delay: Math.random() * 1.5,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* The Pokemon sprite itself */}
            <motion.div
                className="relative z-10"
                animate={
                    phase === 'pulse'
                        ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }
                        : phase === 'reveal'
                        ? { scale: [1, 1.35, 1] }
                        : { scale: 1 }
                }
                transition={{
                    duration: phase === 'pulse' ? 0.45 : phase === 'reveal' ? 0.9 : 0.5,
                    repeat: phase === 'pulse' ? Infinity : 0,
                    ease: 'easeInOut',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentSprite + '|' + silhouette}
                        src={currentSprite}
                        alt={after.name}
                        className={`pixelated select-none pointer-events-none drop-shadow-[0_0_30px_rgba(173,216,255,0.9)] ${
                            phase === 'pulse' && silhouette ? 'brightness-0 invert contrast-150' : ''
                        }`}
                        initial={{ opacity: phase === 'pulse' ? 0.6 : 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        style={{ width: 288, height: 288 }}
                    />
                </AnimatePresence>
            </motion.div>

            {/* Reveal flash overlay */}
            <AnimatePresence>
                {phase === 'reveal' && (
                    <motion.div
                        className="absolute inset-0 bg-white pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.9, times: [0, 0.3, 1] }}
                    />
                )}
            </AnimatePresence>

            {/* Top banner during pulse: "Huh?" */}
            {phase === 'intro' || phase === 'pulse' ? (
                <motion.div
                    className="absolute top-16 left-1/2 -translate-x-1/2 text-center z-20"
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="text-yellow-300 text-[10px] tracking-[0.4em] uppercase mb-2">
                        {phase === 'intro' ? 'What?' : '...?'}
                    </div>
                    <div
                        className="text-4xl md:text-6xl font-black text-white italic tracking-tight"
                        style={{ textShadow: '0 4px 0 #3c5aa6, 0 10px 30px rgba(0,0,0,0.8)' }}
                    >
                        {before.name.toUpperCase()} is evolving!
                    </div>
                </motion.div>
            ) : null}

            {/* Cancel hint during pulse */}
            {phase === 'pulse' && !cancelled && (
                <motion.button
                    onClick={() => { setCancelled(true); setPhase('finale'); }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                    transition={{ delay: 1.5, duration: 0.4 }}
                    className="absolute bottom-24 text-[10px] uppercase tracking-[0.3em] text-red-300 hover:text-red-200 bg-black/50 border border-red-500/40 rounded-full px-5 py-2 z-30"
                >
                    Press B to stop
                </motion.button>
            )}

            {/* Finale banner */}
            {phase === 'finale' && (
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-end pb-24 z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-8">
                        <div className="text-yellow-300 text-[10px] tracking-[0.5em] uppercase mb-3">
                            {cancelled ? 'Evolution Cancelled' : 'Congratulations!'}
                        </div>
                        <div
                            className="text-2xl md:text-4xl font-black text-white italic tracking-tight leading-tight"
                            style={{ textShadow: '0 4px 0 #3c5aa6, 0 10px 30px rgba(0,0,0,0.8)' }}
                        >
                            {cancelled
                                ? `${before.name.toUpperCase()} stopped evolving.`
                                : (
                                    <>
                                        {before.name.toUpperCase()}
                                        <span className="text-cyan-300 mx-3">evolved into</span>
                                        <span className="text-yellow-300">{after.name.toUpperCase()}!</span>
                                    </>
                                )}
                        </div>
                    </div>
                    <motion.button
                        onClick={() => onComplete(cancelled ? 'cancelled' : 'evolved')}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [0.95, 1.05, 0.95] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-sm uppercase font-black tracking-widest border-b-4 border-yellow-700 active:translate-y-1 active:border-b-0"
                    >
                        Continue
                    </motion.button>
                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-3">Enter / Space</div>
                </motion.div>
            )}
        </div>
    );
};
