//stats and chart data, all worked out from the raw scores (oldest first)

export function summary(scores) {
    const total = scores.reduce((sum, m) => sum + m.score, 0);
    const best = {};
    // calculate biggest jump in high score from prev high to now
    let jump = null;
    for (const m of scores) {
        const key = m.name.toLowerCase();
        const by = m.score - best[key];
        if (by > (jump?.by ?? 0)) {
            jump = { name: m.name, by };
        }

        best[key] = Math.max(best[key] ?? m.score, m.score);
    }
    return {
        average: scores.length ? Math.round(total / scores.length) : 0,
        jump,
    };
}

// for the race chart: after each score, what's every top team's best so far
export function raceSeries(scores, teamKeys) {
    const best = {};
    return scores.map((m, i) => {
        const key = m.name.toLowerCase();
        if (teamKeys.includes(key))
            best[key] = Math.max(best[key] ?? -Infinity, m.score);
        //copy best into a new object each time, otherwise every point would show the final values
        return { n: i + 1, ...best };
    });
}

// counts how many scores fall in each range. keeps it to about 12 bars no matter how spread out.
export function histogram(scores) {
    if (!scores.length) return [];
    const values = scores.map((m) => m.score);
    const min = Math.min(...values);
    const max = Math.max(...values);
    //bar width: split the range into ~12, round up to a multiple of 50, never under 50
    const size = Math.max(50, Math.ceil((max - min + 1) / 12 / 50) * 50);
    //first bar starts on a multiple of size (so -120 starts at -150, not -120)
    const start = Math.floor(min / size) * size;

    const bars = [];
    for (let from = start; from <= max; from += size)
        bars.push({ range: `${from}`, count: 0 });
    for (const s of values) bars[Math.floor((s - start) / size)].count++; //which bar this score goes in
    return bars;
}

// Did this score beat every earlier score by the same team (a new personal best)?
export function isPersonalBest(scores, entry) {
    const key = entry.name.toLowerCase();
    const earlier = scores.filter(
        (m) => m.id < entry.id && m.name.toLowerCase() === key,
    );
    //a team's very first score doesn't count as a "new best"
    return earlier.length > 0 && earlier.every((m) => m.score < entry.score);
}

// Distinct line colors, defined as --team-1 to --team-10 in app/globals.css.
const TEAM_COLORS = Array.from(
    { length: 10 },
    (_, i) => `var(--team-${i + 1})`,
);

//each team gets a color in the order they first scored. colors don't change mid event
// and the first ten teams all get different ones (after that they start repeating)
export function teamColors(scores) {
    const colors = new Map();
    for (const m of scores) {
        const key = m.name.toLowerCase();
        if (!colors.has(key))
            colors.set(key, TEAM_COLORS[colors.size % TEAM_COLORS.length]);
    }
    return colors;
}

// turns a timestamp into "just now", "40 sec ago", "3 min ago" etc
export function timeAgo(iso, now) {
    const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    return `${Math.floor(seconds / 3600)} hr ago`;
}
