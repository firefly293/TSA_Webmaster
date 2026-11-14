export const MAX_NAME_LENGTH = 32;
export const MAX_SCORE = 2_147_483_647;  //biggest number a postgres INTEGER can hold

// takes whatever got sent in and gives back { name, score } or { error }
// score can be a number or a string like "250", but it has to be a whole number
export function parseScore(input) {
     //?. stops it from crashing if nothing was sent (if input is null or undefined)
    const name = typeof input?.name === "string" ? input.name.trim() : "";
    const raw = input?.score;
    // e.g. turns "250" (text) into 250 (a number). empty strings stay as-is so they fail the check below
    const score =
        typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;

    if (!name) return { error: "`name` must be a non-empty string" };
    if (name.length > MAX_NAME_LENGTH)
        return {
            error: `\`name\` must be at most ${MAX_NAME_LENGTH} characters`,
        };
    if (!Number.isInteger(score) || Math.abs(score) > MAX_SCORE) {
        return {
            error: `\`score\` must be an integer between -${MAX_SCORE} and ${MAX_SCORE}`,
        };
    }
    return { name, score };
}
