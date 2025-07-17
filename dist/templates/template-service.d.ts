import { DatabaseAdapter } from '../database/database-adapter';
export interface TemplateInfo {
    id: number;
    name: string;
    description: string;
    author: {
        name: string;
        username: string;
        verified: boolean;
    };
    nodes: string[];
    views: number;
    created: string;
    url: string;
}
export interface TemplateWithWorkflow extends TemplateInfo {
    workflow: any;
}
export declare class TemplateService {
    private repository;
    constructor(db: DatabaseAdapter);
    listNodeTemplates(nodeTypes: string[], limit?: number): Promise<TemplateInfo[]>;
    getTemplate(templateId: number): Promise<TemplateWithWorkflow | null>;
    searchTemplates(query: string, limit?: number): Promise<TemplateInfo[]>;
    getTemplatesForTask(task: string): Promise<TemplateInfo[]>;
    listAvailableTasks(): string[];
    getTemplateStats(): Promise<Record<string, any>>;
    fetchAndUpdateTemplates(progressCallback?: (message: string, current: number, total: number) => void): Promise<void>;
    private formatTemplateInfo;
}
//# sourceMappingURL=template-service.d.ts.map