/**
 * N8N MCP Engine - Clean interface for service integration
 * Now with Streamable HTTP support
 */
import { Request, Response } from 'express';
import { TransportType, EngineConfig } from './types/transport.types';
export interface EngineHealth {
    status: 'healthy' | 'unhealthy';
    uptime: number;
    sessionActive: boolean;
    memoryUsage: {
        used: number;
        total: number;
        unit: string;
    };
    version: string;
    transportSupport: TransportType[];
}
export interface EngineOptions extends EngineConfig {
    transportType?: TransportType;
}
export declare class N8NMCPEngine {
    private server;
    private startTime;
    private transportType;
    private streamableHTTPServer?;
    constructor(options?: EngineOptions);
    /**
     * Process a single MCP request (legacy HTTP mode)
     */
    processRequest(req: Request, res: Response): Promise<void>;
    /**
     * Process a Streamable HTTP request
     * This is the new recommended transport method
     *
     * @example
     * app.post('/mcp', async (req, res) => {
     *   await engine.processStreamableHTTP(req, res);
     * });
     */
    processStreamableHTTP2(req: Request, res: Response): Promise<void>;
    processStreamableHTTP(req: Request, res: Response): Promise<void>;
    /**
     * Get transport capabilities
     */
    getTransportCapabilities(): TransportType[];
    /**
     * Health check for service monitoring
     */
    healthCheck(): Promise<EngineHealth>;
    /**
     * Get current session information
     */
    getSessionInfo(): {
        active: boolean;
        sessionId?: string;
        age?: number;
    };
    /**
     * Graceful shutdown for service lifecycle
     */
    shutdown(): Promise<void>;
    /**
     * Start the engine (if using standalone mode)
     */
    start(): Promise<void>;
}
export default N8NMCPEngine;
//# sourceMappingURL=mcp-engine.d.ts.map