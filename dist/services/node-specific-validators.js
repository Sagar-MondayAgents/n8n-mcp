"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeSpecificValidators = void 0;
class NodeSpecificValidators {
    static validateSlack(context) {
        const { config, errors, warnings, suggestions } = context;
        const { resource, operation } = config;
        if (resource === 'message') {
            switch (operation) {
                case 'send':
                    this.validateSlackSendMessage(context);
                    break;
                case 'update':
                    this.validateSlackUpdateMessage(context);
                    break;
                case 'delete':
                    this.validateSlackDeleteMessage(context);
                    break;
            }
        }
        else if (resource === 'channel') {
            switch (operation) {
                case 'create':
                    this.validateSlackCreateChannel(context);
                    break;
                case 'get':
                case 'getAll':
                    break;
            }
        }
        else if (resource === 'user') {
            if (operation === 'get' && !config.user) {
                errors.push({
                    type: 'missing_required',
                    property: 'user',
                    message: 'User identifier required - use email, user ID, or username',
                    fix: 'Set user to an email like "john@example.com" or user ID like "U1234567890"'
                });
            }
        }
    }
    static validateSlackSendMessage(context) {
        const { config, errors, warnings, suggestions, autofix } = context;
        if (!config.channel && !config.channelId) {
            errors.push({
                type: 'missing_required',
                property: 'channel',
                message: 'Channel is required to send a message',
                fix: 'Set channel to a channel name (e.g., "#general") or ID (e.g., "C1234567890")'
            });
        }
        if (!config.text && !config.blocks && !config.attachments) {
            errors.push({
                type: 'missing_required',
                property: 'text',
                message: 'Message content is required - provide text, blocks, or attachments',
                fix: 'Add text field with your message content'
            });
        }
        if (config.text && config.text.length > 40000) {
            warnings.push({
                type: 'inefficient',
                property: 'text',
                message: 'Message text exceeds Slack\'s 40,000 character limit',
                suggestion: 'Split into multiple messages or use a file upload'
            });
        }
        if (config.replyToThread && !config.threadTs) {
            warnings.push({
                type: 'missing_common',
                property: 'threadTs',
                message: 'Thread timestamp required when replying to thread',
                suggestion: 'Set threadTs to the timestamp of the thread parent message'
            });
        }
        if (config.text?.includes('@') && !config.linkNames) {
            suggestions.push('Set linkNames=true to convert @mentions to user links');
            autofix.linkNames = true;
        }
    }
    static validateSlackUpdateMessage(context) {
        const { config, errors } = context;
        if (!config.ts) {
            errors.push({
                type: 'missing_required',
                property: 'ts',
                message: 'Message timestamp (ts) is required to update a message',
                fix: 'Provide the timestamp of the message to update'
            });
        }
        if (!config.channel && !config.channelId) {
            errors.push({
                type: 'missing_required',
                property: 'channel',
                message: 'Channel is required to update a message',
                fix: 'Provide the channel where the message exists'
            });
        }
    }
    static validateSlackDeleteMessage(context) {
        const { config, errors, warnings } = context;
        if (!config.ts) {
            errors.push({
                type: 'missing_required',
                property: 'ts',
                message: 'Message timestamp (ts) is required to delete a message',
                fix: 'Provide the timestamp of the message to delete'
            });
        }
        if (!config.channel && !config.channelId) {
            errors.push({
                type: 'missing_required',
                property: 'channel',
                message: 'Channel is required to delete a message',
                fix: 'Provide the channel where the message exists'
            });
        }
        warnings.push({
            type: 'security',
            message: 'Message deletion is permanent and cannot be undone',
            suggestion: 'Consider archiving or updating the message instead if you need to preserve history'
        });
    }
    static validateSlackCreateChannel(context) {
        const { config, errors, warnings } = context;
        if (!config.name) {
            errors.push({
                type: 'missing_required',
                property: 'name',
                message: 'Channel name is required',
                fix: 'Provide a channel name (lowercase, no spaces, 1-80 characters)'
            });
        }
        else {
            const name = config.name;
            if (name.includes(' ')) {
                errors.push({
                    type: 'invalid_value',
                    property: 'name',
                    message: 'Channel names cannot contain spaces',
                    fix: 'Use hyphens or underscores instead of spaces'
                });
            }
            if (name !== name.toLowerCase()) {
                errors.push({
                    type: 'invalid_value',
                    property: 'name',
                    message: 'Channel names must be lowercase',
                    fix: 'Convert the channel name to lowercase'
                });
            }
            if (name.length > 80) {
                errors.push({
                    type: 'invalid_value',
                    property: 'name',
                    message: 'Channel name exceeds 80 character limit',
                    fix: 'Shorten the channel name'
                });
            }
        }
    }
    static validateGoogleSheets(context) {
        const { config, errors, warnings, suggestions } = context;
        const { operation } = config;
        if (!config.sheetId && !config.documentId) {
            errors.push({
                type: 'missing_required',
                property: 'sheetId',
                message: 'Spreadsheet ID is required',
                fix: 'Provide the Google Sheets document ID from the URL'
            });
        }
        switch (operation) {
            case 'append':
                this.validateGoogleSheetsAppend(context);
                break;
            case 'read':
                this.validateGoogleSheetsRead(context);
                break;
            case 'update':
                this.validateGoogleSheetsUpdate(context);
                break;
            case 'delete':
                this.validateGoogleSheetsDelete(context);
                break;
        }
        if (config.range) {
            this.validateGoogleSheetsRange(config.range, errors, warnings);
        }
    }
    static validateGoogleSheetsAppend(context) {
        const { config, errors, warnings, autofix } = context;
        if (!config.range) {
            errors.push({
                type: 'missing_required',
                property: 'range',
                message: 'Range is required for append operation',
                fix: 'Specify range like "Sheet1!A:B" or "Sheet1!A1:B10"'
            });
        }
        if (!config.options?.valueInputMode) {
            warnings.push({
                type: 'missing_common',
                property: 'options.valueInputMode',
                message: 'Consider setting valueInputMode for proper data formatting',
                suggestion: 'Use "USER_ENTERED" to parse formulas and dates, or "RAW" for literal values'
            });
            autofix.options = { ...config.options, valueInputMode: 'USER_ENTERED' };
        }
    }
    static validateGoogleSheetsRead(context) {
        const { config, errors, suggestions } = context;
        if (!config.range) {
            errors.push({
                type: 'missing_required',
                property: 'range',
                message: 'Range is required for read operation',
                fix: 'Specify range like "Sheet1!A:B" or "Sheet1!A1:B10"'
            });
        }
        if (!config.options?.dataStructure) {
            suggestions.push('Consider setting options.dataStructure to "object" for easier data manipulation');
        }
    }
    static validateGoogleSheetsUpdate(context) {
        const { config, errors } = context;
        if (!config.range) {
            errors.push({
                type: 'missing_required',
                property: 'range',
                message: 'Range is required for update operation',
                fix: 'Specify the exact range to update like "Sheet1!A1:B10"'
            });
        }
        if (!config.values && !config.rawData) {
            errors.push({
                type: 'missing_required',
                property: 'values',
                message: 'Values are required for update operation',
                fix: 'Provide the data to write to the spreadsheet'
            });
        }
    }
    static validateGoogleSheetsDelete(context) {
        const { config, errors, warnings } = context;
        if (!config.toDelete) {
            errors.push({
                type: 'missing_required',
                property: 'toDelete',
                message: 'Specify what to delete (rows or columns)',
                fix: 'Set toDelete to "rows" or "columns"'
            });
        }
        if (config.toDelete === 'rows' && !config.startIndex && config.startIndex !== 0) {
            errors.push({
                type: 'missing_required',
                property: 'startIndex',
                message: 'Start index is required when deleting rows',
                fix: 'Specify the starting row index (0-based)'
            });
        }
        warnings.push({
            type: 'security',
            message: 'Deletion is permanent. Consider backing up data first',
            suggestion: 'Read the data before deletion to create a backup'
        });
    }
    static validateGoogleSheetsRange(range, errors, warnings) {
        if (!range.includes('!')) {
            warnings.push({
                type: 'inefficient',
                property: 'range',
                message: 'Range should include sheet name for clarity',
                suggestion: 'Format: "SheetName!A1:B10" or "SheetName!A:B"'
            });
        }
        if (range.includes(' ') && !range.match(/^'[^']+'/)) {
            errors.push({
                type: 'invalid_value',
                property: 'range',
                message: 'Sheet names with spaces must be quoted',
                fix: 'Use single quotes around sheet name: \'Sheet Name\'!A1:B10'
            });
        }
        const a1Pattern = /^('[^']+'|[^!]+)!([A-Z]+\d*:?[A-Z]*\d*|[A-Z]+:[A-Z]+|\d+:\d+)$/i;
        if (!a1Pattern.test(range)) {
            warnings.push({
                type: 'inefficient',
                property: 'range',
                message: 'Range may not be in valid A1 notation',
                suggestion: 'Examples: "Sheet1!A1:B10", "Sheet1!A:B", "Sheet1!1:10"'
            });
        }
    }
    static validateOpenAI(context) {
        const { config, errors, warnings, suggestions } = context;
        const { resource, operation } = config;
        if (resource === 'chat' && operation === 'create') {
            if (!config.model) {
                errors.push({
                    type: 'missing_required',
                    property: 'model',
                    message: 'Model selection is required',
                    fix: 'Choose a model like "gpt-4", "gpt-3.5-turbo", etc.'
                });
            }
            else {
                const deprecatedModels = ['text-davinci-003', 'text-davinci-002'];
                if (deprecatedModels.includes(config.model)) {
                    warnings.push({
                        type: 'deprecated',
                        property: 'model',
                        message: `Model ${config.model} is deprecated`,
                        suggestion: 'Use "gpt-3.5-turbo" or "gpt-4" instead'
                    });
                }
            }
            if (!config.messages && !config.prompt) {
                errors.push({
                    type: 'missing_required',
                    property: 'messages',
                    message: 'Messages or prompt required for chat completion',
                    fix: 'Add messages array or use the prompt field'
                });
            }
            if (config.maxTokens && config.maxTokens > 4000) {
                warnings.push({
                    type: 'inefficient',
                    property: 'maxTokens',
                    message: 'High token limit may increase costs significantly',
                    suggestion: 'Consider if you really need more than 4000 tokens'
                });
            }
            if (config.temperature !== undefined) {
                if (config.temperature < 0 || config.temperature > 2) {
                    errors.push({
                        type: 'invalid_value',
                        property: 'temperature',
                        message: 'Temperature must be between 0 and 2',
                        fix: 'Set temperature between 0 (deterministic) and 2 (creative)'
                    });
                }
            }
        }
    }
    static validateMongoDB(context) {
        const { config, errors, warnings } = context;
        const { operation } = config;
        if (!config.collection) {
            errors.push({
                type: 'missing_required',
                property: 'collection',
                message: 'Collection name is required',
                fix: 'Specify the MongoDB collection to work with'
            });
        }
        switch (operation) {
            case 'find':
                if (config.query) {
                    try {
                        JSON.parse(config.query);
                    }
                    catch (e) {
                        errors.push({
                            type: 'invalid_value',
                            property: 'query',
                            message: 'Query must be valid JSON',
                            fix: 'Ensure query is valid JSON like: {"name": "John"}'
                        });
                    }
                }
                break;
            case 'insert':
                if (!config.fields && !config.documents) {
                    errors.push({
                        type: 'missing_required',
                        property: 'fields',
                        message: 'Document data is required for insert',
                        fix: 'Provide the data to insert'
                    });
                }
                break;
            case 'update':
                if (!config.query) {
                    warnings.push({
                        type: 'security',
                        message: 'Update without query will affect all documents',
                        suggestion: 'Add a query to target specific documents'
                    });
                }
                break;
            case 'delete':
                if (!config.query || config.query === '{}') {
                    errors.push({
                        type: 'invalid_value',
                        property: 'query',
                        message: 'Delete without query would remove all documents - this is a critical security issue',
                        fix: 'Add a query to specify which documents to delete'
                    });
                }
                break;
        }
    }
    static validateWebhook(context) {
        const { config, errors, warnings, suggestions } = context;
        if (!config.path) {
            errors.push({
                type: 'missing_required',
                property: 'path',
                message: 'Webhook path is required',
                fix: 'Set a unique path like "my-webhook" (no leading slash)'
            });
        }
        else {
            const path = config.path;
            if (path.startsWith('/')) {
                warnings.push({
                    type: 'inefficient',
                    property: 'path',
                    message: 'Webhook path should not start with /',
                    suggestion: 'Remove the leading slash: use "my-webhook" instead of "/my-webhook"'
                });
            }
            if (path.includes(' ')) {
                errors.push({
                    type: 'invalid_value',
                    property: 'path',
                    message: 'Webhook path cannot contain spaces',
                    fix: 'Replace spaces with hyphens or underscores'
                });
            }
            if (!/^[a-zA-Z0-9\-_\/]+$/.test(path.replace(/^\//, ''))) {
                warnings.push({
                    type: 'inefficient',
                    property: 'path',
                    message: 'Webhook path contains special characters',
                    suggestion: 'Use only letters, numbers, hyphens, and underscores'
                });
            }
        }
        if (config.responseMode === 'responseNode') {
            suggestions.push('Add a "Respond to Webhook" node to send custom responses');
            if (!config.responseData) {
                warnings.push({
                    type: 'missing_common',
                    property: 'responseData',
                    message: 'Response data not configured for responseNode mode',
                    suggestion: 'Add a "Respond to Webhook" node or change responseMode'
                });
            }
        }
        if (config.httpMethod && Array.isArray(config.httpMethod)) {
            if (config.httpMethod.length === 0) {
                errors.push({
                    type: 'invalid_value',
                    property: 'httpMethod',
                    message: 'At least one HTTP method must be selected',
                    fix: 'Select GET, POST, or other methods your webhook should accept'
                });
            }
        }
        if (!config.authentication || config.authentication === 'none') {
            warnings.push({
                type: 'security',
                message: 'Webhook has no authentication',
                suggestion: 'Consider adding authentication to prevent unauthorized access'
            });
        }
    }
    static validatePostgres(context) {
        const { config, errors, warnings, suggestions, autofix } = context;
        const { operation } = config;
        if (['execute', 'select', 'insert', 'update', 'delete'].includes(operation)) {
            this.validateSQLQuery(context, 'postgres');
        }
        switch (operation) {
            case 'insert':
                if (!config.table) {
                    errors.push({
                        type: 'missing_required',
                        property: 'table',
                        message: 'Table name is required for insert operation',
                        fix: 'Specify the table to insert data into'
                    });
                }
                if (!config.columns && !config.dataMode) {
                    warnings.push({
                        type: 'missing_common',
                        property: 'columns',
                        message: 'No columns specified for insert',
                        suggestion: 'Define which columns to insert data into'
                    });
                }
                break;
            case 'update':
                if (!config.table) {
                    errors.push({
                        type: 'missing_required',
                        property: 'table',
                        message: 'Table name is required for update operation',
                        fix: 'Specify the table to update'
                    });
                }
                if (!config.updateKey) {
                    warnings.push({
                        type: 'missing_common',
                        property: 'updateKey',
                        message: 'No update key specified',
                        suggestion: 'Set updateKey to identify which rows to update (e.g., "id")'
                    });
                }
                break;
            case 'delete':
                if (!config.table) {
                    errors.push({
                        type: 'missing_required',
                        property: 'table',
                        message: 'Table name is required for delete operation',
                        fix: 'Specify the table to delete from'
                    });
                }
                if (!config.deleteKey) {
                    errors.push({
                        type: 'missing_required',
                        property: 'deleteKey',
                        message: 'Delete key is required to identify rows',
                        fix: 'Set deleteKey (e.g., "id") to specify which rows to delete'
                    });
                }
                break;
            case 'execute':
                if (!config.query) {
                    errors.push({
                        type: 'missing_required',
                        property: 'query',
                        message: 'SQL query is required',
                        fix: 'Provide the SQL query to execute'
                    });
                }
                break;
        }
        if (config.connectionTimeout === undefined) {
            suggestions.push('Consider setting connectionTimeout to handle slow connections');
        }
    }
    static validateMySQL(context) {
        const { config, errors, warnings, suggestions } = context;
        const { operation } = config;
        if (['execute', 'insert', 'update', 'delete'].includes(operation)) {
            this.validateSQLQuery(context, 'mysql');
        }
        switch (operation) {
            case 'insert':
                if (!config.table) {
                    errors.push({
                        type: 'missing_required',
                        property: 'table',
                        message: 'Table name is required for insert operation',
                        fix: 'Specify the table to insert data into'
                    });
                }
                break;
            case 'update':
                if (!config.table) {
                    errors.push({
                        type: 'missing_required',
                        property: 'table',
                        message: 'Table name is required for update operation',
                        fix: 'Specify the table to update'
                    });
                }
                if (!config.updateKey) {
                    warnings.push({
                        type: 'missing_common',
                        property: 'updateKey',
                        message: 'No update key specified',
                        suggestion: 'Set updateKey to identify which rows to update'
                    });
                }
                break;
            case 'delete':
                if (!config.table) {
                    errors.push({
                        type: 'missing_required',
                        property: 'table',
                        message: 'Table name is required for delete operation',
                        fix: 'Specify the table to delete from'
                    });
                }
                break;
            case 'execute':
                if (!config.query) {
                    errors.push({
                        type: 'missing_required',
                        property: 'query',
                        message: 'SQL query is required',
                        fix: 'Provide the SQL query to execute'
                    });
                }
                break;
        }
        if (config.timezone === undefined) {
            suggestions.push('Consider setting timezone to ensure consistent date/time handling');
        }
    }
    static validateSQLQuery(context, dbType = 'generic') {
        const { config, errors, warnings, suggestions } = context;
        const query = config.query || config.deleteQuery || config.updateQuery || '';
        if (!query)
            return;
        const lowerQuery = query.toLowerCase();
        if (query.includes('${') || query.includes('{{')) {
            warnings.push({
                type: 'security',
                message: 'Query contains template expressions that might be vulnerable to SQL injection',
                suggestion: 'Use parameterized queries with query parameters instead of string interpolation'
            });
            suggestions.push('Example: Use "SELECT * FROM users WHERE id = $1" with queryParams: [userId]');
        }
        if (lowerQuery.includes('delete') && !lowerQuery.includes('where')) {
            errors.push({
                type: 'invalid_value',
                property: 'query',
                message: 'DELETE query without WHERE clause will delete all records',
                fix: 'Add a WHERE clause to specify which records to delete'
            });
        }
        if (lowerQuery.includes('update') && !lowerQuery.includes('where')) {
            warnings.push({
                type: 'security',
                message: 'UPDATE query without WHERE clause will update all records',
                suggestion: 'Add a WHERE clause to specify which records to update'
            });
        }
        if (lowerQuery.includes('truncate')) {
            warnings.push({
                type: 'security',
                message: 'TRUNCATE will remove all data from the table',
                suggestion: 'Consider using DELETE with WHERE clause if you need to keep some data'
            });
        }
        if (lowerQuery.includes('drop')) {
            errors.push({
                type: 'invalid_value',
                property: 'query',
                message: 'DROP operations are extremely dangerous and will permanently delete database objects',
                fix: 'Use this only if you really intend to delete tables/databases permanently'
            });
        }
        if (lowerQuery.includes('select *')) {
            suggestions.push('Consider selecting specific columns instead of * for better performance');
        }
        if (dbType === 'postgres') {
            if (query.includes('$$')) {
                suggestions.push('Dollar-quoted strings detected - ensure they are properly closed');
            }
        }
        else if (dbType === 'mysql') {
            if (query.includes('`')) {
                suggestions.push('Using backticks for identifiers - ensure they are properly paired');
            }
        }
    }
}
exports.NodeSpecificValidators = NodeSpecificValidators;
//# sourceMappingURL=node-specific-validators.js.map