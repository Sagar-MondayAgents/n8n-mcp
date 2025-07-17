#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const node_repository_1 = require("../database/node-repository");
const database_adapter_1 = require("../database/database-adapter");
const workflow_validator_1 = require("../services/workflow-validator");
const enhanced_config_validator_1 = require("../services/enhanced-config-validator");
const template_repository_1 = require("../templates/template-repository");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger({ prefix: '[test-template-validation]' });
async function testTemplateValidation() {
    logger.info('Starting template validation tests...\n');
    const dbPath = path_1.default.join(process.cwd(), 'data', 'nodes.db');
    if (!(0, fs_1.existsSync)(dbPath)) {
        logger.error('Database not found. Run npm run rebuild first.');
        process.exit(1);
    }
    const db = await (0, database_adapter_1.createDatabaseAdapter)(dbPath);
    const repository = new node_repository_1.NodeRepository(db);
    const templateRepository = new template_repository_1.TemplateRepository(db);
    const validator = new workflow_validator_1.WorkflowValidator(repository, enhanced_config_validator_1.EnhancedConfigValidator);
    try {
        const templates = await templateRepository.getAllTemplates(20);
        if (templates.length === 0) {
            logger.warn('No templates found in database. Run npm run fetch:templates first.');
            process.exit(0);
        }
        logger.info(`Found ${templates.length} templates to validate\n`);
        const results = {
            total: templates.length,
            valid: 0,
            invalid: 0,
            withErrors: 0,
            withWarnings: 0,
            errorTypes: new Map(),
            warningTypes: new Map()
        };
        for (const template of templates) {
            logger.info(`\n${'='.repeat(80)}`);
            logger.info(`Validating: ${template.name} (ID: ${template.id})`);
            logger.info(`Author: ${template.author_name} (@${template.author_username})`);
            logger.info(`Views: ${template.views}`);
            logger.info(`${'='.repeat(80)}\n`);
            try {
                const workflow = JSON.parse(template.workflow_json);
                logger.info(`Workflow summary:`);
                logger.info(`- Nodes: ${workflow.nodes?.length || 0}`);
                logger.info(`- Connections: ${Object.keys(workflow.connections || {}).length}`);
                const validationResult = await validator.validateWorkflow(workflow);
                if (validationResult.valid) {
                    results.valid++;
                    console.log('✅ VALID');
                }
                else {
                    results.invalid++;
                    console.log('❌ INVALID');
                }
                if (validationResult.errors.length > 0) {
                    results.withErrors++;
                    console.log('\nErrors:');
                    validationResult.errors.forEach((error) => {
                        const errorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
                        const errorKey = errorMsg.substring(0, 50);
                        results.errorTypes.set(errorKey, (results.errorTypes.get(errorKey) || 0) + 1);
                        console.log(`  - ${error.nodeName || 'workflow'}: ${errorMsg}`);
                    });
                }
                if (validationResult.warnings.length > 0) {
                    results.withWarnings++;
                    console.log('\nWarnings:');
                    validationResult.warnings.forEach((warning) => {
                        const warningKey = typeof warning.message === 'string'
                            ? warning.message.substring(0, 50)
                            : JSON.stringify(warning.message).substring(0, 50);
                        results.warningTypes.set(warningKey, (results.warningTypes.get(warningKey) || 0) + 1);
                        console.log(`  - ${warning.nodeName || 'workflow'}: ${typeof warning.message === 'string' ? warning.message : JSON.stringify(warning.message)}`);
                    });
                }
                if (validationResult.suggestions?.length > 0) {
                    console.log('\nSuggestions:');
                    validationResult.suggestions.forEach((suggestion) => {
                        console.log(`  - ${suggestion}`);
                    });
                }
                console.log('\nStatistics:');
                console.log(`  - Total nodes: ${validationResult.statistics.totalNodes}`);
                console.log(`  - Enabled nodes: ${validationResult.statistics.enabledNodes}`);
                console.log(`  - Trigger nodes: ${validationResult.statistics.triggerNodes}`);
                console.log(`  - Valid connections: ${validationResult.statistics.validConnections}`);
                console.log(`  - Invalid connections: ${validationResult.statistics.invalidConnections}`);
                console.log(`  - Expressions validated: ${validationResult.statistics.expressionsValidated}`);
            }
            catch (error) {
                logger.error(`Failed to validate template ${template.id}:`, error);
                results.invalid++;
            }
        }
        console.log('\n' + '='.repeat(80));
        console.log('VALIDATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total templates tested: ${results.total}`);
        console.log(`Valid workflows: ${results.valid} (${((results.valid / results.total) * 100).toFixed(1)}%)`);
        console.log(`Invalid workflows: ${results.invalid} (${((results.invalid / results.total) * 100).toFixed(1)}%)`);
        console.log(`Workflows with errors: ${results.withErrors}`);
        console.log(`Workflows with warnings: ${results.withWarnings}`);
        if (results.errorTypes.size > 0) {
            console.log('\nMost common errors:');
            const sortedErrors = Array.from(results.errorTypes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            sortedErrors.forEach(([error, count]) => {
                console.log(`  - "${error}..." (${count} times)`);
            });
        }
        if (results.warningTypes.size > 0) {
            console.log('\nMost common warnings:');
            const sortedWarnings = Array.from(results.warningTypes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            sortedWarnings.forEach(([warning, count]) => {
                console.log(`  - "${warning}..." (${count} times)`);
            });
        }
    }
    catch (error) {
        logger.error('Failed to run template validation:', error);
        process.exit(1);
    }
    finally {
        db.close();
    }
}
testTemplateValidation().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-template-validation.js.map