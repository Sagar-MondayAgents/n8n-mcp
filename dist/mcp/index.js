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
const server_1 = require("./server");
const logger_1 = require("../utils/logger");
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
    const mode = process.env.MCP_MODE || 'stdio';
    try {
        if (mode === 'http') {
            console.error(`Starting n8n Documentation MCP Server in ${mode} mode...`);
            console.error('Current directory:', process.cwd());
            console.error('Node version:', process.version);
        }
        if (mode === 'http') {
            if (process.env.USE_FIXED_HTTP === 'true') {
                const { startFixedHTTPServer } = await Promise.resolve().then(() => __importStar(require('../http-server')));
                await startFixedHTTPServer();
            }
            else {
                const { SingleSessionHTTPServer } = await Promise.resolve().then(() => __importStar(require('../http-server-single-session')));
                const server = new SingleSessionHTTPServer();
                const shutdown = async () => {
                    await server.shutdown();
                    process.exit(0);
                };
                process.on('SIGTERM', shutdown);
                process.on('SIGINT', shutdown);
                await server.start();
            }
        }
        else {
            const server = new server_1.N8NDocumentationMCPServer();
            await server.run();
        }
    }
    catch (error) {
        if (mode !== 'stdio') {
            console.error('Failed to start MCP server:', error);
            logger_1.logger.error('Failed to start MCP server', error);
            if (error instanceof Error && error.message.includes('nodes.db not found')) {
                console.error('\nTo fix this issue:');
                console.error('1. cd to the n8n-mcp directory');
                console.error('2. Run: npm run build');
                console.error('3. Run: npm run rebuild');
            }
            else if (error instanceof Error && error.message.includes('NODE_MODULE_VERSION')) {
                console.error('\nTo fix this Node.js version mismatch:');
                console.error('1. cd to the n8n-mcp directory');
                console.error('2. Run: npm rebuild better-sqlite3');
                console.error('3. If that doesn\'t work, try: rm -rf node_modules && npm install');
            }
        }
        process.exit(1);
    }
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map