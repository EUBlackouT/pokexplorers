import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* =============================================================================
 * BattleLog
 * =============================================================================
 * Drop-in replacement for the previous one-liner log render. Adds:
 *
 *  - Auto-scroll to bottom whenever a new log line lands. The previous
 *    flat <div> would grow upward and the player had to manually scroll
 *    each turn to see what happened most recently.
 *  - Tone-classification per line (super effective, faint, status, weather,
 *    terrain, healing, miss, crit, item, switch). Each tone gets a subtle
 *    color tint and an icon prefix so the player can scan the column.
 *  - The newest line gets a one-shot animated entry + brighter contrast,
 *    then settles into the persistent style.
 *  - Keeps only the 60 most-recent rendered lines for performance; older
 *    lines are still in `battleState.logs` if anyone needs them, we just
 *    don't paint them all.
 * ========================================================================== */

interface Props {
    logs: string[];
}

type Tone =
    | 'default'
    | 'crit'
    | 'super'
    | 'resist'
    | 'miss'
    | 'faint'
    | 'heal'
    | 'status'
    | 'weather'
    | 'terrain'
    | 'item'
    | 'switch'
    | 'gauge';

const TONE_STYLE: Record<Tone, { color: string; icon: string }> = {
    default: { color: 'text-gray-300',     icon: '' },
    crit:    { color: 'text-orange-300',   icon: '\u2731' }, // ✱
    super:   { color: 'text-amber-300',    icon: '\u26A1' }, // ⚡
    resist:  { color: 'text-slate-400',    icon: '\u2295' }, // ⊕
    miss:    { color: 'text-zinc-500 italic', icon: '\u2718' }, // ✘
    faint:   { color: 'text-red-400 font-semibold', icon: '\u2620' }, // ☠
    heal:    { color: 'text-emerald-300',  icon: '\u2764' }, // ❤
    status:  { color: 'text-fuchsia-300',  icon: '\u2697' }, // ⚗
    weather: { color: 'text-sky-300',      icon: '\u2601' }, // ☁
    terrain: { color: 'text-lime-300',     icon: '\u2698' }, // ⚘
    item:    { color: 'text-cyan-300',     icon: '\u26B7' }, // ⚷
    switch:  { color: 'text-indigo-300',   icon: '\u21BB' }, // ↻
    gauge:   { color: 'text-yellow-200',   icon: '\u2726' }, // ✦
};

