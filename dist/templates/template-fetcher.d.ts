export interface TemplateNode {
    id: number;
    name: string;
    icon: string;
}
export interface TemplateUser {
    id: number;
    name: string;
    username: string;
    verified: boolean;
}
export interface TemplateWorkflow {
    id: number;
    name: string;
    description: string;
    totalViews: number;
    createdAt: string;
    user: TemplateUser;
    nodes: TemplateNode[];
}
export interface TemplateDetail {
    id: number;
    name: string;
    description: string;
    views: number;
    createdAt: string;
    workflow: {
        nodes: any[];
        connections: any;
        settings?: any;
    };
}
export declare class TemplateFetcher {
    private readonly baseUrl;
    private readonly pageSize;
    fetchTemplates(progressCallback?: (current: number, total: number) => void): Promise<TemplateWorkflow[]>;
    fetchTemplateDetail(workflowId: number): Promise<TemplateDetail>;
    fetchAllTemplateDetails(workflows: TemplateWorkflow[], progressCallback?: (current: number, total: number) => void): Promise<Map<number, TemplateDetail>>;
    private sleep;
}
//# sourceMappingURL=template-fetcher.d.ts.map