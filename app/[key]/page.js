import { notFound } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import { getState } from "@/lib/db";
import { standings } from "@/lib/standings";
import * as actions from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Panel", robots: "noindex" };

// the vercel deployment runs in UTC
// so we have to convert it to pst or pdt whatever it is
const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeStyle: "medium",
});

// accessible at /[ADMIN_KEY], a secret env variable set in deployment
export default async function AdminPanel({ params }) {
    const { key } = await params;
    if (!(await actions.isAdmin(key))) notFound();

    // helper lambda function
    // a binding so that you dont need to pass the key in every time, used in form elements. you can do like act("togglePause") and it returns a function with the key pre-filled in
    const act = (name) => actions[name].bind(null, key);
    // get the scores, pause state, and aliases
    const { scores, paused, aliases } = await getState();

    return (
        <main className="admin">
            <AutoRefresh />
            <h1>Admin Panel</h1>

            <section className="panel">
                <h2>Tournament</h2>
                <p>
                    Scoring is <b>{paused ? "paused" : "live"}</b> right now.
                    When it is paused, the API will be down and the leaderboard
                    shows a notice{" "}
                </p>
                <form action={act("togglePause")}>
                    <button>
                        {paused ? "Resume scoring" : "Pause scoring"}
                    </button>
                </form>
                <form action={act("resetAll")} className="row">
                    <label>
                        <input type="checkbox" required /> Confirm reset{" "}
                    </label>
                    <button className="danger">Reset everything</button>
                </form>
                <p>
                    Scores are posted to{" "}
                    <code>/api/{process.env.INGEST_KEY}</code>.
                </p>
                <p>
                    Download CSV:{" "}
                    <a href="/api/scores?csv=standings">standings</a> {" or  "}
                    <a href="/api/scores?csv=scores">every score</a>
                </p>
            </section>

            <section className="panel">
                <h2>Add a score manually</h2>
                <form action={act("addScore")} className="row">
                    <input
                        name="name"
                        placeholder="Team name"
                        required
                        maxLength={32}
                    />
                    <input
                        name="score"
                        type="number"
                        step="1"
                        placeholder="Score"
                        required
                    />
                    <button>Add</button>
                </form>
            </section>

            <section className="panel">
                <h2>
                    Teams (renaming a team to an existing name merges the teams)
                </h2>
                {standings(scores).map((p) => (
                    <form key={p.name} className="row">
                        <input type="hidden" name="from" value={p.name} />
                        <input type="hidden" name="name" value={p.name} />
                        <span className="grow">
                            <b>
                                {p.rank}. {p.name}
                            </b>{" "}
                            <span className="muted">
                                best {p.best}, {p.attempts}{" "}
                                {p.attempts === 1 ? "attempt" : "attempts"}
                            </span>
                        </span>
                        <input
                            name="to"
                            placeholder="New name"
                            maxLength={32}
                        />
                        <button formAction={act("renameTeam")}>Rename</button>
                        <button
                            formAction={act("deleteTeam")}
                            className="danger"
                        >
                            Delete team
                        </button>
                    </form>
                ))}
            </section>

            <section className="panel">
                <h2>Aliases (renames that are remembered)</h2>
                <p>
                    Renames just change how names are shown but scores in the
                    database are unaffected. You can remove aliases to undo
                    renames.
                </p>
                {aliases.map((a) => (
                    <form
                        key={a.from_name}
                        action={act("deleteAlias")}
                        className="row"
                    >
                        <input type="hidden" name="from" value={a.from_name} />
                        <span className="grow">
                            {a.from_name} → <b>{a.to_name}</b>
                        </span>
                        <button className="danger">Remove</button>
                    </form>
                ))}
            </section>

            <section className="panel">
                <h2>Scores (reverse chronological order, so newest first)</h2>
                {scores.toReversed().map((m) => (
                    <form key={m.id} className="row">
                        <input type="hidden" name="id" value={m.id} />
                        <span className="muted">#{m.id}</span>
                        <time className="muted">
                            {clock.format(new Date(m.at))}
                        </time>
                        <input
                            name="name"
                            defaultValue={m.name}
                            required
                            maxLength={32}
                        />
                        <input
                            name="score"
                            type="number"
                            step="1"
                            defaultValue={m.score}
                            required
                        />
                        <button formAction={act("editScore")}>Save</button>
                        <button
                            formAction={act("deleteScore")}
                            className="danger"
                        >
                            Delete
                        </button>
                    </form>
                ))}
            </section>
        </main>
    );
}
