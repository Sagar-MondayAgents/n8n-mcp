import { Request, Response } from 'express';

export type TransportType = 'stdio' | 'http' | 'sse' | 'streamable-http';

export interface TransportSession {
  id: string;
  transport: any;
  server: any;
  createdAt: Date;
  lastActivity: Date;
}

export interface EngineConfig {
  sessionTimeout?: number;
  logLevel?: string;
  maxConcurrentSessions?: number;
  enableMetrics?: boolean;
}

export interface HTTPTransportOptions {
  sessionIdGenerator?: () => string;
  timeout?: number;
  maxRequestSize?: string;
}

export interface SSETransportSession extends TransportSession {
  transport: any; // SSEServerTransport type
  messageEndpoint: string;
}