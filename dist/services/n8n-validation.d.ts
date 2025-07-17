import { z } from 'zod';
import { WorkflowNode, WorkflowConnection, Workflow } from '../types/n8n-api';
export declare const workflowNodeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    typeVersion: z.ZodNumber;
    position: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    disabled: z.ZodOptional<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
    notesInFlow: z.ZodOptional<z.ZodBoolean>;
    continueOnFail: z.ZodOptional<z.ZodBoolean>;
    retryOnFail: z.ZodOptional<z.ZodBoolean>;
    maxTries: z.ZodOptional<z.ZodNumber>;
    waitBetweenTries: z.ZodOptional<z.ZodNumber>;
    alwaysOutputData: z.ZodOptional<z.ZodBoolean>;
    executeOnce: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, unknown>;
    disabled?: boolean | undefined;
    credentials?: Record<string, string> | undefined;
    notes?: string | undefined;
    notesInFlow?: boolean | undefined;
    continueOnFail?: boolean | undefined;
    retryOnFail?: boolean | undefined;
    maxTries?: number | undefined;
    waitBetweenTries?: number | undefined;
    alwaysOutputData?: boolean | undefined;
    executeOnce?: boolean | undefined;
}, {
    name: string;
    id: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, unknown>;
    disabled?: boolean | undefined;
    credentials?: Record<string, string> | undefined;
    notes?: string | undefined;
    notesInFlow?: boolean | undefined;
    continueOnFail?: boolean | undefined;
    retryOnFail?: boolean | undefined;
    maxTries?: number | undefined;
    waitBetweenTries?: number | undefined;
    alwaysOutputData?: boolean | undefined;
    executeOnce?: boolean | undefined;
}>;
export declare const workflowConnectionSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    main: z.ZodArray<z.ZodArray<z.ZodObject<{
        node: z.ZodString;
        type: z.ZodString;
        index: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        node: string;
        index: number;
    }, {
        type: string;
        node: string;
        index: number;
    }>, "many">, "many">;
}, "strip", z.ZodTypeAny, {
    main: {
        type: string;
        node: string;
        index: number;
    }[][];
}, {
    main: {
        type: string;
        node: string;
        index: number;
    }[][];
}>>;
export declare const workflowSettingsSchema: z.ZodObject<{
    executionOrder: z.ZodDefault<z.ZodEnum<["v0", "v1"]>>;
    timezone: z.ZodOptional<z.ZodString>;
    saveDataErrorExecution: z.ZodDefault<z.ZodEnum<["all", "none"]>>;
    saveDataSuccessExecution: z.ZodDefault<z.ZodEnum<["all", "none"]>>;
    saveManualExecutions: z.ZodDefault<z.ZodBoolean>;
    saveExecutionProgress: z.ZodDefault<z.ZodBoolean>;
    executionTimeout: z.ZodOptional<z.ZodNumber>;
    errorWorkflow: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    executionOrder: "v0" | "v1";
    saveDataErrorExecution: "all" | "none";
    saveDataSuccessExecution: "all" | "none";
    saveManualExecutions: boolean;
    saveExecutionProgress: boolean;
    timezone?: string | undefined;
    executionTimeout?: number | undefined;
    errorWorkflow?: string | undefined;
}, {
    timezone?: string | undefined;
    executionOrder?: "v0" | "v1" | undefined;
    saveDataErrorExecution?: "all" | "none" | undefined;
    saveDataSuccessExecution?: "all" | "none" | undefined;
    saveManualExecutions?: boolean | undefined;
    saveExecutionProgress?: boolean | undefined;
    executionTimeout?: number | undefined;
    errorWorkflow?: string | undefined;
}>;
export declare const defaultWorkflowSettings: {
    executionOrder: "v1";
    saveDataErrorExecution: "all";
    saveDataSuccessExecution: "all";
    saveManualExecutions: boolean;
    saveExecutionProgress: boolean;
};
export declare function validateWorkflowNode(node: unknown): WorkflowNode;
export declare function validateWorkflowConnections(connections: unknown): WorkflowConnection;
export declare function validateWorkflowSettings(settings: unknown): z.infer<typeof workflowSettingsSchema>;
export declare function cleanWorkflowForCreate(workflow: Partial<Workflow>): Partial<Workflow>;
export declare function cleanWorkflowForUpdate(workflow: Workflow): Partial<Workflow>;
export declare function validateWorkflowStructure(workflow: Partial<Workflow>): string[];
export declare function hasWebhookTrigger(workflow: Workflow): boolean;
export declare function getWebhookUrl(workflow: Workflow): string | null;
export declare function getWorkflowStructureExample(): string;
export declare function getWorkflowFixSuggestions(errors: string[]): string[];
//# sourceMappingURL=n8n-validation.d.ts.map