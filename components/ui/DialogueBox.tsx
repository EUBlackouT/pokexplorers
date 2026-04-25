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

    return (
        <AnimatePresence>
            <motion.div
                key="dialogue-box"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-6 left-6 right-6 bg-blue-900/95 border-4 border-white p-6 rounded-2xl z-[60] text-white shadow-2xl"
                onClick={() => { if (!choices) onAdvance(); }}
            >
                {dialogue.speaker && (
                    <div className="absolute -top-4 left-6 px-3 py-1 bg-yellow-400 text-blue-950 text-xs font-black tracking-wide rounded-md border-2 border-white shadow-md uppercase">
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
                    <div className="flex-1">
                        <div className="text-base leading-relaxed">
                            {dialogue.lines.map((l, i) => (
                                <p key={i} className={i > 0 ? 'mt-1' : ''}>{l}</p>
                            ))}
                        </div>
                        {choices && choices.length > 0 ? (
                            <ChoiceRow
                                choices={choices}
                                highlight={highlight}
                                onPick={(c, i) => {
                                    if (c.disabled) return;
                                    setHighlight(i);
                                    onChoice(c.id);
                                }}
                                onHover={(i) => {
                                    if (!choices[i].disabled) setHighlight(i);
                                }}
                            />
                        ) : (
                            <div className="text-xs text-yellow-400 mt-3 font-bold animate-pulse select-none">
                                Press Enter to continue
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
                            "px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all flex flex-col items-start min-w-[140px]",
                            c.disabled
                                ? "bg-slate-700/60 border-slate-500 text-slate-400 cursor-not-allowed opacity-60"
                                : isHi
                                    ? "bg-yellow-300 border-yellow-100 text-blue-950 shadow-lg scale-105"
                                    : "bg-blue-700 border-blue-300 text-white hover:bg-blue-600",
                        ].join(' ')}
                    >
                        <span className="leading-tight">{c.label}</span>
                        {c.hint && <span className={`text-[10px] mt-0.5 font-normal ${isHi ? 'text-blue-900/80' : 'text-blue-200/80'}`}>{c.hint}</span>}
                    </button>
                );
            })}
        </div>
    );
};
