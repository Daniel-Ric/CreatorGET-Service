import {writeText} from "../utils/fs.js";

export async function writeIdsTxt(creators, path) {
    const txt = creators.map((c) => c.id).join("\n") + "\n";
    await writeText(path, txt);
    return path;
}

export async function writeIdsJson(creators, path) {
    const ids = creators.map((c) => c.id);
    await writeText(path, JSON.stringify(ids, null, 2) + "\n");
    return path;
}
