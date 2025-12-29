import axios from "axios";
import http from "node:http";
import https from "node:https";

const httpAgent = new http.Agent({keepAlive: true, maxSockets: 100});
const httpsAgent = new https.Agent({keepAlive: true, maxSockets: 100});

export function createHttp(timeoutMs = 25000) {
    return axios.create({
        timeout: Number(timeoutMs) || 25000,
        httpAgent,
        httpsAgent,
        validateStatus: (s) => s >= 200 && s < 300,
        maxRedirects: 5
    });
}
