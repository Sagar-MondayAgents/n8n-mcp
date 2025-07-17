#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../mcp/server");
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger({ prefix: '[TestMCPTools]' });
async function testTool(server, toolName, args) {
    try {
        console.log(`\n🔧 Testing: ${toolName}`);
        console.log('Args:', JSON.stringify(args, null, 2));
        console.log('-'.repeat(60));
        const result = await server[toolName].call(server, args);
        console.log('Result:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error(`❌ Error: ${error}`);
    }
}
async function main() {
    console.log('🤖 Testing MCP Tools\n');
    const server = new server_1.N8NDocumentationMCPServer();
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('\n=== Testing get_node_as_tool_info ===');
    await testTool(server, 'getNodeAsToolInfo', 'nodes-base.slack');
    await testTool(server, 'getNodeAsToolInfo', 'nodes-base.googleSheets');
    console.log('\n\n=== Testing get_node_info (with aiToolCapabilities) ===');
    await testTool(server, 'getNodeInfo', 'nodes-base.httpRequest');
    console.log('\n\n=== Testing list_ai_tools (enhanced) ===');
    await testTool(server, 'listAITools', {});
    console.log('\n✅ All tests completed!');
    process.exit(0);
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=test-mcp-tools.js.map