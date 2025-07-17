#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.MCP_MODE = 'stdio';
process.env.DISABLE_CONSOLE_OUTPUT = 'true';
process.env.LOG_LEVEL = 'error';
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;
const originalConsoleTrace = console.trace;
const originalConsoleDir = console.dir;
const originalConsoleTime = console.time;
const originalConsoleTimeEnd = console.timeEnd;
console.log = () => { };
console.error = () => { };
console.warn = () => { };
console.info = () => { };
console.debug = () => { };
console.trace = () => { };
console.dir = () => { };
console.time = () => { };
console.timeEnd = () => { };
console.timeLog = () => { };
console.group = () => { };
console.groupEnd = () => { };
console.table = () => { };
console.clear = () => { };
console.count = () => { };
console.countReset = () => { };
const server_1 = require("./server");
async function main() {
    try {
        const server = new server_1.N8NDocumentationMCPServer();
        await server.run();
    }
    catch (error) {
        originalConsoleError('Fatal error:', error);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    originalConsoleError('Uncaught exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    originalConsoleError('Unhandled rejection:', reason);
    process.exit(1);
});
main();
//# sourceMappingURL=stdio-wrapper.js.map