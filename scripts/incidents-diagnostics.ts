import { getRouteIncidentCatalog, getRouteArcCatalog } from '../services/mapData';

const incidents = getRouteIncidentCatalog();
const arcs = getRouteArcCatalog();
const ids = new Set(incidents.map(i => i.id));
const arcIds = new Set(arcs.map(a => a.id));
const knownRewards = new Set([
    'money', 'discoveryPoints', 'routeIntel', 'tempBuff', 'mapRevealRadius', 'safeCampUnlock', 'routeSafehouseUnlocked',
    'factionReputation', 'routeControl', 'shortcutUnlock', 'rareEncounterAccess', 'moveTutorAccess', 'craftingMaterials',
    'futureDiscountPct', 'companionBuff', 'rewardPokemonId', 'rewardLevel', 'startContract', 'joinCompanion', 'poiUnlock',
    'ownershipChange', 'routeBuff',
]);
const knownPenalty = new Set(['moneyLoss', 'tensionDelta', 'curiosityDelta', 'addFlags']);
const knownFamilies = new Set(['pokemon_ecology', 'environment', 'human_trouble', 'mystery', 'rival', 'faction', 'companion', 'poi', 'economy', 'setpiece']);
const knownRoles = new Set(['breather', 'temptation', 'obstacle', 'threat', 'mystery', 'consequence', 'setpiece']);

let fails = 0;
for (const i of incidents) {
    if (!i.family || !knownFamilies.has(i.family)) { console.error(`[incidents] invalid family on ${i.id}`); fails++; }
    if (!i.biomeTags || i.biomeTags.length === 0) { console.error(`[incidents] missing biome tags on ${i.id}`); fails++; }
    if (!i.chunkRoles || i.chunkRoles.some(r => !knownRoles.has(r))) { console.error(`[incidents] invalid chunk role on ${i.id}`); fails++; }
    if (!i.choices || i.choices.length < 2) { console.error(`[incidents] less than 2 choices on ${i.id}`); fails++; }
    if (i.minTension !== undefined && i.maxTension !== undefined && i.minTension > i.maxTension) { console.error(`[incidents] impossible tension bounds on ${i.id}`); fails++; }
    if (i.minCuriosity !== undefined && i.maxCuriosity !== undefined && i.minCuriosity > i.maxCuriosity) { console.error(`[incidents] impossible curiosity bounds on ${i.id}`); fails++; }
    if (i.followUp?.arcId && !arcIds.has(i.followUp.arcId)) { console.error(`[incidents] unknown follow-up arc ${i.followUp.arcId} on ${i.id}`); fails++; }
    (i.followUp?.possibleNextIncidentIds || []).forEach(next => {
        if (!ids.has(next)) { console.error(`[incidents] unknown follow-up incident ${next} from ${i.id}`); fails++; }
    });
    i.choices.forEach((c) => {
        if (!c.outcome || !Array.isArray(c.outcome.narrative) || c.outcome.narrative.length === 0) {
            console.error(`[incidents] invalid outcome narrative on ${i.id}:${c.id}`);
            fails++;
        }
        const rew = c.outcome.rewards || {};
        Object.keys(rew).forEach(k => { if (!knownRewards.has(k)) { console.error(`[incidents] unknown reward key "${k}" on ${i.id}:${c.id}`); fails++; } });
        const pen = c.outcome.penalties || {};
        Object.keys(pen).forEach(k => { if (!knownPenalty.has(k)) { console.error(`[incidents] unknown penalty key "${k}" on ${i.id}:${c.id}`); fails++; } });
        if (c.outcome.queueEchoIncidentId && !ids.has(c.outcome.queueEchoIncidentId)) {
            console.error(`[incidents] unknown echo incident "${c.outcome.queueEchoIncidentId}" on ${i.id}:${c.id}`);
            fails++;
        }
        [c.outcome.startRouteArcId, c.outcome.advanceRouteArcId, c.outcome.completeRouteArcId, c.outcome.failRouteArcId].forEach((arc) => {
            if (arc && !arcIds.has(arc)) {
                console.error(`[incidents] unknown arc "${arc}" on ${i.id}:${c.id}`);
                fails++;
            }
        });
    });
}

if (fails > 0) {
    console.error(`[incidents] FAILED with ${fails} issue(s).`);
    process.exit(1);
}
console.log(`[incidents] PASS incidents=${incidents.length} arcs=${arcs.length}`);
