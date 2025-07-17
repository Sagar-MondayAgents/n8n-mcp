import { DatabaseAdapter } from './database-adapter';
import { ParsedNode } from '../parsers/node-parser';
export declare class NodeRepository {
    private db;
    constructor(db: DatabaseAdapter);
    saveNode(node: ParsedNode): void;
    getNode(nodeType: string): any;
    getAITools(): any[];
    private safeJsonParse;
}
//# sourceMappingURL=node-repository.d.ts.map