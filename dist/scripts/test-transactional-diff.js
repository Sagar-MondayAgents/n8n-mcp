"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflow_diff_engine_1 = require("../services/workflow-diff-engine");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger({ prefix: '[TestTransactionalDiff]' });
const testWorkflow = {
    id: 'test-workflow-123',
    name: 'Test Workflow',
    active: false,
    nodes: [
        {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [200, 300],
            parameters: {
                path: '/test',
                method: 'GET'
            }
        }
    ],
    connections: {},
    settings: {
        executionOrder: 'v1'
    },
    tags: []
};
async function testAddNodesAndConnect() {
    logger.info('Test 1: Add two nodes and connect them in one operation');
    const engine = new workflow_diff_engine_1.WorkflowDiffEngine();
    const request = {
        id: testWorkflow.id,
        operations: [
            {
                type: 'addConnection',
                source: 'Webhook',
                target: 'Process Data'
            },
            {
                type: 'addConnection',
                source: 'Process Data',
                target: 'Send Email'
            },
            {
                type: 'addNode',
                node: {
                    id: '2',
                    name: 'Process Data',
                    type: 'n8n-nodes-base.set',
                    typeVersion: 3,
                    position: [400, 300],
                    parameters: {
                        mode: 'manual',
                        fields: []
                    }
                }
            },
            {
                type: 'addNode',
                node: {
                    id: '3',
                    name: 'Send Email',
                    type: 'n8n-nodes-base.emailSend',
                    typeVersion: 2.1,
                    position: [600, 300],
                    parameters: {
                        to: 'test@example.com',
                        subject: 'Test'
                    }
                }
            }
        ]
    };
    const result = await engine.applyDiff(testWorkflow, request);
    if (result.success) {
        logger.info('✅ Test passed! Operations applied successfully');
        logger.info(`Message: ${result.message}`);
        const workflow = result.workflow;
        const hasProcessData = workflow.nodes.some((n) => n.name === 'Process Data');
        const hasSendEmail = workflow.nodes.some((n) => n.name === 'Send Email');
        if (hasProcessData && hasSendEmail) {
            logger.info('✅ Both nodes were added');
        }
        else {
            logger.error('❌ Nodes were not added correctly');
        }
        const webhookConnections = workflow.connections['Webhook'];
        const processConnections = workflow.connections['Process Data'];
        if (webhookConnections && processConnections) {
            logger.info('✅ Connections were established');
        }
        else {
            logger.error('❌ Connections were not established correctly');
        }
    }
    else {
        logger.error('❌ Test failed!');
        logger.error('Errors:', result.errors);
    }
}
async function testOperationLimit() {
    logger.info('\nTest 2: Operation limit (max 5)');
    const engine = new workflow_diff_engine_1.WorkflowDiffEngine();
    const request = {
        id: testWorkflow.id,
        operations: [
            { type: 'addNode', node: { id: '101', name: 'Node1', type: 'n8n-nodes-base.set', typeVersion: 1, position: [400, 100], parameters: {} } },
            { type: 'addNode', node: { id: '102', name: 'Node2', type: 'n8n-nodes-base.set', typeVersion: 1, position: [400, 200], parameters: {} } },
            { type: 'addNode', node: { id: '103', name: 'Node3', type: 'n8n-nodes-base.set', typeVersion: 1, position: [400, 300], parameters: {} } },
            { type: 'addNode', node: { id: '104', name: 'Node4', type: 'n8n-nodes-base.set', typeVersion: 1, position: [400, 400], parameters: {} } },
            { type: 'addNode', node: { id: '105', name: 'Node5', type: 'n8n-nodes-base.set', typeVersion: 1, position: [400, 500], parameters: {} } },
            { type: 'addNode', node: { id: '106', name: 'Node6', type: 'n8n-nodes-base.set', typeVersion: 1, position: [400, 600], parameters: {} } }
        ]
    };
    const result = await engine.applyDiff(testWorkflow, request);
    if (!result.success && result.errors?.[0]?.message.includes('Too many operations')) {
        logger.info('✅ Operation limit enforced correctly');
    }
    else {
        logger.error('❌ Operation limit not enforced');
    }
}
async function testValidateOnly() {
    logger.info('\nTest 3: Validate only mode');
    const engine = new workflow_diff_engine_1.WorkflowDiffEngine();
    const request = {
        id: testWorkflow.id,
        operations: [
            {
                type: 'addConnection',
                source: 'Webhook',
                target: 'HTTP Request'
            },
            {
                type: 'addNode',
                node: {
                    id: '4',
                    name: 'HTTP Request',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 4.2,
                    position: [400, 300],
                    parameters: {
                        method: 'GET',
                        url: 'https://api.example.com'
                    }
                }
            },
            {
                type: 'updateSettings',
                settings: {
                    saveDataErrorExecution: 'all'
                }
            }
        ],
        validateOnly: true
    };
    const result = await engine.applyDiff(testWorkflow, request);
    if (result.success) {
        logger.info('✅ Validate-only mode works correctly');
        logger.info(`Validation message: ${result.message}`);
        if (testWorkflow.nodes.length === 1) {
            logger.info('✅ Original workflow unchanged');
        }
        else {
            logger.error('❌ Original workflow was modified in validate-only mode');
        }
    }
    else {
        logger.error('❌ Validate-only mode failed');
        logger.error('Errors:', result.errors);
    }
}
async function testMixedOperations() {
    logger.info('\nTest 4: Mixed operations (update existing, add new, connect)');
    const engine = new workflow_diff_engine_1.WorkflowDiffEngine();
    const request = {
        id: testWorkflow.id,
        operations: [
            {
                type: 'updateNode',
                nodeName: 'Webhook',
                changes: {
                    'parameters.path': '/updated-path'
                }
            },
            {
                type: 'addNode',
                node: {
                    id: '5',
                    name: 'Logger',
                    type: 'n8n-nodes-base.n8n',
                    typeVersion: 1,
                    position: [400, 300],
                    parameters: {
                        operation: 'log',
                        level: 'info'
                    }
                }
            },
            {
                type: 'addConnection',
                source: 'Webhook',
                target: 'Logger'
            },
            {
                type: 'updateSettings',
                settings: {
                    saveDataErrorExecution: 'all'
                }
            }
        ]
    };
    const result = await engine.applyDiff(testWorkflow, request);
    if (result.success) {
        logger.info('✅ Mixed operations applied successfully');
        logger.info(`Message: ${result.message}`);
    }
    else {
        logger.error('❌ Mixed operations failed');
        logger.error('Errors:', result.errors);
    }
}
async function runTests() {
    logger.info('Starting transactional diff tests...\n');
    try {
        await testAddNodesAndConnect();
        await testOperationLimit();
        await testValidateOnly();
        await testMixedOperations();
        logger.info('\n✅ All tests completed!');
    }
    catch (error) {
        logger.error('Test suite failed:', error);
    }
}
if (require.main === module) {
    runTests().catch(console.error);
}
//# sourceMappingURL=test-transactional-diff.js.map