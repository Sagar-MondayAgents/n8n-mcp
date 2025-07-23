"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8NMCPEngine = void 0;
const http_server_single_session_1 = require("./http-server-single-session");
const logger_1 = require("./utils/logger");
const server_1 = require("./mcp/server");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
class N8NMCPEngine {
    server;
    startTime;
    transportType;
    streamableHTTPServer;
    constructor(options = {}) {
        this.server = new http_server_single_session_1.SingleSessionHTTPServer();
        this.startTime = new Date();
        this.transportType = options.transportType || 'http';
        if (options.logLevel) {
            process.env.LOG_LEVEL = options.logLevel;
        }
    }
    /**
     * Process a single MCP request (legacy HTTP mode)
     */
    async processRequest(req, res) {
        try {
            await this.server.handleRequest(req, res);
        }
        catch (error) {
            logger_1.logger.error('Engine processRequest error:', error);
            throw error;
        }
    }
    /**
     * Process a Streamable HTTP request
     * This is the new recommended transport method
     *
     * @example
     * app.post('/mcp', async (req, res) => {
     *   await engine.processStreamableHTTP(req, res);
     * });
     */
    async processStreamableHTTP2(req, res) {
        try {
            // Create a new server instance for each request to ensure isolation
            const server = new server_1.N8NDocumentationMCPServer();
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: undefined, // Use default session ID generation
            });
            await server.connect(transport);
            await transport.handleRequest(req, res);
            logger_1.logger.debug('Streamable HTTP request processed successfully');
        }
        catch (error) {
            logger_1.logger.error('Engine processStreamableHTTP error:', error);
            // Ensure proper error response
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
            throw error;
        }
    }
    // In processStreamableHTTP method in mcp-engine.ts
    async processStreamableHTTP(req, res) {
        try {
            logger_1.logger.debug('processStreamableHTTP called', {
                method: req.method,
                url: req.url,
                headers: req.headers,
                readable: req.readable,
                readableEnded: req.readableEnded
            });
            // Check if stream is still readable
            if (!req.readable) {
                throw new Error('Request stream is not readable - body may have been consumed by middleware');
            }
            const server = new server_1.N8NDocumentationMCPServer();
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            await server.connect(transport);
            await transport.handleRequest(req, res);
        }
        catch (error) {
            logger_1.logger.error('processStreamableHTTP error:', error);
            throw error;
        }
    }
    /**
     * Get transport capabilities
     */
    getTransportCapabilities() {
        return ['stdio', 'http', 'sse', 'streamable-http'];
    }
    /**
     * Health check for service monitoring
     */
    async healthCheck() {
        try {
            const sessionInfo = this.server.getSessionInfo();
            const memoryUsage = process.memoryUsage();
            return {
                status: 'healthy',
                uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
                sessionActive: sessionInfo.active,
                memoryUsage: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    unit: 'MB'
                },
                version: '2.3.2',
                transportSupport: this.getTransportCapabilities()
            };
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            return {
                status: 'unhealthy',
                uptime: 0,
                sessionActive: false,
                memoryUsage: { used: 0, total: 0, unit: 'MB' },
                version: '2.3.2',
                transportSupport: []
            };
        }
    }
    /**
     * Get current session information
     */
    getSessionInfo() {
        return this.server.getSessionInfo();
    }
    /**
     * Graceful shutdown for service lifecycle
     */
    async shutdown() {
        logger_1.logger.info('Shutting down N8N MCP Engine...');
        await this.server.shutdown();
    }
    /**
     * Start the engine (if using standalone mode)
     */
    async start() {
        await this.server.start();
    }
}
exports.N8NMCPEngine = N8NMCPEngine;
exports.default = N8NMCPEngine;
//# sourceMappingURL=mcp-engine.js.map