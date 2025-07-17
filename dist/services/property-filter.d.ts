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
    private static ESSENTIAL_PROPERTIES;
    static deduplicateProperties(properties: any[]): any[];
    static getEssentials(allProperties: any[], nodeType: string): FilteredProperties;
    private static extractProperties;
    private static findPropertyByName;
    private static simplifyProperty;
    private static generateUsageHint;
    private static extractDescription;
    private static generateDescription;
    private static inferEssentials;
    static searchProperties(allProperties: any[], query: string, maxResults?: number): SimplifiedProperty[];
    private static searchPropertiesRecursive;
}
//# sourceMappingURL=property-filter.d.ts.map