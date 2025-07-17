import { ConfigValidator, ValidationResult } from './config-validator';
export type ValidationMode = 'full' | 'operation' | 'minimal';
export type ValidationProfile = 'strict' | 'runtime' | 'ai-friendly' | 'minimal';
export interface EnhancedValidationResult extends ValidationResult {
    mode: ValidationMode;
    profile?: ValidationProfile;
    operation?: {
        resource?: string;
        operation?: string;
        action?: string;
    };
    examples?: Array<{
        description: string;
        config: Record<string, any>;
    }>;
    nextSteps?: string[];
}
export interface OperationContext {
    resource?: string;
    operation?: string;
    action?: string;
    mode?: string;
}
export declare class EnhancedConfigValidator extends ConfigValidator {
    static validateWithMode(nodeType: string, config: Record<string, any>, properties: any[], mode?: ValidationMode, profile?: ValidationProfile): EnhancedValidationResult;
    private static extractOperationContext;
    private static filterPropertiesByMode;
    private static isPropertyRelevantToOperation;
    private static addOperationSpecificEnhancements;
    private static enhanceSlackValidation;
    private static enhanceGoogleSheetsValidation;
    private static enhanceHttpRequestValidation;
    private static generateNextSteps;
    private static addExamplesFromGenerator;
    private static deduplicateErrors;
    private static applyProfileFilters;
}
//# sourceMappingURL=enhanced-config-validator.d.ts.map