import ora from "ora";
import {env} from "./config/env.js";
import {state} from "./state.js";
import {theme} from "./ui/theme.js";
import {
    browseCreators,
    browseFavorites,
    confirmFlow,
    diffMenu,
    fuzzySearchFlow,
    idsExportTypeMenu,
    mainMenu,
    promptOutputPath,
    promptToken,
    selectionFlow,
    showChangedMenu,
    showListMenu
} from "./ui/menu.js";
import {computeCreatorStats, diffCreators, fetchCreators, findCollisions} from "./services/marketplace.service.js";
import {getCreatorsCacheInfo, loadCreatorsCache, saveCreatorsCache} from "./cache/creators.cache.js";
import {loadFavorites} from "./favorites/favorites.store.js";
import {writeCreatorsJson} from "./export/json.export.js";
import {writeCreatorsCsv} from "./export/csv.export.js";
import {writeIdsJson, writeIdsTxt} from "./export/ids.export.js";

function nowIso() {
    return new Date().toISOString();
}

function header() {
    const parts = [];
    parts.push(theme.title("CreatorService"));
    if (state.creators.length) parts.push(theme.dim(`Loaded: ${state.creators.length}`));
    if (state.fetchedAt) parts.push(theme.dim(`Fetched: ${state.fetchedAt}`));
    parts.push(theme.dim(`Mode: ${env.CREATORNAME_MODE}`));
    return parts.join(theme.dim("  •  "));
}

function isCacheFresh(fetchedAt) {
    if (!fetchedAt) return false;
    const t = Date.parse(fetchedAt);
    if (!Number.isFinite(t)) return false;
    const age = Date.now() - t;
    return age >= 0 && age <= Number(env.CACHE_TTL_MS || 0);
}

async function loadCacheIfAny() {
    const cached = await loadCreatorsCache();
    if (cached?.creators?.length) {
        state.creators = cached.creators;
        state.fetchedAt = cached.fetchedAt;
    }
}

async function loadFavoritesIfAny() {
    state.favorites = await loadFavorites();
}

async function refreshFromApi() {
    state.token = await promptToken(state.token || env.MC_TOKEN);
    if (!state.token) throw new Error("Missing token");

    const spinner = ora({text: "Fetching creators…", color: "cyan"}).start();
    try {
        const creators = await fetchCreators(state.token);
        state.creators = creators;
        state.fetchedAt = nowIso();
        await saveCreatorsCache(creators, state.fetchedAt);
        spinner.succeed(`Fetched ${creators.length} creators`);
    } catch (e) {
        spinner.fail("Fetch failed");
        throw e;
    }
}

async function ensureDataFreshEnough() {
    if (!state.creators.length) return await refreshFromApi();
    if (Number(env.CACHE_TTL_MS) <= 0) return;
    if (isCacheFresh(state.fetchedAt)) return;

    const ok = await confirmFlow(`Cache is stale (${state.fetchedAt || "unknown"}). Refresh now?`);
    if (ok) await refreshFromApi();
}

async function diffAgainstApi() {
    state.token = await promptToken(state.token || env.MC_TOKEN);
    if (!state.token) throw new Error("Missing token");

    const spinner = ora({text: "Fetching for diff…", color: "cyan"}).start();
    try {
        const latest = await fetchCreators(state.token);
        spinner.succeed("Fetched latest creators");
        const diff = diffCreators(state.creators, latest);

        while (true) {
            const pick = await diffMenu(diff);
            if (!pick || pick === "back") break;

            if (pick === "added") await showListMenu("Added creators", diff.added, state.favorites);
            if (pick === "removed") await showListMenu("Removed creators", diff.removed, state.favorites);
            if (pick === "changed") await showChangedMenu("Changed creators", diff.changed, state.favorites);
        }

        const apply = await confirmFlow("Apply latest data and update cache?");
        if (apply) {
            state.creators = latest;
            state.fetchedAt = nowIso();
            await saveCreatorsCache(state.creators, state.fetchedAt);
            console.log(theme.ok("Cache updated."));
        }
    } catch (e) {
        spinner.fail("Diff failed");
        throw e;
    }
}

