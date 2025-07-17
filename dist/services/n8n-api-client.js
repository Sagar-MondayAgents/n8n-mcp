"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const n8n_errors_1 = require("../utils/n8n-errors");
const n8n_validation_1 = require("./n8n-validation");
class N8nApiClient {
    constructor(config) {
        const { baseUrl, apiKey, timeout = 30000, maxRetries = 3 } = config;
        this.maxRetries = maxRetries;
        const apiUrl = baseUrl.endsWith('/api/v1')
            ? baseUrl
            : `${baseUrl.replace(/\/$/, '')}/api/v1`;
        this.client = axios_1.default.create({
            baseURL: apiUrl,
            timeout,
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
        });
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug(`n8n API Request: ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data,
            });
            return config;
        }, (error) => {
            logger_1.logger.error('n8n API Request Error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug(`n8n API Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            const n8nError = (0, n8n_errors_1.handleN8nApiError)(error);
            (0, n8n_errors_1.logN8nError)(n8nError, 'n8n API Response');
            return Promise.reject(n8nError);
        });
    }
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        }
        catch (error) {
            try {
                await this.client.get('/workflows', { params: { limit: 1 } });
                return {
                    status: 'ok',
                    features: {}
                };
            }
            catch (fallbackError) {
                throw (0, n8n_errors_1.handleN8nApiError)(fallbackError);
            }
        }
    }
    async createWorkflow(workflow) {
        try {
            const cleanedWorkflow = (0, n8n_validation_1.cleanWorkflowForCreate)(workflow);
            const response = await this.client.post('/workflows', cleanedWorkflow);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async getWorkflow(id) {
        try {
            const response = await this.client.get(`/workflows/${id}`);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async updateWorkflow(id, workflow) {
        try {
            const cleanedWorkflow = (0, n8n_validation_1.cleanWorkflowForUpdate)(workflow);
            try {
                const response = await this.client.put(`/workflows/${id}`, cleanedWorkflow);
                return response.data;
            }
            catch (putError) {
                if (putError.response?.status === 405) {
                    logger_1.logger.debug('PUT method not supported, falling back to PATCH');
                    const response = await this.client.patch(`/workflows/${id}`, cleanedWorkflow);
                    return response.data;
                }
                throw putError;
            }
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async deleteWorkflow(id) {
        try {
            await this.client.delete(`/workflows/${id}`);
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async listWorkflows(params = {}) {
        try {
            const response = await this.client.get('/workflows', { params });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async getExecution(id, includeData = false) {
        try {
            const response = await this.client.get(`/executions/${id}`, {
                params: { includeData },
            });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async listExecutions(params = {}) {
        try {
            const response = await this.client.get('/executions', { params });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async deleteExecution(id) {
        try {
            await this.client.delete(`/executions/${id}`);
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async triggerWebhook(request) {
        try {
            const { webhookUrl, httpMethod, data, headers, waitForResponse = true } = request;
            const url = new URL(webhookUrl);
            const webhookPath = url.pathname;
            const config = {
                method: httpMethod,
                url: webhookPath,
                headers: {
                    ...headers,
                    'X-N8N-API-KEY': undefined,
                },
                data: httpMethod !== 'GET' ? data : undefined,
                params: httpMethod === 'GET' ? data : undefined,
                timeout: waitForResponse ? 120000 : 30000,
            };
            const webhookClient = axios_1.default.create({
                baseURL: new URL('/', webhookUrl).toString(),
                validateStatus: (status) => status < 500,
            });
            const response = await webhookClient.request(config);
            return {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers,
            };
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async listCredentials(params = {}) {
        try {
            const response = await this.client.get('/credentials', { params });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async getCredential(id) {
        try {
            const response = await this.client.get(`/credentials/${id}`);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async createCredential(credential) {
        try {
            const response = await this.client.post('/credentials', credential);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async updateCredential(id, credential) {
        try {
            const response = await this.client.patch(`/credentials/${id}`, credential);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async deleteCredential(id) {
        try {
            await this.client.delete(`/credentials/${id}`);
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async listTags(params = {}) {
        try {
            const response = await this.client.get('/tags', { params });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async createTag(tag) {
        try {
            const response = await this.client.post('/tags', tag);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async updateTag(id, tag) {
        try {
            const response = await this.client.patch(`/tags/${id}`, tag);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async deleteTag(id) {
        try {
            await this.client.delete(`/tags/${id}`);
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async getSourceControlStatus() {
        try {
            const response = await this.client.get('/source-control/status');
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async pullSourceControl(force = false) {
        try {
            const response = await this.client.post('/source-control/pull', { force });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async pushSourceControl(message, fileNames) {
        try {
            const response = await this.client.post('/source-control/push', {
                message,
                fileNames,
            });
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async getVariables() {
        try {
            const response = await this.client.get('/variables');
            return response.data.data || [];
        }
        catch (error) {
            logger_1.logger.warn('Variables API not available, returning empty array');
            return [];
        }
    }
    async createVariable(variable) {
        try {
            const response = await this.client.post('/variables', variable);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async updateVariable(id, variable) {
        try {
            const response = await this.client.patch(`/variables/${id}`, variable);
            return response.data;
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
    async deleteVariable(id) {
        try {
            await this.client.delete(`/variables/${id}`);
        }
        catch (error) {
            throw (0, n8n_errors_1.handleN8nApiError)(error);
        }
    }
}
exports.N8nApiClient = N8nApiClient;
//# sourceMappingURL=n8n-api-client.js.map