/**
 * Battle popup bus.
 *
 * A lightweight pub/sub so the battle handlers in App.tsx can fire off
 * "something interesting happened to THIS Pokemon in THIS slot" signals
 * without having to thread extra state through the battle reducer. The
 * BattlePopupLayer components subscribe and render their own stacks.
 *
 * Why a module-scoped bus instead of more React state?
 *   - Popups are pure UI ephemera; they don't need to survive reloads or
 *     sync over the network. Putting them in battleState would force us
 *     to de-dupe on the client when the host echoes the turn log.
 *   - Emit sites are scattered across hundreds of lines of imperative
 *     ability/move code in App.tsx. A one-line `popupBus.emit(...)` is a
 *     lot less invasive than passing a setter into every handler.
 *
 * Popups auto-expire in the layer (default 1400ms) so there's no need to
 * manually remove them here.
 */

import type { StatName } from '../types';

export type PopupSide = 'player' | 'enemy';

export type PopupVariant =
    | { kind: 'ability'; name: string }
    | { kind: 'stat'; stat: StatName | 'accuracy' | 'evasion'; delta: number }
    | { kind: 'status'; status: 'burn' | 'poison' | 'badly-poisoned' | 'sleep' | 'freeze' | 'paralysis' | 'confusion' | 'cured' }
    | { kind: 'weather'; weather: 'sun' | 'rain' | 'sand' | 'hail' | 'snow' | 'clear' }
    | { kind: 'immunity'; reason?: string }
    | { kind: 'crit' }
    | { kind: 'effective'; level: 'super' | 'resist' }
    | { kind: 'item'; label: string }
    | { kind: 'custom'; label: string; color?: string; icon?: string };

export interface BattlePopup {
    id: string;
    side: PopupSide;
    slot: 0 | 1;
    variant: PopupVariant;
    at: number;
}

export type BattlePopupInit = Omit<BattlePopup, 'id' | 'at'>;

type Listener = (p: BattlePopup) => void;

const listeners = new Set<Listener>();

const genId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'p-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export const battlePopupBus = {
    emit(init: BattlePopupInit): void {
        const p: BattlePopup = { ...init, id: genId(), at: Date.now() };
        listeners.forEach((l) => l(p));
    },
    subscribe(l: Listener): () => void {
        listeners.add(l);
        return () => { listeners.delete(l); };
    },
    /** Clear all subscribers -- used only for test/debug. */
    _reset(): void { listeners.clear(); },
};

// --- Ergonomic helpers -----------------------------------------------------
// These let emit sites be one-liners: `popupAbility(side, slot, 'Intimidate')`.

export const popupAbility = (side: PopupSide, slot: 0 | 1, name: string): void =>
    battlePopupBus.emit({ side, slot, variant: { kind: 'ability', name } });

export type PopupStatName = StatName | 'accuracy' | 'evasion';

export const popupStat = (
    side: PopupSide,
    slot: 0 | 1,
    stat: PopupStatName,
    delta: number,
): void => {
    if (!delta) return;
    battlePopupBus.emit({ side, slot, variant: { kind: 'stat', stat, delta } });
};

export type PopupStatus = 'burn' | 'poison' | 'badly-poisoned' | 'sleep' | 'freeze' | 'paralysis' | 'confusion' | 'cured';
export type PopupWeather = 'sun' | 'rain' | 'sand' | 'hail' | 'snow' | 'clear';

export const popupStatus = (
    side: PopupSide,
    slot: 0 | 1,
    status: PopupStatus,
): void =>
    battlePopupBus.emit({ side, slot, variant: { kind: 'status', status } });

export const popupWeather = (
    side: PopupSide,
    slot: 0 | 1,
    weather: PopupWeather,
): void =>
    battlePopupBus.emit({ side, slot, variant: { kind: 'weather', weather } });

export const popupCrit = (side: PopupSide, slot: 0 | 1): void =>
    battlePopupBus.emit({ side, slot, variant: { kind: 'crit' } });

export const popupEffective = (
    side: PopupSide,
    slot: 0 | 1,
    level: 'super' | 'resist',
): void => battlePopupBus.emit({ side, slot, variant: { kind: 'effective', level } });

export const popupImmunity = (side: PopupSide, slot: 0 | 1, reason?: string): void =>
    battlePopupBus.emit({ side, slot, variant: { kind: 'immunity', reason } });

export const popupItem = (side: PopupSide, slot: 0 | 1, label: string): void =>
    battlePopupBus.emit({ side, slot, variant: { kind: 'item', label } });

export const popupCustom = (
    side: PopupSide,
    slot: 0 | 1,
    label: string,
    color?: string,
    icon?: string,
): void => battlePopupBus.emit({ side, slot, variant: { kind: 'custom', label, color, icon } });
