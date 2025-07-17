interface ToolDocumentation {
    name: string;
    category: string;
    essentials: {
        description: string;
        keyParameters: string[];
        example: string;
        performance: string;
        tips: string[];
    };
    full: {
        description: string;
        parameters: Record<string, {
            type: string;
            description: string;
            required?: boolean;
        }>;
        returns: string;
        examples: string[];
        useCases: string[];
        performance: string;
        bestPractices: string[];
        pitfalls: string[];
        relatedTools: string[];
    };
}
export declare const toolsDocumentation: Record<string, ToolDocumentation>;
export declare function getToolDocumentation(toolName: string, depth?: 'essentials' | 'full'): string;
export declare function getToolsOverview(depth?: 'essentials' | 'full'): string;
export declare function searchToolDocumentation(query: string): string[];
export declare function getToolsByCategory(category: string): string[];
export declare function getAllCategories(): string[];
export {};
//# sourceMappingURL=tools-documentation.d.ts.map