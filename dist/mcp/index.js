#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedHTTPServer = exports.N8NDocumentationMCPServer = void 0;
/**
 * MCP Server entry point with multiple transport support
 */
const server_1 = require("./server");
Object.defineProperty(exports, "N8NDocumentationMCPServer", { enumerable: true, get: function () { return server_1.N8NDocumentationMCPServer; } });
const logger_1 = require("../utils/logger");
const http_unified_server_1 = require("../http-unified-server");
Object.defineProperty(exports, "UnifiedHTTPServer", { enumerable: true, get: function () { return http_unified_server_1.UnifiedHTTPServer; } });
const http_server_single_session_1 = require("../http-server-single-session");
// Add error handlers
process.on('uncaughtException', (error) => {
    if (process.env.MCP_MODE !== 'stdio') {
        console.error('Uncaught Exception:', error);
    }
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    if (process.env.MCP_MODE !== 'stdio') {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    }
    logger_1.logger.error('Unhandled Rejection:', reason);
    process.exit(1);
});
async function main() {
    const mode = process.env.MCP_MODE || 'unified';
    try {
        logger_1.logger.info(`Starting n8n Documentation MCP Server in ${mode} mode...`);
        switch (mode) {
            case 'unified':
                // NEW: Unified server with both Streamable HTTP and SSE
                const unifiedServer = new http_unified_server_1.UnifiedHTTPServer();
                await unifiedServer.start();
                break;
            case 'http':
                // Legacy HTTP mode with custom transport
                if (process.env.USE_FIXED_HTTP === 'true') {
                    const { startFixedHTTPServer } = await Promise.resolve().then(() => __importStar(require('../http-server')));
                    await startFixedHTTPServer();
                }
                else {
                    const server = new http_server_single_session_1.SingleSessionHTTPServer();
                    const shutdown = async () => {
                        await server.shutdown();
                        process.exit(0);
                    };
                    process.on('SIGTERM', shutdown);
                    process.on('SIGINT', shutdown);
                    await server.start();
                }
                break;
            case 'stdio':
                // Stdio mode for local Claude Desktop
                const server = new server_1.N8NDocumentationMCPServer();
                await server.run();
                break;
            default:
                throw new Error(`Unknown MCP_MODE: ${mode}`);
        }
    }
    catch (error) {
        if (mode !== 'stdio') {
            console.error('Failed to start MCP server:', error);
        }
        logger_1.logger.error('Failed to start MCP server', error);
        if (error instanceof Error && error.message.includes('nodes.db not found')) {
            console.error('\nTo fix this issue:');
            console.error('1. cd to the n8n-mcp directory');
            console.error('2. Run: npm run build');
            console.error('3. Run: npm run rebuild');
        }
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map