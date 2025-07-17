import { WorkflowDiffRequest, WorkflowDiffResult } from '../types/workflow-diff';
import { Workflow } from '../types/n8n-api';
export declare class WorkflowDiffEngine {
    applyDiff(workflow: Workflow, request: WorkflowDiffRequest): Promise<WorkflowDiffResult>;
    private validateOperation;
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