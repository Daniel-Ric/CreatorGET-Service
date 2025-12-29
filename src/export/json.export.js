import {writeText} from "../utils/fs.js";

export async function writeCreatorsJson(creators, path) {
    await writeText(path, JSON.stringify(creators, null, 2) + "\n");
    return path;
}
