/**
 * Task Templates Service
 *
 * Provides pre-configured node settings for common tasks.
 * This helps AI agents quickly configure nodes for specific use cases.
 */
export interface TaskTemplate {
    task: string;
    description: string;
    nodeType: string;
    configuration: Record<string, any>;
    userMustProvide: Array<{
        property: string;
        description: string;
        example?: any;
    }>;
    optionalEnhancements?: Array<{
        property: string;
        description: string;
        when?: string;
    }>;
    notes?: string[];
}
export declare class TaskTemplates {
    private static templates;
    /**
     * Get all available tasks
     */
    static getAllTasks(): string[];
    /**
     * Get tasks for a specific node type
     */
    static getTasksForNode(nodeType: string): string[];
    /**
     * Get a specific task template
     */
    static getTaskTemplate(task: string): TaskTemplate | undefined;
    /**
     * Search for tasks by keyword
     */
    static searchTasks(keyword: string): string[];
    /**
     * Get task categories
     */
    static getTaskCategories(): Record<string, string[]>;
}
//# sourceMappingURL=task-templates.d.ts.map