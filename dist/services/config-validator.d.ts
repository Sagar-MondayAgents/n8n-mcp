/**
 * Configuration Validator Service
 *
 * Validates node configurations to catch errors before execution.
 * Provides helpful suggestions and identifies missing or misconfigured properties.
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
    visibleProperties: string[];
    hiddenProperties: string[];
    autofix?: Record<string, any>;
}
export interface ValidationError {
    type: 'missing_required' | 'invalid_type' | 'invalid_value' | 'incompatible';
    property: string;
    message: string;
    fix?: string;
}
export interface ValidationWarning {
    type: 'missing_common' | 'deprecated' | 'inefficient' | 'security';
    property?: string;
    message: string;
    suggestion?: string;
}
export declare class ConfigValidator {
    /**
     * Validate a node configuration
     */
    static validate(nodeType: string, config: Record<string, any>, properties: any[]): ValidationResult;
    /**
     * Check for missing required properties
     */
    private static checkRequiredProperties;
    /**
     * Get visible and hidden properties based on displayOptions
     */
    private static getPropertyVisibility;
    /**
     * Check if a property is visible given current config
     */
    protected static isPropertyVisible(prop: any, config: Record<string, any>): boolean;
    /**
     * Validate property types and values
     */
    private static validatePropertyTypes;
    /**
     * Perform node-specific validation
     */
    private static performNodeSpecificValidation;
    /**
     * Validate HTTP Request configuration
     */
    private static validateHttpRequest;
    /**
     * Validate Webhook configuration
     */
    private static validateWebhook;
    /**
     * Validate database queries
     */
    private static validateDatabase;
    /**
     * Validate Code node
     */
    private static validateCode;
    /**
     * Check for common configuration issues
     */
    private static checkCommonIssues;
    /**
     * Perform security checks
     */
    private static performSecurityChecks;
    /**
     * Basic JavaScript syntax validation
     */
    private static validateJavaScriptSyntax;
    /**
     * Basic Python syntax validation
     */
    private static validatePythonSyntax;
    /**
     * Validate n8n-specific code patterns
     */
    private static validateN8nCodePatterns;
}
//# sourceMappingURL=config-validator.d.ts.map