"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDiffEngine = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger({ prefix: '[WorkflowDiffEngine]' });
class WorkflowDiffEngine {
    async applyDiff(workflow, request) {
        try {
            if (request.operations.length > 5) {
                return {
                    success: false,
                    errors: [{
                            operation: -1,
                            message: 'Too many operations. Maximum 5 operations allowed per request to ensure transactional integrity.'
                        }]
                };
            }
            const workflowCopy = JSON.parse(JSON.stringify(workflow));
            const nodeOperationTypes = ['addNode', 'removeNode', 'updateNode', 'moveNode', 'enableNode', 'disableNode'];
            const nodeOperations = [];
            const otherOperations = [];
            request.operations.forEach((operation, index) => {
                if (nodeOperationTypes.includes(operation.type)) {
                    nodeOperations.push({ operation, index });
                }
                else {
                    otherOperations.push({ operation, index });
                }
            });
            for (const { operation, index } of nodeOperations) {
                const error = this.validateOperation(workflowCopy, operation);
                if (error) {
                    return {
                        success: false,
                        errors: [{
                                operation: index,
                                message: error,
                                details: operation
                            }]
                    };
                }
                try {
                    this.applyOperation(workflowCopy, operation);
                }
                catch (error) {
                    return {
                        success: false,
                        errors: [{
                                operation: index,
                                message: `Failed to apply operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                details: operation
                            }]
                    };
                }
            }
            for (const { operation, index } of otherOperations) {
                const error = this.validateOperation(workflowCopy, operation);
                if (error) {
                    return {
                        success: false,
                        errors: [{
                                operation: index,
                                message: error,
                                details: operation
                            }]
                    };
                }
                try {
                    this.applyOperation(workflowCopy, operation);
                }
                catch (error) {
                    return {
                        success: false,
                        errors: [{
                                operation: index,
                                message: `Failed to apply operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                details: operation
                            }]
                    };
                }
            }
            if (request.validateOnly) {
                return {
                    success: true,
                    message: 'Validation successful. Operations are valid but not applied.'
                };
            }
            const operationsApplied = request.operations.length;
            return {
                success: true,
                workflow: workflowCopy,
                operationsApplied,
                message: `Successfully applied ${operationsApplied} operations (${nodeOperations.length} node ops, ${otherOperations.length} other ops)`
            };
        }
        catch (error) {
            logger.error('Failed to apply diff', error);
            return {
                success: false,
                errors: [{
                        operation: -1,
                        message: `Diff engine error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }]
            };
        }
    }
    validateOperation(workflow, operation) {
        switch (operation.type) {
            case 'addNode':
                return this.validateAddNode(workflow, operation);
            case 'removeNode':
                return this.validateRemoveNode(workflow, operation);
            case 'updateNode':
                return this.validateUpdateNode(workflow, operation);
            case 'moveNode':
                return this.validateMoveNode(workflow, operation);
            case 'enableNode':
            case 'disableNode':
                return this.validateToggleNode(workflow, operation);
            case 'addConnection':
                return this.validateAddConnection(workflow, operation);
            case 'removeConnection':
                return this.validateRemoveConnection(workflow, operation);
            case 'updateConnection':
                return this.validateUpdateConnection(workflow, operation);
            case 'updateSettings':
            case 'updateName':
            case 'addTag':
            case 'removeTag':
                return null;
            default:
                return `Unknown operation type: ${operation.type}`;
        }
    }
    applyOperation(workflow, operation) {
        switch (operation.type) {
            case 'addNode':
                this.applyAddNode(workflow, operation);
                break;
            case 'removeNode':
                this.applyRemoveNode(workflow, operation);
                break;
            case 'updateNode':
                this.applyUpdateNode(workflow, operation);
                break;
            case 'moveNode':
                this.applyMoveNode(workflow, operation);
                break;
            case 'enableNode':
                this.applyEnableNode(workflow, operation);
                break;
            case 'disableNode':
                this.applyDisableNode(workflow, operation);
                break;
            case 'addConnection':
                this.applyAddConnection(workflow, operation);
                break;
            case 'removeConnection':
                this.applyRemoveConnection(workflow, operation);
                break;
            case 'updateConnection':
                this.applyUpdateConnection(workflow, operation);
                break;
            case 'updateSettings':
                this.applyUpdateSettings(workflow, operation);
                break;
            case 'updateName':
                this.applyUpdateName(workflow, operation);
                break;
            case 'addTag':
                this.applyAddTag(workflow, operation);
                break;
            case 'removeTag':
                this.applyRemoveTag(workflow, operation);
                break;
        }
    }
    validateAddNode(workflow, operation) {
        const { node } = operation;
        if (workflow.nodes.some(n => n.name === node.name)) {
            return `Node with name "${node.name}" already exists`;
        }
        if (!node.type.includes('.')) {
            return `Invalid node type "${node.type}". Must include package prefix (e.g., "n8n-nodes-base.webhook")`;
        }
        if (node.type.startsWith('nodes-base.')) {
            return `Invalid node type "${node.type}". Use "n8n-nodes-base.${node.type.substring(11)}" instead`;
        }
        return null;
    }
    validateRemoveNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node) {
            return `Node not found: ${operation.nodeId || operation.nodeName}`;
        }
        const hasConnections = Object.values(workflow.connections).some(conn => {
            return Object.values(conn).some(outputs => outputs.some(connections => connections.some(c => c.node === node.name)));
        });
        if (hasConnections || workflow.connections[node.name]) {
            logger.warn(`Removing node "${node.name}" will break existing connections`);
        }
        return null;
    }
    validateUpdateNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node) {
            return `Node not found: ${operation.nodeId || operation.nodeName}`;
        }
        return null;
    }
    validateMoveNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node) {
            return `Node not found: ${operation.nodeId || operation.nodeName}`;
        }
        return null;
    }
    validateToggleNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node) {
            return `Node not found: ${operation.nodeId || operation.nodeName}`;
        }
        return null;
    }
    validateAddConnection(workflow, operation) {
        const sourceNode = this.findNode(workflow, operation.source, operation.source);
        const targetNode = this.findNode(workflow, operation.target, operation.target);
        if (!sourceNode) {
            return `Source node not found: ${operation.source}`;
        }
        if (!targetNode) {
            return `Target node not found: ${operation.target}`;
        }
        const sourceOutput = operation.sourceOutput || 'main';
        const existing = workflow.connections[sourceNode.name]?.[sourceOutput];
        if (existing) {
            const hasConnection = existing.some(connections => connections.some(c => c.node === targetNode.name));
            if (hasConnection) {
                return `Connection already exists from "${sourceNode.name}" to "${targetNode.name}"`;
            }
        }
        return null;
    }
    validateRemoveConnection(workflow, operation) {
        const sourceNode = this.findNode(workflow, operation.source, operation.source);
        const targetNode = this.findNode(workflow, operation.target, operation.target);
        if (!sourceNode) {
            return `Source node not found: ${operation.source}`;
        }
        if (!targetNode) {
            return `Target node not found: ${operation.target}`;
        }
        const sourceOutput = operation.sourceOutput || 'main';
        const connections = workflow.connections[sourceNode.name]?.[sourceOutput];
        if (!connections) {
            return `No connections found from "${sourceNode.name}"`;
        }
        const hasConnection = connections.some(conns => conns.some(c => c.node === targetNode.name));
        if (!hasConnection) {
            return `No connection exists from "${sourceNode.name}" to "${targetNode.name}"`;
        }
        return null;
    }
    validateUpdateConnection(workflow, operation) {
        const sourceNode = this.findNode(workflow, operation.source, operation.source);
        const targetNode = this.findNode(workflow, operation.target, operation.target);
        if (!sourceNode) {
            return `Source node not found: ${operation.source}`;
        }
        if (!targetNode) {
            return `Target node not found: ${operation.target}`;
        }
        const existingConnections = workflow.connections[sourceNode.name];
        if (!existingConnections) {
            return `No connections found from "${sourceNode.name}"`;
        }
        let hasConnection = false;
        Object.values(existingConnections).forEach(outputs => {
            outputs.forEach(connections => {
                if (connections.some(c => c.node === targetNode.name)) {
                    hasConnection = true;
                }
            });
        });
        if (!hasConnection) {
            return `No connection exists from "${sourceNode.name}" to "${targetNode.name}"`;
        }
        return null;
    }
    applyAddNode(workflow, operation) {
        const newNode = {
            id: operation.node.id || (0, uuid_1.v4)(),
            name: operation.node.name,
            type: operation.node.type,
            typeVersion: operation.node.typeVersion || 1,
            position: operation.node.position,
            parameters: operation.node.parameters || {},
            credentials: operation.node.credentials,
            disabled: operation.node.disabled,
            notes: operation.node.notes,
            notesInFlow: operation.node.notesInFlow,
            continueOnFail: operation.node.continueOnFail,
            retryOnFail: operation.node.retryOnFail,
            maxTries: operation.node.maxTries,
            waitBetweenTries: operation.node.waitBetweenTries,
            alwaysOutputData: operation.node.alwaysOutputData,
            executeOnce: operation.node.executeOnce
        };
        workflow.nodes.push(newNode);
    }
    applyRemoveNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node)
            return;
        const index = workflow.nodes.findIndex(n => n.id === node.id);
        if (index !== -1) {
            workflow.nodes.splice(index, 1);
        }
        delete workflow.connections[node.name];
        Object.keys(workflow.connections).forEach(sourceName => {
            const sourceConnections = workflow.connections[sourceName];
            Object.keys(sourceConnections).forEach(outputName => {
                sourceConnections[outputName] = sourceConnections[outputName].map(connections => connections.filter(conn => conn.node !== node.name)).filter(connections => connections.length > 0);
                if (sourceConnections[outputName].length === 0) {
                    delete sourceConnections[outputName];
                }
            });
            if (Object.keys(sourceConnections).length === 0) {
                delete workflow.connections[sourceName];
            }
        });
    }
    applyUpdateNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node)
            return;
        Object.entries(operation.changes).forEach(([path, value]) => {
            this.setNestedProperty(node, path, value);
        });
    }
    applyMoveNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node)
            return;
        node.position = operation.position;
    }
    applyEnableNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node)
            return;
        node.disabled = false;
    }
    applyDisableNode(workflow, operation) {
        const node = this.findNode(workflow, operation.nodeId, operation.nodeName);
        if (!node)
            return;
        node.disabled = true;
    }
    applyAddConnection(workflow, operation) {
        const sourceNode = this.findNode(workflow, operation.source, operation.source);
        const targetNode = this.findNode(workflow, operation.target, operation.target);
        if (!sourceNode || !targetNode)
            return;
        const sourceOutput = operation.sourceOutput || 'main';
        const targetInput = operation.targetInput || 'main';
        const sourceIndex = operation.sourceIndex || 0;
        const targetIndex = operation.targetIndex || 0;
        if (!workflow.connections[sourceNode.name]) {
            workflow.connections[sourceNode.name] = {};
        }
        if (!workflow.connections[sourceNode.name][sourceOutput]) {
            workflow.connections[sourceNode.name][sourceOutput] = [];
        }
        while (workflow.connections[sourceNode.name][sourceOutput].length <= sourceIndex) {
            workflow.connections[sourceNode.name][sourceOutput].push([]);
        }
        workflow.connections[sourceNode.name][sourceOutput][sourceIndex].push({
            node: targetNode.name,
            type: targetInput,
            index: targetIndex
        });
    }
    applyRemoveConnection(workflow, operation) {
        const sourceNode = this.findNode(workflow, operation.source, operation.source);
        const targetNode = this.findNode(workflow, operation.target, operation.target);
        if (!sourceNode || !targetNode)
            return;
        const sourceOutput = operation.sourceOutput || 'main';
        const connections = workflow.connections[sourceNode.name]?.[sourceOutput];
        if (!connections)
            return;
        workflow.connections[sourceNode.name][sourceOutput] = connections.map(conns => conns.filter(conn => conn.node !== targetNode.name));
        workflow.connections[sourceNode.name][sourceOutput] =
            workflow.connections[sourceNode.name][sourceOutput].filter(conns => conns.length > 0);
        if (workflow.connections[sourceNode.name][sourceOutput].length === 0) {
            delete workflow.connections[sourceNode.name][sourceOutput];
        }
        if (Object.keys(workflow.connections[sourceNode.name]).length === 0) {
            delete workflow.connections[sourceNode.name];
        }
    }
    applyUpdateConnection(workflow, operation) {
        this.applyRemoveConnection(workflow, {
            type: 'removeConnection',
            source: operation.source,
            target: operation.target,
            sourceOutput: operation.changes.sourceOutput,
            targetInput: operation.changes.targetInput
        });
        this.applyAddConnection(workflow, {
            type: 'addConnection',
            source: operation.source,
            target: operation.target,
            sourceOutput: operation.changes.sourceOutput,
            targetInput: operation.changes.targetInput,
            sourceIndex: operation.changes.sourceIndex,
            targetIndex: operation.changes.targetIndex
        });
    }
    applyUpdateSettings(workflow, operation) {
        if (!workflow.settings) {
            workflow.settings = {};
        }
        Object.assign(workflow.settings, operation.settings);
    }
    applyUpdateName(workflow, operation) {
        workflow.name = operation.name;
    }
    applyAddTag(workflow, operation) {
        if (!workflow.tags) {
            workflow.tags = [];
        }
        if (!workflow.tags.includes(operation.tag)) {
            workflow.tags.push(operation.tag);
        }
    }
    applyRemoveTag(workflow, operation) {
        if (!workflow.tags)
            return;
        const index = workflow.tags.indexOf(operation.tag);
        if (index !== -1) {
            workflow.tags.splice(index, 1);
        }
    }
    findNode(workflow, nodeId, nodeName) {
        if (nodeId) {
            const nodeById = workflow.nodes.find(n => n.id === nodeId);
            if (nodeById)
                return nodeById;
        }
        if (nodeName) {
            const nodeByName = workflow.nodes.find(n => n.name === nodeName);
            if (nodeByName)
                return nodeByName;
        }
        if (nodeId && !nodeName) {
            const nodeByName = workflow.nodes.find(n => n.name === nodeId);
            if (nodeByName)
                return nodeByName;
        }
        return null;
    }
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }
}
exports.WorkflowDiffEngine = WorkflowDiffEngine;
//# sourceMappingURL=workflow-diff-engine.js.map