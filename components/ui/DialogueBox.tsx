import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DialoguePayload, DialogueChoice } from '../../types';

interface DialogueBoxProps {
    dialogue: DialoguePayload | null;
    /** Called when the player advances past a choiceless dialogue (Enter,
     *  Space, E, or click). The receiver should both clear the dialogue
     *  state and invoke any resolver attached to the payload. */
    onAdvance: () => void;
    /** Called with a choice id when the player selects one of the buttons.
     *  Same teardown responsibilities as onAdvance. */
    onChoice: (id: string) => void;
}

/**
 * Replacement for the legacy single-line dialogue render in App.tsx.
 *
 * - Lines are stacked as paragraphs (same look as before so existing
 *   one-shot dialogue feels identical).
 * - When `choices` is set we render a row of selectable buttons instead
 *   of the "Press Enter" footer. Arrow Up/Down highlights, Enter / Space
 *   confirms; mouse click also works. Disabled choices are skipped by
 *   keyboard navigation.
 * - When no choices, Enter / Space / E / click advances. The actual
 *   key handling is in App.tsx -- this component handles arrow nav +
 *   Enter only when choices are present, so the rest of the game's
 *   keymap is untouched.
 *
 * The component is intentionally dumb: it doesn't read or write game
 * state. App.tsx wires resolve callbacks via the payload itself so a
 * Promise-style `await askDialogue(...)` API can sit on top.
 */
export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onAdvance, onChoice }) => {
    const [highlight, setHighlight] = useState(0);

    const choices = dialogue?.choices ?? null;

    // Reset highlight whenever a new dialogue arrives so the cursor lands
    // on the first enabled choice. Without this, lingering keyboard
    // selection from a previous prompt could pre-confirm an unintended
    // choice on the next dialogue.
    useEffect(() => {
        if (!choices) { setHighlight(0); return; }
        const firstEnabled = choices.findIndex(c => !c.disabled);
        setHighlight(firstEnabled === -1 ? 0 : firstEnabled);
    }, [dialogue, choices]);

    // Keyboard handling for choice navigation. We attach this listener
    // only while choices are visible so we don't fight other key handlers
    // (movement, pause, dismiss) when the dialogue is a plain string.
    useEffect(() => {
        if (!choices || choices.length === 0) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                setHighlight(h => {
                    let next = h;
                    for (let i = 0; i < choices.length; i++) {
                        next = (next + 1) % choices.length;
                        if (!choices[next].disabled) return next;
                    }
                    return h;
                });
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                setHighlight(h => {
                    let next = h;
                    for (let i = 0; i < choices.length; i++) {
                        next = (next - 1 + choices.length) % choices.length;
                        if (!choices[next].disabled) return next;
                    }
                    return h;
                });
            } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
                const sel = choices[highlight];
                if (sel && !sel.disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    onChoice(sel.id);
                }
            } else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
                // Escape always picks a choice with id 'cancel' or 'no' if
                // present, or falls through to the last choice -- this lets
                // the player back out of a Yes/No prompt with the same
                // ergonomics as a modal. If no obvious cancel exists we
                // do nothing (so important confirmations can't be skipped).
                e.preventDefault();
                const cancel = choices.find(c => c.id === 'cancel' || c.id === 'no');
                if (cancel && !cancel.disabled) onChoice(cancel.id);
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [choices, highlight, onChoice]);

    if (!dialogue) return null;
    const hasChoices = !!choices && choices.length > 0;

    return (
        <AnimatePresence>
            <motion.div
                key="dialogue-box"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-4 md:bottom-6 left-3 md:left-6 right-3 md:right-6 bg-gradient-to-br from-slate-950/96 via-indigo-950/94 to-blue-950/96 border-2 border-indigo-200/70 p-4 md:p-5 rounded-xl z-[60] text-white shadow-2xl backdrop-blur-md"
                onClick={() => { if (!hasChoices) onAdvance(); }}
            >
                {dialogue.speaker && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-yellow-300 text-blue-950 text-[10px] font-black tracking-wide rounded-md border border-white/80 shadow-md uppercase">
                        {dialogue.speaker}
                    </div>
                )}
                <div className="flex gap-4 items-start">
                    {dialogue.portrait && (
                        <div className="w-16 h-16 flex-none rounded-md border-2 border-yellow-300 bg-blue-950/60 overflow-hidden">
                            <img
                                src={dialogue.portrait}
                                alt={dialogue.speaker ?? ''}
                                className="w-full h-full object-contain pixelated"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] md:text-[16px] leading-relaxed md:leading-loose max-h-40 md:max-h-48 overflow-y-auto pr-1">
                            {dialogue.lines.map((l, i) => (
                                <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{l}</p>
                            ))}
                        </div>
                        {hasChoices ? (
                            <ChoiceRow
                                choices={choices!}
                                highlight={highlight}
                                onPick={(c, i) => {
                                    if (c.disabled) return;
                                    setHighlight(i);
                                    onChoice(c.id);
                                }}
                                onHover={(i) => {
                                    if (!choices![i].disabled) setHighlight(i);
                                }}
                            />
                        ) : (
                            <div className="text-[11px] md:text-xs text-indigo-100/90 mt-3 font-semibold select-none flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-indigo-400/20 border border-indigo-200/40">Enter / E / Space</span>
                                <span>Continue</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const ChoiceRow: React.FC<{
    choices: DialogueChoice[];
    highlight: number;
    onPick: (choice: DialogueChoice, idx: number) => void;
    onHover: (idx: number) => void;
}> = ({ choices, highlight, onPick, onHover }) => {
    return (
        <div className="mt-4 flex flex-wrap gap-2">
            {choices.map((c, i) => {
                const isHi = i === highlight;
                return (
                    <button
                        key={c.id}
                        onClick={(e) => { e.stopPropagation(); onPick(c, i); }}
                        onMouseEnter={() => onHover(i)}
                        disabled={c.disabled}
                        className={[
                            "px-4 py-2.5 rounded-lg border font-bold text-sm transition-all flex flex-col items-start min-w-[150px]",
                            c.disabled
                                ? "bg-slate-700/50 border-slate-400/40 text-slate-400 cursor-not-allowed opacity-60"
                                : isHi
                                    ? "bg-amber-200 border-amber-100 text-slate-950 shadow-lg scale-105"
                                    : "bg-indigo-800/90 border-indigo-300/50 text-white hover:bg-indigo-700",
                        ].join(' ')}
                    >
                        <span className="leading-tight">{c.label}</span>
                        {c.hint && <span className={`text-[11px] mt-1 font-normal leading-snug ${isHi ? 'text-slate-800/80' : 'text-indigo-100/80'}`}>{c.hint}</span>}
                    </button>
                );
            })}
        </div>
    );
};
