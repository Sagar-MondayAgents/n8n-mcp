"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleManager = exports.ConsoleManager = void 0;
/**
 * Console Manager for MCP HTTP Server
 *
 * Prevents console output from interfering with StreamableHTTPServerTransport
 * by silencing console methods during MCP request handling.
 */
class ConsoleManager {
    originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        trace: console.trace
    };
    isSilenced = false;
    /**
     * Silence all console output
     */
    silence() {
        if (this.isSilenced || process.env.MCP_MODE !== 'http') {
            return;
        }
        this.isSilenced = true;
        process.env.MCP_REQUEST_ACTIVE = 'true';
        console.log = () => { };
        console.error = () => { };
        console.warn = () => { };
        console.info = () => { };
        console.debug = () => { };
        console.trace = () => { };
    }
    /**
     * Restore original console methods
     */
    restore() {
        if (!this.isSilenced) {
            return;
        }
        this.isSilenced = false;
        process.env.MCP_REQUEST_ACTIVE = 'false';
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.info = this.originalConsole.info;
        console.debug = this.originalConsole.debug;
        console.trace = this.originalConsole.trace;
    }
    /**
     * Wrap an operation with console silencing
     * Automatically restores console on completion or error
     */
    async wrapOperation(operation) {
        this.silence();
        try {
            const result = operation();
            if (result instanceof Promise) {
                return await result.finally(() => this.restore());
            }
            this.restore();
            return result;
        }
        catch (error) {
            this.restore();
            throw error;
        }
    }
    /**
     * Check if console is currently silenced
     */
    get isActive() {
        return this.isSilenced;
    }
}
exports.ConsoleManager = ConsoleManager;
// Export singleton instance for easy use
exports.consoleManager = new ConsoleManager();
//# sourceMappingURL=console-manager.js.map