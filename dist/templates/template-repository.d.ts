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
    /**
     * Save a template to the database
     */
    saveTemplate(workflow: TemplateWorkflow, detail: TemplateDetail, categories?: string[]): void;
    /**
     * Get templates that use specific node types
     */
    getTemplatesByNodes(nodeTypes: string[], limit?: number): StoredTemplate[];
    /**
     * Get a specific template by ID
     */
    getTemplate(templateId: number): StoredTemplate | null;
    /**
     * Search templates by name or description
     */
    searchTemplates(query: string, limit?: number): StoredTemplate[];
    /**
     * Get templates for a specific task/use case
     */
    getTemplatesForTask(task: string): StoredTemplate[];
    /**
     * Get all templates with limit
     */
    getAllTemplates(limit?: number): StoredTemplate[];
    /**
     * Get total template count
     */
    getTemplateCount(): number;
    /**
     * Get template statistics
     */
    getTemplateStats(): Record<string, any>;
    /**
     * Clear all templates (for testing or refresh)
     */
    clearTemplates(): void;
}
//# sourceMappingURL=template-repository.d.ts.map