"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeParser = void 0;
const property_extractor_1 = require("./property-extractor");
class NodeParser {
    constructor() {
        this.propertyExtractor = new property_extractor_1.PropertyExtractor();
    }
    parse(nodeClass, packageName) {
        const description = this.getNodeDescription(nodeClass);
        return {
            style: this.detectStyle(nodeClass),
            nodeType: this.extractNodeType(description, packageName),
            displayName: description.displayName || description.name,
            description: description.description,
            category: this.extractCategory(description),
            properties: this.propertyExtractor.extractProperties(nodeClass),
            credentials: this.propertyExtractor.extractCredentials(nodeClass),
            isAITool: this.propertyExtractor.detectAIToolCapability(nodeClass),
            isTrigger: this.detectTrigger(description),
            isWebhook: this.detectWebhook(description),
            operations: this.propertyExtractor.extractOperations(nodeClass),
            version: this.extractVersion(nodeClass),
            isVersioned: this.detectVersioned(nodeClass),
            packageName: packageName
        };
    }
    getNodeDescription(nodeClass) {
        let description;
        if (typeof nodeClass === 'function' && nodeClass.prototype &&
            nodeClass.prototype.constructor &&
            nodeClass.prototype.constructor.name === 'VersionedNodeType') {
            const instance = new nodeClass();
            description = instance.baseDescription || {};
        }
        else if (typeof nodeClass === 'function') {
            try {
                const instance = new nodeClass();
                description = instance.description || {};
                if (!description.name && instance.baseDescription) {
                    description = instance.baseDescription;
                }
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
    detectStyle(nodeClass) {
        const desc = this.getNodeDescription(nodeClass);
        return desc.routing ? 'declarative' : 'programmatic';
    }
    extractNodeType(description, packageName) {
        const name = description.name;
        if (!name) {
            throw new Error('Node is missing name property');
        }
        if (name.includes('.')) {
            return name;
        }
        const packagePrefix = packageName.replace('@n8n/', '').replace('n8n-', '');
        return `${packagePrefix}.${name}`;
    }
    extractCategory(description) {
        return description.group?.[0] ||
            description.categories?.[0] ||
            description.category ||
            'misc';
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
    detectWebhook(description) {
        return (description.webhooks?.length > 0) ||
            description.webhook === true ||
            description.name?.toLowerCase().includes('webhook');
    }
    extractVersion(nodeClass) {
        if (nodeClass.baseDescription?.defaultVersion) {
            return nodeClass.baseDescription.defaultVersion.toString();
        }
        if (nodeClass.nodeVersions) {
            const versions = Object.keys(nodeClass.nodeVersions);
            return Math.max(...versions.map(Number)).toString();
        }
        try {
            const instance = typeof nodeClass === 'function' ? new nodeClass() : nodeClass;
            if (instance?.nodeVersions) {
                const versions = Object.keys(instance.nodeVersions);
                return Math.max(...versions.map(Number)).toString();
            }
            if (instance?.description?.version) {
                const version = instance.description.version;
                if (Array.isArray(version)) {
                    const maxVersion = Math.max(...version.map((v) => parseFloat(v.toString())));
                    return maxVersion.toString();
                }
                else if (typeof version === 'number' || typeof version === 'string') {
                    return version.toString();
                }
            }
        }
        catch (e) {
        }
        const description = this.getNodeDescription(nodeClass);
        if (description?.version) {
            if (Array.isArray(description.version)) {
                const maxVersion = Math.max(...description.version.map((v) => parseFloat(v.toString())));
                return maxVersion.toString();
            }
            else if (typeof description.version === 'number' || typeof description.version === 'string') {
                return description.version.toString();
            }
        }
        return '1';
    }
    detectVersioned(nodeClass) {
        if (nodeClass.nodeVersions || nodeClass.baseDescription?.defaultVersion) {
            return true;
        }
        try {
            const instance = typeof nodeClass === 'function' ? new nodeClass() : nodeClass;
            if (instance?.nodeVersions) {
                return true;
            }
            if (instance?.description?.version && Array.isArray(instance.description.version)) {
                return true;
            }
        }
        catch (e) {
        }
        const description = this.getNodeDescription(nodeClass);
        if (description?.version && Array.isArray(description.version)) {
            return true;
        }
        return false;
    }
}
exports.NodeParser = NodeParser;
//# sourceMappingURL=node-parser.js.map