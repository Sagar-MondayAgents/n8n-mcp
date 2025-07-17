"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyExtractor = void 0;
class PropertyExtractor {
    extractProperties(nodeClass) {
        const properties = [];
        let instance;
        try {
            instance = typeof nodeClass === 'function' ? new nodeClass() : nodeClass;
        }
        catch (e) {
        }
        if (instance?.nodeVersions) {
            const versions = Object.keys(instance.nodeVersions);
            const latestVersion = Math.max(...versions.map(Number));
            const versionedNode = instance.nodeVersions[latestVersion];
            if (versionedNode?.description?.properties) {
                return this.normalizeProperties(versionedNode.description.properties);
            }
        }
        const description = instance?.description || instance?.baseDescription ||
            this.getNodeDescription(nodeClass);
        if (description?.properties) {
            return this.normalizeProperties(description.properties);
        }
        return properties;
    }
    getNodeDescription(nodeClass) {
        let description;
        if (typeof nodeClass === 'function') {
            try {
                const instance = new nodeClass();
                description = instance.description || instance.baseDescription || {};
            }
            catch (e) {
                description = nodeClass.description || {};
            }
        }
        else {
            description = nodeClass.description || {};
        }
        return description;
    }
    extractOperations(nodeClass) {
        const operations = [];
        let instance;
        try {
            instance = typeof nodeClass === 'function' ? new nodeClass() : nodeClass;
        }
        catch (e) {
        }
        if (instance?.nodeVersions) {
            const versions = Object.keys(instance.nodeVersions);
            const latestVersion = Math.max(...versions.map(Number));
            const versionedNode = instance.nodeVersions[latestVersion];
            if (versionedNode?.description) {
                return this.extractOperationsFromDescription(versionedNode.description);
            }
        }
        const description = instance?.description || instance?.baseDescription ||
            this.getNodeDescription(nodeClass);
        return this.extractOperationsFromDescription(description);
    }
    extractOperationsFromDescription(description) {
        const operations = [];
        if (!description)
            return operations;
        if (description.routing) {
            const routing = description.routing;
            if (routing.request?.resource) {
                const resources = routing.request.resource.options || [];
                const operationOptions = routing.request.operation?.options || {};
                resources.forEach((resource) => {
                    const resourceOps = operationOptions[resource.value] || [];
                    resourceOps.forEach((op) => {
                        operations.push({
                            resource: resource.value,
                            operation: op.value,
                            name: `${resource.name} - ${op.name}`,
                            action: op.action
                        });
                    });
                });
            }
        }
        if (description.properties && Array.isArray(description.properties)) {
            const operationProp = description.properties.find((p) => p.name === 'operation' || p.name === 'action');
            if (operationProp?.options) {
                operationProp.options.forEach((op) => {
                    operations.push({
                        operation: op.value,
                        name: op.name,
                        description: op.description
                    });
                });
            }
        }
        return operations;
    }
    detectAIToolCapability(nodeClass) {
        const description = this.getNodeDescription(nodeClass);
        if (description?.usableAsTool === true)
            return true;
        if (description?.actions?.some((a) => a.usableAsTool === true))
            return true;
        if (nodeClass.nodeVersions) {
            for (const version of Object.values(nodeClass.nodeVersions)) {
                if (version.description?.usableAsTool === true)
                    return true;
            }
        }
        const aiIndicators = ['openai', 'anthropic', 'huggingface', 'cohere', 'ai'];
        const nodeName = description?.name?.toLowerCase() || '';
        return aiIndicators.some(indicator => nodeName.includes(indicator));
    }
    extractCredentials(nodeClass) {
        const credentials = [];
        let instance;
        try {
            instance = typeof nodeClass === 'function' ? new nodeClass() : nodeClass;
        }
        catch (e) {
        }
        if (instance?.nodeVersions) {
            const versions = Object.keys(instance.nodeVersions);
            const latestVersion = Math.max(...versions.map(Number));
            const versionedNode = instance.nodeVersions[latestVersion];
            if (versionedNode?.description?.credentials) {
                return versionedNode.description.credentials;
            }
        }
        const description = instance?.description || instance?.baseDescription ||
            this.getNodeDescription(nodeClass);
        if (description?.credentials) {
            return description.credentials;
        }
        return credentials;
    }
    normalizeProperties(properties) {
        return properties.map(prop => ({
            displayName: prop.displayName,
            name: prop.name,
            type: prop.type,
            default: prop.default,
            description: prop.description,
            options: prop.options,
            required: prop.required,
            displayOptions: prop.displayOptions,
            typeOptions: prop.typeOptions,
            noDataExpression: prop.noDataExpression
        }));
    }
}
exports.PropertyExtractor = PropertyExtractor;
//# sourceMappingURL=property-extractor.js.map