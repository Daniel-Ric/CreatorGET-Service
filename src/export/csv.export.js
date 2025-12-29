import {writeText} from "../utils/fs.js";

function esc(s) {
    return `"${String(s ?? "").replace(/"/g, '""')}"`;
}

export function toCreatorsCsv(creators) {
    const lines = ["creatorName,id,displayName"];
    for (const c of creators) lines.push([esc(c.creatorName), esc(c.id), esc(c.displayName)].join(","));
    return lines.join("\n") + "\n";
}

export async function writeCreatorsCsv(creators, path) {
    await writeText(path, toCreatorsCsv(creators));
    return path;
}
