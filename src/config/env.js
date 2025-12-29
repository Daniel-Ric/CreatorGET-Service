import "dotenv/config";
import Joi from "joi";

const schema = Joi.object({
    NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
    LOG_PRETTY: Joi.when("NODE_ENV", {
        is: "production",
        then: Joi.boolean().truthy("true").falsy("false").default(false),
        otherwise: Joi.boolean().truthy("true").falsy("false").default(true)
    }),
    HTTP_TIMEOUT_MS: Joi.number().integer().min(1000).default(25000),
    CACHE_TTL_MS: Joi.number().integer().min(0).default(21600000),
    CACHE_DIR: Joi.string().default(".cache"),
    MC_TOKEN: Joi.string().allow("").default(""),
    PAGE_SIZE: Joi.number().integer().min(5).max(100).default(20),
    CREATORNAME_MODE: Joi.string().valid("nospace", "alnum").default("nospace")
}).unknown(true);

const {value, error} = schema.validate(process.env, {abortEarly: false});
if (error) {
    console.error("Invalid env:", error.message);
    process.exit(1);
}

export const env = value;
