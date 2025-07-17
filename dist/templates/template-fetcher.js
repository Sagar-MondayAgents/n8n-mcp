"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class TemplateFetcher {
    constructor() {
        this.baseUrl = 'https://api.n8n.io/api/templates';
        this.pageSize = 100;
    }
    async fetchTemplates(progressCallback) {
        const oneYearAgo = new Date();
        oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
        const allTemplates = [];
        let page = 1;
        let hasMore = true;
        logger_1.logger.info('Starting template fetch from n8n.io API');
        while (hasMore) {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/search`, {
                    params: {
                        page,
                        rows: this.pageSize,
                        sort_by: 'last-updated'
                    }
                });
                const { workflows, totalWorkflows } = response.data;
                const recentTemplates = workflows.filter((w) => {
                    const createdDate = new Date(w.createdAt);
                    return createdDate >= oneYearAgo;
                });
                if (recentTemplates.length < workflows.length) {
                    hasMore = false;
                    logger_1.logger.info(`Reached templates older than 1 year at page ${page}`);
                }
                allTemplates.push(...recentTemplates);
                if (progressCallback) {
                    progressCallback(allTemplates.length, Math.min(totalWorkflows, allTemplates.length + 500));
                }
                if (workflows.length < this.pageSize || allTemplates.length >= totalWorkflows) {
                    hasMore = false;
                }
                page++;
                if (hasMore) {
                    await this.sleep(500);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error fetching templates page ${page}:`, error);
                throw error;
            }
        }
        logger_1.logger.info(`Fetched ${allTemplates.length} templates from last year`);
        return allTemplates;
    }
    async fetchTemplateDetail(workflowId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/workflows/${workflowId}`);
            return response.data.workflow;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching template detail for ${workflowId}:`, error);
            throw error;
        }
    }
    async fetchAllTemplateDetails(workflows, progressCallback) {
        const details = new Map();
        logger_1.logger.info(`Fetching details for ${workflows.length} templates`);
        for (let i = 0; i < workflows.length; i++) {
            const workflow = workflows[i];
            try {
                const detail = await this.fetchTemplateDetail(workflow.id);
                details.set(workflow.id, detail);
                if (progressCallback) {
                    progressCallback(i + 1, workflows.length);
                }
                await this.sleep(200);
            }
            catch (error) {
                logger_1.logger.error(`Failed to fetch details for workflow ${workflow.id}:`, error);
            }
        }
        logger_1.logger.info(`Successfully fetched ${details.size} template details`);
        return details;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TemplateFetcher = TemplateFetcher;
//# sourceMappingURL=template-fetcher.js.map