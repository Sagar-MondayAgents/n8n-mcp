"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
class AuthManager {
    constructor() {
        this.validTokens = new Set();
        this.tokenExpiry = new Map();
    }
    validateToken(token, expectedToken) {
        if (!expectedToken) {
            return true;
        }
        if (!token) {
            return false;
        }
        if (token === expectedToken) {
            return true;
        }
        if (this.validTokens.has(token)) {
            const expiry = this.tokenExpiry.get(token);
            if (expiry && expiry > Date.now()) {
                return true;
            }
            else {
                this.validTokens.delete(token);
                this.tokenExpiry.delete(token);
                return false;
            }
        }
        return false;
    }
    generateToken(expiryHours = 24) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
        this.validTokens.add(token);
        this.tokenExpiry.set(token, expiryTime);
        this.cleanupExpiredTokens();
        return token;
    }
    revokeToken(token) {
        this.validTokens.delete(token);
        this.tokenExpiry.delete(token);
    }
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, expiry] of this.tokenExpiry.entries()) {
            if (expiry <= now) {
                this.validTokens.delete(token);
                this.tokenExpiry.delete(token);
            }
        }
    }
    static hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    static compareTokens(plainToken, hashedToken) {
        const hashedPlainToken = AuthManager.hashToken(plainToken);
        return crypto_1.default.timingSafeEqual(Buffer.from(hashedPlainToken), Buffer.from(hashedToken));
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=auth.js.map