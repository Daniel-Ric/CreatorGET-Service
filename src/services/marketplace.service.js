import {env} from "../config/env.js";
import {createHttp} from "../utils/http.js";
import {badRequest, internal} from "../utils/httpError.js";

const http = createHttp(env.HTTP_TIMEOUT_MS);
const STORE_CONFIG_URL = "https://store.mktpl.minecraft-services.net/api/v1.0/session/config";

export function normalizeCreatorName(displayName, mode = env.CREATORNAME_MODE) {
    const s = String(displayName || "").trim();
    if (!s) return "";
    if (mode === "alnum") return s.replace(/[^0-9A-Za-z_-]+/g, "");
    return s.replace(/\s+/g, "");
}

export function extractCreatorsArray(data) {
    const filters = data?.result?.storeFilters || [];
    const creatorFilter = filters.find((f) => String(f?.filterType || "").toLowerCase() === "creator");
    const toggles = Array.isArray(creatorFilter?.toggles) ? creatorFilter.toggles : [];
    return toggles
        .map((t) => {
            const displayName = String(t?.filterName || "").trim();
            const id = String(t?.filterId || "").trim();
            if (!displayName || !id) return null;
            return {creatorName: normalizeCreatorName(displayName), id, displayName};
        })
        .filter(Boolean)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function fetchCreators(mcToken) {
    if (!mcToken) throw badRequest("MC token is required");
    try {
        const {data} = await http.get(STORE_CONFIG_URL, {
            headers: {authorization: mcToken, Accept: "application/json"}
        });
        return extractCreatorsArray(data);
    } catch (err) {
        throw internal("Failed to fetch creators", err.response?.data || err.message);
    }
}

export function computeCreatorStats(creators) {
    const ids = new Map();
    const creatorNames = new Map();
    let withSpaces = 0;
    let emptyNames = 0;

    for (const c of creators) {
        ids.set(c.id, (ids.get(c.id) || 0) + 1);
        creatorNames.set(c.creatorName, (creatorNames.get(c.creatorName) || 0) + 1);
        if (/\s/.test(c.displayName)) withSpaces++;
        if (!String(c.creatorName || "").trim()) emptyNames++;
    }

    const duplicateIds = [...ids.values()].filter((n) => n > 1).length;
    const collisions = [...creatorNames.values()].filter((n) => n > 1).length;

    return {
        total: creators.length,
        uniqueIds: ids.size,
        duplicateIds,
        creatorNameCollisions: collisions,
        withSpacesInDisplayName: withSpaces,
        emptyCreatorNames: emptyNames
    };
}

export function findCollisions(creators) {
    const map = new Map();
    for (const c of creators) {
        const k = String(c.creatorName || "").trim();
        if (!k) continue;
        const arr = map.get(k) || [];
        arr.push(c);
        map.set(k, arr);
    }
    return [...map.entries()]
        .filter(([, arr]) => arr.length > 1)
        .map(([creatorName, arr]) => ({
            creatorName, items: arr.map((x) => ({id: x.id, displayName: x.displayName}))
        }))
        .sort((a, b) => a.creatorName.localeCompare(b.creatorName));
}

export function diffCreators(oldList, newList) {
    const oldById = new Map(oldList.map((c) => [c.id, c]));
    const newById = new Map(newList.map((c) => [c.id, c]));

    const added = [];
    const removed = [];
    const changed = [];

    for (const [id, c] of newById) {
        if (!oldById.has(id)) added.push(c); else {
            const o = oldById.get(id);
            if (o.displayName !== c.displayName || o.creatorName !== c.creatorName) {
                changed.push({id, from: o, to: c});
            }
        }
    }

    for (const [id, c] of oldById) {
        if (!newById.has(id)) removed.push(c);
    }

    added.sort((a, b) => a.displayName.localeCompare(b.displayName));
    removed.sort((a, b) => a.displayName.localeCompare(b.displayName));
    changed.sort((a, b) => a.to.displayName.localeCompare(b.to.displayName));

    return {added, removed, changed};
}
