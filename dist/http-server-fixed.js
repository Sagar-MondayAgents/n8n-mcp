#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFixedHTTPServer = startFixedHTTPServer;
const express_1 = __importDefault(require("express"));
const tools_update_1 = require("./mcp/tools-update");
const server_update_1 = require("./mcp/server-update");
const logger_1 = require("./utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let expressServer;
function validateEnvironment() {
    const required = ['AUTH_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        logger_1.logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        console.error(`ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Generate AUTH_TOKEN with: openssl rand -base64 32');
        process.exit(1);
    }
    if (process.env.AUTH_TOKEN && process.env.AUTH_TOKEN.length < 32) {
        logger_1.logger.warn('AUTH_TOKEN should be at least 32 characters for security');
        console.warn('WARNING: AUTH_TOKEN should be at least 32 characters for security');
    }
}
async function shutdown() {
    logger_1.logger.info('Shutting down HTTP server...');
    console.log('Shutting down HTTP server...');
    if (expressServer) {
        expressServer.close(() => {
            logger_1.logger.info('HTTP server closed');
            console.log('HTTP server closed');
            process.exit(0);
        });
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
    else {
        process.exit(0);
    }
}
async function startFixedHTTPServer() {
    validateEnvironment();
    const app = (0, express_1.default)();
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
    const mcpServer = new server_update_1.N8NDocumentationMCPServer();
    logger_1.logger.info('Created persistent MCP server instance');
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            mode: 'http-fixed',
            version: '2.4.1',
            uptime: Math.floor(process.uptime()),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB'
            },
            timestamp: new Date().toISOString()
        });
    });
    app.get('/version', (req, res) => {
        res.json({
            version: '2.4.1',
            buildTime: new Date().toISOString(),
            tools: tools_update_1.n8nDocumentationToolsFinal.map(t => t.name),
            commit: process.env.GIT_COMMIT || 'unknown'
        });
    });
    app.get('/test-tools', async (req, res) => {
        try {
            const result = await mcpServer.executeTool('get_node_essentials', { nodeType: 'nodes-base.httpRequest' });
            res.json({ status: 'ok', hasData: !!result, toolCount: tools_update_1.n8nDocumentationToolsFinal.length });
        }
        catch (error) {
            res.json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.post('/mcp', async (req, res) => {
        const startTime = Date.now();
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;
        if (token !== process.env.AUTH_TOKEN) {
            logger_1.logger.warn('Authentication failed', {
                ip: req.ip,
                userAgent: req.get('user-agent')
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
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const jsonRpcRequest = JSON.parse(body);
                    logger_1.logger.debug('Received JSON-RPC request:', { method: jsonRpcRequest.method });
                    let response;
                    switch (jsonRpcRequest.method) {
                        case 'initialize':
                            response = {
                                jsonrpc: '2.0',
                                result: {
                                    protocolVersion: '1.0',
                                    capabilities: {
                                        tools: {},
                                        resources: {}
                                    },
                                    serverInfo: {
                                        name: 'n8n-documentation-mcp',
                                        version: '2.4.1'
                                    }
                                },
                                id: jsonRpcRequest.id
                            };
                            break;
                        case 'tools/list':
                            response = {
                                jsonrpc: '2.0',
                                result: {
                                    tools: tools_update_1.n8nDocumentationToolsFinal
                                },
                                id: jsonRpcRequest.id
                            };
                            break;
                        case 'tools/call':
                            const toolName = jsonRpcRequest.params?.name;
                            const toolArgs = jsonRpcRequest.params?.arguments || {};
                            try {
                                const result = await mcpServer.executeTool(toolName, toolArgs);
                                response = {
                                    jsonrpc: '2.0',
                                    result: {
                                        content: [
                                            {
                                                type: 'text',
                                                text: JSON.stringify(result, null, 2)
                                            }
                                        ]
                                    },
                                    id: jsonRpcRequest.id
                                };
                            }
                            catch (error) {
                                response = {
                                    jsonrpc: '2.0',
                                    error: {
                                        code: -32603,
                                        message: `Error executing tool ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
                                    },
                                    id: jsonRpcRequest.id
                                };
                            }
                            break;
                        default:
                            response = {
                                jsonrpc: '2.0',
                                error: {
                                    code: -32601,
                                    message: `Method not found: ${jsonRpcRequest.method}`
                                },
                                id: jsonRpcRequest.id
                            };
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.json(response);
                    const duration = Date.now() - startTime;
                    logger_1.logger.info('MCP request completed', {
                        duration,
                        method: jsonRpcRequest.method
                    });
                }
                catch (error) {
                    logger_1.logger.error('Error processing request:', error);
                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32700,
                            message: 'Parse error',
                            data: error instanceof Error ? error.message : 'Unknown error'
                        },
                        id: null
                    });
                }
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
    expressServer = app.listen(port, host, () => {
        logger_1.logger.info(`n8n MCP Fixed HTTP Server started`, { port, host });
        console.log(`n8n MCP Fixed HTTP Server running on ${host}:${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log(`MCP endpoint: http://localhost:${port}/mcp`);
        console.log('\nPress Ctrl+C to stop the server');
    });
    expressServer.on('error', (error) => {
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
}
if (require.main === module) {
    startFixedHTTPServer().catch(error => {
        logger_1.logger.error('Failed to start Fixed HTTP server:', error);
        console.error('Failed to start Fixed HTTP server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=http-server-fixed.js.map