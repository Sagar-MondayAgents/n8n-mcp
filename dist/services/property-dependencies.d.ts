/**
 * Property Dependencies Service
 *
 * Analyzes property dependencies and visibility conditions.
 * Helps AI agents understand which properties affect others.
 */
export interface PropertyDependency {
    property: string;
    displayName: string;
    dependsOn: DependencyCondition[];
    showWhen?: Record<string, any>;
    hideWhen?: Record<string, any>;
    enablesProperties?: string[];
    disablesProperties?: string[];
    notes?: string[];
}
export interface DependencyCondition {
    property: string;
    values: any[];
    condition: 'equals' | 'not_equals' | 'includes' | 'not_includes';
    description?: string;
}
export interface DependencyAnalysis {
    totalProperties: number;
    propertiesWithDependencies: number;
    dependencies: PropertyDependency[];
    dependencyGraph: Record<string, string[]>;
    suggestions: string[];
}
export declare class PropertyDependencies {
    /**
     * Analyze property dependencies for a node
     */
    static analyze(properties: any[]): DependencyAnalysis;
    /**
     * Extract dependency information from a property
     */
    private static extractDependency;
    /**
     * Generate human-readable condition description
     */
    private static generateConditionDescription;
    /**
     * Generate suggestions based on dependency analysis
     */
    private static generateSuggestions;
    /**
     * Get properties that would be visible/hidden given a configuration
     */
    static getVisibilityImpact(properties: any[], config: Record<string, any>): {
        visible: string[];
        hidden: string[];
        reasons: Record<string, string>;
    };
    /**
     * Check if a property is visible given current configuration
     */
    private static checkVisibility;
}
//# sourceMappingURL=property-dependencies.d.ts.map