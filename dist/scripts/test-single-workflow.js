#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const node_repository_1 = require("../database/node-repository");
const database_adapter_1 = require("../database/database-adapter");
const workflow_validator_1 = require("../services/workflow-validator");
const enhanced_config_validator_1 = require("../services/enhanced-config-validator");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger({ prefix: '[test-single-workflow]' });
async function testSingleWorkflow() {
    const workflowPath = process.argv[2];
    if (!workflowPath) {
        logger.error('Please provide a workflow file path');
        process.exit(1);
    }
    if (!(0, fs_1.existsSync)(workflowPath)) {
        logger.error(`Workflow file not found: ${workflowPath}`);
        process.exit(1);
    }
    logger.info(`Testing workflow: ${workflowPath}\n`);
    const dbPath = path_1.default.join(process.cwd(), 'data', 'nodes.db');
    if (!(0, fs_1.existsSync)(dbPath)) {
        logger.error('Database not found. Run npm run rebuild first.');
        process.exit(1);
    }
    const db = await (0, database_adapter_1.createDatabaseAdapter)(dbPath);
    const repository = new node_repository_1.NodeRepository(db);
    const validator = new workflow_validator_1.WorkflowValidator(repository, enhanced_config_validator_1.EnhancedConfigValidator);
    try {
        const workflowJson = JSON.parse((0, fs_1.readFileSync)(workflowPath, 'utf8'));
        logger.info(`Workflow: ${workflowJson.name || 'Unnamed'}`);
        logger.info(`Nodes: ${workflowJson.nodes?.length || 0}`);
        logger.info(`Connections: ${Object.keys(workflowJson.connections || {}).length}`);
        logger.info('\nNode types in workflow:');
        workflowJson.nodes?.forEach((node) => {
            logger.info(`  - ${node.name}: ${node.type}`);
        });
        logger.info('\nChecking node types in database:');
        for (const node of workflowJson.nodes || []) {
            const dbNode = repository.getNode(node.type);
            if (dbNode) {
                logger.info(`  ✓ ${node.type} found in database`);
            }
            else {
                let shortType = node.type;
                if (node.type.startsWith('n8n-nodes-base.')) {
                    shortType = node.type.replace('n8n-nodes-base.', 'nodes-base.');
                }
                else if (node.type.startsWith('@n8n/n8n-nodes-langchain.')) {
                    shortType = node.type.replace('@n8n/n8n-nodes-langchain.', 'nodes-langchain.');
                }
                const dbNodeShort = repository.getNode(shortType);
                if (dbNodeShort) {
                    logger.info(`  ✓ ${shortType} found in database (normalized)`);
                }
                else {
                    logger.error(`  ✗ ${node.type} NOT found in database`);
                }
            }
        }
        logger.info('\n' + '='.repeat(80));
        logger.info('VALIDATION RESULTS');
        logger.info('='.repeat(80) + '\n');
        const result = await validator.validateWorkflow(workflowJson);
        console.log(`Valid: ${result.valid ? '✅ YES' : '❌ NO'}`);
        if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach((error) => {
                console.log(`  - ${error.nodeName || 'workflow'}: ${error.message}`);
            });
        }
        if (result.warnings.length > 0) {
            console.log('\nWarnings:');
            result.warnings.forEach((warning) => {
                const msg = typeof warning.message === 'string'
                    ? warning.message
                    : JSON.stringify(warning.message);
                console.log(`  - ${warning.nodeName || 'workflow'}: ${msg}`);
            });
        }
        if (result.suggestions?.length > 0) {
            console.log('\nSuggestions:');
            result.suggestions.forEach((suggestion) => {
                console.log(`  - ${suggestion}`);
            });
        }
        console.log('\nStatistics:');
        console.log(`  - Total nodes: ${result.statistics.totalNodes}`);
        console.log(`  - Enabled nodes: ${result.statistics.enabledNodes}`);
        console.log(`  - Trigger nodes: ${result.statistics.triggerNodes}`);
        console.log(`  - Valid connections: ${result.statistics.validConnections}`);
        console.log(`  - Invalid connections: ${result.statistics.invalidConnections}`);
        console.log(`  - Expressions validated: ${result.statistics.expressionsValidated}`);
    }
    catch (error) {
        logger.error('Failed to validate workflow:', error);
        process.exit(1);
    }
    finally {
        db.close();
    }
}
testSingleWorkflow().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-single-workflow.js.map