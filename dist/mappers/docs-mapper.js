"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocsMapper = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class DocsMapper {
    docsPath = path_1.default.join(process.cwd(), 'n8n-docs');
    // Known documentation mapping fixes
    KNOWN_FIXES = {
        'httpRequest': 'httprequest',
        'code': 'code',
        'webhook': 'webhook',
        'respondToWebhook': 'respondtowebhook',
        // With package prefix
        'n8n-nodes-base.httpRequest': 'httprequest',
        'n8n-nodes-base.code': 'code',
        'n8n-nodes-base.webhook': 'webhook',
        'n8n-nodes-base.respondToWebhook': 'respondtowebhook'
    };
    async fetchDocumentation(nodeType) {
        // Apply known fixes first
        const fixedType = this.KNOWN_FIXES[nodeType] || nodeType;
        // Extract node name
        const nodeName = fixedType.split('.').pop()?.toLowerCase();
        if (!nodeName) {
            console.log(`⚠️  Could not extract node name from: ${nodeType}`);
            return null;
        }
        console.log(`📄 Looking for docs for: ${nodeType} -> ${nodeName}`);
        // Try different documentation paths - both files and directories
        const possiblePaths = [
            // Direct file paths
            `docs/integrations/builtin/core-nodes/n8n-nodes-base.${nodeName}.md`,
            `docs/integrations/builtin/app-nodes/n8n-nodes-base.${nodeName}.md`,
            `docs/integrations/builtin/trigger-nodes/n8n-nodes-base.${nodeName}.md`,
            `docs/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.${nodeName}.md`,
            `docs/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.${nodeName}.md`,
            // Directory with index.md
            `docs/integrations/builtin/core-nodes/n8n-nodes-base.${nodeName}/index.md`,
            `docs/integrations/builtin/app-nodes/n8n-nodes-base.${nodeName}/index.md`,
            `docs/integrations/builtin/trigger-nodes/n8n-nodes-base.${nodeName}/index.md`,
            `docs/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.${nodeName}/index.md`,
            `docs/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.${nodeName}/index.md`
        ];
        // Try each path
        for (const relativePath of possiblePaths) {
            try {
                const fullPath = path_1.default.join(this.docsPath, relativePath);
                const content = await fs_1.promises.readFile(fullPath, 'utf-8');
                console.log(`  ✓ Found docs at: ${relativePath}`);
                return content;
            }
            catch (error) {
                // File doesn't exist, try next
                continue;
            }
        }
        console.log(`  ✗ No docs found for ${nodeName}`);
        return null;
    }
}
exports.DocsMapper = DocsMapper;
//# sourceMappingURL=docs-mapper.js.map