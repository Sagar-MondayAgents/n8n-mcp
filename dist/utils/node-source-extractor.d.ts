export interface NodeSourceInfo {
    nodeType: string;
    sourceCode: string;
    credentialCode?: string;
    packageInfo?: any;
    location: string;
}
export declare class NodeSourceExtractor {
    private n8nBasePaths;
    /**
     * Extract source code for a specific n8n node
     */
    extractNodeSource(nodeType: string): Promise<NodeSourceInfo>;
    /**
     * Parse node type identifier
     */
    private parseNodeType;
    /**
     * Search for node in a specific path
     */
    private searchNodeInPath;
    /**
     * Search for nodes in pnpm's special directory structure
     */
    private searchInPnpm;
    /**
     * Search for files matching a glob-like pattern
     */
    private searchWithGlobPattern;
    /**
     * Try to load a node file and its associated files
     */
    private tryLoadNodeFile;
    /**
     * List all available nodes
     */
    listAvailableNodes(category?: string, search?: string): Promise<any[]>;
    /**
     * Scan directory for n8n nodes
     */
    private scanDirectoryForNodes;
    /**
     * Scan pnpm directory structure for nodes
     */
    private scanPnpmDirectory;
    /**
     * Extract AI Agent node specifically
     */
    extractAIAgentNode(): Promise<NodeSourceInfo>;
}
//# sourceMappingURL=node-source-extractor.d.ts.map