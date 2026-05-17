import { generateChunk } from '../services/mapData';

type Point = { cx: number; cy: number };
type LaneStrategy = 'safe' | 'balanced' | 'risky' | 'strange';
type EchoPriority = 'high' | 'medium' | 'low';

const originalWarn = console.warn;
console.warn = () => {};

const roleTargets: Record<string, [number, number]> = {
    breather: [15, 25],
    temptation: [15, 20],
    obstacle: [10, 15],
    threat: [15, 20],
    mystery: [15, 20],
    consequence: [8, 12],
    setpiece: [3, 6],
};

const familyTargets: Record<string, [number, number]> = {
    pokemon_ecology: [15, 22],
    environment: [12, 18],
    human_trouble: [12, 18],
    mystery: [12, 18],
    faction: [8, 14],
    rival: [5, 10],
    companion: [5, 10],
    poi: [5, 10],
    economy: [5, 10],
    setpiece: [3, 6],
};

const scalarTargets: Record<string, [number, number]> = {
    arcStarts: [8, 14],
    arcCompletions: [4, 8],
    arcFailures: [1, 4],
    unresolvedArcs: [0, 3],
    queuedEchoes: [8, 16],
    triggeredEchoes: [5, 12],
    expiredEchoes: [0, 4],
    setpieces: [3, 6],
};

const parseArgs = () => {
    const args = process.argv.slice(2);
    const get = (name: string): string | undefined => {
        const pref = `--${name}=`;
        const hit = args.find((a) => a.startsWith(pref));
        return hit ? hit.slice(pref.length) : undefined;
    };
    const getEnv = (name: string): string | undefined => {
        const npmKey = `npm_config_${name.replace(/-/g, '_')}`;
        return process.env[npmKey] || process.env[name.replace(/-/g, '_').toUpperCase()];
    };
    const chunks = Number(get('chunks') || getEnv('chunks') || 100);
    const runs = Number(get('runs') || getEnv('runs') || 20);
    const seed = Number(get('seed') || getEnv('seed') || 7100);
    const biome = get('biome') || getEnv('biome');
    const laneRaw = (get('lane-strategy') || getEnv('lane-strategy') || 'balanced').toLowerCase();
    const laneStrategy = (['safe', 'balanced', 'risky', 'strange'].includes(laneRaw) ? laneRaw : 'balanced') as LaneStrategy;
    return { chunks, runs, seed, biome, laneStrategy };
};

