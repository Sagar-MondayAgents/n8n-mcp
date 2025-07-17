import { Workflow, WorkflowListParams, WorkflowListResponse, Execution, ExecutionListParams, ExecutionListResponse, Credential, CredentialListParams, CredentialListResponse, Tag, TagListParams, TagListResponse, HealthCheckResponse, Variable, WebhookRequest, SourceControlStatus, SourceControlPullResult, SourceControlPushResult } from '../types/n8n-api';
export interface N8nApiClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
}
export declare class N8nApiClient {
    private client;
    private maxRetries;
    constructor(config: N8nApiClientConfig);
    healthCheck(): Promise<HealthCheckResponse>;
    createWorkflow(workflow: Partial<Workflow>): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow>;
    updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow>;
    deleteWorkflow(id: string): Promise<void>;
    listWorkflows(params?: WorkflowListParams): Promise<WorkflowListResponse>;
    getExecution(id: string, includeData?: boolean): Promise<Execution>;
    listExecutions(params?: ExecutionListParams): Promise<ExecutionListResponse>;
    deleteExecution(id: string): Promise<void>;
    triggerWebhook(request: WebhookRequest): Promise<any>;
    listCredentials(params?: CredentialListParams): Promise<CredentialListResponse>;
    getCredential(id: string): Promise<Credential>;
    createCredential(credential: Partial<Credential>): Promise<Credential>;
    updateCredential(id: string, credential: Partial<Credential>): Promise<Credential>;
    deleteCredential(id: string): Promise<void>;
    listTags(params?: TagListParams): Promise<TagListResponse>;
    createTag(tag: Partial<Tag>): Promise<Tag>;
    updateTag(id: string, tag: Partial<Tag>): Promise<Tag>;
    deleteTag(id: string): Promise<void>;
    getSourceControlStatus(): Promise<SourceControlStatus>;
    pullSourceControl(force?: boolean): Promise<SourceControlPullResult>;
    pushSourceControl(message: string, fileNames?: string[]): Promise<SourceControlPushResult>;
    getVariables(): Promise<Variable[]>;
    createVariable(variable: Partial<Variable>): Promise<Variable>;
    updateVariable(id: string, variable: Partial<Variable>): Promise<Variable>;
    deleteVariable(id: string): Promise<void>;
}
//# sourceMappingURL=n8n-api-client.d.ts.map