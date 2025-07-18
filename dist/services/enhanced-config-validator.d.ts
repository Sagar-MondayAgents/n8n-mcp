/**
 * Enhanced Configuration Validator Service
 *
 * Provides operation-aware validation for n8n nodes with reduced false positives.
 * Supports multiple validation modes and node-specific logic.
 */
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
    /**
     * Validate with operation awareness
     */
    static validateWithMode(nodeType: string, config: Record<string, any>, properties: any[], mode?: ValidationMode, profile?: ValidationProfile): EnhancedValidationResult;
    /**
     * Extract operation context from configuration
     */
    private static extractOperationContext;
    /**
     * Filter properties based on validation mode and operation
     */
    private static filterPropertiesByMode;
    /**
     * Check if property is relevant to current operation
     */
    private static isPropertyRelevantToOperation;
    /**
     * Add operation-specific enhancements to validation result
     */
    private static addOperationSpecificEnhancements;
    /**
     * Enhanced Slack validation with operation awareness
     */
    private static enhanceSlackValidation;
    /**
     * Enhanced Google Sheets validation
     */
    private static enhanceGoogleSheetsValidation;
    /**
     * Enhanced HTTP Request validation
     */
    private static enhanceHttpRequestValidation;
    /**
     * Generate actionable next steps based on validation results
     */
    private static generateNextSteps;
    /**
     * Add examples from ExampleGenerator to help fix validation errors
     */
    private static addExamplesFromGenerator;
    /**
     * Deduplicate errors based on property and type
     * Prefers more specific error messages over generic ones
     */
    private static deduplicateErrors;
    /**
     * Apply profile-based filtering to validation results
     */
    private static applyProfileFilters;
}
//# sourceMappingURL=enhanced-config-validator.d.ts.map