const hash = (a: number, b: number, c: number): number => {
    let x = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
    x = (x << 13) ^ x;
    return Math.abs((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
};

const spiralPath = (count: number): Point[] => {
    const points: Point[] = [];
    let x = 1, y = 0, dx = 0, dy = 1;
    let segment = 1;
    while (points.length < count) {
        for (let rep = 0; rep < 2 && points.length < count; rep++) {
            for (let i = 0; i < segment && points.length < count; i++) {
                points.push({ cx: x, cy: y });
                x += dx;
                y += dy;
            }
            const ndx = -dy;
            const ndy = dx;
            dx = ndx;
            dy = ndy;
        }
        segment++;
    }
    return points.filter((p) => !(p.cx === 0 && p.cy === 0));
};

const defaultState = () => ({
    routeTension: 0,
    routeCuriosity: 0,
    routeFlags: [] as string[],
    factionReputation: {} as Record<string, number>,
    chunkMemoryStates: {} as Record<string, string[]>,
    routeIntel: 0,
    routeControl: 0,
    activeRouteArcs: [] as any[],
    completedRouteArcs: [] as string[],
    failedRouteArcs: [] as string[],
    recentIncidentIds: [] as string[],
    recentChunkRoles: [] as string[],
    routeStability: 5,
    queuedEchoes: [] as Array<{ incidentId: string; triggerAfterChunk: number; expiresAfterChunk?: number; priority: EchoPriority }>,
    pacing: {
        desiredIntensity: 'normal',
        recentDangerCount: 0,
        recentRewardCount: 0,
        recentMysteryCount: 0,
        recentBattleIncidentCount: 0,
        chunksSinceMajorIncident: 0,
        chunksSinceBreather: 0,
        forceBreatherSoon: false,
        forcePayoffSoon: false,
    },
    routeOwnershipByRegion: {} as Record<string, string>,
    activeCompanions: [] as any[],
    activeContracts: [] as any[],
    completedContracts: [] as string[],
    failedContracts: [] as string[],
});

const queueEchoUnique = (
    queue: Array<{ incidentId: string; triggerAfterChunk: number; expiresAfterChunk?: number; priority: EchoPriority }>,
    entry: { incidentId: string; triggerAfterChunk: number; expiresAfterChunk?: number; priority: EchoPriority },
) => {
    const duplicate = queue.find((e) => e.incidentId === entry.incidentId && Math.abs((e.triggerAfterChunk || 0) - entry.triggerAfterChunk) <= 2);
    if (duplicate) return false;
    queue.push(entry);
    queue.sort((a, b) => (a.triggerAfterChunk || 0) - (b.triggerAfterChunk || 0));
    if (queue.length > 9) queue.splice(9);
    return true;
};

const classifyEchoPriority = (incidentId: string): EchoPriority => {
    if (/rescued|merchant|poacher|rival|shrine|bridge|alpha|ambush/.test(incidentId)) return 'high';
    if (/patrol|checkpoint|contract|guild|ownership|fog|courier/.test(incidentId)) return 'medium';
    return 'low';
};

const chooseLane = (strategy: LaneStrategy, p: Point, runSeed: number): 'main' | 'side' | 'strange' => {
    const r = hash(p.cx, p.cy, runSeed);
    if (strategy === 'safe') return r < 0.82 ? 'main' : 'side';
    if (strategy === 'risky') return r < 0.62 ? 'side' : r < 0.87 ? 'strange' : 'main';
    if (strategy === 'strange') return r < 0.76 ? 'strange' : r < 0.9 ? 'side' : 'main';
    return r < 0.45 ? 'main' : r < 0.8 ? 'side' : 'strange';
};

const chooseIncidentChoice = (incident: any, strategy: LaneStrategy): any => {
    if (!incident?.choices?.length) return undefined;
    if (strategy === 'safe') {
        return incident.choices.find((c: any) => /safe|wait|observe|repair|heal|help|cautious|stabilize/i.test(`${c.id} ${c.label} ${c.hint || ''}`)) || incident.choices[0];
    }
    if (strategy === 'risky') {
        return incident.choices.find((c: any) => /risky|push|battle|exploit|bait|sabotage|force|ambush/i.test(`${c.id} ${c.label} ${c.hint || ''}`)) || incident.choices[1] || incident.choices[0];
    }
    if (strategy === 'strange') {
        return incident.choices.find((c: any) => /mystery|strange|alliance|attune|ritual|resonance|shrine|unknown/i.test(`${c.id} ${c.label} ${c.hint || ''}`)) || incident.choices[2] || incident.choices[0];
    }
    return incident.choices[0];
};

const scoreLabel = (ok: boolean, bad: boolean) => ok ? '✅' : bad ? '❌' : '⚠️';

const inRange = (v: number, min: number, max: number) => v >= min && v <= max;

const summarizeRange = (name: string, value: number, min: number, max: number, suffix = '%') => {
    const ok = inRange(value, min, max);
    const near = value >= min - 2 && value <= max + 2;
    return `${scoreLabel(ok, !near)} ${name} ${value.toFixed(1)}${suffix} (target ${min}-${max}${suffix})`;
};

const runSimulation = (chunks: number, runSeed: number, laneStrategy: LaneStrategy, forcedBiome?: string) => {
    const path = spiralPath(chunks);
    const state = defaultState();
    const roleDist: Record<string, number> = {};
    const familyDist: Record<string, number> = {};
    const echoByPriority: Record<EchoPriority, { queued: number; triggered: number; expired: number }> = {
        high: { queued: 0, triggered: 0, expired: 0 },
        medium: { queued: 0, triggered: 0, expired: 0 },
        low: { queued: 0, triggered: 0, expired: 0 },
    };
    let setpieces = 0;
    let breathers = 0;
    let arcsStarted = 0;
    let arcsCompleted = 0;
    let arcsFailed = 0;
    let ownershipShifts = 0;
    let companionMoments = 0;
    let contractMoments = 0;
    let repeatedWarnings = 0;
    let dominanceWarnings = 0;
    let sinceMajor = 0;
    let majorGapTotal = 0;
    let majorGapCount = 0;
    let deadStretch = 0;
    let longestDeadStretch = 0;
    let intenseStreak = 0;
    let overloadWarnings = 0;
    let setpieceBackToBack = 0;
    let breatherSpacingWarnings = 0;
    let chunksSinceBreather = 0;
    let lastSetpieceAt = -99;

    for (let i = 0; i < path.length; i++) {
        const point = path[i];
        const lane = chooseLane(laneStrategy, point, runSeed + i);
        state.routeFlags = state.routeFlags.filter((f) => !/^lane_/.test(f));
        state.routeFlags.push(`lane_${lane}`);
        if (lane === 'strange') {
            state.routeCuriosity = Math.min(10, state.routeCuriosity + 1);
            state.routeTension = Math.min(10, state.routeTension + 0.2);
        } else if (lane === 'side') {
            state.routeCuriosity = Math.min(10, state.routeCuriosity + 0.4);
        } else {
            state.routeTension = Math.max(0, state.routeTension - 0.2);
        }

        const chunk = generateChunk(point.cx, point.cy, 0, state as any);
        if (forcedBiome && chunk.biome !== forcedBiome) continue;

        const role = chunk.chunkRole || 'breather';
        roleDist[role] = (roleDist[role] || 0) + 1;
        state.recentChunkRoles = [...state.recentChunkRoles.slice(-9), role];
        const isIntenseRole = role === 'threat' || role === 'setpiece' || role === 'obstacle' || role === 'consequence';
        intenseStreak = isIntenseRole ? intenseStreak + 1 : 0;
        if (intenseStreak > 2 && state.routeTension < 7) overloadWarnings++;

        let setpieceMarked = false;
        if (role === 'setpiece') {
            setpieces++;
            setpieceMarked = true;
            if (i - lastSetpieceAt <= 1) setpieceBackToBack++;
            lastSetpieceAt = i;
            state.pacing.forceBreatherSoon = true;
        }
        if (role === 'breather') {
            breathers++;
            chunksSinceBreather = 0;
            state.pacing.forceBreatherSoon = false;
        } else {
            chunksSinceBreather++;
        }
        if (chunksSinceBreather > 8) breatherSpacingWarnings++;

        const chunkFloor = Math.floor(Math.sqrt(point.cx * point.cx + point.cy * point.cy));
        const expiredEchoes = state.queuedEchoes.filter((e: any) => e.expiresAfterChunk !== undefined && e.expiresAfterChunk < chunkFloor);
        for (const ex of expiredEchoes) echoByPriority[ex.priority].expired++;
        state.queuedEchoes = state.queuedEchoes.filter((e: any) => !(e.expiresAfterChunk !== undefined && e.expiresAfterChunk < chunkFloor));

        const incident = chunk.routeIncident;
        let meaningfulBeat = false;
        if ((Object.keys(chunk.portals || {}).length > 0) || (Object.keys(chunk.npcs || {}).length > 0) || (Object.keys(chunk.trainers || {}).length > 0)) {
            meaningfulBeat = true;
        }
        if (incident) {
            meaningfulBeat = true;
            familyDist[incident.family] = (familyDist[incident.family] || 0) + 1;
            if (incident.family === 'setpiece' && !setpieceMarked) setpieces++;
            const recentIds = state.recentIncidentIds.slice(-10);
            if (recentIds.includes(incident.id)) repeatedWarnings++;
            const lastFiveFamilies = state.recentIncidentIds
                .slice(-5)
                .map((id) => (state as any).__familyById?.[id])
                .filter(Boolean);
            const famCount = lastFiveFamilies.filter((f: string) => f === incident.family).length;
            if (famCount >= 2) repeatedWarnings++;
            (state as any).__familyById = { ...((state as any).__familyById || {}), [incident.id]: incident.family };

            state.recentIncidentIds = [...state.recentIncidentIds.slice(-11), incident.id];
            const choice = chooseIncidentChoice(incident, laneStrategy);
            const outcome = choice?.outcome || {};
            const penalties = outcome.penalties || {};
            const rewards = outcome.rewards || {};

            state.routeTension = Math.max(0, Math.min(10, state.routeTension + (outcome.tensionDelta || 0) + (penalties.tensionDelta || 0)));
            state.routeCuriosity = Math.max(0, Math.min(10, state.routeCuriosity + (outcome.curiosityDelta || 0)));
            state.routeFlags = [...new Set([...state.routeFlags, ...(outcome.addFlags || []), ...(outcome.setRouteFlags || [])])];
            if (rewards.joinCompanion) {
                companionMoments++;
                state.activeCompanions = [rewards.joinCompanion];
            }
            if (rewards.startContract) {
                contractMoments++;
                state.activeContracts.push(rewards.startContract);
            }
            if (rewards.routeOwnershipChange) {
                ownershipShifts++;
                const regionKey = `${Math.floor(point.cx / 5)},${Math.floor(point.cy / 5)}`;
                state.routeOwnershipByRegion[regionKey] = rewards.routeOwnershipChange;
            }

            const upsertArc = (arcId: string | undefined, mode: 'start' | 'advance' | 'complete' | 'fail') => {
                if (!arcId) return;
                const idx = state.activeRouteArcs.findIndex((a: any) => a.id === arcId);
                if (mode === 'start' && idx === -1 && state.activeRouteArcs.length < 3) {
                    state.activeRouteArcs.push({ id: arcId, title: arcId.replace(/-/g, ' '), stageIndex: 0, maxStages: chunkFloor < 15 ? 3 : 5, expiresAfterChunks: chunkFloor < 15 ? 10 : 14, age: 0 });
                    arcsStarted++;
                    return;
                }
                if (idx === -1) return;
                const arc = state.activeRouteArcs[idx];
                if (mode === 'advance') arc.stageIndex = Math.min((arc.maxStages || 4) - 1, (arc.stageIndex || 0) + 1);
                if (mode === 'complete') {
                    state.completedRouteArcs.push(arc.id);
                    state.activeRouteArcs.splice(idx, 1);
                    arcsCompleted++;
                }
                if (mode === 'fail') {
                    state.failedRouteArcs.push(arc.id);
                    state.activeRouteArcs.splice(idx, 1);
                    arcsFailed++;
                }
            };

            upsertArc(outcome.startRouteArcId || incident.followUp?.arcId, 'start');
            upsertArc(outcome.advanceRouteArcId, 'advance');
            upsertArc(outcome.completeRouteArcId, 'complete');
            upsertArc(outcome.failRouteArcId, 'fail');

            const queueEcho = (incidentId: string | undefined, minDelay = 2, maxDelay = 5) => {
                if (!incidentId) return;
                const p = classifyEchoPriority(incidentId);
                const delay = Math.max(1, minDelay + Math.floor(hash(point.cx, point.cy, runSeed + incidentId.length) * Math.max(1, (maxDelay - minDelay + 1))));
                const triggerAfterChunk = chunkFloor + delay;
                const expiresAfterChunk = triggerAfterChunk + (p === 'high' ? 5 : p === 'medium' ? 4 : 2);
                const queued = queueEchoUnique(state.queuedEchoes, { incidentId, triggerAfterChunk, expiresAfterChunk, priority: p });
                if (queued) echoByPriority[p].queued++;
            };

            queueEcho(outcome.queueEchoIncidentId, outcome.echoDelayChunks || 2, (outcome.echoDelayChunks || 2) + 3);
            const followUpChanceBase = incident.followUp?.echoChance || 0.55;
            const followUpChance = (incident.family === 'rival' || incident.family === 'faction') ? Math.min(0.55, followUpChanceBase) : followUpChanceBase;
            if (incident.followUp?.possibleNextIncidentIds?.length && state.queuedEchoes.length < 4 && hash(point.cx, point.cy, runSeed + i + 99) < Math.min(0.45, followUpChance)) {
                const nextId = incident.followUp.possibleNextIncidentIds[Math.floor(hash(point.cx, point.cy, runSeed + 444) * incident.followUp.possibleNextIncidentIds.length)];
                queueEcho(nextId, incident.followUp.minChunksLater || 2, incident.followUp.maxChunksLater || 5);
            }
        }

        const dueEcho = state.queuedEchoes.find((e: any) => e.incidentId === incident?.id && e.triggerAfterChunk <= chunkFloor);
        if (dueEcho) {
            echoByPriority[dueEcho.priority].triggered++;
            state.queuedEchoes = state.queuedEchoes.filter((e: any) => e !== dueEcho);
            meaningfulBeat = true;
        }
        const dueFallback = state.queuedEchoes.find((e: any) => e.triggerAfterChunk <= chunkFloor);
        if (dueFallback && !dueEcho) {
            const triggerChance = dueFallback.priority === 'high' ? 0.85 : dueFallback.priority === 'medium' ? 0.55 : 0.3;
            if (hash(point.cx, point.cy, runSeed + i + 808) < triggerChance) {
                echoByPriority[dueFallback.priority].triggered++;
                state.queuedEchoes = state.queuedEchoes.filter((e: any) => e !== dueFallback);
                meaningfulBeat = true;
            }
        }

        for (const arc of state.activeRouteArcs) {
            arc.age = (arc.age || 0) + 1;
            if ((arc.age % 2) === 0 && arc.age >= 2) arc.stageIndex = Math.min((arc.maxStages || 4) - 1, (arc.stageIndex || 0) + 1);
        }
        const expiredArcs = state.activeRouteArcs.filter((a: any) => a.age > (a.expiresAfterChunks || 8));
        for (const arc of expiredArcs) {
            arcsFailed++;
            state.failedRouteArcs.push(arc.id);
            state.routeFlags.push(`arc_failed_${arc.id}`);
            meaningfulBeat = true;
        }
        state.activeRouteArcs = state.activeRouteArcs.filter((a: any) => a.age <= (a.expiresAfterChunks || 8));
        const completable = state.activeRouteArcs.filter((a: any) => (a.stageIndex || 0) >= ((a.maxStages || 4) - 1) && (a.age || 0) >= 7 && hash(point.cx, point.cy, runSeed + 717) < 0.12);
        for (const arc of completable) {
            arcsCompleted++;
            state.completedRouteArcs.push(arc.id);
            state.activeRouteArcs = state.activeRouteArcs.filter((a: any) => a.id !== arc.id);
            meaningfulBeat = true;
        }

        const major = role === 'setpiece' || role === 'threat' || role === 'consequence' || incident?.family === 'setpiece';
        if (major) {
            majorGapTotal += sinceMajor;
            majorGapCount++;
            sinceMajor = 0;
        } else {
            sinceMajor++;
        }
        if (meaningfulBeat) {
            deadStretch = 0;
        } else {
            deadStretch++;
            longestDeadStretch = Math.max(longestDeadStretch, deadStretch);
        }
    }

    const familyEntries = Object.entries(familyDist);
    const totalFamilies = familyEntries.reduce((sum, [, c]) => sum + c, 0) || 1;
    for (const [family, count] of familyEntries) {
        const pct = (count / totalFamilies) * 100;
        if (pct > 24) dominanceWarnings++;
        if (familyTargets[family] && !inRange(pct, familyTargets[family][0], familyTargets[family][1])) dominanceWarnings += 0.2;
    }

    return {
        chunksSeen: Object.values(roleDist).reduce((a, b) => a + b, 0),
        roleDist,
        familyDist,
        arcsStarted,
        arcsCompleted,
        arcsFailed,
        unresolvedArcs: state.activeRouteArcs.length,
        queuedEchoes: echoByPriority.high.queued + echoByPriority.medium.queued + echoByPriority.low.queued,
        triggeredEchoes: echoByPriority.high.triggered + echoByPriority.medium.triggered + echoByPriority.low.triggered,
        expiredEchoes: echoByPriority.high.expired + echoByPriority.medium.expired + echoByPriority.low.expired,
        echoByPriority,
        setpieces,
        breathers,
        avgChunksBetweenMajorEvents: majorGapCount ? majorGapTotal / majorGapCount : 0,
        longestDeadStretch,
        repeatedWarnings,
        dominanceWarnings,
        overloadWarnings,
        setpieceBackToBack,
        breatherSpacingWarnings,
        companionRate: companionMoments,
        contractRate: contractMoments,
        ownershipShifts,
        laneStrategy,
    };
};

const averageRuns = (runs: ReturnType<typeof runSimulation>[]) => {
    const avg: any = {
        roleDist: {},
        familyDist: {},
        echoByPriority: {
            high: { queued: 0, triggered: 0, expired: 0 },
            medium: { queued: 0, triggered: 0, expired: 0 },
            low: { queued: 0, triggered: 0, expired: 0 },
        },
    };
    const n = runs.length || 1;
    for (const r of runs) {
        for (const [k, v] of Object.entries(r.roleDist)) avg.roleDist[k] = (avg.roleDist[k] || 0) + v / n;
        for (const [k, v] of Object.entries(r.familyDist)) avg.familyDist[k] = (avg.familyDist[k] || 0) + v / n;
        avg.arcsStarted = (avg.arcsStarted || 0) + r.arcsStarted / n;
        avg.arcsCompleted = (avg.arcsCompleted || 0) + r.arcsCompleted / n;
        avg.arcsFailed = (avg.arcsFailed || 0) + r.arcsFailed / n;
        avg.unresolvedArcs = (avg.unresolvedArcs || 0) + r.unresolvedArcs / n;
        avg.queuedEchoes = (avg.queuedEchoes || 0) + r.queuedEchoes / n;
        avg.triggeredEchoes = (avg.triggeredEchoes || 0) + r.triggeredEchoes / n;
        avg.expiredEchoes = (avg.expiredEchoes || 0) + r.expiredEchoes / n;
        avg.setpieces = (avg.setpieces || 0) + r.setpieces / n;
        avg.breathers = (avg.breathers || 0) + r.breathers / n;
        avg.avgChunksBetweenMajorEvents = (avg.avgChunksBetweenMajorEvents || 0) + r.avgChunksBetweenMajorEvents / n;
        avg.longestDeadStretch = (avg.longestDeadStretch || 0) + r.longestDeadStretch / n;
        avg.repeatedWarnings = (avg.repeatedWarnings || 0) + r.repeatedWarnings / n;
        avg.dominanceWarnings = (avg.dominanceWarnings || 0) + r.dominanceWarnings / n;
        avg.overloadWarnings = (avg.overloadWarnings || 0) + r.overloadWarnings / n;
        avg.setpieceBackToBack = (avg.setpieceBackToBack || 0) + r.setpieceBackToBack / n;
        avg.breatherSpacingWarnings = (avg.breatherSpacingWarnings || 0) + r.breatherSpacingWarnings / n;
        avg.companionRate = (avg.companionRate || 0) + r.companionRate / n;
        avg.contractRate = (avg.contractRate || 0) + r.contractRate / n;
        avg.ownershipShifts = (avg.ownershipShifts || 0) + r.ownershipShifts / n;
        avg.echoByPriority.high.queued += r.echoByPriority.high.queued / n;
        avg.echoByPriority.high.triggered += r.echoByPriority.high.triggered / n;
        avg.echoByPriority.high.expired += r.echoByPriority.high.expired / n;
        avg.echoByPriority.medium.queued += r.echoByPriority.medium.queued / n;
        avg.echoByPriority.medium.triggered += r.echoByPriority.medium.triggered / n;
        avg.echoByPriority.medium.expired += r.echoByPriority.medium.expired / n;
        avg.echoByPriority.low.queued += r.echoByPriority.low.queued / n;
        avg.echoByPriority.low.triggered += r.echoByPriority.low.triggered / n;
        avg.echoByPriority.low.expired += r.echoByPriority.low.expired / n;
    }
    avg.chunksSeen = Object.values(avg.roleDist).reduce((a: any, b: any) => a + b, 0);
    return avg;
};

const printDiagnostic = (avg: any, chunks: number, runs: number, laneStrategy: LaneStrategy) => {
    const chunksSeen = Math.max(1, avg.chunksSeen || chunks);
    const per100 = (value: number): number => (value / chunksSeen) * 100;
    console.log('Overworld Cadence Diagnostics');
    console.log('-----------------------------');
    console.log(`[route-walk] runs=${runs} chunks=${chunks} strategy=${laneStrategy}`);
    console.log('Role Distribution:');
    for (const role of Object.keys(roleTargets)) {
        const pct = ((avg.roleDist[role] || 0) / Math.max(1, avg.chunksSeen)) * 100;
        const [min, max] = roleTargets[role];
        console.log(summarizeRange(role, pct, min, max));
    }
    console.log('Incident Family Distribution:');
    const totalFamily = (Object.values(avg.familyDist) as number[]).reduce((a, b) => a + b, 0) || 1;
    for (const fam of Object.keys(familyTargets)) {
        const pct = (((avg.familyDist[fam] || 0) as number) / totalFamily) * 100;
        const [min, max] = familyTargets[fam];
        console.log(summarizeRange(fam, pct, min, max));
    }
    console.log('Route Arcs:');
    console.log(summarizeRange('starts /100', per100(avg.arcsStarted), scalarTargets.arcStarts[0], scalarTargets.arcStarts[1], ''));
    console.log(summarizeRange('completions /100', per100(avg.arcsCompleted), scalarTargets.arcCompletions[0], scalarTargets.arcCompletions[1], ''));
    console.log(summarizeRange('failures /100', per100(avg.arcsFailed), scalarTargets.arcFailures[0], scalarTargets.arcFailures[1], ''));
    console.log(summarizeRange('unresolved at end', avg.unresolvedArcs, scalarTargets.unresolvedArcs[0], scalarTargets.unresolvedArcs[1], ''));
    console.log('Echoes:');
    console.log(summarizeRange('queued /100', per100(avg.queuedEchoes), scalarTargets.queuedEchoes[0], scalarTargets.queuedEchoes[1], ''));
    console.log(summarizeRange('triggered /100', per100(avg.triggeredEchoes), scalarTargets.triggeredEchoes[0], scalarTargets.triggeredEchoes[1], ''));
    console.log(summarizeRange('expired /100', per100(avg.expiredEchoes), scalarTargets.expiredEchoes[0], scalarTargets.expiredEchoes[1], ''));
    console.log(`[route-walk] echoPriority high=${avg.echoByPriority.high.triggered.toFixed(1)} medium=${avg.echoByPriority.medium.triggered.toFixed(1)} low=${avg.echoByPriority.low.triggered.toFixed(1)}`);
    console.log('Cadence:');
    console.log(summarizeRange('setpieces /100', per100(avg.setpieces), scalarTargets.setpieces[0], scalarTargets.setpieces[1], ''));
    console.log(`${scoreLabel(avg.setpieceBackToBack < 0.5, avg.setpieceBackToBack > 1)} setpiece back-to-back avg=${avg.setpieceBackToBack.toFixed(2)}`);
    const breathersPer100 = per100(avg.breathers);
    console.log(`${scoreLabel(breathersPer100 >= 13 && breathersPer100 <= 25, breathersPer100 < 10)} breathers /100=${breathersPer100.toFixed(1)}`);
    console.log(`${scoreLabel(avg.avgChunksBetweenMajorEvents >= 2 && avg.avgChunksBetweenMajorEvents <= 5, avg.avgChunksBetweenMajorEvents > 6)} avg chunks between major events=${avg.avgChunksBetweenMajorEvents.toFixed(2)}`);
    console.log(`${scoreLabel(avg.longestDeadStretch <= 3, avg.longestDeadStretch > 4)} longest dead stretch=${avg.longestDeadStretch.toFixed(2)}`);
    console.log(`${scoreLabel(avg.repeatedWarnings <= 4, avg.repeatedWarnings > 8)} repetition warnings=${avg.repeatedWarnings.toFixed(2)}`);
    console.log(`${scoreLabel(avg.dominanceWarnings <= 3, avg.dominanceWarnings > 6)} over-dominant family warnings=${avg.dominanceWarnings.toFixed(2)}`);
    console.log(`${scoreLabel(avg.breatherSpacingWarnings < 1, avg.breatherSpacingWarnings > 2)} breather spacing warnings=${avg.breatherSpacingWarnings.toFixed(2)}`);
    console.log(`${scoreLabel(avg.overloadWarnings <= 2, avg.overloadWarnings > 5)} overload warnings=${avg.overloadWarnings.toFixed(2)}`);
    console.log('Support Systems:');
    const companionPer100 = per100(avg.companionRate);
    const contractPer100 = per100(avg.contractRate);
    const ownershipPer100 = per100(avg.ownershipShifts);
    console.log(`${scoreLabel(companionPer100 >= 1, companionPer100 < 0.2)} companion moments /100=${companionPer100.toFixed(1)}`);
    console.log(`${scoreLabel(contractPer100 >= 0.3, false)} contract moments /100=${contractPer100.toFixed(1)}`);
    console.log(`${scoreLabel(ownershipPer100 >= 0.4, false)} ownership shifts /100=${ownershipPer100.toFixed(1)}`);
};

const laneComparison = (chunks: number, seed: number, forcedBiome?: string) => {
    const strategies: LaneStrategy[] = ['safe', 'balanced', 'risky', 'strange'];
    const results = strategies.map((s, idx) => averageRuns(Array.from({ length: 6 }, (_, r) => runSimulation(chunks, seed + (idx * 17) + r, s, forcedBiome))));
    const mk = (res: any) => {
        const roleTotal = Math.max(1, res.chunksSeen);
        const familyTotal = Math.max(1, (Object.values(res.familyDist) as number[]).reduce((a, b) => a + b, 0));
        return {
            dangerPct: (((res.roleDist.threat || 0) + ((res.roleDist.setpiece || 0) * 1.2)) / roleTotal) * 100,
            rewardPct: ((((res.familyDist.economy || 0) + (res.familyDist.poi || 0) + (res.familyDist.companion || 0) + (res.familyDist.environment || 0) + (res.familyDist.pokemon_ecology || 0)) as number) / familyTotal) * 100,
            mysteryPct: ((((res.familyDist.mystery || 0) + (res.familyDist.poi || 0)) as number) / familyTotal) * 100,
            setpieces: res.setpieces,
            avgTensionProxy: (((res.roleDist.threat || 0) + (res.roleDist.obstacle || 0)) / roleTotal) * 10,
        };
    };
    console.log('Lane Strategy Comparison:');
    for (let i = 0; i < strategies.length; i++) {
        const m = mk(results[i]);
        console.log(`- ${strategies[i]}: danger=${m.dangerPct.toFixed(1)} reward=${m.rewardPct.toFixed(1)} mystery=${m.mysteryPct.toFixed(1)} setpieces=${m.setpieces.toFixed(1)} tension=${m.avgTensionProxy.toFixed(1)}`);
    }
};

const main = () => {
    const { chunks, runs, seed, biome, laneStrategy } = parseArgs();
    const runsData = Array.from({ length: runs }, (_, i) => runSimulation(chunks, seed + i, laneStrategy, biome));
    const avg = averageRuns(runsData);
    printDiagnostic(avg, chunks, runs, laneStrategy);
    laneComparison(chunks, seed + 9000, biome);
    const severe = avg.longestDeadStretch > 4 || avg.setpieceBackToBack >= 1 || avg.dominanceWarnings > 6;
    const moderate = avg.repeatedWarnings > 4 || avg.triggeredEchoes < scalarTargets.triggeredEchoes[0];
    console.warn = originalWarn;
    if (severe) {
        console.log('[route-walk] FAIL');
        process.exitCode = 1;
        return;
    }
    if (moderate) {
        console.log('[route-walk] WARN');
        return;
    }
    console.log('[route-walk] PASS');
};

main();

