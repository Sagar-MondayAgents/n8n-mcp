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
exports.fetchTemplatesRobust = fetchTemplatesRobust;
const database_adapter_1 = require("../database/database-adapter");
const template_repository_1 = require("../templates/template-repository");
const template_fetcher_1 = require("../templates/template-fetcher");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function fetchTemplatesRobust() {
    console.log('🌐 Fetching n8n workflow templates (last year)...\n');
    // Ensure data directory exists
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    // Initialize database
    const db = await (0, database_adapter_1.createDatabaseAdapter)('./data/nodes.db');
    // Drop existing templates table to ensure clean schema
    try {
        db.exec('DROP TABLE IF EXISTS templates');
        db.exec('DROP TABLE IF EXISTS templates_fts');
        console.log('🗑️  Dropped existing templates tables\n');
    }
    catch (error) {
        // Ignore errors if tables don't exist
    }
    // Apply schema with updated constraint
    const schema = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
    db.exec(schema);
    // Create repository and fetcher
    const repository = new template_repository_1.TemplateRepository(db);
    const fetcher = new template_fetcher_1.TemplateFetcher();
    // Progress tracking
    let lastMessage = '';
    const startTime = Date.now();
    try {
        // Fetch template list
        console.log('📋 Phase 1: Fetching template list from n8n.io API\n');
        const templates = await fetcher.fetchTemplates((current, total) => {
            // Clear previous line
            if (lastMessage) {
                process.stdout.write('\r' + ' '.repeat(lastMessage.length) + '\r');
            }
            const progress = Math.round((current / total) * 100);
            lastMessage = `📊 Fetching template list: ${current}/${total} (${progress}%)`;
            process.stdout.write(lastMessage);
        });
        console.log('\n');
        console.log(`✅ Found ${templates.length} templates from last year\n`);
        // Fetch details and save incrementally
        console.log('📥 Phase 2: Fetching details and saving to database\n');
        let saved = 0;
        let errors = 0;
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            try {
                // Clear previous line
                if (lastMessage) {
                    process.stdout.write('\r' + ' '.repeat(lastMessage.length) + '\r');
                }
                const progress = Math.round(((i + 1) / templates.length) * 100);
                lastMessage = `📊 Processing: ${i + 1}/${templates.length} (${progress}%) - Saved: ${saved}, Errors: ${errors}`;
                process.stdout.write(lastMessage);
                // Fetch detail
                const detail = await fetcher.fetchTemplateDetail(template.id);
                // Save immediately
                repository.saveTemplate(template, detail);
                saved++;
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            catch (error) {
                errors++;
                console.error(`\n❌ Error processing template ${template.id} (${template.name}): ${error.message}`);
                // Continue with next template
            }
        }
        console.log('\n');
        // Get stats
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const stats = await repository.getTemplateStats();
        console.log('✅ Template fetch complete!\n');
        console.log('📈 Statistics:');
        console.log(`   - Templates found: ${templates.length}`);
        console.log(`   - Templates saved: ${saved}`);
        console.log(`   - Errors: ${errors}`);
        console.log(`   - Success rate: ${Math.round((saved / templates.length) * 100)}%`);
        console.log(`   - Time elapsed: ${elapsed} seconds`);
        console.log(`   - Average time per template: ${(elapsed / saved).toFixed(2)} seconds`);
        if (stats.topUsedNodes && stats.topUsedNodes.length > 0) {
            console.log('\n🔝 Top used nodes:');
            stats.topUsedNodes.slice(0, 10).forEach((node, index) => {
                console.log(`   ${index + 1}. ${node.node} (${node.count} templates)`);
            });
        }
    }
    catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
    // Close database
    if ('close' in db && typeof db.close === 'function') {
        db.close();
    }
}
// Run if called directly
if (require.main === module) {
    fetchTemplatesRobust().catch(console.error);
}
//# sourceMappingURL=fetch-templates-robust.js.map