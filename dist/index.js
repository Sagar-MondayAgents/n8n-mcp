"use strict";
/**
 * n8n-MCP - Model Context Protocol Server for n8n
 * Copyright (c) 2024 AiAdvisors Romuald Czlonkowski
 * Licensed under the Sustainable Use License v1.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8NDocumentationMCPServer = exports.ConsoleManager = exports.SingleSessionHTTPServer = exports.N8NMCPEngine = void 0;
// Engine exports for service integration
var mcp_engine_1 = require("./mcp-engine");
Object.defineProperty(exports, "N8NMCPEngine", { enumerable: true, get: function () { return mcp_engine_1.N8NMCPEngine; } });
var http_server_single_session_1 = require("./http-server-single-session");
Object.defineProperty(exports, "SingleSessionHTTPServer", { enumerable: true, get: function () { return http_server_single_session_1.SingleSessionHTTPServer; } });
var console_manager_1 = require("./utils/console-manager");
Object.defineProperty(exports, "ConsoleManager", { enumerable: true, get: function () { return console_manager_1.ConsoleManager; } });
var server_1 = require("./mcp/server");
Object.defineProperty(exports, "N8NDocumentationMCPServer", { enumerable: true, get: function () { return server_1.N8NDocumentationMCPServer; } });
// Default export for convenience
const mcp_engine_2 = __importDefault(require("./mcp-engine"));
exports.default = mcp_engine_2.default;
// Legacy CLI functionality - moved to ./mcp/index.ts
// This file now serves as the main entry point for library usage
//# sourceMappingURL=index.js.map