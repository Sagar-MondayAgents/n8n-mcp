#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const logger_1 = require("../utils/logger");
const n8n_api_1 = require("../config/n8n-api");
const handlers_workflow_diff_1 = require("../mcp/handlers-workflow-diff");
const handlers_n8n_manager_1 = require("../mcp/handlers-n8n-manager");
(0, dotenv_1.config)();
async function testUpdatePartialDebug() {
    logger_1.logger.info('Debug test for n8n_update_partial_workflow...');
    if (!(0, n8n_api_1.isN8nApiConfigured)()) {
        logger_1.logger.warn('n8n API not configured. This test requires a real n8n instance.');
        logger_1.logger.info('Set N8N_API_URL and N8N_API_KEY to test.');
        return;
    }
    const client = (0, handlers_n8n_manager_1.getN8nApiClient)();
    if (!client) {
        logger_1.logger.error('Failed to create n8n API client');
        return;
    }
    try {
        logger_1.logger.info('\n=== Creating test workflow ===');
        const testWorkflow = {
            name: `Test Partial Update ${Date.now()}`,
            nodes: [
                {
                    id: '1',
                    name: 'Start',
                    type: 'n8n-nodes-base.start',
                    typeVersion: 1,
                    position: [250, 300],
                    parameters: {}
                },
                {
                    id: '2',
                    name: 'Set',
                    type: 'n8n-nodes-base.set',
                    typeVersion: 3,
                    position: [450, 300],
                    parameters: {
                        mode: 'manual',
                        fields: {
                            values: [
                                { name: 'message', value: 'Initial value' }
                            ]
                        }
                    }
                }
            ],
            connections: {
                'Start': {
                    main: [[{ node: 'Set', type: 'main', index: 0 }]]
                }
            },
            settings: {
                executionOrder: 'v1'
            }
        };
        const createdWorkflow = await client.createWorkflow(testWorkflow);
        logger_1.logger.info('Created workflow:', {
            id: createdWorkflow.id,
            name: createdWorkflow.name
        });
        logger_1.logger.info('\n=== Testing partial update (NO validateOnly) ===');
        const updateRequest = {
            id: createdWorkflow.id,
            operations: [
                {
                    type: 'updateName',
                    name: 'Updated via Partial Update'
                }
            ]
        };
        logger_1.logger.info('Update request:', JSON.stringify(updateRequest, null, 2));
        const result = await (0, handlers_workflow_diff_1.handleUpdatePartialWorkflow)(updateRequest);
        logger_1.logger.info('Update result:', JSON.stringify(result, null, 2));
        if (createdWorkflow.id) {
            logger_1.logger.info('\n=== Cleanup ===');
            await client.deleteWorkflow(createdWorkflow.id);
            logger_1.logger.info('Deleted test workflow');
        }
    }
    catch (error) {
        logger_1.logger.error('Test failed:', error);
    }
}
testUpdatePartialDebug().catch(error => {
    logger_1.logger.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-update-partial-debug.js.map