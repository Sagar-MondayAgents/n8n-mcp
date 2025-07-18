export type TransportType = 'stdio' | 'http' | 'sse' | 'streamable-http';
export interface TransportSession {
    id: string;
    transport: any;
    server: any;
    createdAt: Date;
    lastActivity: Date;
}
export interface EngineConfig {
    sessionTimeout?: number;
    logLevel?: string;
    maxConcurrentSessions?: number;
    enableMetrics?: boolean;
}
export interface HTTPTransportOptions {
    sessionIdGenerator?: () => string;
    timeout?: number;
    maxRequestSize?: string;
}
export interface SSETransportSession extends TransportSession {
    transport: any;
    messageEndpoint: string;
}
//# sourceMappingURL=transport.types.d.ts.map