// Heuristic classifier with anchored, scoped regexes. The log lines are
// free-form English assembled at thousands of `tempLogs.push(...)` call
// sites inside App.tsx, so a full tag-at-source refactor is infeasible
// for now -- but the previous classifier had several false-positive
// landmines:
//
//   * "rain" matched anywhere -> tinted "raining damage" lines as weather.
//   * "absorbed" matched -> caught "absorbed the impact" (Counter/Bide)
//     and miscolored a damage-deal line as a heal.
//   * "potion" was greedy enough to match "potential" if any future
//     log used that word.
//   * "item" alone matched Sticky Web / item-clause messages.
//
// Strategy:
//  1. Word-boundaries (\b) on every keyword so substrings don't false-fire.
//  2. Anchor to verb phrases ("was poisoned", "regained HP") rather than
//     bare nouns.
//  3. Order from most-specific to most-generic. Once a class hits we stop.
//  4. Use case-insensitive `i` flag in regexes instead of pre-lowercasing,
//    so we don't lose any future literal-case markers added at the source.
const PATTERNS: Array<[Tone, RegExp]> = [
    // Crits and effectiveness are short, unambiguous English.
    ['crit',    /\bcritical\s+hit\b/i],
    ['super',   /\bit['\u2019]?s\s+super[-\s]effective\b/i],
    ['resist',  /\b(it['\u2019]?s\s+not\s+very\s+effective|had\s+no\s+effect|doesn['\u2019]?t\s+affect|wasn['\u2019]?t\s+affected)\b/i],
    ['miss',    /\b(missed\s+the\s+attack|attack\s+missed|but\s+it\s+failed|avoided\s+the\s+attack|protected\s+itself)\b/i],
    // Faint should win over heal in case both keywords appear in the same
    // line ("X fainted! Y was healed.").
    ['faint',   /\b(fainted|was\s+knocked\s+out|was\s+defeated)\b/i],
    // Healing -- only verbs that actually mean "regained HP". Drop bare
    // "absorbed" because it overlaps with damage-redirection moves.
    ['heal',    /\b(restored\s+\w+\s+HP|regained\s+\w+\s+HP|recovered\s+\w+\s+HP|HP\s+was\s+restored|was\s+healed|leftovers|drained\s+\w+\s+HP)\b/i],
    // Status: anchor on the verb-phrase form ("was burned").
    ['status',  /\b(was\s+(burned|poisoned|badly\s+poisoned|paralyzed|frozen|put\s+to\s+sleep)|fell\s+asleep|got\s+confused|woke\s+up|thawed\s+out|snapped\s+out\s+of\s+(its\s+)?confusion|was\s+cured\s+of)\b/i],
    // Weather: ONLY when explicitly described as starting / ending / raging.
    // Bare "sun" or "rain" anywhere else stays default.
    ['weather', /\b(harsh\s+sunlight|the\s+sun(light)?\s+(intensified|faded|grew\s+weak)|started\s+raining|the\s+rain\s+(stopped|continues|fell)|sandstorm\s+(kicked\s+up|raged|subsided)|hailstorm|started\s+to\s+hail|snow\s+(fell|stopped|continues)|electric\s+squall|ashstorm)\b/i],
    // Terrain: only the specific transition phrases.
    ['terrain', /\b(electric|grassy|misty|psychic)\s+terrain\b/i],
    // Items: anchor on "used a/the" plus a known item suffix, OR an
    // explicit "X gave Y a Z to hold".
    ['item',    /\b(used\s+(an?|the|her|his|its)\s+\w+(\s+\w+)?|consumed\s+(its|the)\s+\w+\s+(berry|seed|orb)|gave\s+\w+\s+a\s+\w+\s+to\s+hold)\b/i],
    // Switch verbs.
    ['switch',  /\b(was\s+sent\s+out|came\s+(back|forth)|withdrew|switched\s+(out|in)|came\s+(in|out))\b/i],
    // Sync / Combo / Fusion bookkeeping.
    ['gauge',   /\b(team\s+sync|sync\s+gauge|combo\s+meter|fusion\s+(charge|move|gauge)\s+(activated|ready|charged)|charge\s+is\s+full)\b/i],
];

const classify = (raw: string): Tone => {
    if (!raw) return 'default';
    for (const [tone, rx] of PATTERNS) {
        if (rx.test(raw)) return tone;
    }
    return 'default';
};

const LOG_LIMIT = 60;

export const BattleLog: React.FC<Props> = ({ logs }) => {
    const scroller = useRef<HTMLDivElement>(null);

    // Auto-scroll on new log line. We only trigger on length change, not on
    // every parent re-render, so user-driven manual scroll isn't fought
    // against between turns.
    const lastLen = useRef(logs.length);
    useEffect(() => {
        if (logs.length !== lastLen.current) {
            lastLen.current = logs.length;
            const el = scroller.current;
            if (el) {
                // RAF so the new <div> is mounted before we measure scrollHeight.
                requestAnimationFrame(() => {
                    el.scrollTop = el.scrollHeight;
                });
            }
        }
    }, [logs.length]);

    // Render only the tail; the full log lives in state, here we just paint
    // what fits visually. Even mid-fight 60 lines is overkill for the panel
    // height and prevents long boss fights from churning DOM nodes.
    const start = Math.max(0, logs.length - LOG_LIMIT);
    const slice = logs.slice(start);
    const lastIdx = slice.length - 1;

    return (
        <div
            ref={scroller}
            className="bg-white/5 backdrop-blur-sm p-3 text-[11px] md:text-xs leading-snug overflow-y-auto max-h-32 md:max-h-none border-r border-white/10 scroll-smooth font-sans"
        >
            <AnimatePresence initial={false}>
                {slice.map((line, i) => {
                    const tone = classify(line);
                    const style = TONE_STYLE[tone];
                    const isLast = i === lastIdx;
                    return (
                        <motion.div
                            key={`${start + i}-${line.slice(0, 24)}`}
                            initial={isLast ? { opacity: 0, x: -8 } : false}
                            animate={{ opacity: isLast ? 1 : 0.85, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`mb-1 flex items-start gap-1.5 ${style.color} ${isLast ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.18)]' : ''}`}
                        >
                            {style.icon && (
                                <span aria-hidden className="mt-0.5 text-[9px] opacity-70 flex-shrink-0 w-3">
                                    {style.icon}
                                </span>
                            )}
                            <span className="flex-1">{line}</span>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
