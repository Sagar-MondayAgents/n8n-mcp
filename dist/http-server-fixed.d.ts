#!/usr/bin/env node
export declare function startFixedHTTPServer(): Promise<void>;
declare module './mcp/server-update' {
    interface N8NDocumentationMCPServer {
        executeTool(name: string, args: any): Promise<any>;
    }
}
//# sourceMappingURL=http-server-fixed.d.ts.map