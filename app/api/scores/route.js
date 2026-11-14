import { getState } from "@/lib/db";
import { standings } from "@/lib/standings";

export const dynamic = "force-dynamic";

// the get api, this is where the leaderboard frontend polls every 2 seconds
// passing query param ?csv=standings or ?csv=scores will download a spreadsheet
export async function GET(request) {
    const { scores, paused } = await getState();
    const table = standings(scores);
    const csv = new URL(request.url).searchParams.get("csv");
    if (csv === "standings")
        return csvFile(csv, table, [
            "rank",
            "name",
            "best",
            "average",
            "total",
            "attempts",
        ]);
    if (csv === "scores")
        return csvFile(csv, scores, ["id", "name", "score", "at"]);
    return Response.json({
        paused,
        standings: table,
        scores: scores.toReversed(),
    });
}

// builds a downloadable CSV file
function csvFile(name, rows, columns) {
    // wrap all names in quotes and prevent quotes in names from escaping by replacing with "", this is how csv files escape quotes

    // helper functions to format lines
    const cell = (value) => '"' + String(value).replaceAll('"', '""') + '"';
    const line = (values) => values.map(cell).join(",");

    const header = line(columns); //build the header
    const body = rows.map((row) => line(columns.map((column) => row[column]))); // build the file body

    return new Response([header, ...body].join("\n"), {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="comp-logistics-${name}.csv"`,
        },
    });
}
