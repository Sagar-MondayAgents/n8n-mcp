import { OperationInfo, ApiMethodMapping, CodeExample, TemplateInfo, RelatedResource } from '../utils/enhanced-documentation-fetcher';
interface NodeInfo {
    nodeType: string;
    name: string;
    displayName: string;
    description: string;
    category?: string;
    subcategory?: string;
    icon?: string;
    sourceCode: string;
    credentialCode?: string;
    documentationMarkdown?: string;
    documentationUrl?: string;
    documentationTitle?: string;
    operations?: OperationInfo[];
    apiMethods?: ApiMethodMapping[];
    documentationExamples?: CodeExample[];
    templates?: TemplateInfo[];
    relatedResources?: RelatedResource[];
    requiredScopes?: string[];
    exampleWorkflow?: any;
    exampleParameters?: any;
    propertiesSchema?: any;
    packageName: string;
    version?: string;
    codexData?: any;
    aliases?: string[];
    hasCredentials: boolean;
    isTrigger: boolean;
    isWebhook: boolean;
}
interface SearchOptions {
    query?: string;
    nodeType?: string;
    packageName?: string;
    category?: string;
    hasCredentials?: boolean;
    isTrigger?: boolean;
    limit?: number;
}
export declare class NodeDocumentationService {
    private db;
    private extractor;
    private docsFetcher;
    private dbPath;
    private initialized;
    constructor(dbPath?: string);
    private findDatabasePath;
    private initializeAsync;
    private ensureInitialized;
    private initializeDatabase;
    /**
     * Store complete node information including docs and examples
     */
    storeNode(nodeInfo: NodeInfo): Promise<void>;
    /**
     * Get complete node information
     */
    getNodeInfo(nodeType: string): Promise<NodeInfo | null>;
    /**
     * Search nodes with various filters
     */
    searchNodes(options: SearchOptions): Promise<NodeInfo[]>;
    /**
     * List all nodes
     */
    listNodes(): Promise<NodeInfo[]>;
    /**
     * Extract and store all nodes with documentation
     */
    rebuildDatabase(): Promise<{
        total: number;
        successful: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Parse node definition from source code
     */
    private parseNodeDefinition;
    /**
     * Convert database row to NodeInfo
     */
    private rowToNodeInfo;
    /**
     * Generate hash for content
     */
    private generateHash;
    /**
     * Store extraction statistics
     */
    private storeStatistics;
    /**
     * Get database statistics
     */
    getStatistics(): Promise<any>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=node-documentation-service.d.ts.map