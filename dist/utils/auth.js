"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
class AuthManager {
    validTokens;
    tokenExpiry;
    constructor() {
        this.validTokens = new Set();
        this.tokenExpiry = new Map();
    }
    /**
     * Validate an authentication token
     */
    validateToken(token, expectedToken) {
        if (!expectedToken) {
            // No authentication required
            return true;
        }
        if (!token) {
            return false;
        }
        // Check static token
        if (token === expectedToken) {
            return true;
        }
        // Check dynamic tokens
        if (this.validTokens.has(token)) {
            const expiry = this.tokenExpiry.get(token);
            if (expiry && expiry > Date.now()) {
                return true;
            }
            else {
                // Token expired
                this.validTokens.delete(token);
                this.tokenExpiry.delete(token);
                return false;
            }
        }
        return false;
    }
    /**
     * Generate a new authentication token
     */
    generateToken(expiryHours = 24) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
        this.validTokens.add(token);
        this.tokenExpiry.set(token, expiryTime);
        // Clean up expired tokens
        this.cleanupExpiredTokens();
        return token;
    }
    /**
     * Revoke a token
     */
    revokeToken(token) {
        this.validTokens.delete(token);
        this.tokenExpiry.delete(token);
    }
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, expiry] of this.tokenExpiry.entries()) {
            if (expiry <= now) {
                this.validTokens.delete(token);
                this.tokenExpiry.delete(token);
            }
        }
    }
    /**
     * Hash a password or token for secure storage
     */
    static hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    /**
     * Compare a plain token with a hashed token
     */
    static compareTokens(plainToken, hashedToken) {
        const hashedPlainToken = AuthManager.hashToken(plainToken);
        return crypto_1.default.timingSafeEqual(Buffer.from(hashedPlainToken), Buffer.from(hashedToken));
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=auth.js.map