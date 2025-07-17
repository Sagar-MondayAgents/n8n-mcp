#!/usr/bin/env ts-node
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
const dotenv_1 = require("dotenv");
const handlers_n8n_manager_1 = require("../mcp/handlers-n8n-manager");
const node_repository_1 = require("../database/node-repository");
const database_adapter_1 = require("../database/database-adapter");
const logger_1 = require("../utils/logger");
const path = __importStar(require("path"));
(0, dotenv_1.config)();
const logger = new logger_1.Logger({ prefix: '[TestN8nValidateWorkflow]' });
async function testN8nValidateWorkflow() {
    try {
        if (!process.env.N8N_API_URL || !process.env.N8N_API_KEY) {
            logger.error('N8N_API_URL and N8N_API_KEY must be set in environment variables');
            process.exit(1);
        }
        logger.info('n8n API Configuration:', {
            url: process.env.N8N_API_URL,
            hasApiKey: !!process.env.N8N_API_KEY
        });
        const dbPath = path.join(process.cwd(), 'data', 'nodes.db');
        const db = await (0, database_adapter_1.createDatabaseAdapter)(dbPath);
        const repository = new node_repository_1.NodeRepository(db);
        const testCases = [
            {
                name: 'Validate existing workflow with all options',
                args: {
                    id: '1',
                    options: {
                        validateNodes: true,
                        validateConnections: true,
                        validateExpressions: true,
                        profile: 'runtime'
                    }
                }
            },
            {
                name: 'Validate with minimal profile',
                args: {
                    id: '1',
                    options: {
                        profile: 'minimal'
                    }
                }
            },
            {
                name: 'Validate connections only',
                args: {
                    id: '1',
                    options: {
                        validateNodes: false,
                        validateConnections: true,
                        validateExpressions: false
                    }
                }
            }
        ];
        for (const testCase of testCases) {
            logger.info(`\nRunning test: ${testCase.name}`);
            logger.info('Input:', JSON.stringify(testCase.args, null, 2));
            try {
                const result = await (0, handlers_n8n_manager_1.handleValidateWorkflow)(testCase.args, repository);
                if (result.success) {
                    logger.info('✅ Validation completed successfully');
                    logger.info('Result:', JSON.stringify(result.data, null, 2));
                }
                else {
                    logger.error('❌ Validation failed');
                    logger.error('Error:', result.error);
                    if (result.details) {
                        logger.error('Details:', JSON.stringify(result.details, null, 2));
                    }
                }
            }
            catch (error) {
                logger.error('❌ Test case failed with exception:', error);
            }
            logger.info('-'.repeat(80));
        }
        logger.info('\n✅ All tests completed');
    }
    catch (error) {
        logger.error('Test script failed:', error);
        process.exit(1);
    }
}
testN8nValidateWorkflow().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-n8n-validate-workflow.js.map