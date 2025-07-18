"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8NApiClient = void 0;
class N8NApiClient {
    config;
    headers;
    constructor(config) {
        this.config = config;
        this.headers = {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': config.apiKey,
        };
    }
    async request(endpoint, options = {}) {
        const url = `${this.config.apiUrl}/api/v1${endpoint}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers,
                },
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`n8n API error: ${response.status} - ${error}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`Failed to connect to n8n: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Workflow operations
    async getWorkflows(filters) {
        const query = new URLSearchParams();
        if (filters?.active !== undefined) {
            query.append('active', filters.active.toString());
        }
        if (filters?.tags?.length) {
            query.append('tags', filters.tags.join(','));
        }
        return this.request(`/workflows${query.toString() ? `?${query}` : ''}`);
    }
    async getWorkflow(id) {
        return this.request(`/workflows/${id}`);
    }
    async createWorkflow(workflowData) {
        return this.request('/workflows', {
            method: 'POST',
            body: JSON.stringify(workflowData),
        });
    }
    async updateWorkflow(id, updates) {
        return this.request(`/workflows/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }
    async deleteWorkflow(id) {
        return this.request(`/workflows/${id}`, {
            method: 'DELETE',
        });
    }
    async activateWorkflow(id) {
        return this.request(`/workflows/${id}/activate`, {
            method: 'POST',
        });
    }
    async deactivateWorkflow(id) {
        return this.request(`/workflows/${id}/deactivate`, {
            method: 'POST',
        });
    }
    // Execution operations
    async executeWorkflow(id, data) {
        return this.request(`/workflows/${id}/execute`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    }
    async getExecutions(filters) {
        const query = new URLSearchParams();
        if (filters?.workflowId) {
            query.append('workflowId', filters.workflowId);
        }
        if (filters?.status) {
            query.append('status', filters.status);
        }
        if (filters?.limit) {
            query.append('limit', filters.limit.toString());
        }
        return this.request(`/executions${query.toString() ? `?${query}` : ''}`);
    }
    async getExecution(id) {
        return this.request(`/executions/${id}`);
    }
    async deleteExecution(id) {
        return this.request(`/executions/${id}`, {
            method: 'DELETE',
        });
    }
    // Credential operations
    async getCredentialTypes() {
        return this.request('/credential-types');
    }
    async getCredentials() {
        return this.request('/credentials');
    }
    // Node operations
    async getNodeTypes() {
        return this.request('/node-types');
    }
    async getNodeType(nodeType) {
        return this.request(`/node-types/${nodeType}`);
    }
    // Extended methods for node source extraction
    async getNodeSourceCode(nodeType) {
        // This is a special endpoint we'll need to handle differently
        // as n8n doesn't expose source code directly through API
        // We'll need to implement this through file system access
        throw new Error('Node source code extraction requires special implementation');
    }
    async getNodeDescription(nodeType) {
        try {
            const nodeTypeData = await this.getNodeType(nodeType);
            return {
                name: nodeTypeData.name,
                displayName: nodeTypeData.displayName,
                description: nodeTypeData.description,
                version: nodeTypeData.version,
                defaults: nodeTypeData.defaults,
                inputs: nodeTypeData.inputs,
                outputs: nodeTypeData.outputs,
                properties: nodeTypeData.properties,
                credentials: nodeTypeData.credentials,
            };
        }
        catch (error) {
            throw new Error(`Failed to get node description: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.N8NApiClient = N8NApiClient;
//# sourceMappingURL=n8n-client.js.map