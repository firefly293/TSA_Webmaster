"use server";
// these actions should only be done by admin, but they are reachable over http so we need to enforce
import { revalidatePath } from "next/cache";
import * as db from "@/lib/db";
import { parseScore } from "@/lib/validate";

// function makes sure the user is on the admin page so random people cant use them
export async function isAdmin(key) {
    return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

// run the change only for a valid admin, and refresh the page so that changes show up instantly
async function adminOnly(key, change) {
    if (!(await isAdmin(key))) throw new Error("Not authorized");
    await change();

    // refresh
    revalidatePath("/", "layout");
}

// add a score attempt
export async function addScore(key, form) {
    const { name, score, error } = parseScore(Object.fromEntries(form));
    await adminOnly(key, () => !error && db.addScore(name, score));
}

// edit a score attempt
export async function editScore(key, form) {
    const { name, score, error } = parseScore(Object.fromEntries(form));
    await adminOnly(
        key,
        () => !error && db.editScore(Number(form.get("id")), name, score),
    );
}

// delete a score attempt
export async function deleteScore(key, form) {
    await adminOnly(key, () => db.deleteScore(Number(form.get("id"))));
}

// rename team
// renaming existing team merges scores
export async function renameTeam(key, form) {
    const { name: to, error } = parseScore({ name: form.get("to"), score: 0 });
    await adminOnly(key, () => !error && db.renameTeam(form.get("from"), to));
}

// delete alias
export async function deleteAlias(key, form) {
    await adminOnly(key, () => db.deleteAlias(form.get("from")));
}

export async function deleteTeam(key, form) {
    // delete team
    await adminOnly(key, () => db.deleteTeam(form.get("name")));
}

// toggle pausing
export async function togglePause(key) {
    await adminOnly(key, db.togglePause);
}

//reset all of the scores
export async function resetAll(key) {
    await adminOnly(key, db.reset);
}
