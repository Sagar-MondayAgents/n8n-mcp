/**
 * Workflow Validator for n8n workflows
 * Validates complete workflow structure, connections, and node configurations
 */
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
    /**
     * Validate a complete workflow
     */
    validateWorkflow(workflow: WorkflowJson, options?: {
        validateNodes?: boolean;
        validateConnections?: boolean;
        validateExpressions?: boolean;
        profile?: 'minimal' | 'runtime' | 'ai-friendly' | 'strict';
    }): Promise<WorkflowValidationResult>;
    /**
     * Validate basic workflow structure
     */
    private validateWorkflowStructure;
    /**
     * Validate all nodes in the workflow
     */
    private validateAllNodes;
    /**
     * Validate workflow connections
     */
    private validateConnections;
    /**
     * Validate connection outputs
     */
    private validateConnectionOutputs;
    /**
     * Validate AI tool connections
     */
    private validateAIToolConnection;
    /**
     * Check if workflow has cycles
     */
    private hasCycle;
    /**
     * Validate expressions in the workflow
     */
    private validateExpressions;
    /**
     * Check if a node has input connections
     */
    private nodeHasInput;
    /**
     * Check workflow patterns and best practices
     */
    private checkWorkflowPatterns;
    /**
     * Get the longest linear chain in the workflow
     */
    private getLongestLinearChain;
    /**
     * Find similar node types for suggestions
     */
    private findSimilarNodeTypes;
    /**
     * Generate suggestions based on validation results
     */
    private generateSuggestions;
}
export {};
//# sourceMappingURL=workflow-validator.d.ts.map