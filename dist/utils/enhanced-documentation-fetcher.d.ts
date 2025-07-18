export interface EnhancedNodeDocumentation {
    markdown: string;
    url: string;
    title?: string;
    description?: string;
    operations?: OperationInfo[];
    apiMethods?: ApiMethodMapping[];
    examples?: CodeExample[];
    templates?: TemplateInfo[];
    relatedResources?: RelatedResource[];
    requiredScopes?: string[];
    metadata?: DocumentationMetadata;
}
export interface OperationInfo {
    resource: string;
    operation: string;
    description: string;
    subOperations?: string[];
}
export interface ApiMethodMapping {
    resource: string;
    operation: string;
    apiMethod: string;
    apiUrl: string;
}
export interface CodeExample {
    title?: string;
    description?: string;
    type: 'json' | 'javascript' | 'yaml' | 'text';
    code: string;
    language?: string;
}
export interface TemplateInfo {
    name: string;
    description?: string;
    url?: string;
}
export interface RelatedResource {
    title: string;
    url: string;
    type: 'documentation' | 'api' | 'tutorial' | 'external';
}
export interface DocumentationMetadata {
    contentType?: string[];
    priority?: string;
    tags?: string[];
    lastUpdated?: Date;
}
export declare class EnhancedDocumentationFetcher {
    private docsPath;
    private docsRepoUrl;
    private cloned;
    constructor(docsPath?: string);
    /**
     * Clone or update the n8n-docs repository
     */
    ensureDocsRepository(): Promise<void>;
    /**
     * Get enhanced documentation for a specific node
     */
    getEnhancedNodeDocumentation(nodeType: string): Promise<EnhancedNodeDocumentation | null>;
    /**
     * Parse markdown content into enhanced documentation structure
     */
    private parseEnhancedDocumentation;
    /**
     * Extract frontmatter metadata
     */
    private extractFrontmatter;
    /**
     * Extract title from markdown
     */
    private extractTitle;
    /**
     * Extract description from markdown
     */
    private extractDescription;
    /**
     * Extract operations from markdown
     */
    private extractOperations;
    /**
     * Extract API method mappings from markdown tables
     */
    private extractApiMethods;
    /**
     * Extract code examples from markdown
     */
    private extractCodeExamples;
    /**
     * Extract template information
     */
    private extractTemplates;
    /**
     * Extract related resources
     */
    private extractRelatedResources;
    /**
     * Extract required scopes
     */
    private extractRequiredScopes;
    /**
     * Map language to code example type
     */
    private mapLanguageToType;
    /**
     * Check if this is a credential documentation
     */
    private isCredentialDoc;
    /**
     * Extract node name from node type
     */
    private extractNodeName;
    /**
     * Search for node documentation file
     */
    private searchForNodeDoc;
    /**
     * Generate documentation URL from file path
     */
    private generateDocUrl;
    /**
     * Clean up cloned repository
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=enhanced-documentation-fetcher.d.ts.map