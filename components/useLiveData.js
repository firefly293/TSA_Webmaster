"use client";
import { useEffect, useState } from "react";

// updates the page every 2 seconds
export default function useLiveData(initial) {
    const [data, setData] = useState(initial);
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        let last = "";
        const timer = setInterval(async () => {
            setNow(Date.now());
            const text = await fetch("/api/scores", { cache: "no-store" })
                .then((res) => (res.ok ? res.text() : last))
                .catch(() => last);
            if (text === last) return;
            last = text;
            const { paused, scores } = JSON.parse(text);
            setData({ paused, scores: scores.toReversed() });
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return { ...data, now };
}
