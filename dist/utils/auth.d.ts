export declare class AuthManager {
    private validTokens;
    private tokenExpiry;
    constructor();
    /**
     * Validate an authentication token
     */
    validateToken(token: string | undefined, expectedToken?: string): boolean;
    /**
     * Generate a new authentication token
     */
    generateToken(expiryHours?: number): string;
    /**
     * Revoke a token
     */
    revokeToken(token: string): void;
    /**
     * Clean up expired tokens
     */
    private cleanupExpiredTokens;
    /**
     * Hash a password or token for secure storage
     */
    static hashToken(token: string): string;
    /**
     * Compare a plain token with a hashed token
     */
    static compareTokens(plainToken: string, hashedToken: string): boolean;
}
//# sourceMappingURL=auth.d.ts.map