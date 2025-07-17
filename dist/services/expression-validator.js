"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionValidator = void 0;
class ExpressionValidator {
    static validateExpression(expression, context) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            usedVariables: new Set(),
            usedNodes: new Set(),
        };
        const syntaxErrors = this.checkSyntaxErrors(expression);
        result.errors.push(...syntaxErrors);
        const expressions = this.extractExpressions(expression);
        for (const expr of expressions) {
            this.validateSingleExpression(expr, context, result);
        }
        this.checkNodeReferences(result, context);
        result.valid = result.errors.length === 0;
        return result;
    }
    static checkSyntaxErrors(expression) {
        const errors = [];
        const openBrackets = (expression.match(/\{\{/g) || []).length;
        const closeBrackets = (expression.match(/\}\}/g) || []).length;
        if (openBrackets !== closeBrackets) {
            errors.push('Unmatched expression brackets {{ }}');
        }
        if (expression.includes('{{') && expression.includes('{{', expression.indexOf('{{') + 2)) {
            const match = expression.match(/\{\{.*\{\{/);
            if (match) {
                errors.push('Nested expressions are not supported');
            }
        }
        if (expression.includes('{{}}')) {
            errors.push('Empty expression found');
        }
        return errors;
    }
    static extractExpressions(text) {
        const expressions = [];
        let match;
        while ((match = this.EXPRESSION_PATTERN.exec(text)) !== null) {
            expressions.push(match[1].trim());
        }
        return expressions;
    }
    static validateSingleExpression(expr, context, result) {
        let match;
        while ((match = this.VARIABLE_PATTERNS.json.exec(expr)) !== null) {
            result.usedVariables.add('$json');
            if (!context.hasInputData && !context.isInLoop) {
                result.warnings.push('Using $json but node might not have input data');
            }
        }
        while ((match = this.VARIABLE_PATTERNS.node.exec(expr)) !== null) {
            const nodeName = match[1];
            result.usedNodes.add(nodeName);
            result.usedVariables.add('$node');
        }
        while ((match = this.VARIABLE_PATTERNS.input.exec(expr)) !== null) {
            result.usedVariables.add('$input');
            if (!context.hasInputData) {
                result.errors.push('$input is only available when the node has input data');
            }
        }
        while ((match = this.VARIABLE_PATTERNS.items.exec(expr)) !== null) {
            const nodeName = match[1];
            result.usedNodes.add(nodeName);
            result.usedVariables.add('$items');
        }
        for (const [varName, pattern] of Object.entries(this.VARIABLE_PATTERNS)) {
            if (['json', 'node', 'input', 'items'].includes(varName))
                continue;
            if (pattern.test(expr)) {
                result.usedVariables.add(`$${varName}`);
            }
        }
        this.checkCommonMistakes(expr, result);
    }
    static checkCommonMistakes(expr, result) {
        const missingPrefixPattern = /(?<!\$)\b(json|node|input|items|workflow|execution)\b(?!\s*:)/;
        if (expr.match(missingPrefixPattern)) {
            result.warnings.push('Possible missing $ prefix for variable (e.g., use $json instead of json)');
        }
        if (expr.includes('$json[') && !expr.match(/\$json\[\d+\]/)) {
            result.warnings.push('Array access should use numeric index: $json[0] or property access: $json.property');
        }
        if (expr.match(/\$json\['[^']+'\]/)) {
            result.warnings.push("Consider using dot notation: $json.property instead of $json['property']");
        }
        if (expr.match(/\?\./)) {
            result.warnings.push('Optional chaining (?.) is not supported in n8n expressions');
        }
        if (expr.includes('${')) {
            result.errors.push('Template literals ${} are not supported. Use string concatenation instead');
        }
    }
    static checkNodeReferences(result, context) {
        for (const nodeName of result.usedNodes) {
            if (!context.availableNodes.includes(nodeName)) {
                result.errors.push(`Referenced node "${nodeName}" not found in workflow`);
            }
        }
    }
    static validateNodeExpressions(parameters, context) {
        const combinedResult = {
            valid: true,
            errors: [],
            warnings: [],
            usedVariables: new Set(),
            usedNodes: new Set(),
        };
        this.validateParametersRecursive(parameters, context, combinedResult);
        combinedResult.valid = combinedResult.errors.length === 0;
        return combinedResult;
    }
    static validateParametersRecursive(obj, context, result, path = '') {
        if (typeof obj === 'string') {
            if (obj.includes('{{')) {
                const validation = this.validateExpression(obj, context);
                validation.errors.forEach(error => {
                    result.errors.push(`${path}: ${error}`);
                });
                validation.warnings.forEach(warning => {
                    result.warnings.push(`${path}: ${warning}`);
                });
                validation.usedVariables.forEach(v => result.usedVariables.add(v));
                validation.usedNodes.forEach(n => result.usedNodes.add(n));
            }
        }
        else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.validateParametersRecursive(item, context, result, `${path}[${index}]`);
            });
        }
        else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]) => {
                const newPath = path ? `${path}.${key}` : key;
                this.validateParametersRecursive(value, context, result, newPath);
            });
        }
    }
}
exports.ExpressionValidator = ExpressionValidator;
ExpressionValidator.EXPRESSION_PATTERN = /\{\{(.+?)\}\}/g;
ExpressionValidator.VARIABLE_PATTERNS = {
    json: /\$json(\.[a-zA-Z_][\w]*|\["[^"]+"\]|\['[^']+'\]|\[\d+\])*/g,
    node: /\$node\["([^"]+)"\]\.json/g,
    input: /\$input\.item(\.[a-zA-Z_][\w]*|\["[^"]+"\]|\['[^']+'\]|\[\d+\])*/g,
    items: /\$items\("([^"]+)"(?:,\s*(\d+))?\)/g,
    parameter: /\$parameter\["([^"]+)"\]/g,
    env: /\$env\.([a-zA-Z_][\w]*)/g,
    workflow: /\$workflow\.(id|name|active)/g,
    execution: /\$execution\.(id|mode|resumeUrl)/g,
    prevNode: /\$prevNode\.(name|outputIndex|runIndex)/g,
    itemIndex: /\$itemIndex/g,
    runIndex: /\$runIndex/g,
    now: /\$now/g,
    today: /\$today/g,
};
//# sourceMappingURL=expression-validator.js.map