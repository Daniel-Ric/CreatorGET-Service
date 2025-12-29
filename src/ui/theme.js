import chalk from "chalk";
import {env} from "../config/env.js";

export const theme = {
    title: (s) => chalk.bold.white(s),
    dim: (s) => chalk.gray(s),
    ok: (s) => chalk.green(s),
    warn: (s) => chalk.yellow(s),
    err: (s) => chalk.red(s),
    accent: (s) => chalk.cyan(s),
    pretty: !!env.LOG_PRETTY
};
