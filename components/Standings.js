"use client";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { SORTS, standings } from "@/lib/standings";

const SORT_LABELS = { best: "Best", average: "Average", total: "Total" };

const MEDALS = { 1: "leader", 2: "silver", 3: "bronze" };

export default function Standings({ scores, colors, charted }) {
    const [sortBy, setSortBy] = useState("best");
    const [query, setQuery] = useState("");

    const rows = useMemo(() => standings(scores, sortBy), [scores, sortBy]);
    // ranks before the latest score, to show who just moved up or down.
    const previousRanks = useMemo(
        () =>
            new Map(
                standings(scores.slice(0, -1), sortBy).map((t) => [
                    t.key,
                    t.rank,
                ]),
            ),
        [scores, sortBy],
    );
    const visible = rows.filter((t) =>
        t.key.includes(query.trim().toLowerCase()),
    );

    return (
        <section className="panel standings">
            <div className="panel-head">
                <h2>Standings</h2>
                <div className="tabs" role="group" aria-label="Rank by">
                    {Object.keys(SORTS).map((s) => (
                        <button
                            key={s}
                            aria-pressed={s === sortBy}
                            onClick={() => setSortBy(s)}
                        >
                            {SORT_LABELS[s]}
                        </button>
                    ))}
                </div>
                <input
                    className="search"
                    type="search"
                    aria-label="Search for a team"
                    placeholder="Search for a team"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="team-row labels" aria-hidden>
                <span>Rank</span>
                <span>Team</span>
                {Object.keys(SORTS).map((s) => (
                    <span key={s} className={s === sortBy ? "active" : ""}>
                        {SORT_LABELS[s]}
                    </span>
                ))}
                <span>Attempts</span>
            </div>

            <ul>
                <AnimatePresence initial={false}>
                    {visible.map((t) => (
                        <motion.li
                            key={t.key}
                            layout
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 40,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={["team-row", MEDALS[t.rank]]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <span className="rank">{t.rank}</span>
                            <span className="team-name">
                                {charted.includes(t.key) && (
                                    <span
                                        className="swatch"
                                        style={{
                                            background: colors.get(t.key),
                                        }}
                                        title="Color used on chart"
                                    />
                                )}
                                {t.name}
                                <Movement
                                    before={previousRanks.get(t.key)}
                                    now={t.rank}
                                />
                            </span>
                            {Object.keys(SORTS).map((s) => (
                                <span
                                    key={s}
                                    className={
                                        s === sortBy ? "num active" : "num"
                                    }
                                >
                                    {t[s].toLocaleString()}
                                </span>
                            ))}
                            <span className="num">{t.attempts}</span>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            {rows.length > 0 && visible.length === 0 && (
                <p className="empty">No team matches "{query}". </p>
            )}
        </section>
    );
}

// green up and red down arrows to show changes in standings,
// "new" for a new team
function Movement({ before, now }) {
    if (before === undefined) return <span className="move new">new</span>;
    if (before === now) return null;
    return before > now ? (
        <span className="move up" title={`Up ${before - now}`}>
            ▲{before - now}
        </span>
    ) : (
        <span className="move down" title={`Down ${now - before}`}>
            ▼{now - before}
        </span>
    );
}
