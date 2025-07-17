"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleParser = void 0;
class SimpleParser {
    parse(nodeClass) {
        let description;
        let isVersioned = false;
        try {
            if (typeof nodeClass === 'function' && nodeClass.prototype &&
                nodeClass.prototype.constructor &&
                nodeClass.prototype.constructor.name === 'VersionedNodeType') {
                const instance = new nodeClass();
                description = instance.baseDescription || {};
                isVersioned = true;
                if (instance.nodeVersions && instance.currentVersion) {
                    const currentVersionNode = instance.nodeVersions[instance.currentVersion];
                    if (currentVersionNode && currentVersionNode.description) {
                        description = { ...description, ...currentVersionNode.description };
                    }
                }
            }
            else if (typeof nodeClass === 'function') {
                try {
                    const instance = new nodeClass();
                    description = instance.description || {};
                    if (!description.name && instance.baseDescription) {
                        description = instance.baseDescription;
                        isVersioned = true;
                    }
                }
                catch (e) {
                    description = {};
                }
            }
            else {
                description = nodeClass.description || {};
            }
        }
        catch (error) {
            description = nodeClass.description || {};
        }
        const isDeclarative = !!description.routing;
        if (!description.name) {
            throw new Error('Node is missing name property');
        }
        return {
            style: isDeclarative ? 'declarative' : 'programmatic',
            nodeType: description.name,
            displayName: description.displayName || description.name,
            description: description.description,
            category: description.group?.[0] || description.categories?.[0],
            properties: description.properties || [],
            credentials: description.credentials || [],
            isAITool: description.usableAsTool === true,
            isTrigger: this.detectTrigger(description),
            isWebhook: description.webhooks?.length > 0,
            operations: isDeclarative ? this.extractOperations(description.routing) : this.extractProgrammaticOperations(description),
            version: this.extractVersion(nodeClass),
            isVersioned: isVersioned || this.isVersionedNode(nodeClass) || Array.isArray(description.version) || description.defaultVersion !== undefined
        };
    }
    detectTrigger(description) {
        if (description.group && Array.isArray(description.group)) {
            if (description.group.includes('trigger')) {
                return true;
            }
        }
        return description.polling === true ||
            description.trigger === true ||
            description.eventTrigger === true ||
            description.name?.toLowerCase().includes('trigger');
    }
    extractOperations(routing) {
        const operations = [];
        if (routing?.request) {
            const resources = routing.request.resource?.options || [];
            resources.forEach((resource) => {
                operations.push({
                    resource: resource.value,
                    name: resource.name
                });
            });
            const operationOptions = routing.request.operation?.options || [];
            operationOptions.forEach((operation) => {
                operations.push({
                    operation: operation.value,
                    name: operation.name || operation.displayName
                });
            });
        }
        if (routing?.operations) {
            Object.entries(routing.operations).forEach(([key, value]) => {
                operations.push({
                    operation: key,
                    name: value.displayName || key
                });
            });
        }
        return operations;
    }
    extractProgrammaticOperations(description) {
        const operations = [];
        if (!description.properties || !Array.isArray(description.properties)) {
            return operations;
        }
        const resourceProp = description.properties.find((p) => p.name === 'resource' && p.type === 'options');
        if (resourceProp && resourceProp.options) {
            resourceProp.options.forEach((resource) => {
                operations.push({
                    type: 'resource',
                    resource: resource.value,
                    name: resource.name
                });
            });
        }
        const operationProps = description.properties.filter((p) => p.name === 'operation' && p.type === 'options' && p.displayOptions);
        operationProps.forEach((opProp) => {
            if (opProp.options) {
                opProp.options.forEach((operation) => {
                    const resourceCondition = opProp.displayOptions?.show?.resource;
                    const resources = Array.isArray(resourceCondition) ? resourceCondition : [resourceCondition];
                    operations.push({
                        type: 'operation',
                        operation: operation.value,
                        name: operation.name,
                        action: operation.action,
                        resources: resources
                    });
                });
            }
        });
        return operations;
    }
    extractVersion(nodeClass) {
        if (nodeClass.baseDescription?.defaultVersion) {
            return nodeClass.baseDescription.defaultVersion.toString();
        }
        return nodeClass.description?.version || '1';
    }
    isVersionedNode(nodeClass) {
        if (nodeClass.baseDescription && nodeClass.nodeVersions) {
            return true;
        }
        try {
            const instance = typeof nodeClass === 'function' ? new nodeClass() : nodeClass;
            const description = instance.description || {};
            if (Array.isArray(description.version)) {
                return true;
            }
            if (description.defaultVersion !== undefined) {
                return true;
            }
        }
        catch (e) {
        }
        return false;
    }
}
exports.SimpleParser = SimpleParser;
//# sourceMappingURL=simple-parser.js.map