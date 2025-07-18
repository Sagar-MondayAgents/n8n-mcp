#!/usr/bin/env node
interface ServerConfig {
    port: number;
    corsOrigin?: string | string[];
    maxRequestSize?: string;
    enableMetrics?: boolean;
}
export declare class UnifiedHTTPServer {
    private app;
    private engine;
    private sseTransports;
    private config;
    private server?;
    constructor(config?: Partial<ServerConfig>);
    private setupMiddleware;
    private metricsMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    /**
     * Clean up stale SSE sessions
     */
    private cleanupStaleSessions;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=http-unified-server.d.ts.map