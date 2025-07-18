#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleSessionHTTPServer = void 0;
/**
 * Single-Session HTTP server for n8n-MCP
 * Implements Hybrid Single-Session Architecture for protocol compliance
 * while maintaining simplicity for single-player use case
 */
const express_1 = __importDefault(require("express"));
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const server_1 = require("./mcp/server");
const console_manager_1 = require("./utils/console-manager");
const logger_1 = require("./utils/logger");
const fs_1 = require("fs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class SingleSessionHTTPServer {
    session = null;
    consoleManager = new console_manager_1.ConsoleManager();
    expressServer;
    sessionTimeout = 30 * 60 * 1000; // 30 minutes
    authToken = null;
    constructor() {
        // Validate environment on construction
        this.validateEnvironment();
    }
    /**
     * Load auth token from environment variable or file
     */
    loadAuthToken() {
        // First, try AUTH_TOKEN environment variable
        if (process.env.AUTH_TOKEN) {
            logger_1.logger.info('Using AUTH_TOKEN from environment variable');
            return process.env.AUTH_TOKEN;
        }
        // Then, try AUTH_TOKEN_FILE
        if (process.env.AUTH_TOKEN_FILE) {
            try {
                const token = (0, fs_1.readFileSync)(process.env.AUTH_TOKEN_FILE, 'utf-8').trim();
                logger_1.logger.info(`Loaded AUTH_TOKEN from file: ${process.env.AUTH_TOKEN_FILE}`);
                return token;
            }
            catch (error) {
                logger_1.logger.error(`Failed to read AUTH_TOKEN_FILE: ${process.env.AUTH_TOKEN_FILE}`, error);
                console.error(`ERROR: Failed to read AUTH_TOKEN_FILE: ${process.env.AUTH_TOKEN_FILE}`);
                console.error(error instanceof Error ? error.message : 'Unknown error');
                return null;
            }
        }
        return null;
    }
    /**
     * Validate required environment variables
     */
    validateEnvironment() {
        // Load auth token from env var or file
        this.authToken = this.loadAuthToken();
        if (!this.authToken || this.authToken.trim() === '') {
            const message = 'No authentication token found or token is empty. Set AUTH_TOKEN environment variable or AUTH_TOKEN_FILE pointing to a file containing the token.';
            logger_1.logger.error(message);
            throw new Error(message);
        }
        // Update authToken to trimmed version
        this.authToken = this.authToken.trim();
        if (this.authToken.length < 32) {
            logger_1.logger.warn('AUTH_TOKEN should be at least 32 characters for security');
        }
    }
    /**
     * Handle incoming MCP request in a stateless, per-request manner as per the example.
     * A new server and transport instance are created for each request.
     */
    async handlePerRequest(req, res) {
        try {
            logger_1.logger.info('Handling stateless request: creating new server instance...');
            // Create a new server instance and transport for each request
            const server = new server_1.N8NDocumentationMCPServer();
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                // Let the transport generate a unique session ID for each request
                sessionIdGenerator: undefined,
            });
            // Connect the server to the transport and process the request
            await server.connect(transport);
            await transport.handleRequest(req, res);
            logger_1.logger.info('Stateless request handled successfully.');
        }
        catch (error) {
            logger_1.logger.error('Stateless MCP request error:', error);
            if (!res.headersSent) {
                // Sending a simple error response as specified in the snippet
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    /**
     * Handle incoming MCP request
     */
    async handleRequest(req, res) {
        const startTime = Date.now();
        // Wrap all operations to prevent console interference
        return this.consoleManager.wrapOperation(async () => {
            try {
                // Ensure we have a valid session
                if (!this.session || this.isExpired()) {
                    await this.resetSession();
                }
                // Update last access time
                this.session.lastAccess = new Date();
                // Handle request with existing transport
                logger_1.logger.debug('Calling transport.handleRequest...');
                await this.session.transport.handleRequest(req, res);
                logger_1.logger.debug('transport.handleRequest completed');
                // Log request duration
                const duration = Date.now() - startTime;
                logger_1.logger.info('MCP request completed', {
                    duration,
                    sessionId: this.session.sessionId
                });
            }
            catch (error) {
                logger_1.logger.error('MCP request error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error',
                            data: process.env.NODE_ENV === 'development'
                                ? error.message
                                : undefined
                        },
                        id: null
                    });
                }
            }
        });
    }
    /**
     * Reset the session - clean up old and create new
     */
    async resetSession() {
        // Clean up old session if exists
        if (this.session) {
            try {
                logger_1.logger.info('Closing previous session', { sessionId: this.session.sessionId });
                await this.session.transport.close();
                // Note: Don't close the server as it handles its own lifecycle
            }
            catch (error) {
                logger_1.logger.warn('Error closing previous session:', error);
            }
        }
        try {
            // Create new session
            logger_1.logger.info('Creating new N8NDocumentationMCPServer...');
            const server = new server_1.N8NDocumentationMCPServer();
            logger_1.logger.info('Creating StreamableHTTPServerTransport...');
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => 'single-session', // Always same ID for single-session
            });
            logger_1.logger.info('Connecting server to transport...');
            await server.connect(transport);
            this.session = {
                server,
                transport,
                lastAccess: new Date(),
                sessionId: 'single-session'
            };
            logger_1.logger.info('Created new single session successfully', { sessionId: this.session.sessionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to create session:', error);
            throw error;
        }
    }
    /**
     * Check if current session is expired
     */
    isExpired() {
        if (!this.session)
            return true;
        return Date.now() - this.session.lastAccess.getTime() > this.sessionTimeout;
    }
    /**
     * Start the HTTP server
     */
    async start() {
        const app = (0, express_1.default)();
        // Configure trust proxy for correct IP logging behind reverse proxies
        const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 0;
        if (trustProxy > 0) {
            app.set('trust proxy', trustProxy);
            logger_1.logger.info(`Trust proxy enabled with ${trustProxy} hop(s)`);
        }
        // DON'T use any body parser globally - StreamableHTTPServerTransport needs raw stream
        // Only use JSON parser for specific endpoints that need it
        // Security headers
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            next();
        });
        // CORS configuration
        app.use((req, res, next) => {
            const allowedOrigin = process.env.CORS_ORIGIN || '*';
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
            res.setHeader('Access-Control-Max-Age', '86400');
            if (req.method === 'OPTIONS') {
                res.sendStatus(204);
                return;
            }
            next();
        });
        // Request logging middleware
        app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                contentLength: req.get('content-length')
            });
            next();
        });
        // Health check endpoint (no body parsing needed for GET)
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                mode: 'single-session',
                version: '2.3.2',
                uptime: Math.floor(process.uptime()),
                sessionActive: !!this.session,
                sessionAge: this.session
                    ? Math.floor((Date.now() - this.session.lastAccess.getTime()) / 1000)
                    : null,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    unit: 'MB'
                },
                timestamp: new Date().toISOString()
            });
        });
        // Main MCP endpoint with authentication
        app.post('/mcp', async (req, res) => {
            // Enhanced authentication check with specific logging
            const authHeader = req.headers.authorization;
            // Check if Authorization header is missing
            if (!authHeader) {
                logger_1.logger.warn('Authentication failed: Missing Authorization header', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    reason: 'no_auth_header'
                });
                res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: 'Unauthorized'
                    },
                    id: null
                });
                return;
            }
            // Check if Authorization header has Bearer prefix
            if (!authHeader.startsWith('Bearer ')) {
                logger_1.logger.warn('Authentication failed: Invalid Authorization header format (expected Bearer token)', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    reason: 'invalid_auth_format',
                    headerPrefix: authHeader.substring(0, 10) + '...' // Log first 10 chars for debugging
                });
                res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: 'Unauthorized'
                    },
                    id: null
                });
                return;
            }
            // Extract token and trim whitespace
            const token = authHeader.slice(7).trim();
            // Check if token matches
            if (token !== this.authToken) {
                logger_1.logger.warn('Authentication failed: Invalid token', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    reason: 'invalid_token'
                });
                res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: 'Unauthorized'
                    },
                    id: null
                });
                return;
            }
            // Handle request with single session
            await this.handlePerRequest(req, res);
        });
        // 404 handler
        app.use((req, res) => {
            res.status(404).json({
                error: 'Not found',
                message: `Cannot ${req.method} ${req.path}`
            });
        });
        // Error handler
        app.use((err, req, res, next) => {
            logger_1.logger.error('Express error handler:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error',
                        data: process.env.NODE_ENV === 'development' ? err.message : undefined
                    },
                    id: null
                });
            }
        });
        const port = parseInt(process.env.PORT || '3000');
        const host = process.env.HOST || '0.0.0.0';
        this.expressServer = app.listen(port, host, () => {
            logger_1.logger.info(`n8n MCP Single-Session HTTP Server started`, { port, host });
            console.log(`n8n MCP Single-Session HTTP Server running on ${host}:${port}`);
            console.log(`Health check: http://localhost:${port}/health`);
            console.log(`MCP endpoint: http://localhost:${port}/mcp`);
            console.log('\nPress Ctrl+C to stop the server');
        });
        // Handle server errors
        this.expressServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.logger.error(`Port ${port} is already in use`);
                console.error(`ERROR: Port ${port} is already in use`);
                process.exit(1);
            }
            else {
                logger_1.logger.error('Server error:', error);
                console.error('Server error:', error);
                process.exit(1);
            }
        });
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger_1.logger.info('Shutting down Single-Session HTTP server...');
        // Clean up session
        if (this.session) {
            try {
                await this.session.transport.close();
                logger_1.logger.info('Session closed');
            }
            catch (error) {
                logger_1.logger.warn('Error closing session:', error);
            }
            this.session = null;
        }
        // Close Express server
        if (this.expressServer) {
            await new Promise((resolve) => {
                this.expressServer.close(() => {
                    logger_1.logger.info('HTTP server closed');
                    resolve();
                });
            });
        }
    }
    /**
     * Get current session info (for testing/debugging)
     */
    getSessionInfo() {
        if (!this.session) {
            return { active: false };
        }
        return {
            active: true,
            sessionId: this.session.sessionId,
            age: Date.now() - this.session.lastAccess.getTime()
        };
    }
}
exports.SingleSessionHTTPServer = SingleSessionHTTPServer;
// Start if called directly
if (require.main === module) {
    const server = new SingleSessionHTTPServer();
    // Graceful shutdown handlers
    const shutdown = async () => {
        await server.shutdown();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught exception:', error);
        console.error('Uncaught exception:', error);
        shutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled rejection:', reason);
        console.error('Unhandled rejection at:', promise, 'reason:', reason);
        shutdown();
    });
    // Start server
    server.start().catch(error => {
        logger_1.logger.error('Failed to start Single-Session HTTP server:', error);
        console.error('Failed to start Single-Session HTTP server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=http-server-single-session.js.map