/**
 * Workflow Diff Types
 * Defines the structure for partial workflow updates using diff operations
 */
import { WorkflowNode } from './n8n-api';
export interface DiffOperation {
    type: string;
    description?: string;
}
export interface AddNodeOperation extends DiffOperation {
    type: 'addNode';
    node: Partial<WorkflowNode> & {
        name: string;
        type: string;
        position: [number, number];
    };
}
export interface RemoveNodeOperation extends DiffOperation {
    type: 'removeNode';
    nodeId?: string;
    nodeName?: string;
}
export interface UpdateNodeOperation extends DiffOperation {
    type: 'updateNode';
    nodeId?: string;
    nodeName?: string;
    changes: {
        [path: string]: any;
    };
}
export interface MoveNodeOperation extends DiffOperation {
    type: 'moveNode';
    nodeId?: string;
    nodeName?: string;
    position: [number, number];
}
export interface EnableNodeOperation extends DiffOperation {
    type: 'enableNode';
    nodeId?: string;
    nodeName?: string;
}
export interface DisableNodeOperation extends DiffOperation {
    type: 'disableNode';
    nodeId?: string;
    nodeName?: string;
}
export interface AddConnectionOperation extends DiffOperation {
    type: 'addConnection';
    source: string;
    target: string;
    sourceOutput?: string;
    targetInput?: string;
    sourceIndex?: number;
    targetIndex?: number;
}
export interface RemoveConnectionOperation extends DiffOperation {
    type: 'removeConnection';
    source: string;
    target: string;
    sourceOutput?: string;
    targetInput?: string;
}
export interface UpdateConnectionOperation extends DiffOperation {
    type: 'updateConnection';
    source: string;
    target: string;
    changes: {
        sourceOutput?: string;
        targetInput?: string;
        sourceIndex?: number;
        targetIndex?: number;
    };
}
export interface UpdateSettingsOperation extends DiffOperation {
    type: 'updateSettings';
    settings: {
        [key: string]: any;
    };
}
export interface UpdateNameOperation extends DiffOperation {
    type: 'updateName';
    name: string;
}
export interface AddTagOperation extends DiffOperation {
    type: 'addTag';
    tag: string;
}
export interface RemoveTagOperation extends DiffOperation {
    type: 'removeTag';
    tag: string;
}
export type WorkflowDiffOperation = AddNodeOperation | RemoveNodeOperation | UpdateNodeOperation | MoveNodeOperation | EnableNodeOperation | DisableNodeOperation | AddConnectionOperation | RemoveConnectionOperation | UpdateConnectionOperation | UpdateSettingsOperation | UpdateNameOperation | AddTagOperation | RemoveTagOperation;
export interface WorkflowDiffRequest {
    id: string;
    operations: WorkflowDiffOperation[];
    validateOnly?: boolean;
}
export interface WorkflowDiffValidationError {
    operation: number;
    message: string;
    details?: any;
}
export interface WorkflowDiffResult {
    success: boolean;
    workflow?: any;
    errors?: WorkflowDiffValidationError[];
    operationsApplied?: number;
    message?: string;
}
export interface NodeReference {
    id?: string;
    name?: string;
}
export declare function isNodeOperation(op: WorkflowDiffOperation): op is AddNodeOperation | RemoveNodeOperation | UpdateNodeOperation | MoveNodeOperation | EnableNodeOperation | DisableNodeOperation;
export declare function isConnectionOperation(op: WorkflowDiffOperation): op is AddConnectionOperation | RemoveConnectionOperation | UpdateConnectionOperation;
export declare function isMetadataOperation(op: WorkflowDiffOperation): op is UpdateSettingsOperation | UpdateNameOperation | AddTagOperation | RemoveTagOperation;
//# sourceMappingURL=workflow-diff.d.ts.map