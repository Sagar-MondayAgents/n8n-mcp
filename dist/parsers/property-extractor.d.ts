export declare class PropertyExtractor {
    /**
     * Extract properties with proper handling of n8n's complex structures
     */
    extractProperties(nodeClass: any): any[];
    private getNodeDescription;
    /**
     * Extract operations from both declarative and programmatic nodes
     */
    extractOperations(nodeClass: any): any[];
    private extractOperationsFromDescription;
    /**
     * Deep search for AI tool capability
     */
    detectAIToolCapability(nodeClass: any): boolean;
    /**
     * Extract credential requirements with proper structure
     */
    extractCredentials(nodeClass: any): any[];
    private normalizeProperties;
}
//# sourceMappingURL=property-extractor.d.ts.map