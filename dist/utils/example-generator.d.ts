/**
 * Generates example workflows and parameters for n8n nodes
 */
export declare class ExampleGenerator {
    /**
     * Generate an example workflow from node definition
     */
    static generateFromNodeDefinition(nodeDefinition: any): any;
    /**
     * Generate example parameters based on node properties
     */
    static generateExampleParameters(nodeDefinition: any): any;
    /**
     * Generate example value based on property definition
     */
    private static generateExampleValue;
    /**
     * Generate a unique node ID
     */
    private static generateNodeId;
    /**
     * Generate example based on node operations
     */
    static generateFromOperations(operations: any[]): any;
}
//# sourceMappingURL=example-generator.d.ts.map