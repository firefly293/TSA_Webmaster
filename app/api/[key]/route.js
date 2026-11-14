import { addScore, isPaused } from "@/lib/db";
import { parseScore } from "@/lib/validate";

export const dynamic = "force-dynamic";

// the scorer or whatever posts a json paylod {"name": "test", "score": 100} to the url /api/[INGEST_KEY] which is made secret so random people cant post scores
export async function POST(request, { params }) {
    // enforce the secret key
    const { key } = await params;
    if (!process.env.INGEST_KEY || key !== process.env.INGEST_KEY)
        return new Response("Not found", { status: 404 });

    // wait for the request to come through
    const body = await request.json().catch(() => null);
    if (!body)
        return Response.json(
            { ok: false, error: "body must be a valid json payload" },
            { status: 400 },
        );

    const { name, score, error } = parseScore(body);

    if (error) return Response.json({ ok: false, error }, { status: 400 });

    if (await isPaused())
        return Response.json(
            { ok: false, error: "scoring has been paused by admin" },
            { status: 503 },
        );

    return Response.json(
        { ok: true, score: await addScore(name, score) },
        { status: 201 },
    );
}
