#!/usr/bin/env node
/**
 * Unified HTTP Server supporting both SSE and Streamable HTTP transports
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { N8NMCPEngine } from './mcp-engine';
import { N8NDocumentationMCPServer } from './mcp/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { logger } from './utils/logger';
import { SSETransportSession } from './types/transport.types';

interface ServerConfig {
  port: number;
  corsOrigin?: string | string[];
  maxRequestSize?: string;
  enableMetrics?: boolean;
}

export class UnifiedHTTPServer {
  private app: express.Application;
  private engine: N8NMCPEngine;
  private sseTransports: Map<string, SSETransportSession>;
  private config: ServerConfig;
  private server?: any;
  
  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: parseInt(process.env.PORT || '4302'),
      corsOrigin: '*',
      maxRequestSize: '50mb',
      enableMetrics: true,
      ...config
    };
    
    this.app = express();
    this.engine = new N8NMCPEngine({ transportType: 'streamable-http' });
    this.sseTransports = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  private setupMiddleware(): void {
    // JSON body parser with size limit
    this.app.use(express.json({ limit: this.config.maxRequestSize }));
    
    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true
    }));
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`, {
        headers: req.headers,
        query: req.query
      });
      next();
    });
    
    // Metrics middleware
    if (this.config.enableMetrics) {
      this.app.use(this.metricsMiddleware.bind(this));
    }
  }
  
  private metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    });
    
    next();
  }
  
  private setupRoutes(): void {
    // Root endpoint - API information
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'n8n-mcp',
        version: '2.3.2',
        transports: {
          streamableHTTP: {
            endpoint: '/mcp',
            method: 'POST',
            description: 'Recommended transport for new integrations'
          },
          sse: {
            endpoint: '/sse',
            method: 'GET',
            description: 'Legacy transport (deprecated)'
          }
        },
        health: '/health',
        metrics: this.config.enableMetrics ? '/metrics' : null
      });
    });
    
    // Streamable HTTP endpoint - NEW RECOMMENDED TRANSPORT
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        await this.engine.processStreamableHTTP(req, res);
      } catch (error) {
        logger.error('Streamable HTTP error:', error);
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
      }
    });
    
    // SSE endpoint - LEGACY SUPPORT
    this.app.get('/sse', async (req: Request, res: Response) => {
      try {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

        // Create new server instance for this SSE session
        const server = new N8NDocumentationMCPServer();
        const transport = new SSEServerTransport('/messages', res);

        // Store transport session
        const session: SSETransportSession = {
          id: transport.sessionId,
          transport,
          server,
          createdAt: new Date(),
          lastActivity: new Date(),
          messageEndpoint: '/messages'
        };

        this.sseTransports.set(transport.sessionId, session);

        // Clean up on disconnect
        res.on('close', () => {
          logger.debug(`SSE connection closed: ${transport.sessionId}`);
          this.sseTransports.delete(transport.sessionId);
        });

        // Connect server to transport
        await server.connect(transport);

        logger.info(`SSE connection established: ${transport.sessionId}`);
      } catch (error) {
        logger.error('SSE connection error:', error);
        res.status(500).end();
      }
    });

    // SSE message endpoint - LEGACY SUPPORT
    this.app.post('/messages', async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        res.status(400).json({
          error: 'Missing sessionId parameter'
        });
        return;
      }

      const session = this.sseTransports.get(sessionId);

      if (!session) {
        res.status(404).json({
          error: 'Session not found',
          sessionId
        });
        return;
      }

      try {
        // Update last activity
        session.lastActivity = new Date();

        // Handle the message
        await session.transport.handlePostMessage(req, res);
      } catch (error) {
        logger.error('SSE message handling error:', error);
        res.status(500).json({
          error: 'Message processing failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const health = await this.engine.healthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
          ...health,
          sseSessions: this.sseTransports.size,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Metrics endpoint
    if (this.config.enableMetrics) {
      this.app.get('/metrics', (req: Request, res: Response) => {
        res.json({
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          sessions: {
            sse: this.sseTransports.size,
            total: this.sseTransports.size
          },
          timestamp: new Date().toISOString()
        });
      });
    }
  }
  
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
      });
    });
    
    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error:', err);
      
      if (res.headersSent) {
        return next(err);
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
      });
    });
  }
  
  /**
   * Clean up stale SSE sessions
   */
  private cleanupStaleSessions(): void {
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    for (const [sessionId, session] of this.sseTransports.entries()) {
      const age = now - session.lastActivity.getTime();
      if (age > staleThreshold) {
        logger.info(`Cleaning up stale SSE session: ${sessionId}`);
        this.sseTransports.delete(sessionId);
      }
    }
  }
  
  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`n8n-mcp unified server started on port ${this.config.port}`);
        logger.info(`  - Streamable HTTP: POST http://localhost:${this.config.port}/mcp`);
        logger.info(`  - SSE (legacy): GET http://localhost:${this.config.port}/sse`);
        logger.info(`  - Health: GET http://localhost:${this.config.port}/health`);
        
        // Start session cleanup interval
        setInterval(() => this.cleanupStaleSessions(), 5 * 60 * 1000); // Every 5 minutes
        
        resolve();
      });
    });
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down unified HTTP server...');
    
    // Close all SSE connections
    for (const [sessionId, session] of this.sseTransports.entries()) {
      logger.debug(`Closing SSE session: ${sessionId}`);
      if (session.transport && typeof session.transport.close === 'function') {
        session.transport.close();
      }
    }
    
    // Clear sessions
    this.sseTransports.clear();
    
    // Shutdown engine
    await this.engine.shutdown();
    
    // Close HTTP server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }
  }
}

// Main execution
if (require.main === module) {
  const server = new UnifiedHTTPServer();
  
  // Graceful shutdown handlers
  const shutdown = async () => {
    await server.shutdown();
    process.exit(0);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Start server
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}