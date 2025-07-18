/**
 * Expression Validator for n8n expressions
 * Validates expression syntax, variable references, and context availability
 */
interface ExpressionValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    usedVariables: Set<string>;
    usedNodes: Set<string>;
}
interface ExpressionContext {
    availableNodes: string[];
    currentNodeName?: string;
    isInLoop?: boolean;
    hasInputData?: boolean;
}
export declare class ExpressionValidator {
    private static readonly EXPRESSION_PATTERN;
    private static readonly VARIABLE_PATTERNS;
    /**
     * Validate a single expression
     */
    static validateExpression(expression: string, context: ExpressionContext): ExpressionValidationResult;
    /**
     * Check for basic syntax errors
     */
    private static checkSyntaxErrors;
    /**
     * Extract all expressions from a string
     */
    private static extractExpressions;
    /**
     * Validate a single expression content
     */
    private static validateSingleExpression;
    /**
     * Check for common expression mistakes
     */
    private static checkCommonMistakes;
    /**
     * Check that all referenced nodes exist
     */
    private static checkNodeReferences;
    /**
     * Validate all expressions in a node's parameters
     */
    static validateNodeExpressions(parameters: any, context: ExpressionContext): ExpressionValidationResult;
    /**
     * Recursively validate expressions in parameters
     */
    private static validateParametersRecursive;
}
export {};
//# sourceMappingURL=expression-validator.d.ts.map