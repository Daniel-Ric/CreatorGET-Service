#!/usr/bin/env node
import "dotenv/config";
import {run} from "../src/app.js";

try {
    await run();
} catch (e) {
    console.error(e?.message || String(e));
    process.exitCode = 1;
}
