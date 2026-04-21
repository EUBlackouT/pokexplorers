import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    fetchLeaderboard,
    submitScore,
    getLastSubmittedName,
    setLastSubmittedName,
    getCurrentUid,
    getSession,
    LeaderboardEntry,
    LeaderboardWindow,
} from '../../utils/leaderboard';
import { computeExplorerScore, ScoreInputs, TITLES } from '../../utils/explorerScore';

interface Props {
    inputs: ScoreInputs;
    onClose: () => void;
}

const medal = (rank: number): string => {
    if (rank === 0) return 'bg-gradient-to-r from-yellow-500/40 to-amber-300/20 border-yellow-300/70';
    if (rank === 1) return 'bg-gradient-to-r from-gray-300/30 to-gray-100/10 border-gray-200/70';
    if (rank === 2) return 'bg-gradient-to-r from-amber-700/30 to-amber-900/10 border-amber-600/70';
    return 'bg-white/5 border-white/10';
};

const formatReason = (reason: string | undefined): string => {
    if (!reason) return 'Server rejected the submission.';
    if (reason === 'missing-token') return 'Sign-in still resolving; try again in a second.';
    if (reason === 'unauthorized') return 'Auth token was rejected -- please reload.';
    if (reason === 'session-invalid') return 'Session expired -- rejoining now.';
    if (reason === 'rate-limited') return 'Slow down! Submissions are capped at one every 5 seconds.';
    if (reason.startsWith('duration-insufficient')) return `Play a little longer first: ${reason.replace('duration-insufficient', '').trim()}.`;
    if (reason === 'offline' || reason === 'network') return 'Offline -- kept locally, will retry on reconnect.';
    return `Server said: ${reason}`;
};

