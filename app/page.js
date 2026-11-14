import Board from "@/components/Board";
import { getState } from "@/lib/db";

export const dynamic = "force-dynamic";

// the current data is rendered server side on page load so that the leaderboard appears immediately
// the client polling then keeps it live
// /?projector turns on projector mode
export default async function Home({ searchParams }) {
    const { projector } = await searchParams;
    return (
        <Board initial={await getState()} projector={projector !== undefined} />
    );
}
