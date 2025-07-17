"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const expression_validator_1 = require("./expression-validator");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger({ prefix: '[WorkflowValidator]' });
class WorkflowValidator {
    constructor(nodeRepository, nodeValidator) {
        this.nodeRepository = nodeRepository;
        this.nodeValidator = nodeValidator;
    }
    async validateWorkflow(workflow, options = {}) {
        const { validateNodes = true, validateConnections = true, validateExpressions = true, profile = 'runtime' } = options;
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            statistics: {
                totalNodes: workflow.nodes.length,
                enabledNodes: workflow.nodes.filter(n => !n.disabled).length,
                triggerNodes: 0,
                validConnections: 0,
                invalidConnections: 0,
                expressionsValidated: 0,
            },
            suggestions: []
        };
        try {
            this.validateWorkflowStructure(workflow, result);
            if (validateNodes) {
                await this.validateAllNodes(workflow, result, profile);
            }
            if (validateConnections) {
                this.validateConnections(workflow, result);
            }
            if (validateExpressions) {
                this.validateExpressions(workflow, result);
            }
            this.checkWorkflowPatterns(workflow, result);
            this.generateSuggestions(workflow, result);
        }
        catch (error) {
            logger.error('Error validating workflow:', error);
            result.errors.push({
                type: 'error',
                message: `Workflow validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
        result.valid = result.errors.length === 0;
        return result;
    }
    validateWorkflowStructure(workflow, result) {
        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
            result.errors.push({
                type: 'error',
                message: 'Workflow must have a nodes array'
            });
            return;
        }
        if (!workflow.connections || typeof workflow.connections !== 'object') {
            result.errors.push({
                type: 'error',
                message: 'Workflow must have a connections object'
            });
            return;
        }
        if (workflow.nodes.length === 0) {
            result.errors.push({
                type: 'error',
                message: 'Workflow has no nodes'
            });
            return;
        }
        if (workflow.nodes.length === 1) {
            const singleNode = workflow.nodes[0];
            const normalizedType = singleNode.type.replace('n8n-nodes-base.', 'nodes-base.');
            const isWebhook = normalizedType === 'nodes-base.webhook' ||
                normalizedType === 'nodes-base.webhookTrigger';
            if (!isWebhook) {
                result.errors.push({
                    type: 'error',
                    message: 'Single-node workflows are only valid for webhook endpoints. Add at least one more connected node to create a functional workflow.'
                });
            }
            else if (Object.keys(workflow.connections).length === 0) {
                result.warnings.push({
                    type: 'warning',
                    message: 'Webhook node has no connections. Consider adding nodes to process the webhook data.'
                });
            }
        }
        if (workflow.nodes.length > 1) {
            const hasEnabledNodes = workflow.nodes.some(n => !n.disabled);
            const hasConnections = Object.keys(workflow.connections).length > 0;
            if (hasEnabledNodes && !hasConnections) {
                result.errors.push({
                    type: 'error',
                    message: 'Multi-node workflow has no connections. Nodes must be connected to create a workflow. Use connections: { "Source Node Name": { "main": [[{ "node": "Target Node Name", "type": "main", "index": 0 }]] } }'
                });
            }
        }
        const nodeNames = new Set();
        const nodeIds = new Set();
        for (const node of workflow.nodes) {
            if (nodeNames.has(node.name)) {
                result.errors.push({
                    type: 'error',
                    nodeId: node.id,
                    nodeName: node.name,
                    message: `Duplicate node name: "${node.name}"`
                });
            }
            nodeNames.add(node.name);
            if (nodeIds.has(node.id)) {
                result.errors.push({
                    type: 'error',
                    nodeId: node.id,
                    message: `Duplicate node ID: "${node.id}"`
                });
            }
            nodeIds.add(node.id);
        }
        const triggerNodes = workflow.nodes.filter(n => {
            const normalizedType = n.type.replace('n8n-nodes-base.', 'nodes-base.');
            return normalizedType.toLowerCase().includes('trigger') ||
                normalizedType.toLowerCase().includes('webhook') ||
                normalizedType === 'nodes-base.start' ||
                normalizedType === 'nodes-base.manualTrigger' ||
                normalizedType === 'nodes-base.formTrigger';
        });
        result.statistics.triggerNodes = triggerNodes.length;
        if (triggerNodes.length === 0 && workflow.nodes.filter(n => !n.disabled).length > 0) {
            result.warnings.push({
                type: 'warning',
                message: 'Workflow has no trigger nodes. It can only be executed manually.'
            });
        }
    }
    async validateAllNodes(workflow, result, profile) {
        for (const node of workflow.nodes) {
            if (node.disabled)
                continue;
            try {
                if (node.type.startsWith('nodes-base.')) {
                    const correctType = node.type.replace('nodes-base.', 'n8n-nodes-base.');
                    result.errors.push({
                        type: 'error',
                        nodeId: node.id,
                        nodeName: node.name,
                        message: `Invalid node type: "${node.type}". Use "${correctType}" instead. Node types in workflows must use the full package name.`
                    });
                    continue;
                }
                let nodeInfo = this.nodeRepository.getNode(node.type);
                if (!nodeInfo) {
                    let normalizedType = node.type;
                    if (node.type.startsWith('n8n-nodes-base.')) {
                        normalizedType = node.type.replace('n8n-nodes-base.', 'nodes-base.');
                        nodeInfo = this.nodeRepository.getNode(normalizedType);
                    }
                    else if (node.type.startsWith('@n8n/n8n-nodes-langchain.')) {
                        normalizedType = node.type.replace('@n8n/n8n-nodes-langchain.', 'nodes-langchain.');
                        nodeInfo = this.nodeRepository.getNode(normalizedType);
                    }
                }
                if (!nodeInfo) {
                    let suggestion = '';
                    if (node.type.startsWith('nodes-base.')) {
                        const withPrefix = node.type.replace('nodes-base.', 'n8n-nodes-base.');
                        const exists = this.nodeRepository.getNode(withPrefix) ||
                            this.nodeRepository.getNode(withPrefix.replace('n8n-nodes-base.', 'nodes-base.'));
                        if (exists) {
                            suggestion = ` Did you mean "n8n-nodes-base.${node.type.substring(11)}"?`;
                        }
                    }
                    else if (!node.type.includes('.')) {
                        const commonNodes = [
                            'webhook', 'httpRequest', 'set', 'code', 'manualTrigger',
                            'scheduleTrigger', 'emailSend', 'slack', 'discord'
                        ];
                        if (commonNodes.includes(node.type)) {
                            suggestion = ` Did you mean "n8n-nodes-base.${node.type}"?`;
                        }
                    }
                    if (!suggestion) {
                        const similarNodes = this.findSimilarNodeTypes(node.type);
                        if (similarNodes.length > 0) {
                            suggestion = ` Did you mean: ${similarNodes.map(n => `"${n}"`).join(', ')}?`;
                        }
                    }
                    result.errors.push({
                        type: 'error',
                        nodeId: node.id,
                        nodeName: node.name,
                        message: `Unknown node type: "${node.type}".${suggestion} Node types must include the package prefix (e.g., "n8n-nodes-base.webhook", not "webhook" or "nodes-base.webhook").`
                    });
                    continue;
                }
                if (nodeInfo.isVersioned) {
                    if (!node.typeVersion) {
                        result.errors.push({
                            type: 'error',
                            nodeId: node.id,
                            nodeName: node.name,
                            message: `Missing required property 'typeVersion'. Add typeVersion: ${nodeInfo.version || 1}`
                        });
                    }
                    else if (typeof node.typeVersion !== 'number' || node.typeVersion < 1) {
                        result.errors.push({
                            type: 'error',
                            nodeId: node.id,
                            nodeName: node.name,
                            message: `Invalid typeVersion: ${node.typeVersion}. Must be a positive number`
                        });
                    }
                    else if (nodeInfo.version && node.typeVersion < nodeInfo.version) {
                        result.warnings.push({
                            type: 'warning',
                            nodeId: node.id,
                            nodeName: node.name,
                            message: `Outdated typeVersion: ${node.typeVersion}. Latest is ${nodeInfo.version}`
                        });
                    }
                    else if (nodeInfo.version && node.typeVersion > nodeInfo.version) {
                        result.errors.push({
                            type: 'error',
                            nodeId: node.id,
                            nodeName: node.name,
                            message: `typeVersion ${node.typeVersion} exceeds maximum supported version ${nodeInfo.version}`
                        });
                    }
                }
                const nodeValidation = this.nodeValidator.validateWithMode(node.type, node.parameters, nodeInfo.properties || [], 'operation', profile);
                nodeValidation.errors.forEach((error) => {
                    result.errors.push({
                        type: 'error',
                        nodeId: node.id,
                        nodeName: node.name,
                        message: error
                    });
                });
                nodeValidation.warnings.forEach((warning) => {
                    result.warnings.push({
                        type: 'warning',
                        nodeId: node.id,
                        nodeName: node.name,
                        message: warning
                    });
                });
            }
            catch (error) {
                result.errors.push({
                    type: 'error',
                    nodeId: node.id,
                    nodeName: node.name,
                    message: `Failed to validate node: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }
    }
    validateConnections(workflow, result) {
        const nodeMap = new Map(workflow.nodes.map(n => [n.name, n]));
        const nodeIdMap = new Map(workflow.nodes.map(n => [n.id, n]));
        for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
            const sourceNode = nodeMap.get(sourceName);
            if (!sourceNode) {
                const nodeById = nodeIdMap.get(sourceName);
                if (nodeById) {
                    result.errors.push({
                        type: 'error',
                        nodeId: nodeById.id,
                        nodeName: nodeById.name,
                        message: `Connection uses node ID '${sourceName}' instead of node name '${nodeById.name}'. In n8n, connections must use node names, not IDs.`
                    });
                }
                else {
                    result.errors.push({
                        type: 'error',
                        message: `Connection from non-existent node: "${sourceName}"`
                    });
                }
                result.statistics.invalidConnections++;
                continue;
            }
            if (outputs.main) {
                this.validateConnectionOutputs(sourceName, outputs.main, nodeMap, nodeIdMap, result, 'main');
            }
            if (outputs.error) {
                this.validateConnectionOutputs(sourceName, outputs.error, nodeMap, nodeIdMap, result, 'error');
            }
            if (outputs.ai_tool) {
                this.validateConnectionOutputs(sourceName, outputs.ai_tool, nodeMap, nodeIdMap, result, 'ai_tool');
            }
        }
        const connectedNodes = new Set();
        Object.keys(workflow.connections).forEach(name => connectedNodes.add(name));
        Object.values(workflow.connections).forEach(outputs => {
            if (outputs.main) {
                outputs.main.flat().forEach(conn => {
                    if (conn)
                        connectedNodes.add(conn.node);
                });
            }
            if (outputs.error) {
                outputs.error.flat().forEach(conn => {
                    if (conn)
                        connectedNodes.add(conn.node);
                });
            }
            if (outputs.ai_tool) {
                outputs.ai_tool.flat().forEach(conn => {
                    if (conn)
                        connectedNodes.add(conn.node);
                });
            }
        });
        for (const node of workflow.nodes) {
            if (node.disabled)
                continue;
            const normalizedType = node.type.replace('n8n-nodes-base.', 'nodes-base.');
            const isTrigger = normalizedType.toLowerCase().includes('trigger') ||
                normalizedType.toLowerCase().includes('webhook') ||
                normalizedType === 'nodes-base.start' ||
                normalizedType === 'nodes-base.manualTrigger' ||
                normalizedType === 'nodes-base.formTrigger';
            if (!connectedNodes.has(node.name) && !isTrigger) {
                result.warnings.push({
                    type: 'warning',
                    nodeId: node.id,
                    nodeName: node.name,
                    message: 'Node is not connected to any other nodes'
                });
            }
        }
        if (this.hasCycle(workflow)) {
            result.errors.push({
                type: 'error',
                message: 'Workflow contains a cycle (infinite loop)'
            });
        }
    }
    validateConnectionOutputs(sourceName, outputs, nodeMap, nodeIdMap, result, outputType) {
        outputs.forEach((outputConnections, outputIndex) => {
            if (!outputConnections)
                return;
            outputConnections.forEach(connection => {
                const targetNode = nodeMap.get(connection.node);
                if (!targetNode) {
                    const nodeById = nodeIdMap.get(connection.node);
                    if (nodeById) {
                        result.errors.push({
                            type: 'error',
                            nodeId: nodeById.id,
                            nodeName: nodeById.name,
                            message: `Connection target uses node ID '${connection.node}' instead of node name '${nodeById.name}' (from ${sourceName}). In n8n, connections must use node names, not IDs.`
                        });
                    }
                    else {
                        result.errors.push({
                            type: 'error',
                            message: `Connection to non-existent node: "${connection.node}" from "${sourceName}"`
                        });
                    }
                    result.statistics.invalidConnections++;
                }
                else if (targetNode.disabled) {
                    result.warnings.push({
                        type: 'warning',
                        message: `Connection to disabled node: "${connection.node}" from "${sourceName}"`
                    });
                }
                else {
                    result.statistics.validConnections++;
                    if (outputType === 'ai_tool') {
                        this.validateAIToolConnection(sourceName, targetNode, result);
                    }
                }
            });
        });
    }
    validateAIToolConnection(sourceName, targetNode, result) {
        let targetNodeInfo = this.nodeRepository.getNode(targetNode.type);
        if (!targetNodeInfo) {
            let normalizedType = targetNode.type;
            if (targetNode.type.startsWith('n8n-nodes-base.')) {
                normalizedType = targetNode.type.replace('n8n-nodes-base.', 'nodes-base.');
                targetNodeInfo = this.nodeRepository.getNode(normalizedType);
            }
            else if (targetNode.type.startsWith('@n8n/n8n-nodes-langchain.')) {
                normalizedType = targetNode.type.replace('@n8n/n8n-nodes-langchain.', 'nodes-langchain.');
                targetNodeInfo = this.nodeRepository.getNode(normalizedType);
            }
        }
        if (targetNodeInfo && !targetNodeInfo.isAITool && targetNodeInfo.package !== 'n8n-nodes-base') {
            result.warnings.push({
                type: 'warning',
                nodeId: targetNode.id,
                nodeName: targetNode.name,
                message: `Community node "${targetNode.name}" is being used as an AI tool. Ensure N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true is set.`
            });
        }
    }
    hasCycle(workflow) {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycleDFS = (nodeName) => {
            visited.add(nodeName);
            recursionStack.add(nodeName);
            const connections = workflow.connections[nodeName];
            if (connections) {
                const allTargets = [];
                if (connections.main) {
                    connections.main.flat().forEach(conn => {
                        if (conn)
                            allTargets.push(conn.node);
                    });
                }
                if (connections.error) {
                    connections.error.flat().forEach(conn => {
                        if (conn)
                            allTargets.push(conn.node);
                    });
                }
                if (connections.ai_tool) {
                    connections.ai_tool.flat().forEach(conn => {
                        if (conn)
                            allTargets.push(conn.node);
                    });
                }
                for (const target of allTargets) {
                    if (!visited.has(target)) {
                        if (hasCycleDFS(target))
                            return true;
                    }
                    else if (recursionStack.has(target)) {
                        return true;
                    }
                }
            }
            recursionStack.delete(nodeName);
            return false;
        };
        for (const node of workflow.nodes) {
            if (!visited.has(node.name)) {
                if (hasCycleDFS(node.name))
                    return true;
            }
        }
        return false;
    }
    validateExpressions(workflow, result) {
        const nodeNames = workflow.nodes.map(n => n.name);
        for (const node of workflow.nodes) {
            if (node.disabled)
                continue;
            const context = {
                availableNodes: nodeNames.filter(n => n !== node.name),
                currentNodeName: node.name,
                hasInputData: this.nodeHasInput(node.name, workflow),
                isInLoop: false
            };
            const exprValidation = expression_validator_1.ExpressionValidator.validateNodeExpressions(node.parameters, context);
            result.statistics.expressionsValidated += exprValidation.usedVariables.size;
            exprValidation.errors.forEach(error => {
                result.errors.push({
                    type: 'error',
                    nodeId: node.id,
                    nodeName: node.name,
                    message: `Expression error: ${error}`
                });
            });
            exprValidation.warnings.forEach(warning => {
                result.warnings.push({
                    type: 'warning',
                    nodeId: node.id,
                    nodeName: node.name,
                    message: `Expression warning: ${warning}`
                });
            });
        }
    }
    nodeHasInput(nodeName, workflow) {
        for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
            if (outputs.main) {
                for (const outputConnections of outputs.main) {
                    if (outputConnections?.some(conn => conn.node === nodeName)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    checkWorkflowPatterns(workflow, result) {
        const hasErrorHandling = Object.values(workflow.connections).some(outputs => outputs.error && outputs.error.length > 0);
        if (!hasErrorHandling && workflow.nodes.length > 3) {
            result.warnings.push({
                type: 'warning',
                message: 'Consider adding error handling to your workflow'
            });
        }
        const linearChainLength = this.getLongestLinearChain(workflow);
        if (linearChainLength > 10) {
            result.warnings.push({
                type: 'warning',
                message: `Long linear chain detected (${linearChainLength} nodes). Consider breaking into sub-workflows.`
            });
        }
        for (const node of workflow.nodes) {
            if (node.credentials && Object.keys(node.credentials).length > 0) {
                for (const [credType, credConfig] of Object.entries(node.credentials)) {
                    if (!credConfig || (typeof credConfig === 'object' && !('id' in credConfig))) {
                        result.warnings.push({
                            type: 'warning',
                            nodeId: node.id,
                            nodeName: node.name,
                            message: `Missing credentials configuration for ${credType}`
                        });
                    }
                }
            }
        }
        const aiAgentNodes = workflow.nodes.filter(n => n.type.toLowerCase().includes('agent') ||
            n.type.includes('langchain.agent'));
        if (aiAgentNodes.length > 0) {
            for (const agentNode of aiAgentNodes) {
                const connections = workflow.connections[agentNode.name];
                if (!connections?.ai_tool || connections.ai_tool.flat().filter(c => c).length === 0) {
                    result.warnings.push({
                        type: 'warning',
                        nodeId: agentNode.id,
                        nodeName: agentNode.name,
                        message: 'AI Agent has no tools connected. Consider adding tools to enhance agent capabilities.'
                    });
                }
            }
            const hasAIToolConnections = Object.values(workflow.connections).some(outputs => outputs.ai_tool && outputs.ai_tool.length > 0);
            if (hasAIToolConnections) {
                result.suggestions.push('For community nodes used as AI tools, ensure N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true is set');
            }
        }
    }
    getLongestLinearChain(workflow) {
        const memo = new Map();
        const visiting = new Set();
        const getChainLength = (nodeName) => {
            if (visiting.has(nodeName))
                return 0;
            if (memo.has(nodeName))
                return memo.get(nodeName);
            visiting.add(nodeName);
            let maxLength = 0;
            const connections = workflow.connections[nodeName];
            if (connections?.main) {
                for (const outputConnections of connections.main) {
                    if (outputConnections) {
                        for (const conn of outputConnections) {
                            const length = getChainLength(conn.node);
                            maxLength = Math.max(maxLength, length);
                        }
                    }
                }
            }
            visiting.delete(nodeName);
            const result = maxLength + 1;
            memo.set(nodeName, result);
            return result;
        };
        let maxChain = 0;
        for (const node of workflow.nodes) {
            if (!this.nodeHasInput(node.name, workflow)) {
                maxChain = Math.max(maxChain, getChainLength(node.name));
            }
        }
        return maxChain;
    }
    findSimilarNodeTypes(invalidType) {
        const suggestions = [];
        const nodeName = invalidType.includes('.') ? invalidType.split('.').pop() : invalidType;
        const commonNodeMappings = {
            'webhook': ['nodes-base.webhook'],
            'httpRequest': ['nodes-base.httpRequest'],
            'http': ['nodes-base.httpRequest'],
            'set': ['nodes-base.set'],
            'code': ['nodes-base.code'],
            'manualTrigger': ['nodes-base.manualTrigger'],
            'manual': ['nodes-base.manualTrigger'],
            'scheduleTrigger': ['nodes-base.scheduleTrigger'],
            'schedule': ['nodes-base.scheduleTrigger'],
            'cron': ['nodes-base.scheduleTrigger'],
            'emailSend': ['nodes-base.emailSend'],
            'email': ['nodes-base.emailSend'],
            'slack': ['nodes-base.slack'],
            'discord': ['nodes-base.discord'],
            'postgres': ['nodes-base.postgres'],
            'mysql': ['nodes-base.mySql'],
            'mongodb': ['nodes-base.mongoDb'],
            'redis': ['nodes-base.redis'],
            'if': ['nodes-base.if'],
            'switch': ['nodes-base.switch'],
            'merge': ['nodes-base.merge'],
            'splitInBatches': ['nodes-base.splitInBatches'],
            'loop': ['nodes-base.splitInBatches'],
            'googleSheets': ['nodes-base.googleSheets'],
            'sheets': ['nodes-base.googleSheets'],
            'airtable': ['nodes-base.airtable'],
            'github': ['nodes-base.github'],
            'git': ['nodes-base.github'],
        };
        const lowerNodeName = nodeName.toLowerCase();
        if (commonNodeMappings[lowerNodeName]) {
            suggestions.push(...commonNodeMappings[lowerNodeName]);
        }
        Object.entries(commonNodeMappings).forEach(([key, values]) => {
            if (key.includes(lowerNodeName) || lowerNodeName.includes(key)) {
                values.forEach(v => {
                    if (!suggestions.includes(v)) {
                        suggestions.push(v);
                    }
                });
            }
        });
        return suggestions.slice(0, 3);
    }
    generateSuggestions(workflow, result) {
        if (result.statistics.triggerNodes === 0) {
            result.suggestions.push('Add a trigger node (e.g., Webhook, Schedule Trigger) to automate workflow execution');
        }
        const hasConnectionErrors = result.errors.some(e => e.message && (e.message.includes('connection') ||
            e.message.includes('Connection') ||
            e.message.includes('Multi-node workflow has no connections')));
        if (hasConnectionErrors) {
            result.suggestions.push('Example connection structure: connections: { "Manual Trigger": { "main": [[{ "node": "Set", "type": "main", "index": 0 }]] } }');
            result.suggestions.push('Remember: Use node NAMES (not IDs) in connections. The name is what you see in the UI, not the node type.');
        }
        if (!Object.values(workflow.connections).some(o => o.error)) {
            result.suggestions.push('Add error handling using the error output of nodes or an Error Trigger node');
        }
        if (workflow.nodes.length > 20) {
            result.suggestions.push('Consider breaking this workflow into smaller sub-workflows for better maintainability');
        }
        const complexExpressionNodes = workflow.nodes.filter(node => {
            const jsonString = JSON.stringify(node.parameters);
            const expressionCount = (jsonString.match(/\{\{/g) || []).length;
            return expressionCount > 5;
        });
        if (complexExpressionNodes.length > 0) {
            result.suggestions.push('Consider using a Code node for complex data transformations instead of multiple expressions');
        }
        if (workflow.nodes.length === 1 && Object.keys(workflow.connections).length === 0) {
            result.suggestions.push('A minimal workflow needs: 1) A trigger node (e.g., Manual Trigger), 2) An action node (e.g., Set, HTTP Request), 3) A connection between them');
        }
    }
}
exports.WorkflowValidator = WorkflowValidator;
//# sourceMappingURL=workflow-validator.js.map