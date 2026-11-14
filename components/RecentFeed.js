"use client";
import { AnimatePresence, motion } from "motion/react";
import { isPersonalBest, timeAgo } from "@/lib/analytics";

export default function RecentFeed({ scores, now, limit = 8 }) {
    const latest = scores.slice(-limit).reverse();

    return (
        <section className="panel">
            <h2>Latest results</h2>
            {scores.length === 0 && (
                <p className="empty">
                    Results will be listed here as they come in.
                </p>
            )}
            <ul className="feed">
                <AnimatePresence initial={false}>
                    {latest.map((m) => (
                        <motion.li
                            key={m.id}
                            layout
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 40,
                            }}
                        >
                            <span
                                className={
                                    m.score < 0 ? "score negative" : "score"
                                }
                            >
                                {m.score}
                            </span>
                            <span className="feed-name">
                                <span>{m.name}</span>
                                {isPersonalBest(scores, m) && (
                                    <span className="best-tag">new best</span>
                                )}
                            </span>
                            <time dateTime={m.at} suppressHydrationWarning>
                                {timeAgo(m.at, now)}
                            </time>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </section>
    );
}
