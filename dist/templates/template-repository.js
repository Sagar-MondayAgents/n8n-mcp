"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRepository = void 0;
const logger_1 = require("../utils/logger");
const template_sanitizer_1 = require("../utils/template-sanitizer");
class TemplateRepository {
    db;
    sanitizer;
    constructor(db) {
        this.db = db;
        this.sanitizer = new template_sanitizer_1.TemplateSanitizer();
    }
    /**
     * Save a template to the database
     */
    saveTemplate(workflow, detail, categories = []) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, workflow_id, name, description, author_name, author_username,
        author_verified, nodes_used, workflow_json, categories, views,
        created_at, updated_at, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        // Extract node types from workflow
        const nodeTypes = workflow.nodes.map(n => n.name);
        // Build URL
        const url = `https://n8n.io/workflows/${workflow.id}`;
        // Sanitize the workflow to remove API tokens
        const { sanitized: sanitizedWorkflow, wasModified } = this.sanitizer.sanitizeWorkflow(detail.workflow);
        // Log if we sanitized any tokens
        if (wasModified) {
            const detectedTokens = this.sanitizer.detectTokens(detail.workflow);
            logger_1.logger.warn(`Sanitized API tokens in template ${workflow.id}: ${workflow.name}`, {
                templateId: workflow.id,
                templateName: workflow.name,
                tokensFound: detectedTokens.length,
                tokenPreviews: detectedTokens.map(t => t.substring(0, 20) + '...')
            });
        }
        stmt.run(workflow.id, workflow.id, workflow.name, workflow.description || '', workflow.user.name, workflow.user.username, workflow.user.verified ? 1 : 0, JSON.stringify(nodeTypes), JSON.stringify(sanitizedWorkflow), JSON.stringify(categories), workflow.totalViews || 0, workflow.createdAt, workflow.createdAt, // Using createdAt as updatedAt since API doesn't provide updatedAt
        url);
    }
    /**
     * Get templates that use specific node types
     */
    getTemplatesByNodes(nodeTypes, limit = 10) {
        // Build query for multiple node types
        const conditions = nodeTypes.map(() => "nodes_used LIKE ?").join(" OR ");
        const query = `
      SELECT * FROM templates 
      WHERE ${conditions}
      ORDER BY views DESC, created_at DESC
      LIMIT ?
    `;
        const params = [...nodeTypes.map(n => `%"${n}"%`), limit];
        return this.db.prepare(query).all(...params);
    }
    /**
     * Get a specific template by ID
     */
    getTemplate(templateId) {
        const row = this.db.prepare(`
      SELECT * FROM templates WHERE id = ?
    `).get(templateId);
        return row || null;
    }
    /**
     * Search templates by name or description
     */
    searchTemplates(query, limit = 20) {
        // Use FTS for search
        const ftsQuery = query.split(' ').map(term => `"${term}"`).join(' OR ');
        return this.db.prepare(`
      SELECT t.* FROM templates t
      JOIN templates_fts ON t.id = templates_fts.rowid
      WHERE templates_fts MATCH ?
      ORDER BY rank, t.views DESC
      LIMIT ?
    `).all(ftsQuery, limit);
    }
    /**
     * Get templates for a specific task/use case
     */
    getTemplatesForTask(task) {
        // Map tasks to relevant node combinations
        const taskNodeMap = {
            'ai_automation': ['@n8n/n8n-nodes-langchain.openAi', '@n8n/n8n-nodes-langchain.agent', 'n8n-nodes-base.openAi'],
            'data_sync': ['n8n-nodes-base.googleSheets', 'n8n-nodes-base.postgres', 'n8n-nodes-base.mysql'],
            'webhook_processing': ['n8n-nodes-base.webhook', 'n8n-nodes-base.httpRequest'],
            'email_automation': ['n8n-nodes-base.gmail', 'n8n-nodes-base.emailSend', 'n8n-nodes-base.emailReadImap'],
            'slack_integration': ['n8n-nodes-base.slack', 'n8n-nodes-base.slackTrigger'],
            'data_transformation': ['n8n-nodes-base.code', 'n8n-nodes-base.set', 'n8n-nodes-base.merge'],
            'file_processing': ['n8n-nodes-base.readBinaryFile', 'n8n-nodes-base.writeBinaryFile', 'n8n-nodes-base.googleDrive'],
            'scheduling': ['n8n-nodes-base.scheduleTrigger', 'n8n-nodes-base.cron'],
            'api_integration': ['n8n-nodes-base.httpRequest', 'n8n-nodes-base.graphql'],
            'database_operations': ['n8n-nodes-base.postgres', 'n8n-nodes-base.mysql', 'n8n-nodes-base.mongodb']
        };
        const nodes = taskNodeMap[task];
        if (!nodes) {
            return [];
        }
        return this.getTemplatesByNodes(nodes, 10);
    }
    /**
     * Get all templates with limit
     */
    getAllTemplates(limit = 10) {
        return this.db.prepare(`
      SELECT * FROM templates 
      ORDER BY views DESC, created_at DESC
      LIMIT ?
    `).all(limit);
    }
    /**
     * Get total template count
     */
    getTemplateCount() {
        const result = this.db.prepare('SELECT COUNT(*) as count FROM templates').get();
        return result.count;
    }
    /**
     * Get template statistics
     */
    getTemplateStats() {
        const count = this.getTemplateCount();
        const avgViews = this.db.prepare('SELECT AVG(views) as avg FROM templates').get();
        const topNodes = this.db.prepare(`
      SELECT nodes_used FROM templates 
      ORDER BY views DESC 
      LIMIT 100
    `).all();
        // Count node usage
        const nodeCount = {};
        topNodes.forEach(t => {
            const nodes = JSON.parse(t.nodes_used);
            nodes.forEach((n) => {
                nodeCount[n] = (nodeCount[n] || 0) + 1;
            });
        });
        // Get top 10 most used nodes
        const topUsedNodes = Object.entries(nodeCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([node, count]) => ({ node, count }));
        return {
            totalTemplates: count,
            averageViews: Math.round(avgViews.avg || 0),
            topUsedNodes
        };
    }
    /**
     * Clear all templates (for testing or refresh)
     */
    clearTemplates() {
        this.db.exec('DELETE FROM templates');
        logger_1.logger.info('Cleared all templates from database');
    }
}
exports.TemplateRepository = TemplateRepository;
//# sourceMappingURL=template-repository.js.map