#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleSessionHTTPServer = void 0;
const express_1 = __importDefault(require("express"));
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const server_1 = require("./mcp/server");
const console_manager_1 = require("./utils/console-manager");
const logger_1 = require("./utils/logger");
const fs_1 = require("fs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class SingleSessionHTTPServer {
    constructor() {
        this.session = null;
        this.consoleManager = new console_manager_1.ConsoleManager();
        this.sessionTimeout = 30 * 60 * 1000;
        this.authToken = null;
        this.validateEnvironment();
    }
    loadAuthToken() {
        if (process.env.AUTH_TOKEN) {
            logger_1.logger.info('Using AUTH_TOKEN from environment variable');
            return process.env.AUTH_TOKEN;
        }
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
    validateEnvironment() {
        this.authToken = this.loadAuthToken();
        if (!this.authToken || this.authToken.trim() === '') {
            const message = 'No authentication token found or token is empty. Set AUTH_TOKEN environment variable or AUTH_TOKEN_FILE pointing to a file containing the token.';
            logger_1.logger.error(message);
            throw new Error(message);
        }
        this.authToken = this.authToken.trim();
        if (this.authToken.length < 32) {
            logger_1.logger.warn('AUTH_TOKEN should be at least 32 characters for security');
        }
    }
    async handleRequest(req, res) {
        const startTime = Date.now();
        return this.consoleManager.wrapOperation(async () => {
            try {
                if (!this.session || this.isExpired()) {
                    await this.resetSession();
                }
                this.session.lastAccess = new Date();
                logger_1.logger.debug('Calling transport.handleRequest...');
                await this.session.transport.handleRequest(req, res);
                logger_1.logger.debug('transport.handleRequest completed');
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
    async resetSession() {
        if (this.session) {
            try {
                logger_1.logger.info('Closing previous session', { sessionId: this.session.sessionId });
                await this.session.transport.close();
            }
            catch (error) {
                logger_1.logger.warn('Error closing previous session:', error);
            }
        }
        try {
            logger_1.logger.info('Creating new N8NDocumentationMCPServer...');
            const server = new server_1.N8NDocumentationMCPServer();
            logger_1.logger.info('Creating StreamableHTTPServerTransport...');
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => 'single-session',
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
    isExpired() {
        if (!this.session)
            return true;
        return Date.now() - this.session.lastAccess.getTime() > this.sessionTimeout;
    }
    async start() {
        const app = (0, express_1.default)();
        const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 0;
        if (trustProxy > 0) {
            app.set('trust proxy', trustProxy);
            logger_1.logger.info(`Trust proxy enabled with ${trustProxy} hop(s)`);
        }
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            next();
        });
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
        app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                contentLength: req.get('content-length')
            });
            next();
        });
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
        app.post('/mcp', async (req, res) => {
            const authHeader = req.headers.authorization;
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
            if (!authHeader.startsWith('Bearer ')) {
                logger_1.logger.warn('Authentication failed: Invalid Authorization header format (expected Bearer token)', {
                    ip: req.ip,
                    userAgent: req.get('user-agent'),
                    reason: 'invalid_auth_format',
                    headerPrefix: authHeader.substring(0, 10) + '...'
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
            const token = authHeader.slice(7).trim();
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
            await this.handleRequest(req, res);
        });
        app.use((req, res) => {
            res.status(404).json({
                error: 'Not found',
                message: `Cannot ${req.method} ${req.path}`
            });
        });
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
    async shutdown() {
        logger_1.logger.info('Shutting down Single-Session HTTP server...');
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
        if (this.expressServer) {
            await new Promise((resolve) => {
                this.expressServer.close(() => {
                    logger_1.logger.info('HTTP server closed');
                    resolve();
                });
            });
        }
    }
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
if (require.main === module) {
    const server = new SingleSessionHTTPServer();
    const shutdown = async () => {
        await server.shutdown();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
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
    server.start().catch(error => {
        logger_1.logger.error('Failed to start Single-Session HTTP server:', error);
        console.error('Failed to start Single-Session HTTP server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=http-server-single-session.js.map