export declare class AuthManager {
    private validTokens;
    private tokenExpiry;
    constructor();
    validateToken(token: string | undefined, expectedToken?: string): boolean;
    generateToken(expiryHours?: number): string;
    revokeToken(token: string): void;
    private cleanupExpiredTokens;
    static hashToken(token: string): string;
    static compareTokens(plainToken: string, hashedToken: string): boolean;
}
//# sourceMappingURL=auth.d.ts.map