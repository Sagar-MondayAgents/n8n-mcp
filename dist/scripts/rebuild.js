#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const database_adapter_1 = require("../database/database-adapter");
const node_loader_1 = require("../loaders/node-loader");
const node_parser_1 = require("../parsers/node-parser");
const docs_mapper_1 = require("../mappers/docs-mapper");
const node_repository_1 = require("../database/node-repository");
const template_sanitizer_1 = require("../utils/template-sanitizer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function rebuild() {
    console.log('🔄 Rebuilding n8n node database...\n');
    const db = await (0, database_adapter_1.createDatabaseAdapter)('./data/nodes.db');
    const loader = new node_loader_1.N8nNodeLoader();
    const parser = new node_parser_1.NodeParser();
    const mapper = new docs_mapper_1.DocsMapper();
    const repository = new node_repository_1.NodeRepository(db);
    const schema = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
    db.exec(schema);
    db.exec('DELETE FROM nodes');
    console.log('🗑️  Cleared existing data\n');
    const nodes = await loader.loadAllNodes();
    console.log(`📦 Loaded ${nodes.length} nodes from packages\n`);
    const stats = {
        successful: 0,
        failed: 0,
        aiTools: 0,
        triggers: 0,
        webhooks: 0,
        withProperties: 0,
        withOperations: 0,
        withDocs: 0
    };
    for (const { packageName, nodeName, NodeClass } of nodes) {
        try {
            const parsed = parser.parse(NodeClass, packageName);
            if (!parsed.nodeType || !parsed.displayName) {
                throw new Error('Missing required fields');
            }
            const docs = await mapper.fetchDocumentation(parsed.nodeType);
            parsed.documentation = docs || undefined;
            repository.saveNode(parsed);
            stats.successful++;
            if (parsed.isAITool)
                stats.aiTools++;
            if (parsed.isTrigger)
                stats.triggers++;
            if (parsed.isWebhook)
                stats.webhooks++;
            if (parsed.properties.length > 0)
                stats.withProperties++;
            if (parsed.operations.length > 0)
                stats.withOperations++;
            if (docs)
                stats.withDocs++;
            console.log(`✅ ${parsed.nodeType} [Props: ${parsed.properties.length}, Ops: ${parsed.operations.length}]`);
        }
        catch (error) {
            stats.failed++;
            console.error(`❌ Failed to process ${nodeName}: ${error.message}`);
        }
    }
    console.log('\n🔍 Running validation checks...');
    const validationResults = validateDatabase(repository);
    console.log('\n📊 Summary:');
    console.log(`   Total nodes: ${nodes.length}`);
    console.log(`   Successful: ${stats.successful}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   AI Tools: ${stats.aiTools}`);
    console.log(`   Triggers: ${stats.triggers}`);
    console.log(`   Webhooks: ${stats.webhooks}`);
    console.log(`   With Properties: ${stats.withProperties}`);
    console.log(`   With Operations: ${stats.withOperations}`);
    console.log(`   With Documentation: ${stats.withDocs}`);
    if (!validationResults.passed) {
        console.log('\n⚠️  Validation Issues:');
        validationResults.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    console.log('\n🧹 Checking for templates to sanitize...');
    const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get();
    if (templateCount && templateCount.count > 0) {
        console.log(`   Found ${templateCount.count} templates, sanitizing...`);
        const sanitizer = new template_sanitizer_1.TemplateSanitizer();
        let sanitizedCount = 0;
        const templates = db.prepare('SELECT id, name, workflow_json FROM templates').all();
        for (const template of templates) {
            const originalWorkflow = JSON.parse(template.workflow_json);
            const { sanitized: sanitizedWorkflow, wasModified } = sanitizer.sanitizeWorkflow(originalWorkflow);
            if (wasModified) {
                const stmt = db.prepare('UPDATE templates SET workflow_json = ? WHERE id = ?');
                stmt.run(JSON.stringify(sanitizedWorkflow), template.id);
                sanitizedCount++;
                console.log(`   ✅ Sanitized template ${template.id}: ${template.name}`);
            }
        }
        console.log(`   Sanitization complete: ${sanitizedCount} templates cleaned`);
    }
    else {
        console.log('   No templates found in database');
    }
    console.log('\n✨ Rebuild complete!');
    db.close();
}
function validateDatabase(repository) {
    const issues = [];
    const criticalNodes = ['nodes-base.httpRequest', 'nodes-base.code', 'nodes-base.webhook', 'nodes-base.slack'];
    for (const nodeType of criticalNodes) {
        const node = repository.getNode(nodeType);
        if (!node) {
            issues.push(`Critical node ${nodeType} not found`);
            continue;
        }
        if (node.properties.length === 0) {
            issues.push(`Node ${nodeType} has no properties`);
        }
    }
    const aiTools = repository.getAITools();
    if (aiTools.length === 0) {
        issues.push('No AI tools found - check detection logic');
    }
    return {
        passed: issues.length === 0,
        issues
    };
}
if (require.main === module) {
    rebuild().catch(console.error);
}
//# sourceMappingURL=rebuild.js.map