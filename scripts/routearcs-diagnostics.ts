import { getRouteIncidentCatalog, getRouteArcCatalog } from '../services/mapData';

const incidents = getRouteIncidentCatalog();
const arcs = getRouteArcCatalog();
const incidentIds = new Set(incidents.map(i => i.id));
const validStages = new Set(['rumor', 'trail', 'complication', 'choice', 'payoff', 'aftermath']);
let fails = 0;

for (const arc of arcs) {
    if (!arc.id) { console.error('[routearcs] arc missing id'); fails++; }
    if (!arc.payoffIncidentId || !incidentIds.has(arc.payoffIncidentId)) {
        console.error(`[routearcs] arc ${arc.id} payoff incident missing/unknown`);
        fails++;
    }
    const related = incidents.filter(i => i.followUp?.arcId === arc.id);
    if (related.length === 0) {
        console.error(`[routearcs] arc ${arc.id} has no incident starters`);
        fails++;
    }
}

for (const i of incidents) {
    if (i.followUp?.arcId && !arcs.some(a => a.id === i.followUp?.arcId)) {
        console.error(`[routearcs] incident ${i.id} references unknown arc ${i.followUp.arcId}`);
        fails++;
    }
    if (i.followUp?.minChunksLater !== undefined && i.followUp?.maxChunksLater !== undefined && i.followUp.minChunksLater > i.followUp.maxChunksLater) {
        console.error(`[routearcs] incident ${i.id} has impossible follow-up chunk window`);
        fails++;
    }
    if (i.followUp && i.followUp.failureFlagIfIgnored === undefined) {
        console.error(`[routearcs] incident ${i.id} follow-up lacks failure flag`);
        fails++;
    }
    i.choices.forEach((c) => {
        if (c.outcome.startRouteArcId && !arcs.some(a => a.id === c.outcome.startRouteArcId)) {
            console.error(`[routearcs] choice ${i.id}:${c.id} starts unknown arc`);
            fails++;
        }
    });
}

if (fails > 0) {
    console.error(`[routearcs] FAILED with ${fails} issue(s).`);
    process.exit(1);
}

console.log(`[routearcs] PASS arcs=${arcs.length} incidents=${incidents.length} stages=${Array.from(validStages).join(',')}`);
