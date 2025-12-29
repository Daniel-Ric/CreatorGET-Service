import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";

export function exists(path) {
    return existsSync(path);
}

export async function ensureDir(path) {
    if (!existsSync(path)) await mkdir(path, {recursive: true});
}

export async function readJson(path) {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
}

export async function writeText(path, text) {
    await writeFile(path, text, "utf8");
}

export async function fileStat(path) {
    return await stat(path);
}
