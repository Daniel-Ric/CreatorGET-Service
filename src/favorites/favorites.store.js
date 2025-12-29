import {env} from "../config/env.js";
import {ensureDir, exists, readJson, writeText} from "../utils/fs.js";

function favoritesPath() {
    return `${env.CACHE_DIR.replace(/\/+$/, "")}/favorites.json`;
}

export async function loadFavorites() {
    const path = favoritesPath();
    if (!exists(path)) return new Set();
    try {
        const parsed = await readJson(path);
        const ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
        return new Set(ids.map((x) => String(x).trim()).filter(Boolean));
    } catch {
        return new Set();
    }
}

export async function saveFavorites(favs) {
    const path = favoritesPath();
    await ensureDir(env.CACHE_DIR);
    const ids = [...favs].map((x) => String(x).trim()).filter(Boolean);
    await writeText(path, JSON.stringify({ids}, null, 2) + "\n");
    return path;
}

export async function toggleFavorite(favs, id) {
    const v = String(id || "").trim();
    if (!v) return false;
    if (favs.has(v)) {
        favs.delete(v);
        await saveFavorites(favs);
        return false;
    }
    favs.add(v);
    await saveFavorites(favs);
    return true;
}

export function isFavorite(favs, id) {
    return favs.has(String(id || "").trim());
}
