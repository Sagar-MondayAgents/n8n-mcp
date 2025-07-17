export interface ParsedNode {
    style: 'declarative' | 'programmatic';
    nodeType: string;
    displayName: string;
    description?: string;
    category?: string;
    properties: any[];
    credentials: any[];
    isAITool: boolean;
    isTrigger: boolean;
    isWebhook: boolean;
    operations: any[];
    version?: string;
    isVersioned: boolean;
    packageName: string;
    documentation?: string;
}
export declare class NodeParser {
    private propertyExtractor;
    parse(nodeClass: any, packageName: string): ParsedNode;
    private getNodeDescription;
    private detectStyle;
    private extractNodeType;
    private extractCategory;
    private detectTrigger;
    private detectWebhook;
    private extractVersion;
    private detectVersioned;
}
//# sourceMappingURL=node-parser.d.ts.map