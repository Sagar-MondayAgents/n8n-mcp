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
exports.fetchTemplates = fetchTemplates;
const database_adapter_1 = require("../database/database-adapter");
const template_service_1 = require("../templates/template-service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function fetchTemplates() {
    console.log('🌐 Fetching n8n workflow templates...\n');
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
    // Create service
    const service = new template_service_1.TemplateService(db);
    // Progress tracking
    let lastMessage = '';
    const startTime = Date.now();
    try {
        await service.fetchAndUpdateTemplates((message, current, total) => {
            // Clear previous line
            if (lastMessage) {
                process.stdout.write('\r' + ' '.repeat(lastMessage.length) + '\r');
            }
            const progress = Math.round((current / total) * 100);
            lastMessage = `📊 ${message}: ${current}/${total} (${progress}%)`;
            process.stdout.write(lastMessage);
        });
        console.log('\n'); // New line after progress
        // Get stats
        const stats = await service.getTemplateStats();
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log('✅ Template fetch complete!\n');
        console.log('📈 Statistics:');
        console.log(`   - Total templates: ${stats.totalTemplates}`);
        console.log(`   - Average views: ${stats.averageViews}`);
        console.log(`   - Time elapsed: ${elapsed} seconds`);
        console.log('\n🔝 Top used nodes:');
        stats.topUsedNodes.forEach((node, index) => {
            console.log(`   ${index + 1}. ${node.node} (${node.count} templates)`);
        });
    }
    catch (error) {
        console.error('\n❌ Error fetching templates:', error);
        process.exit(1);
    }
    // Close database
    if ('close' in db && typeof db.close === 'function') {
        db.close();
    }
}
// Run if called directly
if (require.main === module) {
    fetchTemplates().catch(console.error);
}
//# sourceMappingURL=fetch-templates.js.map