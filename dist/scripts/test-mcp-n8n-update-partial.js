#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const logger_1 = require("../utils/logger");
const n8n_api_1 = require("../config/n8n-api");
const handlers_workflow_diff_1 = require("../mcp/handlers-workflow-diff");
(0, dotenv_1.config)();
async function testMcpUpdatePartialWorkflow() {
    logger_1.logger.info('Testing n8n_update_partial_workflow MCP tool...');
    if (!(0, n8n_api_1.isN8nApiConfigured)()) {
        logger_1.logger.warn('n8n API not configured. Set N8N_API_URL and N8N_API_KEY to test.');
        logger_1.logger.info('Example:');
        logger_1.logger.info('  N8N_API_URL=https://your-n8n.com N8N_API_KEY=your-key npm run test:mcp:update-partial');
        return;
    }
    logger_1.logger.info('\n=== Test 1: Validate Only (no actual workflow needed) ===');
    const validateOnlyRequest = {
        id: 'test-workflow-123',
        operations: [
            {
                type: 'addNode',
                description: 'Add HTTP Request node',
                node: {
                    name: 'HTTP Request',
                    type: 'n8n-nodes-base.httpRequest',
                    position: [400, 300],
                    parameters: {
                        url: 'https://api.example.com/data',
                        method: 'GET'
                    }
                }
            },
            {
                type: 'addConnection',
                source: 'Start',
                target: 'HTTP Request'
            }
        ],
        validateOnly: true
    };
    try {
        const result = await (0, handlers_workflow_diff_1.handleUpdatePartialWorkflow)(validateOnlyRequest);
        logger_1.logger.info('Validation result:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        logger_1.logger.error('Validation test failed:', error);
    }
    logger_1.logger.info('\n=== Test 2: Missing Required Fields ===');
    const invalidRequest = {
        operations: [{
                type: 'addNode'
            }]
    };
    try {
        const result = await (0, handlers_workflow_diff_1.handleUpdatePartialWorkflow)(invalidRequest);
        logger_1.logger.info('Should fail with validation error:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        logger_1.logger.info('Expected validation error:', error instanceof Error ? error.message : String(error));
    }
    logger_1.logger.info('\n=== Test 3: Complex Operations Array ===');
    const complexRequest = {
        id: 'workflow-456',
        operations: [
            {
                type: 'updateNode',
                nodeName: 'Webhook',
                changes: {
                    'parameters.path': 'new-webhook-path',
                    'parameters.method': 'POST'
                }
            },
            {
                type: 'addNode',
                node: {
                    name: 'Set',
                    type: 'n8n-nodes-base.set',
                    typeVersion: 3,
                    position: [600, 300],
                    parameters: {
                        mode: 'manual',
                        fields: {
                            values: [
                                { name: 'status', value: 'processed' }
                            ]
                        }
                    }
                }
            },
            {
                type: 'addConnection',
                source: 'Webhook',
                target: 'Set'
            },
            {
                type: 'updateName',
                name: 'Updated Workflow Name'
            },
            {
                type: 'addTag',
                tag: 'production'
            }
        ],
        validateOnly: true
    };
    try {
        const result = await (0, handlers_workflow_diff_1.handleUpdatePartialWorkflow)(complexRequest);
        logger_1.logger.info('Complex operations result:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        logger_1.logger.error('Complex operations test failed:', error);
    }
    logger_1.logger.info('\n=== Test 4: Invalid Operation Type ===');
    const invalidTypeRequest = {
        id: 'workflow-789',
        operations: [{
                type: 'invalidOperation',
                something: 'else'
            }],
        validateOnly: true
    };
    try {
        const result = await (0, handlers_workflow_diff_1.handleUpdatePartialWorkflow)(invalidTypeRequest);
        logger_1.logger.info('Invalid type result:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        logger_1.logger.info('Expected error for invalid type:', error instanceof Error ? error.message : String(error));
    }
    logger_1.logger.info('\n✅ MCP tool integration tests completed!');
    logger_1.logger.info('\nNOTE: These tests verify the MCP tool can be called without errors.');
    logger_1.logger.info('To test with real workflows, ensure N8N_API_URL and N8N_API_KEY are set.');
}
testMcpUpdatePartialWorkflow().catch(error => {
    logger_1.logger.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-mcp-n8n-update-partial.js.map