#!/usr/bin/env node
import express from 'express';
export declare class SingleSessionHTTPServer {
    private session;
    private consoleManager;
    private expressServer;
    private sessionTimeout;
    private authToken;
    constructor();
    private loadAuthToken;
    private validateEnvironment;
    handleRequest(req: express.Request, res: express.Response): Promise<void>;
    private resetSession;
    private isExpired;
    start(): Promise<void>;
    shutdown(): Promise<void>;
    getSessionInfo(): {
        active: boolean;
        sessionId?: string;
        age?: number;
    };
}
//# sourceMappingURL=http-server-single-session.d.ts.map