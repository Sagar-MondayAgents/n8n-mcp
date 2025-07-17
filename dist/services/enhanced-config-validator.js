"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedConfigValidator = void 0;
const config_validator_1 = require("./config-validator");
const node_specific_validators_1 = require("./node-specific-validators");
const example_generator_1 = require("./example-generator");
class EnhancedConfigValidator extends config_validator_1.ConfigValidator {
    static validateWithMode(nodeType, config, properties, mode = 'operation', profile = 'ai-friendly') {
        const operationContext = this.extractOperationContext(config);
        const filteredProperties = this.filterPropertiesByMode(properties, config, mode, operationContext);
        const baseResult = super.validate(nodeType, config, filteredProperties);
        const enhancedResult = {
            ...baseResult,
            mode,
            profile,
            operation: operationContext,
            examples: [],
            nextSteps: []
        };
        this.applyProfileFilters(enhancedResult, profile);
        this.addOperationSpecificEnhancements(nodeType, config, enhancedResult);
        enhancedResult.errors = this.deduplicateErrors(enhancedResult.errors);
        if (enhancedResult.errors.length > 0) {
            this.addExamplesFromGenerator(nodeType, enhancedResult);
        }
        enhancedResult.nextSteps = this.generateNextSteps(enhancedResult);
        return enhancedResult;
    }
    static extractOperationContext(config) {
        return {
            resource: config.resource,
            operation: config.operation,
            action: config.action,
            mode: config.mode
        };
    }
    static filterPropertiesByMode(properties, config, mode, operation) {
        switch (mode) {
            case 'minimal':
                return properties.filter(prop => prop.required && this.isPropertyVisible(prop, config));
            case 'operation':
                return properties.filter(prop => this.isPropertyRelevantToOperation(prop, config, operation));
            case 'full':
            default:
                return properties;
        }
    }
    static isPropertyRelevantToOperation(prop, config, operation) {
        if (!this.isPropertyVisible(prop, config)) {
            return false;
        }
        if (!operation.resource && !operation.operation && !operation.action) {
            return true;
        }
        if (prop.displayOptions?.show) {
            const show = prop.displayOptions.show;
            if (operation.resource && show.resource) {
                const expectedResources = Array.isArray(show.resource) ? show.resource : [show.resource];
                if (!expectedResources.includes(operation.resource)) {
                    return false;
                }
            }
            if (operation.operation && show.operation) {
                const expectedOps = Array.isArray(show.operation) ? show.operation : [show.operation];
                if (!expectedOps.includes(operation.operation)) {
                    return false;
                }
            }
            if (operation.action && show.action) {
                const expectedActions = Array.isArray(show.action) ? show.action : [show.action];
                if (!expectedActions.includes(operation.action)) {
                    return false;
                }
            }
        }
        return true;
    }
    static addOperationSpecificEnhancements(nodeType, config, result) {
        const context = {
            config,
            errors: result.errors,
            warnings: result.warnings,
            suggestions: result.suggestions,
            autofix: result.autofix || {}
        };
        switch (nodeType) {
            case 'nodes-base.slack':
                node_specific_validators_1.NodeSpecificValidators.validateSlack(context);
                this.enhanceSlackValidation(config, result);
                break;
            case 'nodes-base.googleSheets':
                node_specific_validators_1.NodeSpecificValidators.validateGoogleSheets(context);
                this.enhanceGoogleSheetsValidation(config, result);
                break;
            case 'nodes-base.httpRequest':
                this.enhanceHttpRequestValidation(config, result);
                break;
            case 'nodes-base.code':
                break;
            case 'nodes-base.openAi':
                node_specific_validators_1.NodeSpecificValidators.validateOpenAI(context);
                break;
            case 'nodes-base.mongoDb':
                node_specific_validators_1.NodeSpecificValidators.validateMongoDB(context);
                break;
            case 'nodes-base.webhook':
                node_specific_validators_1.NodeSpecificValidators.validateWebhook(context);
                break;
            case 'nodes-base.postgres':
                node_specific_validators_1.NodeSpecificValidators.validatePostgres(context);
                break;
            case 'nodes-base.mysql':
                node_specific_validators_1.NodeSpecificValidators.validateMySQL(context);
                break;
        }
        if (Object.keys(context.autofix).length > 0) {
            result.autofix = context.autofix;
        }
    }
    static enhanceSlackValidation(config, result) {
        const { resource, operation } = result.operation || {};
        if (resource === 'message' && operation === 'send') {
            result.examples?.push({
                description: 'Send a simple text message to a channel',
                config: {
                    resource: 'message',
                    operation: 'send',
                    channel: '#general',
                    text: 'Hello from n8n!'
                }
            });
            if (!config.channel && !config.channelId) {
                const channelError = result.errors.find(e => e.property === 'channel' || e.property === 'channelId');
                if (channelError) {
                    channelError.message = 'To send a Slack message, specify either a channel name (e.g., "#general") or channel ID';
                    channelError.fix = 'Add channel: "#general" or use a channel ID like "C1234567890"';
                }
            }
        }
        else if (resource === 'user' && operation === 'get') {
            result.examples?.push({
                description: 'Get user information by email',
                config: {
                    resource: 'user',
                    operation: 'get',
                    user: 'user@example.com'
                }
            });
        }
    }
    static enhanceGoogleSheetsValidation(config, result) {
        const { operation } = result.operation || {};
        if (operation === 'append') {
            result.examples?.push({
                description: 'Append data to a spreadsheet',
                config: {
                    operation: 'append',
                    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                    range: 'Sheet1!A:B',
                    options: {
                        valueInputMode: 'USER_ENTERED'
                    }
                }
            });
            if (config.range && !config.range.includes('!')) {
                result.warnings.push({
                    type: 'inefficient',
                    property: 'range',
                    message: 'Range should include sheet name (e.g., "Sheet1!A:B")',
                    suggestion: 'Format: "SheetName!A1:B10" or "SheetName!A:B" for entire columns'
                });
            }
        }
    }
    static enhanceHttpRequestValidation(config, result) {
        if (config.method === 'GET') {
            result.examples?.push({
                description: 'GET request with query parameters',
                config: {
                    method: 'GET',
                    url: 'https://api.example.com/users',
                    queryParameters: {
                        parameters: [
                            { name: 'page', value: '1' },
                            { name: 'limit', value: '10' }
                        ]
                    }
                }
            });
        }
        else if (config.method === 'POST') {
            result.examples?.push({
                description: 'POST request with JSON body',
                config: {
                    method: 'POST',
                    url: 'https://api.example.com/users',
                    sendBody: true,
                    bodyContentType: 'json',
                    jsonBody: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
                }
            });
        }
    }
    static generateNextSteps(result) {
        const steps = [];
        const requiredErrors = result.errors.filter(e => e.type === 'missing_required');
        const typeErrors = result.errors.filter(e => e.type === 'invalid_type');
        const valueErrors = result.errors.filter(e => e.type === 'invalid_value');
        if (requiredErrors.length > 0) {
            steps.push(`Add required fields: ${requiredErrors.map(e => e.property).join(', ')}`);
        }
        if (typeErrors.length > 0) {
            steps.push(`Fix type mismatches: ${typeErrors.map(e => `${e.property} should be ${e.fix}`).join(', ')}`);
        }
        if (valueErrors.length > 0) {
            steps.push(`Correct invalid values: ${valueErrors.map(e => e.property).join(', ')}`);
        }
        if (result.warnings.length > 0 && result.errors.length === 0) {
            steps.push('Consider addressing warnings for better reliability');
        }
        if (result.examples && result.examples.length > 0 && result.errors.length > 0) {
            steps.push('See examples above for working configurations');
        }
        return steps;
    }
    static addExamplesFromGenerator(nodeType, result) {
        const examples = example_generator_1.ExampleGenerator.getExamples(nodeType);
        if (!examples) {
            return;
        }
        if (result.errors.some(e => e.type === 'missing_required')) {
            result.examples?.push({
                description: 'Minimal working configuration',
                config: examples.minimal
            });
        }
        if (examples.common) {
            const { operation } = result.operation || {};
            const commonOp = examples.common.operation || examples.common.action;
            if (!operation || operation === commonOp) {
                result.examples?.push({
                    description: 'Common configuration pattern',
                    config: examples.common
                });
            }
        }
        if (examples.advanced && result.errors.length > 2) {
            result.examples?.push({
                description: 'Advanced configuration with all options',
                config: examples.advanced
            });
        }
    }
    static deduplicateErrors(errors) {
        const seen = new Map();
        for (const error of errors) {
            const key = `${error.property}-${error.type}`;
            const existing = seen.get(key);
            if (!existing) {
                seen.set(key, error);
            }
            else {
                const existingLength = (existing.message?.length || 0) + (existing.fix?.length || 0);
                const newLength = (error.message?.length || 0) + (error.fix?.length || 0);
                if (newLength > existingLength) {
                    seen.set(key, error);
                }
            }
        }
        return Array.from(seen.values());
    }
    static applyProfileFilters(result, profile) {
        switch (profile) {
            case 'minimal':
                result.errors = result.errors.filter(e => e.type === 'missing_required');
                result.warnings = [];
                result.suggestions = [];
                break;
            case 'runtime':
                result.errors = result.errors.filter(e => e.type === 'missing_required' ||
                    e.type === 'invalid_value' ||
                    (e.type === 'invalid_type' && e.message.includes('undefined')));
                result.warnings = result.warnings.filter(w => w.type === 'security');
                result.suggestions = [];
                break;
            case 'strict':
                if (result.warnings.length === 0 && result.errors.length === 0) {
                    result.suggestions.push('Consider adding error handling and timeout configuration');
                    result.suggestions.push('Add authentication if connecting to external services');
                }
                break;
            case 'ai-friendly':
            default:
                result.warnings = result.warnings.filter(w => w.type !== 'inefficient' || !w.property?.startsWith('_'));
                break;
        }
    }
}
exports.EnhancedConfigValidator = EnhancedConfigValidator;
//# sourceMappingURL=enhanced-config-validator.js.map