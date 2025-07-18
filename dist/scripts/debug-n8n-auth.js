#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
async function debugN8nAuth() {
    const apiUrl = process.env.N8N_API_URL;
    const apiKey = process.env.N8N_API_KEY;
    if (!apiUrl || !apiKey) {
        console.error('Error: N8N_API_URL and N8N_API_KEY environment variables are required');
        console.error('Please set them in your .env file or environment');
        process.exit(1);
    }
    console.log('Testing n8n API Authentication...');
    console.log('API URL:', apiUrl);
    console.log('API Key:', apiKey.substring(0, 20) + '...');
    // Test 1: Direct health check
    console.log('\n=== Test 1: Direct Health Check (no auth) ===');
    try {
        const healthResponse = await axios_1.default.get(`${apiUrl}/api/v1/health`);
        console.log('Health Response:', healthResponse.data);
    }
    catch (error) {
        console.log('Health Check Error:', error.response?.status, error.response?.data || error.message);
    }
    // Test 2: Workflows with API key
    console.log('\n=== Test 2: List Workflows (with auth) ===');
    try {
        const workflowsResponse = await axios_1.default.get(`${apiUrl}/api/v1/workflows`, {
            headers: {
                'X-N8N-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            params: { limit: 1 }
        });
        console.log('Workflows Response:', workflowsResponse.data);
    }
    catch (error) {
        console.log('Workflows Error:', error.response?.status, error.response?.data || error.message);
        if (error.response?.headers) {
            console.log('Response Headers:', error.response.headers);
        }
    }
    // Test 3: Try different auth header formats
    console.log('\n=== Test 3: Alternative Auth Headers ===');
    // Try Bearer token
    try {
        const bearerResponse = await axios_1.default.get(`${apiUrl}/api/v1/workflows`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            params: { limit: 1 }
        });
        console.log('Bearer Auth Success:', bearerResponse.data);
    }
    catch (error) {
        console.log('Bearer Auth Error:', error.response?.status);
    }
    // Try lowercase header
    try {
        const lowercaseResponse = await axios_1.default.get(`${apiUrl}/api/v1/workflows`, {
            headers: {
                'x-n8n-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            params: { limit: 1 }
        });
        console.log('Lowercase Header Success:', lowercaseResponse.data);
    }
    catch (error) {
        console.log('Lowercase Header Error:', error.response?.status);
    }
    // Test 4: Check API endpoint structure
    console.log('\n=== Test 4: API Endpoint Structure ===');
    const endpoints = [
        '/api/v1/workflows',
        '/workflows',
        '/api/workflows',
        '/api/v1/workflow'
    ];
    for (const endpoint of endpoints) {
        try {
            const response = await axios_1.default.get(`${apiUrl}${endpoint}`, {
                headers: {
                    'X-N8N-API-KEY': apiKey,
                },
                params: { limit: 1 },
                timeout: 5000
            });
            console.log(`✅ ${endpoint} - Success`);
        }
        catch (error) {
            console.log(`❌ ${endpoint} - ${error.response?.status || 'Failed'}`);
        }
    }
}
debugN8nAuth().catch(console.error);
//# sourceMappingURL=debug-n8n-auth.js.map