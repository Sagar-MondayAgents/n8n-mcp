#!/usr/bin/env node
/**
 * Single-Session HTTP server for n8n-MCP
 * Implements Hybrid Single-Session Architecture for protocol compliance
 * while maintaining simplicity for single-player use case
 */
import express from 'express';
export declare class SingleSessionHTTPServer {
    private session;
    private consoleManager;
    private expressServer;
    private sessionTimeout;
    private authToken;
    constructor();
    /**
     * Load auth token from environment variable or file
     */
    private loadAuthToken;
    /**
     * Validate required environment variables
     */
    private validateEnvironment;
    /**
     * Handle incoming MCP request in a stateless, per-request manner as per the example.
     * A new server and transport instance are created for each request.
     */
    handlePerRequest(req: express.Request, res: express.Response): Promise<void>;
    /**
     * Handle incoming MCP request
     */
    handleRequest(req: express.Request, res: express.Response): Promise<void>;
    /**
     * Reset the session - clean up old and create new
     */
    private resetSession;
    /**
     * Check if current session is expired
     */
    private isExpired;
    /**
     * Start the HTTP server
     */
    start(): Promise<void>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Get current session info (for testing/debugging)
     */
    getSessionInfo(): {
        active: boolean;
        sessionId?: string;
        age?: number;
    };
}
//# sourceMappingURL=http-server-single-session.d.ts.map