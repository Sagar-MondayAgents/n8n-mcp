/**
 * PropertyFilter Service
 *
 * Intelligently filters node properties to return only essential and commonly-used ones.
 * Reduces property count from 200+ to 10-20 for better AI agent usability.
 */
export interface SimplifiedProperty {
    name: string;
    displayName: string;
    type: string;
    description: string;
    default?: any;
    options?: Array<{
        value: string;
        label: string;
    }>;
    required?: boolean;
    placeholder?: string;
    showWhen?: Record<string, any>;
    usageHint?: string;
}
export interface EssentialConfig {
    required: string[];
    common: string[];
    categoryPriority?: string[];
}
export interface FilteredProperties {
    required: SimplifiedProperty[];
    common: SimplifiedProperty[];
}
export declare class PropertyFilter {
    /**
     * Curated lists of essential properties for the most commonly used nodes.
     * Based on analysis of typical workflows and AI agent needs.
     */
    private static ESSENTIAL_PROPERTIES;
    /**
     * Deduplicate properties based on name and display conditions
     */
    static deduplicateProperties(properties: any[]): any[];
    /**
     * Get essential properties for a node type
     */
    static getEssentials(allProperties: any[], nodeType: string): FilteredProperties;
    /**
     * Extract and simplify specified properties
     */
    private static extractProperties;
    /**
     * Find a property by name, including in nested collections
     */
    private static findPropertyByName;
    /**
     * Simplify a property for AI consumption
     */
    private static simplifyProperty;
    /**
     * Generate helpful usage hints for properties
     */
    private static generateUsageHint;
    /**
     * Extract description from various possible fields
     */
    private static extractDescription;
    /**
     * Generate a description based on property characteristics
     */
    private static generateDescription;
    /**
     * Infer essentials for nodes without curated lists
     */
    private static inferEssentials;
    /**
     * Search for properties matching a query
     */
    static searchProperties(allProperties: any[], query: string, maxResults?: number): SimplifiedProperty[];
    /**
     * Recursively search properties including nested ones
     */
    private static searchPropertiesRecursive;
}
//# sourceMappingURL=property-filter.d.ts.map