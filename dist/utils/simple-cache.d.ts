/**
 * Simple in-memory cache with TTL support
 * No external dependencies needed
 */
export declare class SimpleCache {
    private cache;
    constructor();
    get(key: string): any;
    set(key: string, data: any, ttlSeconds?: number): void;
    clear(): void;
}
//# sourceMappingURL=simple-cache.d.ts.map