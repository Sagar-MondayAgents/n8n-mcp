/**
 * Node-Specific Validators
 *
 * Provides detailed validation logic for commonly used n8n nodes.
 * Each validator understands the specific requirements and patterns of its node.
 */
import { ValidationError, ValidationWarning } from './config-validator';
export interface NodeValidationContext {
    config: Record<string, any>;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
    autofix: Record<string, any>;
}
export declare class NodeSpecificValidators {
    /**
     * Validate Slack node configuration with operation awareness
     */
    static validateSlack(context: NodeValidationContext): void;
    private static validateSlackSendMessage;
    private static validateSlackUpdateMessage;
    private static validateSlackDeleteMessage;
    private static validateSlackCreateChannel;
    /**
     * Validate Google Sheets node configuration
     */
    static validateGoogleSheets(context: NodeValidationContext): void;
    private static validateGoogleSheetsAppend;
    private static validateGoogleSheetsRead;
    private static validateGoogleSheetsUpdate;
    private static validateGoogleSheetsDelete;
    private static validateGoogleSheetsRange;
    /**
     * Validate OpenAI node configuration
     */
    static validateOpenAI(context: NodeValidationContext): void;
    /**
     * Validate MongoDB node configuration
     */
    static validateMongoDB(context: NodeValidationContext): void;
    /**
     * Validate Webhook node configuration
     */
    static validateWebhook(context: NodeValidationContext): void;
    /**
     * Validate Postgres node configuration
     */
    static validatePostgres(context: NodeValidationContext): void;
    /**
     * Validate MySQL node configuration
     */
    static validateMySQL(context: NodeValidationContext): void;
    /**
     * Validate SQL queries for injection risks and common issues
     */
    private static validateSQLQuery;
}
//# sourceMappingURL=node-specific-validators.d.ts.map