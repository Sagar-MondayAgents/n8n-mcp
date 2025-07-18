#!/usr/bin/env node
/**
 * MCP Server entry point with multiple transport support
 */
import { N8NDocumentationMCPServer } from './server';
import { logger } from '../utils/logger';
import { UnifiedHTTPServer } from '../http-unified-server';
import { SingleSessionHTTPServer } from '../http-server-single-session';

// Add error handlers
process.on('uncaughtException', (error) => {
  if (process.env.MCP_MODE !== 'stdio') {
    console.error('Uncaught Exception:', error);
  }
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  if (process.env.MCP_MODE !== 'stdio') {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

async function main() {
  const mode = process.env.MCP_MODE || 'unified';
  
  try {
    logger.info(`Starting n8n Documentation MCP Server in ${mode} mode...`);
    
    switch (mode) {
      case 'unified':
        // NEW: Unified server with both Streamable HTTP and SSE
        const unifiedServer = new UnifiedHTTPServer();
        await unifiedServer.start();
        break;
        
      case 'http':
        // Legacy HTTP mode with custom transport
        if (process.env.USE_FIXED_HTTP === 'true') {
          const { startFixedHTTPServer } = await import('../http-server');
          await startFixedHTTPServer();
        } else {
          const server = new SingleSessionHTTPServer();
          
          const shutdown = async () => {
            await server.shutdown();
            process.exit(0);
          };
          
          process.on('SIGTERM', shutdown);
          process.on('SIGINT', shutdown);
          
          await server.start();
        }
        break;
        
      case 'stdio':
        // Stdio mode for local Claude Desktop
        const server = new N8NDocumentationMCPServer();
        await server.run();
        break;
        
      default:
        throw new Error(`Unknown MCP_MODE: ${mode}`);
    }
  } catch (error) {
    if (mode !== 'stdio') {
      console.error('Failed to start MCP server:', error);
    }
    logger.error('Failed to start MCP server', error);
    
    if (error instanceof Error && error.message.includes('nodes.db not found')) {
      console.error('\nTo fix this issue:');
      console.error('1. cd to the n8n-mcp directory');
      console.error('2. Run: npm run build');
      console.error('3. Run: npm run rebuild');
    }
    
    process.exit(1);
  }
}

// Export for use as a module
export { N8NDocumentationMCPServer, UnifiedHTTPServer };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}