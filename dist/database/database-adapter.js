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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseAdapter = createDatabaseAdapter;
const fs_1 = require("fs");
const fsSync = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
async function createDatabaseAdapter(dbPath) {
    if (process.env.MCP_MODE !== 'stdio') {
        logger_1.logger.info(`Node.js version: ${process.version}`);
    }
    if (process.env.MCP_MODE !== 'stdio') {
        logger_1.logger.info(`Platform: ${process.platform} ${process.arch}`);
    }
    try {
        if (process.env.MCP_MODE !== 'stdio') {
            logger_1.logger.info('Attempting to use better-sqlite3...');
        }
        const adapter = await createBetterSQLiteAdapter(dbPath);
        if (process.env.MCP_MODE !== 'stdio') {
            logger_1.logger.info('Successfully initialized better-sqlite3 adapter');
        }
        return adapter;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('NODE_MODULE_VERSION') || errorMessage.includes('was compiled against a different Node.js version')) {
            if (process.env.MCP_MODE !== 'stdio') {
                logger_1.logger.warn(`Node.js version mismatch detected. Better-sqlite3 was compiled for a different Node.js version.`);
            }
            if (process.env.MCP_MODE !== 'stdio') {
                logger_1.logger.warn(`Current Node.js version: ${process.version}`);
            }
        }
        if (process.env.MCP_MODE !== 'stdio') {
            logger_1.logger.warn('Failed to initialize better-sqlite3, falling back to sql.js', error);
        }
        try {
            const adapter = await createSQLJSAdapter(dbPath);
            if (process.env.MCP_MODE !== 'stdio') {
                logger_1.logger.info('Successfully initialized sql.js adapter (pure JavaScript, no native dependencies)');
            }
            return adapter;
        }
        catch (sqlJsError) {
            if (process.env.MCP_MODE !== 'stdio') {
                logger_1.logger.error('Failed to initialize sql.js adapter', sqlJsError);
            }
            throw new Error('Failed to initialize any database adapter');
        }
    }
}
async function createBetterSQLiteAdapter(dbPath) {
    try {
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        return new BetterSQLiteAdapter(db);
    }
    catch (error) {
        throw new Error(`Failed to create better-sqlite3 adapter: ${error}`);
    }
}
async function createSQLJSAdapter(dbPath) {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs({
        locateFile: (file) => {
            if (file.endsWith('.wasm')) {
                return path_1.default.join(__dirname, '../../node_modules/sql.js/dist/', file);
            }
            return file;
        }
    });
    let db;
    try {
        const data = await fs_1.promises.readFile(dbPath);
        db = new SQL.Database(new Uint8Array(data));
        logger_1.logger.info(`Loaded existing database from ${dbPath}`);
    }
    catch (error) {
        db = new SQL.Database();
        logger_1.logger.info(`Created new database at ${dbPath}`);
    }
    return new SQLJSAdapter(db, dbPath);
}
class BetterSQLiteAdapter {
    constructor(db) {
        this.db = db;
    }
    prepare(sql) {
        const stmt = this.db.prepare(sql);
        return new BetterSQLiteStatement(stmt);
    }
    exec(sql) {
        this.db.exec(sql);
    }
    close() {
        this.db.close();
    }
    pragma(key, value) {
        return this.db.pragma(key, value);
    }
    get inTransaction() {
        return this.db.inTransaction;
    }
    transaction(fn) {
        return this.db.transaction(fn)();
    }
}
class SQLJSAdapter {
    constructor(db, dbPath) {
        this.db = db;
        this.dbPath = dbPath;
        this.saveTimer = null;
        this.scheduleSave();
    }
    prepare(sql) {
        const stmt = this.db.prepare(sql);
        this.scheduleSave();
        return new SQLJSStatement(stmt, () => this.scheduleSave());
    }
    exec(sql) {
        this.db.exec(sql);
        this.scheduleSave();
    }
    close() {
        this.saveToFile();
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.db.close();
    }
    pragma(key, value) {
        if (key === 'journal_mode' && value === 'WAL') {
            return 'memory';
        }
        return null;
    }
    get inTransaction() {
        return false;
    }
    transaction(fn) {
        try {
            this.exec('BEGIN');
            const result = fn();
            this.exec('COMMIT');
            return result;
        }
        catch (error) {
            this.exec('ROLLBACK');
            throw error;
        }
    }
    scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            this.saveToFile();
        }, 100);
    }
    saveToFile() {
        try {
            const data = this.db.export();
            const buffer = Buffer.from(data);
            fsSync.writeFileSync(this.dbPath, buffer);
            logger_1.logger.debug(`Database saved to ${this.dbPath}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to save database', error);
        }
    }
}
class BetterSQLiteStatement {
    constructor(stmt) {
        this.stmt = stmt;
    }
    run(...params) {
        return this.stmt.run(...params);
    }
    get(...params) {
        return this.stmt.get(...params);
    }
    all(...params) {
        return this.stmt.all(...params);
    }
    iterate(...params) {
        return this.stmt.iterate(...params);
    }
    pluck(toggle) {
        this.stmt.pluck(toggle);
        return this;
    }
    expand(toggle) {
        this.stmt.expand(toggle);
        return this;
    }
    raw(toggle) {
        this.stmt.raw(toggle);
        return this;
    }
    columns() {
        return this.stmt.columns();
    }
    bind(...params) {
        this.stmt.bind(...params);
        return this;
    }
}
class SQLJSStatement {
    constructor(stmt, onModify) {
        this.stmt = stmt;
        this.onModify = onModify;
        this.boundParams = null;
    }
    run(...params) {
        if (params.length > 0) {
            this.bindParams(params);
            this.stmt.bind(this.boundParams);
        }
        this.stmt.run();
        this.onModify();
        return {
            changes: 0,
            lastInsertRowid: 0
        };
    }
    get(...params) {
        if (params.length > 0) {
            this.bindParams(params);
        }
        this.stmt.bind(this.boundParams);
        if (this.stmt.step()) {
            const result = this.stmt.getAsObject();
            this.stmt.reset();
            return this.convertIntegerColumns(result);
        }
        this.stmt.reset();
        return undefined;
    }
    all(...params) {
        if (params.length > 0) {
            this.bindParams(params);
        }
        this.stmt.bind(this.boundParams);
        const results = [];
        while (this.stmt.step()) {
            results.push(this.convertIntegerColumns(this.stmt.getAsObject()));
        }
        this.stmt.reset();
        return results;
    }
    iterate(...params) {
        return this.all(...params)[Symbol.iterator]();
    }
    pluck(toggle) {
        return this;
    }
    expand(toggle) {
        return this;
    }
    raw(toggle) {
        return this;
    }
    columns() {
        return [];
    }
    bind(...params) {
        this.bindParams(params);
        return this;
    }
    bindParams(params) {
        if (params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])) {
            this.boundParams = params[0];
        }
        else {
            this.boundParams = params;
        }
    }
    convertIntegerColumns(row) {
        if (!row)
            return row;
        const integerColumns = ['is_ai_tool', 'is_trigger', 'is_webhook', 'is_versioned'];
        const converted = { ...row };
        for (const col of integerColumns) {
            if (col in converted && typeof converted[col] === 'string') {
                converted[col] = parseInt(converted[col], 10);
            }
        }
        return converted;
    }
}
//# sourceMappingURL=database-adapter.js.map