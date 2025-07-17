#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const logger_1 = require("../utils/logger");
const n8n_api_1 = require("../config/n8n-api");
const handlers_n8n_manager_1 = require("../mcp/handlers-n8n-manager");
(0, dotenv_1.config)();
async function testN8nManagerIntegration() {
    logger_1.logger.info('Testing n8n Manager Integration...');
    if (!(0, n8n_api_1.isN8nApiConfigured)()) {
        logger_1.logger.warn('n8n API not configured. Set N8N_API_URL and N8N_API_KEY to test.');
        logger_1.logger.info('Example:');
        logger_1.logger.info('  N8N_API_URL=https://your-n8n.com N8N_API_KEY=your-key npm run test:n8n-manager');
        return;
    }
    const apiConfig = (0, n8n_api_1.getN8nApiConfig)();
    logger_1.logger.info('n8n API Configuration:', {
        url: apiConfig.baseUrl,
        timeout: apiConfig.timeout,
        maxRetries: apiConfig.maxRetries
    });
    const client = (0, handlers_n8n_manager_1.getN8nApiClient)();
    if (!client) {
        logger_1.logger.error('Failed to create n8n API client');
        return;
    }
    try {
        logger_1.logger.info('\n=== Test 1: Health Check ===');
        const health = await client.healthCheck();
        logger_1.logger.info('Health check passed:', health);
        logger_1.logger.info('\n=== Test 2: List Workflows ===');
        const workflows = await client.listWorkflows({ limit: 5 });
        logger_1.logger.info(`Found ${workflows.data.length} workflows`);
        workflows.data.forEach(wf => {
            logger_1.logger.info(`- ${wf.name} (ID: ${wf.id}, Active: ${wf.active})`);
        });
        logger_1.logger.info('\n=== Test 3: Create Test Workflow ===');
        const testWorkflow = {
            name: `Test Workflow - MCP Integration ${Date.now()}`,
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
                    typeVersion: 1,
                    position: [450, 300],
                    parameters: {
                        values: {
                            string: [
                                {
                                    name: 'message',
                                    value: 'Hello from MCP!'
                                }
                            ]
                        }
                    }
                }
            ],
            connections: {
                '1': {
                    main: [[{ node: '2', type: 'main', index: 0 }]]
                }
            },
            settings: {
                executionOrder: 'v1',
                saveDataErrorExecution: 'all',
                saveDataSuccessExecution: 'all',
                saveManualExecutions: true,
                saveExecutionProgress: true
            }
        };
        const createdWorkflow = await client.createWorkflow(testWorkflow);
        logger_1.logger.info('Created workflow:', {
            id: createdWorkflow.id,
            name: createdWorkflow.name,
            active: createdWorkflow.active
        });
        logger_1.logger.info('\n=== Test 4: Get Workflow Details ===');
        const workflowDetails = await client.getWorkflow(createdWorkflow.id);
        logger_1.logger.info('Retrieved workflow:', {
            id: workflowDetails.id,
            name: workflowDetails.name,
            nodeCount: workflowDetails.nodes.length
        });
        logger_1.logger.info('\n=== Test 5: Update Workflow ===');
        const updatedWorkflow = await client.updateWorkflow(createdWorkflow.id, {
            name: `${createdWorkflow.name} - Updated`,
            nodes: workflowDetails.nodes,
            connections: workflowDetails.connections,
            settings: workflowDetails.settings
        });
        logger_1.logger.info('Updated workflow name:', updatedWorkflow.name);
        logger_1.logger.info('\n=== Test 6: List Recent Executions ===');
        const executions = await client.listExecutions({ limit: 5 });
        logger_1.logger.info(`Found ${executions.data.length} recent executions`);
        executions.data.forEach(exec => {
            logger_1.logger.info(`- Workflow: ${exec.workflowName || exec.workflowId}, Status: ${exec.status}, Started: ${exec.startedAt}`);
        });
        logger_1.logger.info('\n=== Test 7: Cleanup ===');
        await client.deleteWorkflow(createdWorkflow.id);
        logger_1.logger.info('Deleted test workflow');
        logger_1.logger.info('\n✅ All tests passed successfully!');
    }
    catch (error) {
        logger_1.logger.error('Test failed:', error);
        process.exit(1);
    }
}
testN8nManagerIntegration().catch(error => {
    logger_1.logger.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-n8n-manager-integration.js.map