export const LeaderboardScreen: React.FC<Props> = ({ inputs, onClose }) => {
    const score = useMemo(() => computeExplorerScore(inputs), [inputs]);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [window, setWindow] = useState<LeaderboardWindow>('all');
    const [name, setName] = useState(getLastSubmittedName() || '');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
    const [verifiedSelf, setVerifiedSelf] = useState(false);

    const refresh = async (w: LeaderboardWindow = window) => {
        setLoading(true);
        try {
            const data = await fetchLeaderboard(50, w);
            setEntries(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void refresh('all'); void getSession(); }, []);

    const handleWindow = (w: LeaderboardWindow) => { setWindow(w); void refresh(w); };

    const handleSubmit = async () => {
        if (!name.trim()) { setStatus({ ok: false, msg: 'Pick a name first.' }); return; }
        setStatus(null); setSubmitting(true);
        try {
            const result = await submitScore(inputs, name.trim());
            setLastSubmittedName(name.trim());
            if (result.verified) {
                setSubmitted(true);
                setVerifiedSelf(true);
                setStatus({ ok: true, msg: result.isNewBest ? 'New personal best submitted!' : 'Score kept (not a new PB).' });
            } else {
                setStatus({ ok: false, msg: formatReason(result.reason) });
            }
            await refresh();
        } catch (err) {
            setStatus({ ok: false, msg: (err as Error).message });
        } finally {
            setSubmitting(false);
        }
    };

    const selfUid = getCurrentUid();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
        >
            <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-indigo-400/40 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-300 flex items-center gap-2">
                            Explorer Leaderboard
                            <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8px]">
                                Verified
                            </span>
                        </div>
                        <div className="text-2xl font-black text-white">Who went farthest?</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
                    >Close</button>
                </div>

                <div className="grid grid-cols-5 gap-4 p-6 overflow-hidden flex-1">
                    <div className="col-span-2 flex flex-col gap-4 overflow-y-auto pr-1">
                        <div className="rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-700/30 border border-indigo-300/40 p-4">
                            <div className="text-[9px] uppercase tracking-[0.25em] text-indigo-200 flex items-center justify-between">
                                <span>Your Score</span>
                                {(() => {
                                    const idx = entries.findIndex((e) => e.uid === selfUid);
                                    if (idx < 0) return <span className="text-gray-400 normal-case tracking-normal text-[10px]">unranked</span>;
                                    return <span className="text-amber-300 normal-case tracking-normal text-[10px] font-bold">Rank #{idx + 1}</span>;
                                })()}
                            </div>
                            <div className="text-5xl font-black tabular-nums text-white leading-none my-1">
                                {score.total.toLocaleString()}
                            </div>
                            <div className="text-sm font-bold text-amber-300">{score.title}</div>
                            {score.nextTitle && score.nextTitleAt != null && (
                                <div className="text-[10px] text-indigo-200/80 mt-1">
                                    Next: {score.nextTitle} at {score.nextTitleAt} chunks ({Math.max(0, score.nextTitleAt - inputs.farthestDistance)} to go)
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl bg-black/40 border border-white/10 p-4">
                            <div className="text-[9px] uppercase tracking-[0.25em] text-gray-400 mb-2">Breakdown</div>
                            <ul className="text-xs text-white/90 space-y-1">
                                {score.breakdown.map((b) => (
                                    <li key={b.label} className="flex items-center justify-between">
                                        <span className="text-gray-300">{b.label}</span>
                                        <span className="tabular-nums">
                                            <span className="text-gray-400">{Math.floor(b.raw).toLocaleString()}</span>
                                            <span className="mx-1 text-gray-600">×</span>
                                            <span className="text-gray-400">{b.weight}</span>
                                            <span className="mx-1 text-gray-600">=</span>
                                            <span className="text-emerald-300 font-bold">{Math.floor(b.contribution).toLocaleString()}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-xl bg-black/40 border border-white/10 p-4">
                            <div className="text-[9px] uppercase tracking-[0.25em] text-gray-400 mb-2">Titles</div>
                            <ul className="text-xs space-y-1">
                                {TITLES.map((t, i) => {
                                    const unlocked = inputs.farthestDistance >= t.at;
                                    return (
                                        <li key={t.name} className={`flex items-center justify-between ${unlocked ? 'text-white' : 'text-gray-600'}`}>
                                            <span className={i === score.titleIndex ? 'font-bold text-amber-300' : ''}>{t.name}</span>
                                            <span className="tabular-nums text-gray-500">{t.at} chunks</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-2">
                            <div className="text-[9px] uppercase tracking-[0.25em] text-gray-400">Submit Score</div>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value.slice(0, 20))}
                                placeholder="Your explorer name"
                                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || submitted}
                                className="w-full py-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition"
                            >
                                {submitting ? 'Verifying...' : submitted ? (verifiedSelf ? 'Submitted \u2713' : 'Submitted (local)') : 'Submit to Leaderboard'}
                            </button>
                            {status && (
                                <div className={`text-[11px] ${status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{status.msg}</div>
                            )}
                            <div className="text-[9px] text-gray-500 leading-relaxed">
                                Scores are signed with your Firebase auth token and re-computed on the server.
                                Tampering is detected and rejected.
                            </div>
                        </div>
                    </div>

                    <div className="col-span-3 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex flex-col">
                        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(['all', 'weekly'] as LeaderboardWindow[]).map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => handleWindow(w)}
                                        className={`text-[10px] uppercase tracking-[0.22em] px-2 py-1 rounded-md border transition
                                            ${window === w
                                                ? 'bg-indigo-500/25 border-indigo-300/50 text-indigo-100'
                                                : 'bg-transparent border-white/10 text-gray-400 hover:text-gray-200'}`}
                                    >
                                        {w === 'all' ? 'All-Time' : 'This Week'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => refresh()}
                                className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 hover:text-indigo-200"
                            >Refresh</button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading && <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>}
                            {!loading && entries.length === 0 && (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No scores yet. Be the first!
                                </div>
                            )}
                            <AnimatePresence>
                                {entries.map((entry, i) => {
                                    const mine = entry.uid === selfUid;
                                    return (
                                        <motion.div
                                            key={entry.uid + '-' + (entry.updatedAt ?? 0)}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`px-4 py-2 border-b border-white/5 flex items-center gap-3 ${medal(i)} ${mine ? 'ring-1 ring-cyan-300/60' : ''}`}
                                        >
                                            <div className={`w-8 text-center font-black text-lg ${i < 3 ? 'text-amber-300' : 'text-gray-500'}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-white font-bold truncate">{entry.name}</span>
                                                    {mine && <span className="text-[9px] uppercase text-cyan-300 tracking-widest">you</span>}
                                                    {entry.verified && <span className="text-[9px] uppercase text-emerald-300 tracking-widest">verified</span>}
                                                    {entry.local && <span className="text-[9px] uppercase text-amber-400/80 tracking-widest">local</span>}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {entry.title} &middot; Depth {entry.farthestDistance} &middot; {entry.badges}/8 badges &middot; {entry.shinies} shiny
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-black tabular-nums text-lg">{entry.score.toLocaleString()}</div>
                                                <div className="text-[9px] text-gray-500 uppercase">pts</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
