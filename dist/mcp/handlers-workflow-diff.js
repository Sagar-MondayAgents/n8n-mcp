"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpdatePartialWorkflow = handleUpdatePartialWorkflow;
const zod_1 = require("zod");
const workflow_diff_engine_1 = require("../services/workflow-diff-engine");
const handlers_n8n_manager_1 = require("./handlers-n8n-manager");
const n8n_errors_1 = require("../utils/n8n-errors");
const logger_1 = require("../utils/logger");
const workflowDiffSchema = zod_1.z.object({
    id: zod_1.z.string(),
    operations: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        node: zod_1.z.any().optional(),
        nodeId: zod_1.z.string().optional(),
        nodeName: zod_1.z.string().optional(),
        changes: zod_1.z.any().optional(),
        position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).optional(),
        source: zod_1.z.string().optional(),
        target: zod_1.z.string().optional(),
        sourceOutput: zod_1.z.string().optional(),
        targetInput: zod_1.z.string().optional(),
        sourceIndex: zod_1.z.number().optional(),
        targetIndex: zod_1.z.number().optional(),
        settings: zod_1.z.any().optional(),
        name: zod_1.z.string().optional(),
        tag: zod_1.z.string().optional(),
    })),
    validateOnly: zod_1.z.boolean().optional(),
});
async function handleUpdatePartialWorkflow(args) {
    try {
        if (process.env.DEBUG_MCP === 'true') {
            logger_1.logger.debug('Workflow diff request received', {
                argsType: typeof args,
                hasWorkflowId: args && typeof args === 'object' && 'workflowId' in args,
                operationCount: args && typeof args === 'object' && 'operations' in args ?
                    args.operations?.length : 0
            });
        }
        const input = workflowDiffSchema.parse(args);
        const client = (0, handlers_n8n_manager_1.getN8nApiClient)();
        if (!client) {
            return {
                success: false,
                error: 'n8n API not configured. Please set N8N_API_URL and N8N_API_KEY environment variables.'
            };
        }
        let workflow;
        try {
            workflow = await client.getWorkflow(input.id);
        }
        catch (error) {
            if (error instanceof n8n_errors_1.N8nApiError) {
                return {
                    success: false,
                    error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                    code: error.code
                };
            }
            throw error;
        }
        const diffEngine = new workflow_diff_engine_1.WorkflowDiffEngine();
        const diffResult = await diffEngine.applyDiff(workflow, input);
        if (!diffResult.success) {
            return {
                success: false,
                error: 'Failed to apply diff operations',
                details: {
                    errors: diffResult.errors,
                    operationsApplied: diffResult.operationsApplied
                }
            };
        }
        if (input.validateOnly) {
            return {
                success: true,
                message: diffResult.message,
                data: {
                    valid: true,
                    operationsToApply: input.operations.length
                }
            };
        }
        try {
            const updatedWorkflow = await client.updateWorkflow(input.id, diffResult.workflow);
            return {
                success: true,
                data: updatedWorkflow,
                message: `Workflow "${updatedWorkflow.name}" updated successfully. Applied ${diffResult.operationsApplied} operations.`,
                details: {
                    operationsApplied: diffResult.operationsApplied,
                    workflowId: updatedWorkflow.id,
                    workflowName: updatedWorkflow.name
                }
            };
        }
        catch (error) {
            if (error instanceof n8n_errors_1.N8nApiError) {
                return {
                    success: false,
                    error: (0, n8n_errors_1.getUserFriendlyErrorMessage)(error),
                    code: error.code,
                    details: error.details
                };
            }
            throw error;
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Invalid input',
                details: { errors: error.errors }
            };
        }
        logger_1.logger.error('Failed to update partial workflow', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
//# sourceMappingURL=handlers-workflow-diff.js.map