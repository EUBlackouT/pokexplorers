import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pokemon, PlayerGlobalState } from '../../types';
import { PokemonSprite } from '../PokemonSprite';

// ---------------------------------------------------------------------------
// Pokemon Storage System (PC) -- the box management screen.
//
// Layout (full-viewport modal):
//
//   ┌─ Header: "PC -- <Box Name>"  [Rename Box] [Item Bag] [Close] ─┐
//   ├─ Left:  Box grid (5x6 = 30 slots) with prev/next box buttons   │
//   ├─ Right: Active party (vertical 6 slots)                         │
//   ├─ Footer: Selection details + actions (Move, Release)            │
//   └─────────────────────────────────────────────────────────────────┘
//
// Interaction model:
//   - Click any slot to select. Selecting an empty slot does nothing.
//   - When something is selected, click ANOTHER slot (party or box) to
//     swap-or-move into it. Clicking the same slot again deselects.
//   - Right-click / "Release" button releases (with confirmation) the
//     currently selected mon. The last party Pokemon can never be released
//     so the player isn't stranded with no team.
//   - Box navigation: left/right arrows in the box header.
//   - "Rename Box" opens an inline rename row.
// ---------------------------------------------------------------------------

const BOX_SLOTS = 30;
export const DEFAULT_BOX_COUNT = 8;
const PARTY_CAP = 6;

export const makeEmptyBoxes = (count: number = DEFAULT_BOX_COUNT) => {
    return Array.from({ length: count }, (_, i) => ({
        name: `Box ${i + 1}`,
        slots: Array.from({ length: BOX_SLOTS }, () => null as Pokemon | null),
    }));
};

type Selection =
  | { kind: 'party'; index: number }
  | { kind: 'box';   boxIdx: number; slotIdx: number }
  | null;

interface Props {
    player: PlayerGlobalState;
    onUpdate: (next: Partial<PlayerGlobalState>) => void;
    onClose: () => void;
}

