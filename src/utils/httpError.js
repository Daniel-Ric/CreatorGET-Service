export class HttpError extends Error {
    constructor(status, message, details, code) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        if (details) this.details = details;
        if (code) this.code = code;
    }
}

export function badRequest(msg, details) {
    return new HttpError(400, msg, details, "BAD_REQUEST");
}

export function internal(msg, details) {
    return new HttpError(500, msg, details, "INTERNAL");
}
