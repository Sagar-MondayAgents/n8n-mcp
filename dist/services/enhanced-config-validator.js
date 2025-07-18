"use strict";
/**
 * Enhanced Configuration Validator Service
 *
 * Provides operation-aware validation for n8n nodes with reduced false positives.
 * Supports multiple validation modes and node-specific logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedConfigValidator = void 0;
const config_validator_1 = require("./config-validator");
const node_specific_validators_1 = require("./node-specific-validators");
const example_generator_1 = require("./example-generator");
class EnhancedConfigValidator extends config_validator_1.ConfigValidator {
    /**
     * Validate with operation awareness
     */
    static validateWithMode(nodeType, config, properties, mode = 'operation', profile = 'ai-friendly') {
        // Extract operation context from config
        const operationContext = this.extractOperationContext(config);
        // Filter properties based on mode and operation
        const filteredProperties = this.filterPropertiesByMode(properties, config, mode, operationContext);
        // Perform base validation on filtered properties
        const baseResult = super.validate(nodeType, config, filteredProperties);
        // Enhance the result
        const enhancedResult = {
            ...baseResult,
            mode,
            profile,
            operation: operationContext,
            examples: [],
            nextSteps: []
        };
        // Apply profile-based filtering
        this.applyProfileFilters(enhancedResult, profile);
        // Add operation-specific enhancements
        this.addOperationSpecificEnhancements(nodeType, config, enhancedResult);
        // Deduplicate errors
        enhancedResult.errors = this.deduplicateErrors(enhancedResult.errors);
        // Add examples from ExampleGenerator if there are errors
        if (enhancedResult.errors.length > 0) {
            this.addExamplesFromGenerator(nodeType, enhancedResult);
        }
        // Generate next steps based on errors
        enhancedResult.nextSteps = this.generateNextSteps(enhancedResult);
        return enhancedResult;
    }
    /**
     * Extract operation context from configuration
     */
    static extractOperationContext(config) {
        return {
            resource: config.resource,
            operation: config.operation,
            action: config.action,
            mode: config.mode
        };
    }
    /**
     * Filter properties based on validation mode and operation
     */
    static filterPropertiesByMode(properties, config, mode, operation) {
        switch (mode) {
            case 'minimal':
                // Only required properties that are visible
                return properties.filter(prop => prop.required && this.isPropertyVisible(prop, config));
            case 'operation':
                // Only properties relevant to the current operation
                return properties.filter(prop => this.isPropertyRelevantToOperation(prop, config, operation));
            case 'full':
            default:
                // All properties (current behavior)
                return properties;
        }
    }
    /**
     * Check if property is relevant to current operation
     */
    static isPropertyRelevantToOperation(prop, config, operation) {
        // First check if visible
        if (!this.isPropertyVisible(prop, config)) {
            return false;
        }
        // If no operation context, include all visible
        if (!operation.resource && !operation.operation && !operation.action) {
            return true;
        }
        // Check if property has operation-specific display options
        if (prop.displayOptions?.show) {
            const show = prop.displayOptions.show;
            // Check each operation field
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
    /**
     * Add operation-specific enhancements to validation result
     */
    static addOperationSpecificEnhancements(nodeType, config, result) {
        // Create context for node-specific validators
        const context = {
            config,
            errors: result.errors,
            warnings: result.warnings,
            suggestions: result.suggestions,
            autofix: result.autofix || {}
        };
        // Use node-specific validators
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
                // Use existing HTTP validation from base class
                this.enhanceHttpRequestValidation(config, result);
                break;
            case 'nodes-base.code':
                // Code node uses base validation which includes syntax checks
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
        // Update autofix if changes were made
        if (Object.keys(context.autofix).length > 0) {
            result.autofix = context.autofix;
        }
    }
    /**
     * Enhanced Slack validation with operation awareness
     */
    static enhanceSlackValidation(config, result) {
        const { resource, operation } = result.operation || {};
        if (resource === 'message' && operation === 'send') {
            // Add example for sending a message
            result.examples?.push({
                description: 'Send a simple text message to a channel',
                config: {
                    resource: 'message',
                    operation: 'send',
                    channel: '#general',
                    text: 'Hello from n8n!'
                }
            });
            // Check for common issues
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
    /**
     * Enhanced Google Sheets validation
     */
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
            // Validate range format
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
    /**
     * Enhanced HTTP Request validation
     */
    static enhanceHttpRequestValidation(config, result) {
        // Add common examples based on method
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
    /**
     * Generate actionable next steps based on validation results
     */
    static generateNextSteps(result) {
        const steps = [];
        // Group errors by type
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
    /**
     * Add examples from ExampleGenerator to help fix validation errors
     */
    static addExamplesFromGenerator(nodeType, result) {
        const examples = example_generator_1.ExampleGenerator.getExamples(nodeType);
        if (!examples) {
            return;
        }
        // Add minimal example if there are missing required fields
        if (result.errors.some(e => e.type === 'missing_required')) {
            result.examples?.push({
                description: 'Minimal working configuration',
                config: examples.minimal
            });
        }
        // Add common example if available
        if (examples.common) {
            // Check if the common example matches the operation context
            const { operation } = result.operation || {};
            const commonOp = examples.common.operation || examples.common.action;
            if (!operation || operation === commonOp) {
                result.examples?.push({
                    description: 'Common configuration pattern',
                    config: examples.common
                });
            }
        }
        // Add advanced example for complex validation errors
        if (examples.advanced && result.errors.length > 2) {
            result.examples?.push({
                description: 'Advanced configuration with all options',
                config: examples.advanced
            });
        }
    }
    /**
     * Deduplicate errors based on property and type
     * Prefers more specific error messages over generic ones
     */
    static deduplicateErrors(errors) {
        const seen = new Map();
        for (const error of errors) {
            const key = `${error.property}-${error.type}`;
            const existing = seen.get(key);
            if (!existing) {
                seen.set(key, error);
            }
            else {
                // Keep the error with more specific message or fix
                const existingLength = (existing.message?.length || 0) + (existing.fix?.length || 0);
                const newLength = (error.message?.length || 0) + (error.fix?.length || 0);
                if (newLength > existingLength) {
                    seen.set(key, error);
                }
            }
        }
        return Array.from(seen.values());
    }
    /**
     * Apply profile-based filtering to validation results
     */
    static applyProfileFilters(result, profile) {
        switch (profile) {
            case 'minimal':
                // Only keep missing required errors
                result.errors = result.errors.filter(e => e.type === 'missing_required');
                result.warnings = [];
                result.suggestions = [];
                break;
            case 'runtime':
                // Keep critical runtime errors only
                result.errors = result.errors.filter(e => e.type === 'missing_required' ||
                    e.type === 'invalid_value' ||
                    (e.type === 'invalid_type' && e.message.includes('undefined')));
                // Keep only security warnings
                result.warnings = result.warnings.filter(w => w.type === 'security');
                result.suggestions = [];
                break;
            case 'strict':
                // Keep everything, add more suggestions
                if (result.warnings.length === 0 && result.errors.length === 0) {
                    result.suggestions.push('Consider adding error handling and timeout configuration');
                    result.suggestions.push('Add authentication if connecting to external services');
                }
                break;
            case 'ai-friendly':
            default:
                // Current behavior - balanced for AI agents
                // Filter out noise but keep helpful warnings
                result.warnings = result.warnings.filter(w => w.type !== 'inefficient' || !w.property?.startsWith('_'));
                break;
        }
    }
}
exports.EnhancedConfigValidator = EnhancedConfigValidator;
//# sourceMappingURL=enhanced-config-validator.js.map