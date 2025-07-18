/**
 * Configuration for template sanitization
 */
export interface SanitizerConfig {
    problematicTokens: string[];
    tokenPatterns: RegExp[];
    replacements: Map<string, string>;
}
/**
 * Default sanitizer configuration
 */
export declare const defaultSanitizerConfig: SanitizerConfig;
/**
 * Template sanitizer for removing API tokens from workflow templates
 */
export declare class TemplateSanitizer {
    private config;
    constructor(config?: SanitizerConfig);
    /**
     * Add a new problematic token to sanitize
     */
    addProblematicToken(token: string): void;
    /**
     * Add a new token pattern to detect
     */
    addTokenPattern(pattern: RegExp, replacement: string): void;
    /**
     * Sanitize a workflow object
     */
    sanitizeWorkflow(workflow: any): {
        sanitized: any;
        wasModified: boolean;
    };
    /**
     * Check if a workflow needs sanitization
     */
    needsSanitization(workflow: any): boolean;
    /**
     * Get list of detected tokens in a workflow
     */
    detectTokens(workflow: any): string[];
    private sanitizeObject;
    private replaceTokens;
}
//# sourceMappingURL=template-sanitizer.d.ts.map