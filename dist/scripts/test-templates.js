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
exports.testTemplates = testTemplates;
const database_adapter_1 = require("../database/database-adapter");
const template_service_1 = require("../templates/template-service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function testTemplates() {
    console.log('🧪 Testing template functionality...\n');
    // Initialize database
    const db = await (0, database_adapter_1.createDatabaseAdapter)('./data/nodes.db');
    // Apply schema if needed
    const schema = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
    db.exec(schema);
    // Create service
    const service = new template_service_1.TemplateService(db);
    try {
        // Get statistics
        const stats = await service.getTemplateStats();
        console.log('📊 Template Database Stats:');
        console.log(`   Total templates: ${stats.totalTemplates}`);
        if (stats.totalTemplates === 0) {
            console.log('\n⚠️  No templates found in database!');
            console.log('   Run "npm run fetch:templates" to populate the database.\n');
            return;
        }
        console.log(`   Average views: ${stats.averageViews}`);
        console.log('\n🔝 Most used nodes in templates:');
        stats.topUsedNodes.forEach((node, i) => {
            console.log(`   ${i + 1}. ${node.node} (${node.count} templates)`);
        });
        // Test search
        console.log('\n🔍 Testing search for "webhook":');
        const searchResults = await service.searchTemplates('webhook', 3);
        searchResults.forEach((t) => {
            console.log(`   - ${t.name} (${t.views} views)`);
        });
        // Test node-based search
        console.log('\n🔍 Testing templates with HTTP Request node:');
        const httpTemplates = await service.listNodeTemplates(['n8n-nodes-base.httpRequest'], 3);
        httpTemplates.forEach((t) => {
            console.log(`   - ${t.name} (${t.nodes.length} nodes)`);
        });
        // Test task-based search
        console.log('\n🔍 Testing AI automation templates:');
        const aiTemplates = await service.getTemplatesForTask('ai_automation');
        aiTemplates.forEach((t) => {
            console.log(`   - ${t.name} by @${t.author.username}`);
        });
        // Get a specific template
        if (searchResults.length > 0) {
            const templateId = searchResults[0].id;
            console.log(`\n📄 Getting template ${templateId} details...`);
            const template = await service.getTemplate(templateId);
            if (template) {
                console.log(`   Name: ${template.name}`);
                console.log(`   Nodes: ${template.nodes.join(', ')}`);
                console.log(`   Workflow has ${template.workflow.nodes.length} nodes`);
            }
        }
        console.log('\n✅ All template tests passed!');
    }
    catch (error) {
        console.error('❌ Error during testing:', error);
    }
    // Close database
    if ('close' in db && typeof db.close === 'function') {
        db.close();
    }
}
// Run if called directly
if (require.main === module) {
    testTemplates().catch(console.error);
}
//# sourceMappingURL=test-templates.js.map