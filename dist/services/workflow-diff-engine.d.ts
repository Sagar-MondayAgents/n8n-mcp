/**
 * Workflow Diff Engine
 * Applies diff operations to n8n workflows
 */
import { WorkflowDiffRequest, WorkflowDiffResult } from '../types/workflow-diff';
import { Workflow } from '../types/n8n-api';
export declare class WorkflowDiffEngine {
    /**
     * Apply diff operations to a workflow
     */
    applyDiff(workflow: Workflow, request: WorkflowDiffRequest): Promise<WorkflowDiffResult>;
    /**
     * Validate a single operation
     */
    private validateOperation;
    /**
     * Apply a single operation to the workflow
     */
    private applyOperation;
    private validateAddNode;
    private validateRemoveNode;
    private validateUpdateNode;
    private validateMoveNode;
    private validateToggleNode;
    private validateAddConnection;
    private validateRemoveConnection;
    private validateUpdateConnection;
    private applyAddNode;
    private applyRemoveNode;
    private applyUpdateNode;
    private applyMoveNode;
    private applyEnableNode;
    private applyDisableNode;
    private applyAddConnection;
    private applyRemoveConnection;
    private applyUpdateConnection;
    private applyUpdateSettings;
    private applyUpdateName;
    private applyAddTag;
    private applyRemoveTag;
    private findNode;
    private setNestedProperty;
}
//# sourceMappingURL=workflow-diff-engine.d.ts.map