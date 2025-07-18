import { DatabaseAdapter } from './database-adapter';
import { ParsedNode } from '../parsers/node-parser';
export declare class NodeRepository {
    private db;
    constructor(db: DatabaseAdapter);
    /**
     * Save node with proper JSON serialization
     */
    saveNode(node: ParsedNode): void;
    /**
     * Get node with proper JSON deserialization
     */
    getNode(nodeType: string): any;
    /**
     * Get AI tools with proper filtering
     */
    getAITools(): any[];
    private safeJsonParse;
}
//# sourceMappingURL=node-repository.d.ts.map