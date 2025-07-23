/**
 * N8N MCP Engine - Clean interface for service integration
 * Now with Streamable HTTP support
 */
import { Request, Response } from 'express';
import { SingleSessionHTTPServer } from './http-server-single-session';
import { logger } from './utils/logger';
import { N8NDocumentationMCPServer } from './mcp/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TransportType, EngineConfig } from './types/transport.types';

export interface EngineHealth {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  sessionActive: boolean;
  memoryUsage: {
    used: number;
    total: number;
    unit: string;
  };
  version: string;
  transportSupport: TransportType[];
}

export interface EngineOptions extends EngineConfig {
  transportType?: TransportType;
}

export class N8NMCPEngine {
  private server: SingleSessionHTTPServer;
  private startTime: Date;
  private transportType: TransportType;
  private streamableHTTPServer?: N8NDocumentationMCPServer;
  
  constructor(options: EngineOptions = {}) {
    this.server = new SingleSessionHTTPServer();
    this.startTime = new Date();
    this.transportType = options.transportType || 'http';
    
    if (options.logLevel) {
      process.env.LOG_LEVEL = options.logLevel;
    }
  }
  
  /**
   * Process a single MCP request (legacy HTTP mode)
   */
  async processRequest(req: Request, res: Response): Promise<void> {
    try {
      await this.server.handleRequest(req, res);
    } catch (error) {
      logger.error('Engine processRequest error:', error);
      throw error;
    }
  }
  
  /**
   * Process a Streamable HTTP request
   * This is the new recommended transport method
   * 
   * @example
   * app.post('/mcp', async (req, res) => {
   *   await engine.processStreamableHTTP(req, res);
   * });
   */
  async processStreamableHTTP2(req: Request, res: Response): Promise<void> {
    try {
      // Create a new server instance for each request to ensure isolation
      const server = new N8NDocumentationMCPServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Use default session ID generation
      });
      
      await server.connect(transport);
      await transport.handleRequest(req, res);
      
      logger.debug('Streamable HTTP request processed successfully');
    } catch (error) {
      logger.error('Engine processStreamableHTTP error:', error);
      
      // Ensure proper error response
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
      
      throw error;
    }
  }
  // In processStreamableHTTP method in mcp-engine.ts
async processStreamableHTTP(req: Request, res: Response): Promise<void> {
  try {
    logger.debug('processStreamableHTTP called', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      readable: req.readable,
      readableEnded: req.readableEnded
    });
    
    // Check if stream is still readable
    if (!req.readable) {
      throw new Error('Request stream is not readable - body may have been consumed by middleware');
    }
    
    const server = new N8NDocumentationMCPServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res);
    
  } catch (error) {
    logger.error('processStreamableHTTP error:', error);
    throw error;
  }
}
  /**
   * Get transport capabilities
   */
  getTransportCapabilities(): TransportType[] {
    return ['stdio', 'http', 'sse', 'streamable-http'];
  }
  
  /**
   * Health check for service monitoring
   */
  async healthCheck(): Promise<EngineHealth> {
    try {
      const sessionInfo = this.server.getSessionInfo();
      const memoryUsage = process.memoryUsage();
      
      return {
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        sessionActive: sessionInfo.active,
        memoryUsage: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        version: '2.3.2',
        transportSupport: this.getTransportCapabilities()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        uptime: 0,
        sessionActive: false,
        memoryUsage: { used: 0, total: 0, unit: 'MB' },
        version: '2.3.2',
        transportSupport: []
      };
    }
  }
  
  /**
   * Get current session information
   */
  getSessionInfo(): { active: boolean; sessionId?: string; age?: number } {
    return this.server.getSessionInfo();
  }
  
  /**
   * Graceful shutdown for service lifecycle
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down N8N MCP Engine...');
    await this.server.shutdown();
  }
  
  /**
   * Start the engine (if using standalone mode)
   */
  async start(): Promise<void> {
    await this.server.start();
  }
}

export default N8NMCPEngine;