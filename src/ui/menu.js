import promptsLib from "prompts";
import clipboardy from "clipboardy";
import Fuse from "fuse.js";
import {env} from "../config/env.js";
import {theme} from "./theme.js";
import {isFavorite, toggleFavorite} from "../favorites/favorites.store.js";

function refreshScreen() {
    if (!process.stdout.isTTY) return;
    process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
}

async function prompts(question) {
    refreshScreen();
    return await promptsLib(question);
}

function choice(title, value, hint) {
    return {title, value, description: hint || undefined};
}

export async function promptToken(currentToken) {
    const tok = String(currentToken || "").trim();
    if (tok) return tok;

    const r = await prompts({
        type: "password",
        name: "token",
        message: "Enter MC token:",
        validate: (v) => (String(v || "").trim().length < 10 ? "Token looks too short" : true)
    });

    return String(r.token || "").trim();
}

export async function mainMenu(headerText) {
    const r = await prompts({
        type: "select",
        name: "action",
        message: headerText,
        choices: [choice("Refresh from API", "refresh", "Fetch latest creators and update cache"), choice("Diff vs API", "diff", "Show changes vs current cache"), choice("Browse creators", "browse", "Paged list, details, copy, favorites"), choice("Browse favorites", "browseFav", "Only your starred creators"), choice("Search (fuzzy)", "search", "Better search across name/id"), choice("Export creators.json", "exportJson", "Write required JSON format"), choice("Export creators.csv", "exportCsv", "Write CSV file"), choice("Export selection", "exportSelection", "Pick creators and export JSON/CSV"), choice("Export IDs", "exportIds", "Write ids.txt or ids.json"), choice("Health / diagnostics", "health", "Duplicates, collisions, formatting"), choice("Cache info", "cacheInfo", "Show cache file details"), choice("Exit", "exit")],
        initial: 2
    });
    return r.action;
}

export async function promptOutputPath(initialValue, label) {
    const r = await prompts({
        type: "text", name: "path", message: label, initial: initialValue
    });
    return String(r.path || initialValue).trim() || initialValue;
}

function markTitle(c, favs) {
    const star = isFavorite(favs, c.id) ? theme.accent("* ") : theme.dim("  ");
    return `${star}${c.displayName}`;
}

export async function browseCreators(creators, favs) {
    if (!creators.length) return null;

    let page = 0;
    while (true) {
        const start = page * env.PAGE_SIZE;
        const end = Math.min(start + env.PAGE_SIZE, creators.length);
        const slice = creators.slice(start, end);

        const choices = slice.map((c, idx) => choice(markTitle(c, favs), {type: "creator", index: start + idx}, c.id));

        choices.push(choice(theme.dim("---"), "sep"));
        if (page > 0) choices.push(choice("Previous page", {type: "prev"}));
        if (end < creators.length) choices.push(choice("Next page", {type: "next"}));
        choices.push(choice("Back", {type: "back"}));

        const r = await prompts({
            type: "select",
            name: "pick",
            message: `Browse creators (${start + 1}-${end} of ${creators.length})`,
            choices,
            initial: 0
        });

        const pick = r.pick;
        if (!pick || pick === "back") return null;
        if (pick === "sep") continue;

        if (pick.type === "prev") {
            page = Math.max(0, page - 1);
            continue;
        }
        if (pick.type === "next") {
            page = Math.min(Math.floor((creators.length - 1) / env.PAGE_SIZE), page + 1);
            continue;
        }
        if (pick.type === "creator") {
            await creatorDetails(creators[pick.index], favs);
        }
    }
}

export async function browseFavorites(creators, favs) {
    const favList = creators.filter((c) => isFavorite(favs, c.id));
    if (!favList.length) {
        console.log(theme.warn("No favorites yet."));
        return null;
    }
    return await browseCreators(favList, favs);
}

export async function creatorDetails(c, favs) {
    let notice = "";

    while (true) {
        const title = `${theme.title(c.displayName)} ${theme.dim(`(${c.creatorName})`)}`;
        const favLabel = isFavorite(favs, c.id) ? "Unfavorite" : "Favorite";
        const message = [title, theme.dim(c.id), notice].filter(Boolean).join("\n");

        const r = await prompts({
            type: "select",
            name: "action",
            message,
            choices: [choice(favLabel, "fav"), choice("Copy ID to clipboard", "copyId"), choice("Copy displayName to clipboard", "copyDisplay"), choice("Copy creatorName to clipboard", "copyCreator"), choice("Copy JSON snippet", "copyJson"), choice("Back", "back")],
            initial: 0
        });

        if (!r.action || r.action === "back") return;

        if (r.action === "fav") {
            const on = await toggleFavorite(favs, c.id);
            notice = on ? theme.ok("Added to favorites.") : theme.ok("Removed from favorites.");
        } else if (r.action === "copyId") {
            await clipboardy.write(c.id);
            notice = theme.ok("Copied ID to clipboard.");
        } else if (r.action === "copyDisplay") {
            await clipboardy.write(c.displayName);
            notice = theme.ok("Copied displayName to clipboard.");
        } else if (r.action === "copyCreator") {
            await clipboardy.write(c.creatorName);
            notice = theme.ok("Copied creatorName to clipboard.");
        } else if (r.action === "copyJson") {
            await clipboardy.write(JSON.stringify(c, null, 2));
            notice = theme.ok("Copied JSON snippet to clipboard.");
        }
    }
}

