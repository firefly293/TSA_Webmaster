//everything that touches the database lives here. it's a neon postgres db at DATABASE_URL
// and the tables get made the first time we need them, so no setup step
import { neon } from "@neondatabase/serverless";

let sql;
let ready;

// connects and creates the tables on first use
async function db() {
    //??= means "only set this if it's still empty", so later calls reuse the same connection
    sql ??= neon(process.env.DATABASE_URL);
    ready ??= sql
        .transaction([
            sql`CREATE TABLE IF NOT EXISTS scores (
        id    SERIAL PRIMARY KEY,
        name  TEXT NOT NULL,
        score INTEGER NOT NULL,
        at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
            sql`CREATE TABLE IF NOT EXISTS aliases (from_name TEXT PRIMARY KEY, to_name TEXT NOT NULL)`,
            sql`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, paused BOOLEAN NOT NULL)`,
            //settings only ever has one row (id 1). if it's already there this just does nothing
            sql`INSERT INTO settings VALUES (1, false) ON CONFLICT DO NOTHING`,
        ])
        .catch((error) => {
            ready = null; // retry on the next request
            throw error;
        });
    await ready;
    return sql;
}

//  postgres hands back Date objects, turn them into strings e.g.  "2026-11-14T15:04:05.000Z"
const withIsoTime = (m) => ({ ...m, at: new Date(m.at).toISOString() });

export async function getState() {
    const sql = await db();
    //both queries in one transaction so the scores and the paused flag match up
    const [scores, [settings], aliases] = await sql.transaction([
        sql`SELECT id, name, score, at FROM scores ORDER BY id`,
        sql`SELECT paused FROM settings`,
        sql`SELECT from_name, to_name FROM aliases ORDER BY to_name, from_name`,
    ]);

    // renames are cosmetic, scores keep their posted name in the database side, and
    // but server side they are merged in getState, so you can remove aliases after the fact
    const renamed = new Map(aliases.map((a) => [a.from_name, a.to_name]));
    const display = (m) => ({
        ...m,
        name: renamed.get(m.name.toLowerCase()) ?? m.name,
    });
    return {
        scores: scores.map(display).map(withIsoTime),
        paused: settings.paused,
        aliases,
    };
}

export async function isPaused() {
    const sql = await db();
    const [settings] = await sql`SELECT paused FROM settings`;
    return settings.paused;
}

export async function addScore(name, score) {
    const sql = await db();
    // the ${} values get sent separately from the query, so a team name can't run its own sql commands
    const [row] =
        await sql`INSERT INTO scores (name, score) VALUES (${name}, ${score}) RETURNING id, name, score, at`;
    return withIsoTime(row);
}

export async function editScore(id, name, score) {
    const sql = await db();
    await sql`UPDATE scores SET name = ${name}, score = ${score} WHERE id = ${id}`;
}

export async function deleteScore(id) {
    const sql = await db();
    await sql`DELETE FROM scores WHERE id = ${id}`;
}

export async function renameTeam(from, to) {
    const sql = await db();
    // only aliases change not actual scores
    // it follows transitive rule
    await sql.transaction([
        sql`UPDATE aliases SET to_name = ${to} WHERE lower(to_name) = lower(${from})`,
        sql`DELETE FROM aliases WHERE from_name = lower(${to})`,
        sql`INSERT INTO aliases VALUES (lower(${from}), ${to}) ON CONFLICT (from_name) DO UPDATE SET to_name = ${to}`,
    ]);
}

// undoes a rename
export async function deleteAlias(fromName) {
    const sql = await db();
    await sql`DELETE FROM aliases WHERE from_name = ${fromName}`;
}

// deletes every score shown under this name  and aliases
export async function deleteTeam(name) {
    const sql = await db();
    const { scores } = await getState();
    const ids = scores
        .filter((m) => m.name.toLowerCase() === name.toLowerCase())
        .map((m) => m.id);
    await sql.transaction([
        sql`DELETE FROM scores WHERE id = ANY(${ids})`,
        sql`DELETE FROM aliases WHERE lower(to_name) = lower(${name})`,
    ]);
}

export async function togglePause() {
    const sql = await db();
    await sql`UPDATE settings SET paused = NOT paused`;
}

// wipes everything. RESTART IDENTITY makes ids start back at 1
export async function reset() {
    const sql = await db();
    await sql.transaction([
        sql`TRUNCATE scores, aliases RESTART IDENTITY`,
        sql`UPDATE settings SET paused = false`,
    ]);
}
