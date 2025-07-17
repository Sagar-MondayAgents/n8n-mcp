import { NodeRepository } from '../database/node-repository';
import { EnhancedConfigValidator } from './enhanced-config-validator';
interface WorkflowNode {
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters: any;
    credentials?: any;
    disabled?: boolean;
    notes?: string;
    typeVersion?: number;
}
interface WorkflowConnection {
    [sourceNode: string]: {
        main?: Array<Array<{
            node: string;
            type: string;
            index: number;
        }>>;
        error?: Array<Array<{
            node: string;
            type: string;
            index: number;
        }>>;
        ai_tool?: Array<Array<{
            node: string;
            type: string;
            index: number;
        }>>;
    };
}
interface WorkflowJson {
    name?: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection;
    settings?: any;
    staticData?: any;
    pinData?: any;
    meta?: any;
}
interface ValidationIssue {
    type: 'error' | 'warning';
    nodeId?: string;
    nodeName?: string;
    message: string;
    details?: any;
}
interface WorkflowValidationResult {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    statistics: {
        totalNodes: number;
        enabledNodes: number;
        triggerNodes: number;
        validConnections: number;
        invalidConnections: number;
        expressionsValidated: number;
    };
    suggestions: string[];
}
export declare class WorkflowValidator {
    private nodeRepository;
    private nodeValidator;
    constructor(nodeRepository: NodeRepository, nodeValidator: typeof EnhancedConfigValidator);
    validateWorkflow(workflow: WorkflowJson, options?: {
        validateNodes?: boolean;
        validateConnections?: boolean;
        validateExpressions?: boolean;
        profile?: 'minimal' | 'runtime' | 'ai-friendly' | 'strict';
    }): Promise<WorkflowValidationResult>;
    private validateWorkflowStructure;
    private validateAllNodes;
    private validateConnections;
    private validateConnectionOutputs;
    private validateAIToolConnection;
    private hasCycle;
    private validateExpressions;
    private nodeHasInput;
    private checkWorkflowPatterns;
    private getLongestLinearChain;
    private findSimilarNodeTypes;
    private generateSuggestions;
}
export {};
//# sourceMappingURL=workflow-validator.d.ts.map