import { INodeExecutionData, IDataObject } from 'n8n-workflow';
export declare class N8NMCPBridge {
    /**
     * Convert n8n workflow data to MCP tool arguments
     */
    static n8nToMCPToolArgs(data: IDataObject): any;
    /**
     * Convert MCP tool response to n8n execution data
     */
    static mcpToN8NExecutionData(mcpResponse: any, itemIndex?: number): INodeExecutionData;
    /**
     * Convert n8n workflow definition to MCP-compatible format
     */
    static n8nWorkflowToMCP(workflow: any): any;
    /**
     * Convert MCP workflow format to n8n-compatible format
     */
    static mcpToN8NWorkflow(mcpWorkflow: any): any;
    /**
     * Convert n8n execution data to MCP resource format
     */
    static n8nExecutionToMCPResource(execution: any): any;
    /**
     * Convert MCP prompt arguments to n8n-compatible format
     */
    static mcpPromptArgsToN8N(promptArgs: any): IDataObject;
    /**
     * Validate and sanitize data before conversion
     */
    static sanitizeData(data: any): any;
    /**
     * Extract error information for both n8n and MCP formats
     */
    static formatError(error: any): any;
}
//# sourceMappingURL=bridge.d.ts.map