/**
 * Console Manager for MCP HTTP Server
 *
 * Prevents console output from interfering with StreamableHTTPServerTransport
 * by silencing console methods during MCP request handling.
 */
export declare class ConsoleManager {
    private originalConsole;
    private isSilenced;
    /**
     * Silence all console output
     */
    silence(): void;
    /**
     * Restore original console methods
     */
    restore(): void;
    /**
     * Wrap an operation with console silencing
     * Automatically restores console on completion or error
     */
    wrapOperation<T>(operation: () => T | Promise<T>): Promise<T>;
    /**
     * Check if console is currently silenced
     */
    get isActive(): boolean;
}
export declare const consoleManager: ConsoleManager;
//# sourceMappingURL=console-manager.d.ts.map