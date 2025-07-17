import { N8NConfig } from '../types';
export declare class N8NApiClient {
    private config;
    private headers;
    constructor(config: N8NConfig);
    private request;
    getWorkflows(filters?: {
        active?: boolean;
        tags?: string[];
    }): Promise<any>;
    getWorkflow(id: string): Promise<any>;
    createWorkflow(workflowData: any): Promise<any>;
    updateWorkflow(id: string, updates: any): Promise<any>;
    deleteWorkflow(id: string): Promise<any>;
    activateWorkflow(id: string): Promise<any>;
    deactivateWorkflow(id: string): Promise<any>;
    executeWorkflow(id: string, data?: any): Promise<any>;
    getExecutions(filters?: {
        workflowId?: string;
        status?: string;
        limit?: number;
    }): Promise<any>;
    getExecution(id: string): Promise<any>;
    deleteExecution(id: string): Promise<any>;
    getCredentialTypes(): Promise<any>;
    getCredentials(): Promise<any>;
    getNodeTypes(): Promise<any>;
    getNodeType(nodeType: string): Promise<any>;
    getNodeSourceCode(nodeType: string): Promise<any>;
    getNodeDescription(nodeType: string): Promise<any>;
}
//# sourceMappingURL=n8n-client.d.ts.map