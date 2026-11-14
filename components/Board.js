"use client";
import { MotionConfig } from "motion/react";
import { useMemo } from "react";
import { summary, teamColors } from "@/lib/analytics";
import { standings } from "@/lib/standings";
import { RaceChart, ScoreDistribution } from "./Charts";
import RecentFeed from "./RecentFeed";
import Standings from "./Standings";
import useLiveData from "./useLiveData";

const plural = (n, one, many) => (n === 1 ? one : many);

export default function Board({ initial, projector }) {
    const { scores, paused, now } = useLiveData(initial);
    const ranked = useMemo(() => standings(scores), [scores]);
    const top = useMemo(() => ranked.slice(0, 5), [ranked]);
    const colors = useMemo(() => teamColors(scores), [scores]);
    const { average, jump } = summary(scores);
    const leader = ranked[0];

    return (
        <MotionConfig reducedMotion="user">
            <header className="topbar">
                <div>
                    <b>TSA Super Saturday Qualifier Leaderboard</b>
                    <span />
                    <a href={projector ? "/" : "/?projector"}>
                        {projector ? "Exit projector" : "Projector mode"}
                    </a>
                </div>
            </header>
            <main className={projector ? "board projector" : "board"}>
                {paused && (
                    <p className="paused">
                        Scoring is paused and new results will appear when it
                        resumes.
                    </p>
                )}

                <section className="panel intro">
                    <h1>Computational Logistics</h1>
                    <p className="summary">
                        {leader ? (
                            <>
                                <b>{leader.name}</b> leads with{" "}
                                <b>{leader.best}</b> points. {ranked.length}{" "}
                                {plural(ranked.length, "team", "teams")} have
                                submitted {scores.length}{" "}
                                {plural(scores.length, "attempt", "attempts")},
                                averaging {average} points.
                                {jump && (
                                    <>
                                        {" "}
                                        The biggest improvement in high score is{" "}
                                        <b>{jump.name}</b>, up <b>{jump.by}</b>{" "}
                                        points.
                                    </>
                                )}
                            </>
                        ) : (
                            "No results yet, scores will appear as soon as they are posted."
                        )}
                    </p>
                </section>

                <div className="layout">
                    <div className="column">
                        <Standings
                            scores={scores}
                            colors={colors}
                            charted={top.map((t) => t.key)}
                        />
                        {!projector && <ScoreDistribution scores={scores} />}
                    </div>
                    <div className="column">
                        <RecentFeed
                            scores={scores}
                            now={now}
                            limit={projector ? 4 : 8}
                        />
                        <RaceChart scores={scores} top={top} colors={colors} />
                    </div>
                </div>
            </main>
        </MotionConfig>
    );
}
