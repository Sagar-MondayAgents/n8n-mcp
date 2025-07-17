#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_loader_1 = require("../loaders/node-loader");
const node_parser_1 = require("../parsers/node-parser");
async function debugNode() {
    const loader = new node_loader_1.N8nNodeLoader();
    const parser = new node_parser_1.NodeParser();
    console.log('Loading nodes...');
    const nodes = await loader.loadAllNodes();
    const httpNode = nodes.find(n => n.nodeName === 'HttpRequest');
    if (httpNode) {
        console.log('\n=== HTTP Request Node Debug ===');
        console.log('NodeName:', httpNode.nodeName);
        console.log('Package:', httpNode.packageName);
        console.log('NodeClass type:', typeof httpNode.NodeClass);
        console.log('NodeClass constructor name:', httpNode.NodeClass?.constructor?.name);
        try {
            const parsed = parser.parse(httpNode.NodeClass, httpNode.packageName);
            console.log('\nParsed successfully:');
            console.log('- Node Type:', parsed.nodeType);
            console.log('- Display Name:', parsed.displayName);
            console.log('- Style:', parsed.style);
            console.log('- Properties count:', parsed.properties.length);
            console.log('- Operations count:', parsed.operations.length);
            console.log('- Is AI Tool:', parsed.isAITool);
            console.log('- Is Versioned:', parsed.isVersioned);
            if (parsed.properties.length > 0) {
                console.log('\nFirst property:', parsed.properties[0]);
            }
        }
        catch (error) {
            console.error('\nError parsing node:', error.message);
            console.error('Stack:', error.stack);
        }
    }
    else {
        console.log('HTTP Request node not found');
    }
    const codeNode = nodes.find(n => n.nodeName === 'Code');
    if (codeNode) {
        console.log('\n\n=== Code Node Debug ===');
        console.log('NodeName:', codeNode.nodeName);
        console.log('Package:', codeNode.packageName);
        console.log('NodeClass type:', typeof codeNode.NodeClass);
        try {
            const parsed = parser.parse(codeNode.NodeClass, codeNode.packageName);
            console.log('\nParsed successfully:');
            console.log('- Node Type:', parsed.nodeType);
            console.log('- Properties count:', parsed.properties.length);
            console.log('- Is Versioned:', parsed.isVersioned);
        }
        catch (error) {
            console.error('\nError parsing node:', error.message);
        }
    }
}
debugNode().catch(console.error);
//# sourceMappingURL=debug-node.js.map