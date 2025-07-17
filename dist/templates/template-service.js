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
exports.TemplateService = void 0;
const template_repository_1 = require("./template-repository");
const logger_1 = require("../utils/logger");
class TemplateService {
    constructor(db) {
        this.repository = new template_repository_1.TemplateRepository(db);
    }
    async listNodeTemplates(nodeTypes, limit = 10) {
        const templates = this.repository.getTemplatesByNodes(nodeTypes, limit);
        return templates.map(this.formatTemplateInfo);
    }
    async getTemplate(templateId) {
        const template = this.repository.getTemplate(templateId);
        if (!template) {
            return null;
        }
        return {
            ...this.formatTemplateInfo(template),
            workflow: JSON.parse(template.workflow_json)
        };
    }
    async searchTemplates(query, limit = 20) {
        const templates = this.repository.searchTemplates(query, limit);
        return templates.map(this.formatTemplateInfo);
    }
    async getTemplatesForTask(task) {
        const templates = this.repository.getTemplatesForTask(task);
        return templates.map(this.formatTemplateInfo);
    }
    listAvailableTasks() {
        return [
            'ai_automation',
            'data_sync',
            'webhook_processing',
            'email_automation',
            'slack_integration',
            'data_transformation',
            'file_processing',
            'scheduling',
            'api_integration',
            'database_operations'
        ];
    }
    async getTemplateStats() {
        return this.repository.getTemplateStats();
    }
    async fetchAndUpdateTemplates(progressCallback) {
        try {
            const { TemplateFetcher } = await Promise.resolve().then(() => __importStar(require('./template-fetcher')));
            const fetcher = new TemplateFetcher();
            this.repository.clearTemplates();
            logger_1.logger.info('Fetching template list from n8n.io');
            const templates = await fetcher.fetchTemplates((current, total) => {
                progressCallback?.('Fetching template list', current, total);
            });
            logger_1.logger.info(`Found ${templates.length} templates from last year`);
            logger_1.logger.info('Fetching template details');
            const details = await fetcher.fetchAllTemplateDetails(templates, (current, total) => {
                progressCallback?.('Fetching template details', current, total);
            });
            logger_1.logger.info('Saving templates to database');
            let saved = 0;
            for (const template of templates) {
                const detail = details.get(template.id);
                if (detail) {
                    this.repository.saveTemplate(template, detail);
                    saved++;
                }
            }
            logger_1.logger.info(`Successfully saved ${saved} templates to database`);
            progressCallback?.('Complete', saved, saved);
        }
        catch (error) {
            logger_1.logger.error('Error fetching templates:', error);
            throw error;
        }
    }
    formatTemplateInfo(template) {
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            author: {
                name: template.author_name,
                username: template.author_username,
                verified: template.author_verified === 1
            },
            nodes: JSON.parse(template.nodes_used),
            views: template.views,
            created: template.created_at,
            url: template.url
        };
    }
}
exports.TemplateService = TemplateService;
//# sourceMappingURL=template-service.js.map