//how each sort mode ranks teams. it checks these fields in order and if they're
//all tied, whoever hit their best score first wins.
// "best" is the default bc one good run counts right away and teams that play
// fewer times don't get punished for it
export const SORTS = {
    best: ["best", "average"],
    average: ["average", "best"],
    total: ["total", "best"],
};

// turns the raw score list (oldest first) into one row per team
export function standings(scores, sortBy = "best") {
    //keyed by lowercase name so two same teams but different caps end up in the same row
    const teams = new Map();

    for (const m of scores) {
        const key = m.name.toLowerCase();
        //first time we see a team, start them off empty
        const t = teams.get(key) ?? {
            key,
            name: m.name,
            attempts: 0,
            total: 0,
            best: -Infinity,
            bestAt: "",
        };
        t.attempts += 1;
        t.total += m.score;
        //only > not >=, so if they tie their own best we keep the earlier time
        if (m.score > t.best) Object.assign(t, { best: m.score, bestAt: m.at });
        teams.set(key, t);
    }

    const compare = (a, b) => {
        // b - a puts the bigger number first
        for (const field of SORTS[sortBy])
            if (a[field] !== b[field]) return b[field] - a[field];
        //times look like "2026-11-14T15:04:05" (biggest unit first)
        //so sorting them like words also sorts them oldest to newest
        return a.bestAt.localeCompare(b.bestAt);
    };

    return [...teams.values()]
        .map((t) => ({ ...t, average: Math.round(t.total / t.attempts) }))
        .sort(compare)
        .map((t, i) => ({ rank: i + 1, ...t }));
}
