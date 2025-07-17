export declare function getN8nApiConfig(): {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    maxRetries: number;
} | null;
export declare function isN8nApiConfigured(): boolean;
export type N8nApiConfig = NonNullable<ReturnType<typeof getN8nApiConfig>>;
//# sourceMappingURL=n8n-api.d.ts.map