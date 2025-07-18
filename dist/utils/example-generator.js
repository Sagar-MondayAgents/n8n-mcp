"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleGenerator = void 0;
/**
 * Generates example workflows and parameters for n8n nodes
 */
class ExampleGenerator {
    /**
     * Generate an example workflow from node definition
     */
    static generateFromNodeDefinition(nodeDefinition) {
        const nodeName = nodeDefinition.displayName || 'Example Node';
        const nodeType = nodeDefinition.name || 'n8n-nodes-base.exampleNode';
        return {
            name: `${nodeName} Example Workflow`,
            nodes: [
                {
                    parameters: this.generateExampleParameters(nodeDefinition),
                    id: this.generateNodeId(),
                    name: nodeName,
                    type: nodeType,
                    typeVersion: nodeDefinition.version || 1,
                    position: [250, 300],
                },
            ],
            connections: {},
            active: false,
            settings: {},
            tags: ['example', 'generated'],
        };
    }
    /**
     * Generate example parameters based on node properties
     */
    static generateExampleParameters(nodeDefinition) {
        const params = {};
        // If properties are available, generate examples based on them
        if (Array.isArray(nodeDefinition.properties)) {
            for (const prop of nodeDefinition.properties) {
                if (prop.name && prop.type) {
                    params[prop.name] = this.generateExampleValue(prop);
                }
            }
        }
        // Add common parameters based on node type
        if (nodeDefinition.displayName?.toLowerCase().includes('trigger')) {
            params.pollTimes = {
                item: [
                    {
                        mode: 'everyMinute',
                    },
                ],
            };
        }
        return params;
    }
    /**
     * Generate example value based on property definition
     */
    static generateExampleValue(property) {
        switch (property.type) {
            case 'string':
                if (property.name.toLowerCase().includes('url')) {
                    return 'https://example.com';
                }
                if (property.name.toLowerCase().includes('email')) {
                    return 'user@example.com';
                }
                if (property.name.toLowerCase().includes('name')) {
                    return 'Example Name';
                }
                return property.default || 'example-value';
            case 'number':
                return property.default || 10;
            case 'boolean':
                return property.default !== undefined ? property.default : true;
            case 'options':
                if (property.options && property.options.length > 0) {
                    return property.options[0].value;
                }
                return property.default || '';
            case 'collection':
            case 'fixedCollection':
                return {};
            default:
                return property.default || null;
        }
    }
    /**
     * Generate a unique node ID
     */
    static generateNodeId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
    /**
     * Generate example based on node operations
     */
    static generateFromOperations(operations) {
        const examples = [];
        if (!operations || operations.length === 0) {
            return examples;
        }
        // Group operations by resource
        const resourceMap = new Map();
        for (const op of operations) {
            if (!resourceMap.has(op.resource)) {
                resourceMap.set(op.resource, []);
            }
            resourceMap.get(op.resource).push(op);
        }
        // Generate example for each resource
        for (const [resource, ops] of resourceMap) {
            examples.push({
                resource,
                operation: ops[0].operation,
                description: `Example: ${ops[0].description}`,
                parameters: {
                    resource,
                    operation: ops[0].operation,
                },
            });
        }
        return examples;
    }
}
exports.ExampleGenerator = ExampleGenerator;
//# sourceMappingURL=example-generator.js.map