import { Request, Response } from 'express';
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
}
export interface EngineOptions {
    sessionTimeout?: number;
    logLevel?: string;
}
export declare class N8NMCPEngine {
    private server;
    private startTime;
    constructor(options?: EngineOptions);
    processRequest(req: Request, res: Response): Promise<void>;
    healthCheck(): Promise<EngineHealth>;
    getSessionInfo(): {
        active: boolean;
        sessionId?: string;
        age?: number;
    };
    shutdown(): Promise<void>;
    start(): Promise<void>;
}
export default N8NMCPEngine;
//# sourceMappingURL=mcp-engine.d.ts.map