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
    static validate(nodeType: string, config: Record<string, any>, properties: any[]): ValidationResult;
    private static checkRequiredProperties;
    private static getPropertyVisibility;
    protected static isPropertyVisible(prop: any, config: Record<string, any>): boolean;
    private static validatePropertyTypes;
    private static performNodeSpecificValidation;
    private static validateHttpRequest;
    private static validateWebhook;
    private static validateDatabase;
    private static validateCode;
    private static checkCommonIssues;
    private static performSecurityChecks;
    private static validateJavaScriptSyntax;
    private static validatePythonSyntax;
    private static validateN8nCodePatterns;
}
//# sourceMappingURL=config-validator.d.ts.map