export const PokemonStorage: React.FC<Props> = ({ player, onUpdate, onClose }) => {
    // Boxes are optional on the player state for back-compat with old saves.
    // Lazily initialize a default 8-box layout the first time the screen
    // opens and persist it back through onUpdate so the rest of the run
    // sees the migrated shape.
    const boxes = useMemo(() => player.boxes ?? makeEmptyBoxes(), [player.boxes]);
    useEffect(() => {
        if (!player.boxes) onUpdate({ boxes });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [boxIdx, setBoxIdx] = useState(0);
    const [selection, setSelection] = useState<Selection>(null);
    const [renaming, setRenaming] = useState(false);
    const [pendingName, setPendingName] = useState(boxes[0]?.name ?? '');
    const [confirmRelease, setConfirmRelease] = useState(false);

    // -- Keyboard cursor --------------------------------------------------
    // The cursor is a separate concept from `selection` (the clipboard).
    // Selection is what's being held / moved; cursor is where the player
    // is currently looking. Pressing Enter on the cursor either selects
    // (if no selection yet) or commits a move/swap (if something is held).
    // Two panels: 'box' (6-wide grid, 30 slots) and 'party' (1-wide, 6
    // slots). Tab toggles between panels.
    type Panel = 'box' | 'party';
    const [cursor, setCursor] = useState<{ panel: Panel; x: number; y: number }>({ panel: 'box', x: 0, y: 0 });
    const BOX_COLS = 6;
    const BOX_ROWS = BOX_SLOTS / BOX_COLS;

    useEffect(() => {
        setPendingName(boxes[boxIdx]?.name ?? `Box ${boxIdx + 1}`);
        setRenaming(false);
        setSelection(null);
    }, [boxIdx, boxes]);

    // Resolve the cursor's current Selection target. Computed lazily so the
    // movement / commit handlers below stay readable.
    const cursorAsSelection = (): Selection => {
        if (cursor.panel === 'party') return { kind: 'party', index: cursor.y };
        return { kind: 'box', boxIdx, slotIdx: cursor.y * BOX_COLS + cursor.x };
    };

    // Keyboard:
    //   Arrow keys -- move cursor inside the active panel.
    //   Tab        -- switch between Box and Party panels.
    //   Enter/Space-- select/place at cursor (same as click).
    //   [, ]       -- previous/next box.
    //   R          -- toggle rename.
    //   Del/Bksp   -- release confirm at cursor.
    //   Esc/Q      -- close.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (renaming) return;
            const k = e.key;
            if (k === 'Escape' || k === 'q' || k === 'Q') {
                e.preventDefault();
                if (selection) { setSelection(null); return; }   // unstick first
                onClose();
            } else if (k === 'Tab') {
                e.preventDefault();
                setCursor(c => c.panel === 'box'
                    ? { panel: 'party', x: 0, y: 0 }
                    : { panel: 'box',   x: 0, y: 0 });
            } else if (k === 'ArrowLeft') {
                e.preventDefault();
                setCursor(c => c.panel === 'box'
                    ? { ...c, x: Math.max(0, c.x - 1) }
                    : c);
            } else if (k === 'ArrowRight') {
                e.preventDefault();
                setCursor(c => c.panel === 'box'
                    ? { ...c, x: Math.min(BOX_COLS - 1, c.x + 1) }
                    : c);
            } else if (k === 'ArrowUp') {
                e.preventDefault();
                setCursor(c => ({ ...c, y: Math.max(0, c.y - 1) }));
            } else if (k === 'ArrowDown') {
                e.preventDefault();
                setCursor(c => {
                    const max = c.panel === 'box' ? BOX_ROWS - 1 : PARTY_CAP - 1;
                    return { ...c, y: Math.min(max, c.y + 1) };
                });
            } else if (k === '[' || k === ',') {
                e.preventDefault();
                setBoxIdx(i => Math.max(0, i - 1));
            } else if (k === ']' || k === '.') {
                e.preventDefault();
                setBoxIdx(i => Math.min(boxes.length - 1, i + 1));
            } else if (k === 'Enter' || k === ' ') {
                e.preventDefault();
                handleSlotClick(cursorAsSelection());
            } else if (k === 'r' || k === 'R') {
                e.preventDefault();
                setRenaming(true);
            } else if (k === 'Delete' || k === 'Backspace') {
                e.preventDefault();
                // Only enable release if the cursor lands on something.
                const sel = cursorAsSelection();
                if (getAt(sel)) {
                    setSelection(sel);
                    setConfirmRelease(true);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // handleSlotClick / cursorAsSelection are stable over a render --
        // we deliberately don't re-bind on every keystroke to keep the
        // listener simple. The deps cover the values they actually read.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renaming, boxes.length, boxIdx, cursor, selection, onClose]);

    const partyCap = player.team.length;

    // Resolve the Pokémon at a given Selection target without mutating.
    const getAt = (sel: Selection): Pokemon | null => {
        if (!sel) return null;
        if (sel.kind === 'party') return player.team[sel.index] ?? null;
        return boxes[sel.boxIdx]?.slots[sel.slotIdx] ?? null;
    };

    const selectedMon = getAt(selection);

    /** Apply a move: take whatever is at `from` and place it at `to`,
     *  swapping if `to` is occupied. Handles edge cases:
     *   - Same source/target -> no-op.
     *   - Releasing the only party member is blocked elsewhere; here we
     *     ensure moving the only party member to a box leaves at least
     *     one in the party by failing silently and showing a dialog.
     *   - Putting into a full party (>=6) requires the destination to be
     *     a party slot whose contents we're swapping into the box.
     */
    const moveOrSwap = (from: Selection, to: Selection) => {
        if (!from || !to) return;
        if (from.kind === 'party' && to.kind === 'party' && from.index === to.index) return;
        if (from.kind === 'box'   && to.kind === 'box'   && from.boxIdx === to.boxIdx && from.slotIdx === to.slotIdx) return;

        const src = getAt(from);
        const dst = getAt(to);
        if (!src) return; // can't move "nothing"

        // Block: removing last party Pokemon by sending to box without
        // swapping in another. (Swap is fine; transfer is not.)
        if (from.kind === 'party' && to.kind === 'box' && !dst && player.team.filter(p => !!p).length <= 1) {
            // Surface a tiny inline message via the selection footer.
            setConfirmRelease(false);
            setSelection(null);
            return;
        }

        // Build the new state immutably.
        const newTeam = [...player.team];
        const newBoxes = boxes.map(b => ({ ...b, slots: [...b.slots] }));

        const writeAt = (sel: Selection, mon: Pokemon | null) => {
            if (!sel) return;
            if (sel.kind === 'party') {
                if (mon === null) {
                    // Removing from party means splice (party is variable-length).
                    newTeam.splice(sel.index, 1);
                } else {
                    if (sel.index < newTeam.length) newTeam[sel.index] = mon;
                    else if (newTeam.length < PARTY_CAP) newTeam.push(mon);
                }
            } else {
                newBoxes[sel.boxIdx].slots[sel.slotIdx] = mon;
            }
        };

        // Swap is a two-step write. We have to be careful with party
        // splice: if `from` and `to` both reference party indices, the
        // splice on the first write shifts the second target. We avoid
        // that here because the only case that calls splice is "send to
        // box without swap" (dst === null), which we already handled.
        if (dst) {
            // Swap.
            writeAt(from, dst);
            writeAt(to, src);
        } else {
            // Move-only.
            // For party->party the slot count has to make sense; clamp.
            if (from.kind === 'party' && to.kind === 'party') {
                writeAt(from, null);
                writeAt(to, src);
            } else if (from.kind === 'box' && to.kind === 'party') {
                if (newTeam.length >= PARTY_CAP) return; // party full -> need swap
                writeAt(from, null);
                newTeam.push(src);
            } else if (from.kind === 'party' && to.kind === 'box') {
                writeAt(to, src);
                writeAt(from, null);
            } else {
                writeAt(to, src);
                writeAt(from, null);
            }
        }

        onUpdate({ team: newTeam, boxes: newBoxes });
        setSelection(null);
    };

    const release = () => {
        if (!selection || !selectedMon) return;
        // Safety: never release the last party member.
        if (selection.kind === 'party' && player.team.length <= 1) {
            setConfirmRelease(false);
            return;
        }
        const newTeam = [...player.team];
        const newBoxes = boxes.map(b => ({ ...b, slots: [...b.slots] }));
        if (selection.kind === 'party') newTeam.splice(selection.index, 1);
        else newBoxes[selection.boxIdx].slots[selection.slotIdx] = null;
        onUpdate({ team: newTeam, boxes: newBoxes });
        setSelection(null);
        setConfirmRelease(false);
    };

    const renameBox = () => {
        const trimmed = pendingName.trim().slice(0, 20) || `Box ${boxIdx + 1}`;
        const newBoxes = boxes.map((b, i) => i === boxIdx ? { ...b, name: trimmed } : b);
        onUpdate({ boxes: newBoxes });
        setRenaming(false);
    };

    const handleSlotClick = (target: Selection) => {
        if (!target) return;
        if (!selection) {
            // First click: only select if there's a Pokémon there.
            if (getAt(target)) setSelection(target);
            return;
        }
        // Same slot? deselect.
        if (selection.kind === 'party' && target.kind === 'party' && selection.index === target.index) {
            setSelection(null); return;
        }
        if (selection.kind === 'box' && target.kind === 'box' && selection.boxIdx === target.boxIdx && selection.slotIdx === target.slotIdx) {
            setSelection(null); return;
        }
        moveOrSwap(selection, target);
    };

    const currentBox = boxes[boxIdx];

    return (
        <div className="fixed inset-0 z-[80] bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white p-6 flex flex-col">
            {/* HEADER */}
            <div className="flex items-center gap-4 border-b-2 border-yellow-400/40 pb-3">
                <div className="text-3xl font-black tracking-wider drop-shadow text-yellow-300">PC</div>
                {!renaming ? (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setBoxIdx(i => Math.max(0, i - 1))} disabled={boxIdx === 0}
                            className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-30">
                            ◀
                        </button>
                        <div className="px-4 py-1 bg-blue-900/70 border-2 border-blue-300 rounded-lg min-w-[180px] text-center font-bold">
                            {currentBox?.name}
                            <span className="text-xs text-blue-200 ml-2">({boxIdx + 1}/{boxes.length})</span>
                        </div>
                        <button onClick={() => setBoxIdx(i => Math.min(boxes.length - 1, i + 1))} disabled={boxIdx === boxes.length - 1}
                            className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-30">
                            ▶
                        </button>
                        <button onClick={() => setRenaming(true)}
                            className="ml-2 px-3 py-1 rounded bg-purple-700 hover:bg-purple-600 text-xs font-bold">
                            ✎ Rename
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            value={pendingName}
                            onChange={e => setPendingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') renameBox(); if (e.key === 'Escape') setRenaming(false); }}
                            autoFocus
                            maxLength={20}
                            className="px-3 py-1 rounded-lg bg-slate-800 border-2 border-yellow-400 text-white"
                        />
                        <button onClick={renameBox} className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 font-bold">Save</button>
                        <button onClick={() => setRenaming(false)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">Cancel</button>
                    </div>
                )}
                <div className="ml-auto flex gap-2 items-center text-sm">
                    <div className="px-3 py-1 bg-emerald-900/50 border border-emerald-400 rounded">$ {player.money.toLocaleString()}</div>
                    <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 font-bold border-2 border-red-300">
                        Close (Esc)
                    </button>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="flex-1 grid grid-cols-[1fr_280px] gap-6 mt-4 min-h-0">
                {/* BOX */}
                <div className="bg-slate-900/60 border-2 border-blue-400/50 rounded-2xl p-3 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-1.5">
                        {currentBox?.slots.map((mon, i) => {
                            const isSel    = selection?.kind === 'box' && selection.boxIdx === boxIdx && selection.slotIdx === i;
                            const isCursor = cursor.panel === 'box' && (cursor.y * BOX_COLS + cursor.x) === i;
                            return (
                                <SlotCell
                                    key={i}
                                    mon={mon}
                                    selected={isSel}
                                    cursor={isCursor}
                                    onClick={() => {
                                        // Clicking a slot also relocates the cursor so the
                                        // mouse and keyboard stay in sync (otherwise pressing
                                        // arrow after a click jumps from a stale grid spot).
                                        setCursor({ panel: 'box', x: i % BOX_COLS, y: Math.floor(i / BOX_COLS) });
                                        handleSlotClick({ kind: 'box', boxIdx, slotIdx: i });
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* PARTY */}
                <div className="bg-slate-900/60 border-2 border-yellow-400/50 rounded-2xl p-3 flex flex-col gap-2">
                    <div className="text-sm font-bold uppercase tracking-wider text-yellow-300 mb-1">Party ({player.team.length}/{PARTY_CAP})</div>
                    {Array.from({ length: PARTY_CAP }).map((_, i) => {
                        const mon = player.team[i] ?? null;
                        const isSel    = selection?.kind === 'party' && selection.index === i;
                        const isCursor = cursor.panel === 'party' && cursor.y === i;
                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setCursor({ panel: 'party', x: 0, y: i });
                                    if (!mon && selection) {
                                        // Place currently-selected at end of party (push).
                                        moveOrSwap(selection, { kind: 'party', index: player.team.length });
                                    } else {
                                        handleSlotClick({ kind: 'party', index: i });
                                    }
                                }}
                                className={[
                                    "w-full flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-all",
                                    isSel ? "bg-yellow-400/30 border-yellow-300 shadow-md" :
                                        mon ? "bg-blue-900/40 border-blue-400 hover:bg-blue-800/50" :
                                              "bg-slate-800/40 border-slate-600 border-dashed text-slate-400 hover:bg-slate-700/40",
                                    isCursor ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900" : "",
                                ].join(' ')}
                            >
                                {mon ? (
                                    <>
                                        <div className="w-12 h-12 flex-none flex items-center justify-center">
                                            <PokemonSprite pokemon={mon} variant="menu" className="w-12 h-12" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold truncate">{mon.name}</div>
                                            <div className="text-xs text-slate-300">Lv {mon.level} · HP {mon.currentHp}/{mon.maxHp}</div>
                                        </div>
                                        {i === 0 && <div className="text-[10px] font-black text-yellow-300">LEAD</div>}
                                    </>
                                ) : (
                                    <span className="text-xs italic">Empty slot</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER: selection details + actions */}
            <AnimatePresence>
                {selectedMon && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="mt-4 bg-slate-900/80 border-2 border-yellow-400/40 rounded-2xl p-3 flex items-center gap-4"
                    >
                        <div className="w-20 h-20 flex-none flex items-center justify-center bg-slate-800 rounded-lg border border-slate-600">
                            <PokemonSprite pokemon={selectedMon} variant="menu" className="w-20 h-20" />
                        </div>
                        <div className="flex-1">
                            <div className="font-black text-xl text-yellow-300">{selectedMon.name} <span className="text-sm text-blue-200 font-normal">Lv {selectedMon.level}</span></div>
                            <div className="text-xs text-slate-300">
                                {selectedMon.types?.join(' / ').toUpperCase()}
                                {' · '}HP {selectedMon.currentHp}/{selectedMon.maxHp}
                                {selectedMon.heldItem && <> · holding {selectedMon.heldItem.name}</>}
                            </div>
                            <div className="text-xs text-blue-200 italic mt-0.5">
                                Pick another slot to {selection?.kind === 'party' ? 'send to box / swap' : 'withdraw / swap'}.
                            </div>
                        </div>
                        {!confirmRelease ? (
                            <button
                                onClick={() => setConfirmRelease(true)}
                                disabled={selection?.kind === 'party' && player.team.length <= 1}
                                className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 disabled:opacity-30 font-bold border-2 border-red-300"
                            >
                                Release
                            </button>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <span className="text-xs text-red-200">Release {selectedMon.name}?</span>
                                <button onClick={release} className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 font-bold">Yes</button>
                                <button onClick={() => setConfirmRelease(false)} className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600">No</button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HELP STRIP */}
            <div className="mt-3 text-xs text-slate-400 text-center select-none">
                Arrows move cursor · Tab switches panel · Enter selects/places · [ ] prev/next box · R rename · Del release · Esc closes
            </div>
        </div>
    );
};

const SlotCell: React.FC<{
    mon: Pokemon | null;
    selected: boolean;
    /** Whether the keyboard cursor is on this cell (separate from selected,
     *  which is the "held in clipboard" state). Renders a cyan glow ring
     *  so it reads as "currently focused, press Enter". */
    cursor?: boolean;
    onClick: () => void;
}> = ({ mon, selected, cursor, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={[
                "aspect-square rounded-md border-2 transition-all flex items-center justify-center relative",
                selected
                    ? "bg-yellow-400/30 border-yellow-300 shadow-md scale-105"
                    : mon
                        ? "bg-slate-800/60 border-blue-500/40 hover:bg-slate-700/60"
                        : "bg-slate-900/40 border-slate-700 border-dashed hover:bg-slate-800/40",
                cursor ? "ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-900 z-10" : "",
            ].join(' ')}
            title={mon ? `${mon.name} · Lv ${mon.level}` : 'Empty'}
        >
            {mon && (
                <>
                    <div className="absolute inset-0 flex items-center justify-center p-1">
                        <PokemonSprite pokemon={mon} variant="menu" className="w-full h-full" />
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 text-[10px] font-bold bg-blue-950/80 text-yellow-300 px-1 rounded">
                        L{mon.level}
                    </div>
                </>
            )}
        </button>
    );
};