export async function fuzzySearchFlow(creators, favs) {
    if (!creators.length) return null;

    const q = await prompts({
        type: "text",
        name: "q",
        message: "Search query:",
        validate: (v) => (String(v || "").trim().length ? true : "Enter something")
    });

    const term = String(q.q || "").trim();
    if (!term) return null;

    const fuse = new Fuse(creators, {
        includeScore: true, threshold: 0.35, keys: ["displayName", "creatorName", "id"]
    });

    const results = fuse.search(term).slice(0, 200).map((r) => r.item);

    if (!results.length) {
        console.log(theme.warn("No matches."));
        return null;
    }

    while (true) {
        const r = await prompts({
            type: "select",
            name: "pick",
            message: `Matches (${results.length}${results.length === 200 ? "+" : ""})`,
            choices: results.map((c) => choice(markTitle(c, favs), c, c.id)).concat([choice("Back", null)]),
            initial: 0
        });

        if (!r.pick) return null;
        await creatorDetails(r.pick, favs);
    }
}

export async function selectionFlow(creators, favs) {
    if (!creators.length) return [];

    const q = await prompts({
        type: "text", name: "q", message: "Optional filter before selecting (blank = show all):"
    });

    const term = String(q.q || "").trim();
    let list = creators;

    if (term) {
        const fuse = new Fuse(creators, {threshold: 0.35, keys: ["displayName", "creatorName", "id"]});
        list = fuse.search(term).slice(0, 400).map((r) => r.item);
    }

    if (!list.length) {
        console.log(theme.warn("No items to select."));
        return [];
    }

    const r = await prompts({
        type: "multiselect",
        name: "picked",
        message: `Select creators (${list.length} shown)`,
        choices: list.map((c) => ({
            title: markTitle(c, favs), value: c.id, description: c.id
        })),
        min: 1,
        hint: "- Space to toggle, Enter to confirm"
    });

    const ids = Array.isArray(r.picked) ? r.picked : [];
    const set = new Set(ids.map((x) => String(x).trim()).filter(Boolean));
    return creators.filter((c) => set.has(c.id));
}

export async function confirmFlow(message) {
    const r = await prompts({
        type: "select",
        name: "pick",
        message,
        choices: [{title: "Yes", value: true}, {title: "No", value: false}],
        initial: 1
    });
    return !!r.pick;
}

export async function diffMenu(diff) {
    const lines = [`${theme.accent("Added:")} ${diff.added.length}`, `${theme.accent("Removed:")} ${diff.removed.length}`, `${theme.accent("Changed:")} ${diff.changed.length}`].join("\n");

    const r = await prompts({
        type: "select",
        name: "pick",
        message: `Diff vs API\n${lines}`,
        choices: [choice("Show added", "added"), choice("Show removed", "removed"), choice("Show changed", "changed"), choice("Back", "back")],
        initial: 0
    });

    return r.pick;
}

export async function showListMenu(title, items, favs) {
    if (!items.length) {
        console.log(theme.warn("Nothing to show."));
        return null;
    }

    while (true) {
        const r = await prompts({
            type: "select",
            name: "pick",
            message: title,
            choices: items.slice(0, 300).map((c) => choice(markTitle(c, favs), c, c.id)).concat([choice("Back", null)]),
            initial: 0
        });

        if (!r.pick) return null;
        await creatorDetails(r.pick, favs);
    }
}

export async function showChangedMenu(title, items, favs) {
    if (!items.length) {
        console.log(theme.warn("Nothing to show."));
        return null;
    }

    const choices = items.slice(0, 300).map((x) => choice(`${x.to.displayName}`, x, `${x.from.displayName} -> ${x.to.displayName}`));

    while (true) {
        const r = await prompts({
            type: "select", name: "pick", message: title, choices: choices.concat([choice("Back", null)]), initial: 0
        });

        if (!r.pick) return null;
        await creatorDetails(r.pick.to, favs);
    }
}

export async function idsExportTypeMenu() {
    const r = await prompts({
        type: "select",
        name: "pick",
        message: "Export IDs as:",
        choices: [choice("ids.txt", "txt"), choice("ids.json", "json"), choice("Back", null)],
        initial: 0
    });
    return r.pick;
}

export async function exportFormatMenu() {
    const r = await prompts({
        type: "select",
        name: "pick",
        message: "Export selection as:",
        choices: [choice("JSON", "json"), choice("CSV", "csv"), choice("Back", null)],
        initial: 0
    });
    return r.pick;
}
