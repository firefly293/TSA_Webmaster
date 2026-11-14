"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// page auto re-rendered to make reloading not necessary
export default function AutoRefresh({ seconds = 5 }) {
    const router = useRouter();
    useEffect(() => {
        const timer = setInterval(() => router.refresh(), seconds * 1000);
        return () => clearInterval(timer);
    }, [router, seconds]);
    return null;
}
