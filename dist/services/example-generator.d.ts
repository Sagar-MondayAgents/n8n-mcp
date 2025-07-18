/**
 * ExampleGenerator Service
 *
 * Provides concrete, working examples for n8n nodes to help AI agents
 * understand how to configure them properly.
 */
export interface NodeExamples {
    minimal: Record<string, any>;
    common?: Record<string, any>;
    advanced?: Record<string, any>;
}
export declare class ExampleGenerator {
    /**
     * Curated examples for the most commonly used nodes.
     * Each example is a valid configuration that can be used directly.
     */
    private static NODE_EXAMPLES;
    /**
     * Get examples for a specific node type
     */
    static getExamples(nodeType: string, essentials?: any): NodeExamples;
    /**
     * Generate basic examples for nodes without curated ones
     */
    private static generateBasicExamples;
    /**
     * Generate a sensible default value for a property
     */
    private static getDefaultValue;
    /**
     * Get default value for string properties based on name
     */
    private static getStringDefault;
    /**
     * Get example for a specific use case
     */
    static getTaskExample(nodeType: string, task: string): Record<string, any> | undefined;
}
//# sourceMappingURL=example-generator.d.ts.map