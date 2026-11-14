"use client";
import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { histogram, raceSeries } from "@/lib/analytics";

const INK = "var(--text)";
const MUTED = "var(--muted)";
const RULE = "var(--line)";
const BLUE = "var(--brand)";

const axis = { stroke: MUTED, fontSize: 13, tickLine: false, axisLine: false };
const tooltip = {
    contentStyle: {
        background: "var(--box)",
        border: `1px solid ${RULE}`,
        borderRadius: 3,
        color: INK,
    },
    cursor: { fill: RULE },
};

// makes a step chart for the current 5 best teams
export function RaceChart({ scores, top, colors }) {
    const data = useMemo(
        () =>
            raceSeries(
                scores,
                top.map((t) => t.key),
            ),
        [scores, top],
    );
    if (!scores.length) return null;


    return (
        <section className="panel race">
            <h2>Top 5</h2>
            <div className="race-chart">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                    <CartesianGrid stroke={RULE} vertical={false} />
                    <XAxis dataKey="n" {...axis} />
                    <YAxis {...axis} />
                    <Tooltip
                        {...tooltip}
                        labelFormatter={(n) => `After score #${n}`}
                    />
                    {top.map((t) => (
                        <Line
                            key={t.key}
                            dataKey={t.key}
                            name={t.name}
                            type="stepAfter"
                            stroke={colors.get(t.key)}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            </div>
            <p className="note">
                Line colors are the same as in the squares next to each top 5
                team on the leaderboard
            </p>
        </section>
    );
}

export function ScoreDistribution({ scores }) {
    const data = useMemo(() => histogram(scores), [scores]);
    if (!scores.length) return null;

    return (
        <section className="panel distribution">
            <h2>Histogram of scores</h2>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                    <XAxis dataKey="range" {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip
                        {...tooltip}
                        labelFormatter={(from) => `Scores from ${from}`}
                    />
                    <Bar dataKey="count" name="Scores" fill={BLUE} />
                </BarChart>
            </ResponsiveContainer>
        </section>
    );
}
