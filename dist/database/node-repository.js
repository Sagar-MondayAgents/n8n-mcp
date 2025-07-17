"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRepository = void 0;
class NodeRepository {
    constructor(db) {
        this.db = db;
    }
    saveNode(node) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO nodes (
        node_type, package_name, display_name, description,
        category, development_style, is_ai_tool, is_trigger,
        is_webhook, is_versioned, version, documentation,
        properties_schema, operations, credentials_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(node.nodeType, node.packageName, node.displayName, node.description, node.category, node.style, node.isAITool ? 1 : 0, node.isTrigger ? 1 : 0, node.isWebhook ? 1 : 0, node.isVersioned ? 1 : 0, node.version, node.documentation || null, JSON.stringify(node.properties, null, 2), JSON.stringify(node.operations, null, 2), JSON.stringify(node.credentials, null, 2));
    }
    getNode(nodeType) {
        const row = this.db.prepare(`
      SELECT * FROM nodes WHERE node_type = ?
    `).get(nodeType);
        if (!row)
            return null;
        return {
            nodeType: row.node_type,
            displayName: row.display_name,
            description: row.description,
            category: row.category,
            developmentStyle: row.development_style,
            package: row.package_name,
            isAITool: Number(row.is_ai_tool) === 1,
            isTrigger: Number(row.is_trigger) === 1,
            isWebhook: Number(row.is_webhook) === 1,
            isVersioned: Number(row.is_versioned) === 1,
            version: row.version,
            properties: this.safeJsonParse(row.properties_schema, []),
            operations: this.safeJsonParse(row.operations, []),
            credentials: this.safeJsonParse(row.credentials_required, []),
            hasDocumentation: !!row.documentation
        };
    }
    getAITools() {
        const rows = this.db.prepare(`
      SELECT node_type, display_name, description, package_name
      FROM nodes 
      WHERE is_ai_tool = 1
      ORDER BY display_name
    `).all();
        return rows.map(row => ({
            nodeType: row.node_type,
            displayName: row.display_name,
            description: row.description,
            package: row.package_name
        }));
    }
    safeJsonParse(json, defaultValue) {
        try {
            return JSON.parse(json);
        }
        catch {
            return defaultValue;
        }
    }
}
exports.NodeRepository = NodeRepository;
//# sourceMappingURL=node-repository.js.map