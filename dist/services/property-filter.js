"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyFilter = void 0;
class PropertyFilter {
    static deduplicateProperties(properties) {
        const seen = new Map();
        return properties.filter(prop => {
            const conditions = JSON.stringify(prop.displayOptions || {});
            const key = `${prop.name}_${conditions}`;
            if (seen.has(key)) {
                return false;
            }
            seen.set(key, prop);
            return true;
        });
    }
    static getEssentials(allProperties, nodeType) {
        const uniqueProperties = this.deduplicateProperties(allProperties);
        const config = this.ESSENTIAL_PROPERTIES[nodeType];
        if (!config) {
            return this.inferEssentials(uniqueProperties);
        }
        const required = this.extractProperties(uniqueProperties, config.required, true);
        const requiredNames = new Set(required.map(p => p.name));
        const common = this.extractProperties(uniqueProperties, config.common, false)
            .filter(p => !requiredNames.has(p.name));
        return { required, common };
    }
    static extractProperties(allProperties, propertyNames, markAsRequired) {
        const extracted = [];
        for (const name of propertyNames) {
            const property = this.findPropertyByName(allProperties, name);
            if (property) {
                const simplified = this.simplifyProperty(property);
                if (markAsRequired) {
                    simplified.required = true;
                }
                extracted.push(simplified);
            }
        }
        return extracted;
    }
    static findPropertyByName(properties, name) {
        for (const prop of properties) {
            if (prop.name === name) {
                return prop;
            }
            if (prop.type === 'collection' && prop.options) {
                const found = this.findPropertyByName(prop.options, name);
                if (found)
                    return found;
            }
            if (prop.type === 'fixedCollection' && prop.options) {
                for (const option of prop.options) {
                    if (option.values) {
                        const found = this.findPropertyByName(option.values, name);
                        if (found)
                            return found;
                    }
                }
            }
        }
        return undefined;
    }
    static simplifyProperty(prop) {
        const simplified = {
            name: prop.name,
            displayName: prop.displayName || prop.name,
            type: prop.type,
            description: this.extractDescription(prop),
            required: prop.required || false
        };
        if (prop.default !== undefined &&
            typeof prop.default !== 'object' ||
            prop.type === 'options' ||
            prop.type === 'multiOptions') {
            simplified.default = prop.default;
        }
        if (prop.placeholder) {
            simplified.placeholder = prop.placeholder;
        }
        if (prop.options && Array.isArray(prop.options)) {
            simplified.options = prop.options.map((opt) => {
                if (typeof opt === 'string') {
                    return { value: opt, label: opt };
                }
                return {
                    value: opt.value || opt.name,
                    label: opt.name || opt.value || opt.displayName
                };
            });
        }
        if (prop.displayOptions?.show) {
            const conditions = Object.keys(prop.displayOptions.show);
            if (conditions.length <= 2) {
                simplified.showWhen = prop.displayOptions.show;
            }
        }
        simplified.usageHint = this.generateUsageHint(prop);
        return simplified;
    }
    static generateUsageHint(prop) {
        if (prop.name.toLowerCase().includes('url') || prop.name === 'endpoint') {
            return 'Enter the full URL including https://';
        }
        if (prop.name.includes('auth') || prop.name.includes('credential')) {
            return 'Select authentication method or credentials';
        }
        if (prop.type === 'json' || prop.name.includes('json')) {
            return 'Enter valid JSON data';
        }
        if (prop.type === 'code' || prop.name.includes('code')) {
            return 'Enter your code here';
        }
        if (prop.type === 'boolean' && prop.displayOptions) {
            return 'Enabling this will show additional options';
        }
        return undefined;
    }
    static extractDescription(prop) {
        const description = prop.description ||
            prop.hint ||
            prop.placeholder ||
            prop.displayName ||
            '';
        if (!description) {
            return this.generateDescription(prop);
        }
        return description;
    }
    static generateDescription(prop) {
        const name = prop.name.toLowerCase();
        const type = prop.type;
        const commonDescriptions = {
            'url': 'The URL to make the request to',
            'method': 'HTTP method to use for the request',
            'authentication': 'Authentication method to use',
            'sendbody': 'Whether to send a request body',
            'contenttype': 'Content type of the request body',
            'sendheaders': 'Whether to send custom headers',
            'jsonbody': 'JSON data to send in the request body',
            'headers': 'Custom headers to send with the request',
            'timeout': 'Request timeout in milliseconds',
            'query': 'SQL query to execute',
            'table': 'Database table name',
            'operation': 'Operation to perform',
            'path': 'Webhook path or file path',
            'httpmethod': 'HTTP method to accept',
            'responsemode': 'How to respond to the webhook',
            'responsecode': 'HTTP response code to return',
            'channel': 'Slack channel to send message to',
            'text': 'Text content of the message',
            'subject': 'Email subject line',
            'fromemail': 'Sender email address',
            'toemail': 'Recipient email address',
            'language': 'Programming language to use',
            'jscode': 'JavaScript code to execute',
            'pythoncode': 'Python code to execute'
        };
        if (commonDescriptions[name]) {
            return commonDescriptions[name];
        }
        for (const [key, desc] of Object.entries(commonDescriptions)) {
            if (name.includes(key)) {
                return desc;
            }
        }
        if (type === 'boolean') {
            return `Enable or disable ${prop.displayName || name}`;
        }
        else if (type === 'options') {
            return `Select ${prop.displayName || name}`;
        }
        else if (type === 'string') {
            return `Enter ${prop.displayName || name}`;
        }
        else if (type === 'number') {
            return `Number value for ${prop.displayName || name}`;
        }
        else if (type === 'json') {
            return `JSON data for ${prop.displayName || name}`;
        }
        return `Configure ${prop.displayName || name}`;
    }
    static inferEssentials(properties) {
        const required = properties
            .filter(p => p.required === true)
            .map(p => this.simplifyProperty(p));
        const common = properties
            .filter(p => {
            return !p.required &&
                !p.displayOptions &&
                p.type !== 'collection' &&
                p.type !== 'fixedCollection' &&
                !p.name.startsWith('options');
        })
            .slice(0, 5)
            .map(p => this.simplifyProperty(p));
        if (required.length + common.length < 5) {
            const additional = properties
                .filter(p => {
                return !p.required &&
                    p.displayOptions &&
                    Object.keys(p.displayOptions.show || {}).length === 1;
            })
                .slice(0, 5 - (required.length + common.length))
                .map(p => this.simplifyProperty(p));
            common.push(...additional);
        }
        return { required, common };
    }
    static searchProperties(allProperties, query, maxResults = 20) {
        const lowerQuery = query.toLowerCase();
        const matches = [];
        this.searchPropertiesRecursive(allProperties, lowerQuery, matches);
        return matches
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(match => ({
            ...this.simplifyProperty(match.property),
            path: match.path
        }));
    }
    static searchPropertiesRecursive(properties, query, matches, path = '') {
        for (const prop of properties) {
            const currentPath = path ? `${path}.${prop.name}` : prop.name;
            let score = 0;
            if (prop.name.toLowerCase() === query) {
                score = 10;
            }
            else if (prop.name.toLowerCase().startsWith(query)) {
                score = 8;
            }
            else if (prop.name.toLowerCase().includes(query)) {
                score = 5;
            }
            if (prop.displayName?.toLowerCase().includes(query)) {
                score = Math.max(score, 4);
            }
            if (prop.description?.toLowerCase().includes(query)) {
                score = Math.max(score, 3);
            }
            if (score > 0) {
                matches.push({ property: prop, score, path: currentPath });
            }
            if (prop.type === 'collection' && prop.options) {
                this.searchPropertiesRecursive(prop.options, query, matches, currentPath);
            }
            else if (prop.type === 'fixedCollection' && prop.options) {
                for (const option of prop.options) {
                    if (option.values) {
                        this.searchPropertiesRecursive(option.values, query, matches, `${currentPath}.${option.name}`);
                    }
                }
            }
        }
    }
}
exports.PropertyFilter = PropertyFilter;
PropertyFilter.ESSENTIAL_PROPERTIES = {
    'nodes-base.httpRequest': {
        required: ['url'],
        common: ['method', 'authentication', 'sendBody', 'contentType', 'sendHeaders'],
        categoryPriority: ['basic', 'authentication', 'request', 'response', 'advanced']
    },
    'nodes-base.webhook': {
        required: [],
        common: ['httpMethod', 'path', 'responseMode', 'responseData', 'responseCode'],
        categoryPriority: ['basic', 'response', 'advanced']
    },
    'nodes-base.code': {
        required: [],
        common: ['language', 'jsCode', 'pythonCode', 'mode'],
        categoryPriority: ['basic', 'code', 'advanced']
    },
    'nodes-base.set': {
        required: [],
        common: ['mode', 'assignments', 'includeOtherFields', 'options'],
        categoryPriority: ['basic', 'data', 'advanced']
    },
    'nodes-base.if': {
        required: [],
        common: ['conditions', 'combineOperation'],
        categoryPriority: ['basic', 'conditions', 'advanced']
    },
    'nodes-base.postgres': {
        required: [],
        common: ['operation', 'table', 'query', 'additionalFields', 'returnAll'],
        categoryPriority: ['basic', 'query', 'options', 'advanced']
    },
    'nodes-base.openAi': {
        required: [],
        common: ['resource', 'operation', 'modelId', 'prompt', 'messages', 'maxTokens'],
        categoryPriority: ['basic', 'model', 'input', 'options', 'advanced']
    },
    'nodes-base.googleSheets': {
        required: [],
        common: ['operation', 'documentId', 'sheetName', 'range', 'dataStartRow'],
        categoryPriority: ['basic', 'location', 'data', 'options', 'advanced']
    },
    'nodes-base.slack': {
        required: [],
        common: ['resource', 'operation', 'channel', 'text', 'attachments', 'blocks'],
        categoryPriority: ['basic', 'message', 'formatting', 'advanced']
    },
    'nodes-base.email': {
        required: [],
        common: ['resource', 'operation', 'fromEmail', 'toEmail', 'subject', 'text', 'html'],
        categoryPriority: ['basic', 'recipients', 'content', 'advanced']
    },
    'nodes-base.merge': {
        required: [],
        common: ['mode', 'joinMode', 'propertyName1', 'propertyName2', 'outputDataFrom'],
        categoryPriority: ['basic', 'merge', 'advanced']
    },
    'nodes-base.function': {
        required: [],
        common: ['functionCode'],
        categoryPriority: ['basic', 'code', 'advanced']
    },
    'nodes-base.splitInBatches': {
        required: [],
        common: ['batchSize', 'options'],
        categoryPriority: ['basic', 'options', 'advanced']
    },
    'nodes-base.redis': {
        required: [],
        common: ['operation', 'key', 'value', 'keyType', 'expire'],
        categoryPriority: ['basic', 'data', 'options', 'advanced']
    },
    'nodes-base.mongoDb': {
        required: [],
        common: ['operation', 'collection', 'query', 'fields', 'limit'],
        categoryPriority: ['basic', 'query', 'options', 'advanced']
    },
    'nodes-base.mySql': {
        required: [],
        common: ['operation', 'table', 'query', 'columns', 'additionalFields'],
        categoryPriority: ['basic', 'query', 'options', 'advanced']
    },
    'nodes-base.ftp': {
        required: [],
        common: ['operation', 'path', 'fileName', 'binaryData'],
        categoryPriority: ['basic', 'file', 'options', 'advanced']
    },
    'nodes-base.ssh': {
        required: [],
        common: ['resource', 'operation', 'command', 'path', 'cwd'],
        categoryPriority: ['basic', 'command', 'options', 'advanced']
    },
    'nodes-base.executeCommand': {
        required: [],
        common: ['command', 'cwd'],
        categoryPriority: ['basic', 'advanced']
    },
    'nodes-base.github': {
        required: [],
        common: ['resource', 'operation', 'owner', 'repository', 'title', 'body'],
        categoryPriority: ['basic', 'repository', 'content', 'advanced']
    }
};
//# sourceMappingURL=property-filter.js.map