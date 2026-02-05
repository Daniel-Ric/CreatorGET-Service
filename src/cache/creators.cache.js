import {env} from "../config/env.js";
import {ensureDir, exists, fileStat, readJson, writeText} from "../utils/fs.js";

function cachePath() {
    return `${env.CACHE_DIR.replace(/\/+$/, "")}/creators.cache.json`;
}

export async function loadCreatorsCache() {
    const path = cachePath();
    if (!exists(path)) return null;
    try {
        const parsed = await readJson(path);
        const creators = Array.isArray(parsed?.creators) ? parsed.creators : [];
        if (!creators.length) return null;
        const fetchedAt = String(parsed?.fetchedAt || "").trim();
        return {creators, fetchedAt: fetchedAt || null};
    } catch {
        return null;
    }
}

export async function saveCreatorsCache(creators, fetchedAt) {
    const path = cachePath();
    await ensureDir(env.CACHE_DIR);
    const payload = {fetchedAt: String(fetchedAt || "").trim(), creators};
    await writeText(path, JSON.stringify(payload, null, 2) + "\n");
    return path;
}

export async function getCreatorsCacheInfo() {
    const path = cachePath();
    if (!exists(path)) return null;
    const stats = await fileStat(path);
    return {path, sizeBytes: stats.size};
}
