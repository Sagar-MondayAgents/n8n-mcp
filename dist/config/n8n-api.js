"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getN8nApiConfig = getN8nApiConfig;
exports.isN8nApiConfigured = isN8nApiConfigured;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const n8nApiConfigSchema = zod_1.z.object({
    N8N_API_URL: zod_1.z.string().url().optional(),
    N8N_API_KEY: zod_1.z.string().min(1).optional(),
    N8N_API_TIMEOUT: zod_1.z.coerce.number().positive().default(30000),
    N8N_API_MAX_RETRIES: zod_1.z.coerce.number().positive().default(3),
});
let envLoaded = false;
function getN8nApiConfig() {
    if (!envLoaded) {
        dotenv_1.default.config();
        envLoaded = true;
    }
    const result = n8nApiConfigSchema.safeParse(process.env);
    if (!result.success) {
        return null;
    }
    const config = result.data;
    if (!config.N8N_API_URL || !config.N8N_API_KEY) {
        return null;
    }
    return {
        baseUrl: config.N8N_API_URL,
        apiKey: config.N8N_API_KEY,
        timeout: config.N8N_API_TIMEOUT,
        maxRetries: config.N8N_API_MAX_RETRIES,
    };
}
function isN8nApiConfigured() {
    const config = getN8nApiConfig();
    return config !== null;
}
//# sourceMappingURL=n8n-api.js.map