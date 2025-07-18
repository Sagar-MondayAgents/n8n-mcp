"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    config;
    static instance;
    useFileLogging = false;
    fileStream = null;
    // Cache environment variables for performance
    isStdio = process.env.MCP_MODE === 'stdio';
    isDisabled = process.env.DISABLE_CONSOLE_OUTPUT === 'true';
    isHttp = process.env.MCP_MODE === 'http';
    constructor(config) {
        this.config = {
            level: LogLevel.INFO,
            prefix: 'n8n-mcp',
            timestamp: true,
            ...config,
        };
    }
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    formatMessage(level, message) {
        const parts = [];
        if (this.config.timestamp) {
            parts.push(`[${new Date().toISOString()}]`);
        }
        if (this.config.prefix) {
            parts.push(`[${this.config.prefix}]`);
        }
        parts.push(`[${level}]`);
        parts.push(message);
        return parts.join(' ');
    }
    log(level, levelName, message, ...args) {
        // Check environment variables FIRST, before level check
        // In stdio mode, suppress ALL console output to avoid corrupting JSON-RPC
        if (this.isStdio || this.isDisabled) {
            // Silently drop all logs in stdio mode
            return;
        }
        if (level <= this.config.level) {
            const formattedMessage = this.formatMessage(levelName, message);
            // In HTTP mode during request handling, suppress console output
            // The ConsoleManager will handle this, but we add a safety check
            if (this.isHttp && process.env.MCP_REQUEST_ACTIVE === 'true') {
                // Silently drop the log during active MCP requests
                return;
            }
            switch (level) {
                case LogLevel.ERROR:
                    console.error(formattedMessage, ...args);
                    break;
                case LogLevel.WARN:
                    console.warn(formattedMessage, ...args);
                    break;
                default:
                    console.log(formattedMessage, ...args);
            }
        }
    }
    error(message, ...args) {
        this.log(LogLevel.ERROR, 'ERROR', message, ...args);
    }
    warn(message, ...args) {
        this.log(LogLevel.WARN, 'WARN', message, ...args);
    }
    info(message, ...args) {
        this.log(LogLevel.INFO, 'INFO', message, ...args);
    }
    debug(message, ...args) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
    }
    setLevel(level) {
        this.config.level = level;
    }
    static parseLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'error':
                return LogLevel.ERROR;
            case 'warn':
                return LogLevel.WARN;
            case 'debug':
                return LogLevel.DEBUG;
            case 'info':
            default:
                return LogLevel.INFO;
        }
    }
}
exports.Logger = Logger;
// Create a default logger instance
exports.logger = Logger.getInstance({
    level: Logger.parseLogLevel(process.env.LOG_LEVEL || 'info'),
});
//# sourceMappingURL=logger.js.map