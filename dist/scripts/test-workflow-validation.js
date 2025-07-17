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
const logger = new logger_1.Logger({ prefix: '[test-workflow-validation]' });
const VALID_WORKFLOW = {
    name: 'Test Valid Workflow',
    nodes: [
        {
            id: '1',
            name: 'Schedule Trigger',
            type: 'nodes-base.scheduleTrigger',
            position: [250, 300],
            parameters: {
                rule: {
                    interval: [{ field: 'hours', hoursInterval: 1 }]
                }
            }
        },
        {
            id: '2',
            name: 'HTTP Request',
            type: 'nodes-base.httpRequest',
            position: [450, 300],
            parameters: {
                url: 'https://api.example.com/data',
                method: 'GET'
            }
        },
        {
            id: '3',
            name: 'Set',
            type: 'nodes-base.set',
            position: [650, 300],
            parameters: {
                values: {
                    string: [
                        {
                            name: 'status',
                            value: '={{ $json.status }}'
                        }
                    ]
                }
            }
        }
    ],
    connections: {
        'Schedule Trigger': {
            main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
        },
        'HTTP Request': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
        }
    }
};
const WORKFLOW_WITH_CYCLE = {
    name: 'Workflow with Cycle',
    nodes: [
        {
            id: '1',
            name: 'Start',
            type: 'nodes-base.start',
            position: [250, 300],
            parameters: {}
        },
        {
            id: '2',
            name: 'Node A',
            type: 'nodes-base.set',
            position: [450, 300],
            parameters: { values: { string: [] } }
        },
        {
            id: '3',
            name: 'Node B',
            type: 'nodes-base.set',
            position: [650, 300],
            parameters: { values: { string: [] } }
        }
    ],
    connections: {
        'Start': {
            main: [[{ node: 'Node A', type: 'main', index: 0 }]]
        },
        'Node A': {
            main: [[{ node: 'Node B', type: 'main', index: 0 }]]
        },
        'Node B': {
            main: [[{ node: 'Node A', type: 'main', index: 0 }]]
        }
    }
};
const WORKFLOW_WITH_INVALID_EXPRESSION = {
    name: 'Workflow with Invalid Expression',
    nodes: [
        {
            id: '1',
            name: 'Webhook',
            type: 'nodes-base.webhook',
            position: [250, 300],
            parameters: {
                path: 'test-webhook'
            }
        },
        {
            id: '2',
            name: 'Set Data',
            type: 'nodes-base.set',
            position: [450, 300],
            parameters: {
                values: {
                    string: [
                        {
                            name: 'invalidExpression',
                            value: '={{ json.field }}'
                        },
                        {
                            name: 'nestedExpression',
                            value: '={{ {{ $json.field }} }}'
                        },
                        {
                            name: 'nodeReference',
                            value: '={{ $node["Non Existent Node"].json.data }}'
                        }
                    ]
                }
            }
        }
    ],
    connections: {
        'Webhook': {
            main: [[{ node: 'Set Data', type: 'main', index: 0 }]]
        }
    }
};
const WORKFLOW_WITH_ORPHANED_NODE = {
    name: 'Workflow with Orphaned Node',
    nodes: [
        {
            id: '1',
            name: 'Schedule Trigger',
            type: 'nodes-base.scheduleTrigger',
            position: [250, 300],
            parameters: {
                rule: { interval: [{ field: 'hours', hoursInterval: 1 }] }
            }
        },
        {
            id: '2',
            name: 'HTTP Request',
            type: 'nodes-base.httpRequest',
            position: [450, 300],
            parameters: {
                url: 'https://api.example.com',
                method: 'GET'
            }
        },
        {
            id: '3',
            name: 'Orphaned Node',
            type: 'nodes-base.set',
            position: [450, 500],
            parameters: {
                values: { string: [] }
            }
        }
    ],
    connections: {
        'Schedule Trigger': {
            main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
        }
    }
};
async function testWorkflowValidation() {
    logger.info('Starting workflow validation tests...\n');
    const dbPath = path_1.default.join(process.cwd(), 'data', 'nodes.db');
    if (!(0, fs_1.existsSync)(dbPath)) {
        logger.error('Database not found. Run npm run rebuild first.');
        process.exit(1);
    }
    const db = await (0, database_adapter_1.createDatabaseAdapter)(dbPath);
    const repository = new node_repository_1.NodeRepository(db);
    const validator = new workflow_validator_1.WorkflowValidator(repository, enhanced_config_validator_1.EnhancedConfigValidator);
    logger.info('Test 1: Validating a valid workflow');
    const validResult = await validator.validateWorkflow(VALID_WORKFLOW);
    console.log('Valid workflow result:', JSON.stringify(validResult, null, 2));
    console.log('---\n');
    logger.info('Test 2: Validating workflow with cycle');
    const cycleResult = await validator.validateWorkflow(WORKFLOW_WITH_CYCLE);
    console.log('Cycle workflow result:', JSON.stringify(cycleResult, null, 2));
    console.log('---\n');
    logger.info('Test 3: Validating workflow with invalid expressions');
    const expressionResult = await validator.validateWorkflow(WORKFLOW_WITH_INVALID_EXPRESSION);
    console.log('Invalid expression result:', JSON.stringify(expressionResult, null, 2));
    console.log('---\n');
    logger.info('Test 4: Validating workflow with orphaned node');
    const orphanedResult = await validator.validateWorkflow(WORKFLOW_WITH_ORPHANED_NODE);
    console.log('Orphaned node result:', JSON.stringify(orphanedResult, null, 2));
    console.log('---\n');
    logger.info('Test 5: Testing connection-only validation');
    const connectionOnlyResult = await validator.validateWorkflow(WORKFLOW_WITH_CYCLE, {
        validateNodes: false,
        validateConnections: true,
        validateExpressions: false
    });
    console.log('Connection-only result:', JSON.stringify(connectionOnlyResult, null, 2));
    console.log('---\n');
    logger.info('Test 6: Testing expression-only validation');
    const expressionOnlyResult = await validator.validateWorkflow(WORKFLOW_WITH_INVALID_EXPRESSION, {
        validateNodes: false,
        validateConnections: false,
        validateExpressions: true
    });
    console.log('Expression-only result:', JSON.stringify(expressionOnlyResult, null, 2));
    console.log('---\n');
    logger.info('Test Summary:');
    console.log('✓ Valid workflow:', validResult.valid ? 'PASSED' : 'FAILED');
    console.log('✓ Cycle detection:', !cycleResult.valid ? 'PASSED' : 'FAILED');
    console.log('✓ Expression validation:', !expressionResult.valid ? 'PASSED' : 'FAILED');
    console.log('✓ Orphaned node detection:', orphanedResult.warnings.length > 0 ? 'PASSED' : 'FAILED');
    console.log('✓ Connection-only validation:', connectionOnlyResult.errors.length > 0 ? 'PASSED' : 'FAILED');
    console.log('✓ Expression-only validation:', expressionOnlyResult.errors.length > 0 ? 'PASSED' : 'FAILED');
    db.close();
}
testWorkflowValidation().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-workflow-validation.js.map