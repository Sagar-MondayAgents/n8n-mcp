"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getN8nApiClient = getN8nApiClient;
exports.handleCreateWorkflow = handleCreateWorkflow;
exports.handleGetWorkflow = handleGetWorkflow;
exports.handleGetWorkflowDetails = handleGetWorkflowDetails;
exports.handleGetWorkflowStructure = handleGetWorkflowStructure;
exports.handleGetWorkflowMinimal = handleGetWorkflowMinimal;
exports.handleUpdateWorkflow = handleUpdateWorkflow;
exports.handleDeleteWorkflow = handleDeleteWorkflow;
exports.handleListWorkflows = handleListWorkflows;
exports.handleValidateWorkflow = handleValidateWorkflow;
exports.handleTriggerWebhookWorkflow = handleTriggerWebhookWorkflow;
exports.handleGetExecution = handleGetExecution;
exports.handleListExecutions = handleListExecutions;
exports.handleDeleteExecution = handleDeleteExecution;
exports.handleHealthCheck = handleHealthCheck;
exports.handleListAvailableTools = handleListAvailableTools;
exports.handleDiagnostic = handleDiagnostic;
const n8n_api_client_1 = require("../services/n8n-api-client");
const n8n_api_1 = require("../config/n8n-api");
const n8n_api_2 = require("../types/n8n-api");
const n8n_validation_1 = require("../services/n8n-validation");
const n8n_errors_1 = require("../utils/n8n-errors");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const workflow_validator_1 = require("../services/workflow-validator");
const enhanced_config_validator_1 = require("../services/enhanced-config-validator");
// Singleton n8n API client instance
let apiClient = null;
let lastConfigUrl = null;
// Get or create API client (with lazy config loading)
function getN8nApiClient() {
    const config = (0, n8n_api_1.getN8nApiConfig)();
    if (!config) {
        if (apiClient) {
            logger_1.logger.info('n8n API configuration removed, clearing client');
            apiClient = null;
            lastConfigUrl = null;
        }
        return null;
    }
    // Check if config has changed
    if (!apiClient || lastConfigUrl !== config.baseUrl) {
        logger_1.logger.info('n8n API client initialized', { url: config.baseUrl });
        apiClient = new n8n_api_client_1.N8nApiClient(config);
        lastConfigUrl = config.baseUrl;
    }
    return apiClient;
}
// Helper to ensure API is configured
function ensureApiConfigured() {
    const client = getN8nApiClient();
    if (!client) {
        throw new Error('n8n API not configured. Please set N8N_API_URL and N8N_API_KEY environment variables.');
    }
    return client;
}
// Zod schemas for input validation
const createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string(),
    nodes: zod_1.z.array(zod_1.z.any()),
    connections: zod_1.z.record(zod_1.z.any()),
    settings: zod_1.z.object({
        executionOrder: zod_1.z.enum(['v0', 'v1']).optional(),
        timezone: zod_1.z.string().optional(),
        saveDataErrorExecution: zod_1.z.enum(['all', 'none']).optional(),
        saveDataSuccessExecution: zod_1.z.enum(['all', 'none']).optional(),
        saveManualExecutions: zod_1.z.boolean().optional(),
        saveExecutionProgress: zod_1.z.boolean().optional(),
        executionTimeout: zod_1.z.number().optional(),
        errorWorkflow: zod_1.z.string().optional(),
    }).optional(),
});
const updateWorkflowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    nodes: zod_1.z.array(zod_1.z.any()).optional(),
    connections: zod_1.z.record(zod_1.z.any()).optional(),
    settings: zod_1.z.any().optional(),
});
const listWorkflowsSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(100).optional(),
    cursor: zod_1.z.string().optional(),
    active: zod_1.z.boolean().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    projectId: zod_1.z.string().optional(),
    excludePinnedData: zod_1.z.boolean().optional(),
});
const validateWorkflowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    options: zod_1.z.object({
        validateNodes: zod_1.z.boolean().optional(),
        validateConnections: zod_1.z.boolean().optional(),
        validateExpressions: zod_1.z.boolean().optional(),
        profile: zod_1.z.enum(['minimal', 'runtime', 'ai-friendly', 'strict']).optional(),
    }).optional(),
});
const triggerWebhookSchema = zod_1.z.object({
    webhookUrl: zod_1.z.string().url(),
    httpMethod: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    data: zod_1.z.record(zod_1.z.unknown()).optional(),
    headers: zod_1.z.record(zod_1.z.string()).optional(),
    waitForResponse: zod_1.z.boolean().optional(),
});
const listExecutionsSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(100).optional(),
    cursor: zod_1.z.string().optional(),
    workflowId: zod_1.z.string().optional(),
    projectId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['success', 'error', 'waiting']).optional(),
    includeData: zod_1.z.boolean().optional(),
});
// Workflow Management Handlers
async function handleCreateWorkflow(args) {
    try {
        const client = ensureApiConfigured();
        const input = createWorkflowSchema.parse(args);
        // Validate workflow structure
        const errors = (0, n8n_validation_1.validateWorkflowStructure)(input);
        if (errors.length > 0) {
            return {
                success: false,
                error: 'Workflow validation failed',
                details: { errors }
            };
        }
        // Create workflow
        const workflow = await client.createWorkflow(input);
        return {
            success: true,
            data: workflow,
            message: `Workflow "${workflow.name}" created successfully with ID: ${workflow.id}`
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code,
                details: error.details
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleGetWorkflow(args) {
    try {
        const client = ensureApiConfigured();
        const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(args);
        const workflow = await client.getWorkflow(id);
        return {
            success: true,
            data: workflow
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleGetWorkflowDetails(args) {
    try {
        const client = ensureApiConfigured();
        const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(args);
        const workflow = await client.getWorkflow(id);
        // Get recent executions for this workflow
        const executions = await client.listExecutions({
            workflowId: id,
            limit: 10
        });
        // Calculate execution statistics
        const stats = {
            totalExecutions: executions.data.length,
            successCount: executions.data.filter(e => e.status === n8n_api_2.ExecutionStatus.SUCCESS).length,
            errorCount: executions.data.filter(e => e.status === n8n_api_2.ExecutionStatus.ERROR).length,
            lastExecutionTime: executions.data[0]?.startedAt || null
        };
        return {
            success: true,
            data: {
                workflow,
                executionStats: stats,
                hasWebhookTrigger: (0, n8n_validation_1.hasWebhookTrigger)(workflow),
                webhookPath: (0, n8n_validation_1.getWebhookUrl)(workflow)
            }
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleGetWorkflowStructure(args) {
    try {
        const client = ensureApiConfigured();
        const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(args);
        const workflow = await client.getWorkflow(id);
        // Simplify nodes to just essential structure
        const simplifiedNodes = workflow.nodes.map(node => ({
            id: node.id,
            name: node.name,
            type: node.type,
            position: node.position,
            disabled: node.disabled || false
        }));
        return {
            success: true,
            data: {
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                nodes: simplifiedNodes,
                connections: workflow.connections,
                nodeCount: workflow.nodes.length,
                connectionCount: Object.keys(workflow.connections).length
            }
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleGetWorkflowMinimal(args) {
    try {
        const client = ensureApiConfigured();
        const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(args);
        const workflow = await client.getWorkflow(id);
        return {
            success: true,
            data: {
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                tags: workflow.tags || [],
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt
            }
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleUpdateWorkflow(args) {
    try {
        const client = ensureApiConfigured();
        const input = updateWorkflowSchema.parse(args);
        const { id, ...updateData } = input;
        // If nodes/connections are being updated, validate the structure
        if (updateData.nodes || updateData.connections) {
            // Fetch current workflow if only partial update
            let fullWorkflow = updateData;
            if (!updateData.nodes || !updateData.connections) {
                const current = await client.getWorkflow(id);
                fullWorkflow = {
                    ...current,
                    ...updateData
                };
            }
            const errors = (0, n8n_validation_1.validateWorkflowStructure)(fullWorkflow);
            if (errors.length > 0) {
                return {
                    success: false,
                    error: 'Workflow validation failed',
                    details: { errors }
                };
            }
        }
        // Update workflow
        const workflow = await client.updateWorkflow(id, updateData);
        return {
            success: true,
            data: workflow,
            message: `Workflow "${workflow.name}" updated successfully`
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code,
                details: error.details
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleDeleteWorkflow(args) {
    try {
        const client = ensureApiConfigured();
        const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(args);
        await client.deleteWorkflow(id);
        return {
            success: true,
            message: `Workflow ${id} deleted successfully`
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleListWorkflows(args) {
    try {
        const client = ensureApiConfigured();
        const input = listWorkflowsSchema.parse(args || {});
        const response = await client.listWorkflows({
            limit: input.limit || 100,
            cursor: input.cursor,
            active: input.active,
            tags: input.tags,
            projectId: input.projectId,
            excludePinnedData: input.excludePinnedData ?? true
        });
        return {
            success: true,
            data: {
                workflows: response.data,
                nextCursor: response.nextCursor,
                total: response.data.length
            }
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleValidateWorkflow(args, repository) {
    try {
        const client = ensureApiConfigured();
        const input = validateWorkflowSchema.parse(args);
        // First, fetch the workflow from n8n
        const workflowResponse = await handleGetWorkflow({ id: input.id });
        if (!workflowResponse.success) {
            return workflowResponse; // Return the error from fetching
        }
        const workflow = workflowResponse.data;
        // Create validator instance using the provided repository
        const validator = new workflow_validator_1.WorkflowValidator(repository, enhanced_config_validator_1.EnhancedConfigValidator);
        // Run validation
        const validationResult = await validator.validateWorkflow(workflow, input.options);
        // Format the response (same format as the regular validate_workflow tool)
        const response = {
            valid: validationResult.valid,
            workflowId: workflow.id,
            workflowName: workflow.name,
            summary: {
                totalNodes: validationResult.statistics.totalNodes,
                enabledNodes: validationResult.statistics.enabledNodes,
                triggerNodes: validationResult.statistics.triggerNodes,
                validConnections: validationResult.statistics.validConnections,
                invalidConnections: validationResult.statistics.invalidConnections,
                expressionsValidated: validationResult.statistics.expressionsValidated,
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length
            }
        };
        if (validationResult.errors.length > 0) {
            response.errors = validationResult.errors.map(e => ({
                node: e.nodeName || 'workflow',
                message: e.message,
                details: e.details
            }));
        }
        if (validationResult.warnings.length > 0) {
            response.warnings = validationResult.warnings.map(w => ({
                node: w.nodeName || 'workflow',
                message: w.message,
                details: w.details
            }));
        }
        if (validationResult.suggestions.length > 0) {
            response.suggestions = validationResult.suggestions;
        }
        return {
            success: true,
            data: response
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
// Execution Management Handlers
async function handleTriggerWebhookWorkflow(args) {
    try {
        const client = ensureApiConfigured();
        const input = triggerWebhookSchema.parse(args);
        const webhookRequest = {
            webhookUrl: input.webhookUrl,
            httpMethod: input.httpMethod || 'POST',
            data: input.data,
            headers: input.headers,
            waitForResponse: input.waitForResponse ?? true
        };
        const response = await client.triggerWebhook(webhookRequest);
        return {
            success: true,
            data: response,
            message: 'Webhook triggered successfully'
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code,
                details: error.details
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleGetExecution(args) {
    try {
        const client = ensureApiConfigured();
        const { id, includeData } = zod_1.z.object({
            id: zod_1.z.string(),
            includeData: zod_1.z.boolean().optional()
        }).parse(args);
        const execution = await client.getExecution(id, includeData || false);
        return {
            success: true,
            data: execution
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleListExecutions(args) {
    try {
        const client = ensureApiConfigured();
        const input = listExecutionsSchema.parse(args || {});
        const response = await client.listExecutions({
            limit: input.limit || 100,
            cursor: input.cursor,
            workflowId: input.workflowId,
            projectId: input.projectId,
            status: input.status,
            includeData: input.includeData || false
        });
        return {
            success: true,
            data: {
                executions: response.data,
                nextCursor: response.nextCursor,
                total: response.data.length
            }
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleDeleteExecution(args) {
    try {
        const client = ensureApiConfigured();
        const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(args);
        await client.deleteExecution(id);
        return {
            success: true,
            message: `Execution ${id} deleted successfully`
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
// System Tools Handlers
async function handleHealthCheck() {
    try {
        const client = ensureApiConfigured();
        const health = await client.healthCheck();
        return {
            success: true,
            data: {
                status: health.status,
                instanceId: health.instanceId,
                n8nVersion: health.n8nVersion,
                features: health.features,
                apiUrl: (0, n8n_api_1.getN8nApiConfig)()?.baseUrl
            }
        };
    }
    catch (error) {
        if (error instanceof n8n_errors_1.N8nApiError) {
            return {
                success: false,
                error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                code: error.code,
                details: {
                    apiUrl: (0, n8n_api_1.getN8nApiConfig)()?.baseUrl,
                    hint: 'Check if n8n is running and API is enabled'
                }
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
async function handleListAvailableTools() {
    const tools = [
        {
            category: 'Workflow Management',
            tools: [
                { name: 'n8n_create_workflow', description: 'Create new workflows' },
                { name: 'n8n_get_workflow', description: 'Get workflow by ID' },
                { name: 'n8n_get_workflow_details', description: 'Get detailed workflow info with stats' },
                { name: 'n8n_get_workflow_structure', description: 'Get simplified workflow structure' },
                { name: 'n8n_get_workflow_minimal', description: 'Get minimal workflow info' },
                { name: 'n8n_update_workflow', description: 'Update existing workflows' },
                { name: 'n8n_delete_workflow', description: 'Delete workflows' },
                { name: 'n8n_list_workflows', description: 'List workflows with filters' },
                { name: 'n8n_validate_workflow', description: 'Validate workflow from n8n instance' }
            ]
        },
        {
            category: 'Execution Management',
            tools: [
                { name: 'n8n_trigger_webhook_workflow', description: 'Trigger workflows via webhook' },
                { name: 'n8n_get_execution', description: 'Get execution details' },
                { name: 'n8n_list_executions', description: 'List executions with filters' },
                { name: 'n8n_delete_execution', description: 'Delete execution records' }
            ]
        },
        {
            category: 'System',
            tools: [
                { name: 'n8n_health_check', description: 'Check API connectivity' },
                { name: 'n8n_list_available_tools', description: 'List all available tools' }
            ]
        }
    ];
    const config = (0, n8n_api_1.getN8nApiConfig)();
    const apiConfigured = config !== null;
    return {
        success: true,
        data: {
            tools,
            apiConfigured,
            configuration: config ? {
                apiUrl: config.baseUrl,
                timeout: config.timeout,
                maxRetries: config.maxRetries
            } : null,
            limitations: [
                'Cannot activate/deactivate workflows via API',
                'Cannot execute workflows directly (must use webhooks)',
                'Cannot stop running executions',
                'Tags and credentials have limited API support'
            ]
        }
    };
}
// Handler: n8n_diagnostic
async function handleDiagnostic(request) {
    const verbose = request.params?.arguments?.verbose || false;
    // Check environment variables
    const envVars = {
        N8N_API_URL: process.env.N8N_API_URL || null,
        N8N_API_KEY: process.env.N8N_API_KEY ? '***configured***' : null,
        NODE_ENV: process.env.NODE_ENV || 'production',
        MCP_MODE: process.env.MCP_MODE || 'stdio'
    };
    // Check API configuration
    const apiConfig = (0, n8n_api_1.getN8nApiConfig)();
    const apiConfigured = apiConfig !== null;
    const apiClient = getN8nApiClient();
    // Test API connectivity if configured
    let apiStatus = {
        configured: apiConfigured,
        connected: false,
        error: null,
        version: null
    };
    if (apiClient) {
        try {
            const health = await apiClient.healthCheck();
            apiStatus.connected = true;
            apiStatus.version = health.n8nVersion || 'unknown';
        }
        catch (error) {
            apiStatus.error = error instanceof Error ? error.message : 'Unknown error';
        }
    }
    // Check which tools are available
    const documentationTools = 22; // Base documentation tools
    const managementTools = apiConfigured ? 16 : 0;
    const totalTools = documentationTools + managementTools;
    // Build diagnostic report
    const diagnostic = {
        timestamp: new Date().toISOString(),
        environment: envVars,
        apiConfiguration: {
            configured: apiConfigured,
            status: apiStatus,
            config: apiConfig ? {
                baseUrl: apiConfig.baseUrl,
                timeout: apiConfig.timeout,
                maxRetries: apiConfig.maxRetries
            } : null
        },
        toolsAvailability: {
            documentationTools: {
                count: documentationTools,
                enabled: true,
                description: 'Always available - node info, search, validation, etc.'
            },
            managementTools: {
                count: managementTools,
                enabled: apiConfigured,
                description: apiConfigured ?
                    'Management tools are ENABLED - create, update, execute workflows' :
                    'Management tools are DISABLED - configure N8N_API_URL and N8N_API_KEY to enable'
            },
            totalAvailable: totalTools
        },
        troubleshooting: {
            steps: apiConfigured ? [
                'API is configured and should work',
                'If tools are not showing in Claude Desktop:',
                '1. Restart Claude Desktop completely',
                '2. Check if using latest Docker image',
                '3. Verify environment variables are passed correctly',
                '4. Try running n8n_health_check to test connectivity'
            ] : [
                'To enable management tools:',
                '1. Set N8N_API_URL environment variable (e.g., https://your-n8n-instance.com)',
                '2. Set N8N_API_KEY environment variable (get from n8n API settings)',
                '3. Restart the MCP server',
                '4. Management tools will automatically appear'
            ],
            documentation: 'For detailed setup instructions, see: https://github.com/czlonkowski/n8n-mcp#n8n-management-tools-new-v260---requires-api-configuration'
        }
    };
    // Add verbose debug info if requested
    if (verbose) {
        diagnostic['debug'] = {
            processEnv: Object.keys(process.env).filter(key => key.startsWith('N8N_') || key.startsWith('MCP_')),
            nodeVersion: process.version,
            platform: process.platform,
            workingDirectory: process.cwd()
        };
    }
    return {
        success: true,
        data: diagnostic
    };
}
//# sourceMappingURL=handlers-n8n-manager.js.map