async function exportSelection() {
    const picked = await selectionFlow(state.creators, state.favorites);
    if (!picked.length) return;

    const format = await (await import("prompts")).default({
        type: "select",
        name: "pick",
        message: "Export selection as:",
        choices: [{title: "JSON", value: "json"}, {title: "CSV", value: "csv"}, {title: "Back", value: null}],
        initial: 0
    }).then((r) => r.pick);

    if (!format) return;

    if (format === "json") {
        const path = await promptOutputPath("creators.selection.json", "Output path:");
        await writeCreatorsJson(picked, path);
        console.log(theme.ok(`Wrote ${path}`));
    } else {
        const path = await promptOutputPath("creators.selection.csv", "Output path:");
        await writeCreatorsCsv(picked, path);
        console.log(theme.ok(`Wrote ${path}`));
    }
}

async function exportIds() {
    const t = await idsExportTypeMenu();
    if (!t) return;

    if (t === "txt") {
        const path = await promptOutputPath("ids.txt", "Output path:");
        await writeIdsTxt(state.creators, path);
        console.log(theme.ok(`Wrote ${path}`));
    } else {
        const path = await promptOutputPath("ids.json", "Output path:");
        await writeIdsJson(state.creators, path);
        console.log(theme.ok(`Wrote ${path}`));
    }
}

async function health() {
    if (!state.creators.length) {
        console.log(theme.warn("No creators loaded."));
        return;
    }

    const s = computeCreatorStats(state.creators);
    console.log(`${theme.accent("Total:")} ${s.total}`);
    console.log(`${theme.accent("Unique IDs:")} ${s.uniqueIds}`);
    console.log(`${theme.accent("Duplicate IDs:")} ${s.duplicateIds}`);
    console.log(`${theme.accent("creatorName collisions:")} ${s.creatorNameCollisions}`);
    console.log(`${theme.accent("Display names with spaces:")} ${s.withSpacesInDisplayName}`);
    console.log(`${theme.accent("Empty creatorName:")} ${s.emptyCreatorNames}`);

    const coll = findCollisions(state.creators);
    if (coll.length) {
        const show = await confirmFlow(`Show ${coll.length} creatorName collisions?`);
        if (show) {
            const lines = coll
                .slice(0, 60)
                .map((x) => `${theme.warn(x.creatorName)}  ${theme.dim(x.items.map((i) => i.displayName).join(" | "))}`);
            console.log(lines.join("\n"));
            if (coll.length > 60) console.log(theme.dim(`…and ${coll.length - 60} more`));
        }
    }
}

export async function run() {
    state.token = String(env.MC_TOKEN || "").trim();
    await loadFavoritesIfAny();
    await loadCacheIfAny();
    await ensureDataFreshEnough();

    while (true) {
        const action = await mainMenu(header());
        if (!action || action === "exit") break;

        try {
            if (action === "refresh") {
                await refreshFromApi();
            } else if (action === "diff") {
                await diffAgainstApi();
            } else if (action === "browse") {
                await browseCreators(state.creators, state.favorites);
            } else if (action === "browseFav") {
                await browseFavorites(state.creators, state.favorites);
            } else if (action === "search") {
                await fuzzySearchFlow(state.creators, state.favorites);
            } else if (action === "exportJson") {
                if (!state.creators.length) {
                    console.log(theme.warn("No creators loaded."));
                    continue;
                }
                const path = await promptOutputPath("creators.json", "Output path:");
                await writeCreatorsJson(state.creators, path);
                console.log(theme.ok(`Wrote ${path}`));
            } else if (action === "exportCsv") {
                if (!state.creators.length) {
                    console.log(theme.warn("No creators loaded."));
                    continue;
                }
                const path = await promptOutputPath("creators.csv", "Output path:");
                await writeCreatorsCsv(state.creators, path);
                console.log(theme.ok(`Wrote ${path}`));
            } else if (action === "exportSelection") {
                await exportSelection();
            } else if (action === "exportIds") {
                await exportIds();
            } else if (action === "health") {
                await health();
            } else if (action === "cacheInfo") {
                const info = await getCreatorsCacheInfo();
                if (!info) {
                    console.log(theme.warn("No cache file found."));
                    continue;
                }
                const kb = Math.round((info.sizeBytes / 1024) * 10) / 10;
                console.log(`${theme.accent("Cache file:")} ${info.path}`);
                console.log(`${theme.accent("Size:")} ${kb} KB`);
                if (state.fetchedAt) console.log(`${theme.accent("FetchedAt:")} ${state.fetchedAt}`);
            }
        } catch (e) {
            console.log(theme.err(e?.message || String(e)));
        }
    }
}
