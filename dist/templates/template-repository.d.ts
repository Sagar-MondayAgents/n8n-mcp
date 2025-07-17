import { DatabaseAdapter } from '../database/database-adapter';
import { TemplateWorkflow, TemplateDetail } from './template-fetcher';
export interface StoredTemplate {
    id: number;
    workflow_id: number;
    name: string;
    description: string;
    author_name: string;
    author_username: string;
    author_verified: number;
    nodes_used: string;
    workflow_json: string;
    categories: string;
    views: number;
    created_at: string;
    updated_at: string;
    url: string;
    scraped_at: string;
}
export declare class TemplateRepository {
    private db;
    private sanitizer;
    constructor(db: DatabaseAdapter);
    saveTemplate(workflow: TemplateWorkflow, detail: TemplateDetail, categories?: string[]): void;
    getTemplatesByNodes(nodeTypes: string[], limit?: number): StoredTemplate[];
    getTemplate(templateId: number): StoredTemplate | null;
    searchTemplates(query: string, limit?: number): StoredTemplate[];
    getTemplatesForTask(task: string): StoredTemplate[];
    getAllTemplates(limit?: number): StoredTemplate[];
    getTemplateCount(): number;
    getTemplateStats(): Record<string, any>;
    clearTemplates(): void;
}
//# sourceMappingURL=template-repository.d.ts.map