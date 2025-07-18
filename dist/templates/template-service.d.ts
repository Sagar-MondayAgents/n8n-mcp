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
    /**
     * List templates that use specific node types
     */
    listNodeTemplates(nodeTypes: string[], limit?: number): Promise<TemplateInfo[]>;
    /**
     * Get a specific template with full workflow
     */
    getTemplate(templateId: number): Promise<TemplateWithWorkflow | null>;
    /**
     * Search templates by query
     */
    searchTemplates(query: string, limit?: number): Promise<TemplateInfo[]>;
    /**
     * Get templates for a specific task
     */
    getTemplatesForTask(task: string): Promise<TemplateInfo[]>;
    /**
     * List available tasks
     */
    listAvailableTasks(): string[];
    /**
     * Get template statistics
     */
    getTemplateStats(): Promise<Record<string, any>>;
    /**
     * Fetch and update templates from n8n.io
     */
    fetchAndUpdateTemplates(progressCallback?: (message: string, current: number, total: number) => void): Promise<void>;
    /**
     * Format stored template for API response
     */
    private formatTemplateInfo;
}
//# sourceMappingURL=template-service.d.ts.map