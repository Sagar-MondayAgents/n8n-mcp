"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nServerError = exports.N8nRateLimitError = exports.N8nValidationError = exports.N8nNotFoundError = exports.N8nAuthenticationError = exports.N8nApiError = void 0;
exports.handleN8nApiError = handleN8nApiError;
exports.getUserFriendlyErrorMessage = getUserFriendlyErrorMessage;
exports.logN8nError = logN8nError;
const logger_1 = require("./logger");
// Custom error classes for n8n API operations
class N8nApiError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'N8nApiError';
    }
}
exports.N8nApiError = N8nApiError;
class N8nAuthenticationError extends N8nApiError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'N8nAuthenticationError';
    }
}
exports.N8nAuthenticationError = N8nAuthenticationError;
class N8nNotFoundError extends N8nApiError {
    constructor(resource, id) {
        const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
        super(message, 404, 'NOT_FOUND');
        this.name = 'N8nNotFoundError';
    }
}
exports.N8nNotFoundError = N8nNotFoundError;
class N8nValidationError extends N8nApiError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'N8nValidationError';
    }
}
exports.N8nValidationError = N8nValidationError;
class N8nRateLimitError extends N8nApiError {
    constructor(retryAfter) {
        const message = retryAfter
            ? `Rate limit exceeded. Retry after ${retryAfter} seconds`
            : 'Rate limit exceeded';
        super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
        this.name = 'N8nRateLimitError';
    }
}
exports.N8nRateLimitError = N8nRateLimitError;
class N8nServerError extends N8nApiError {
    constructor(message = 'Internal server error', statusCode = 500) {
        super(message, statusCode, 'SERVER_ERROR');
        this.name = 'N8nServerError';
    }
}
exports.N8nServerError = N8nServerError;
// Error handling utility
function handleN8nApiError(error) {
    if (error instanceof N8nApiError) {
        return error;
    }
    if (error instanceof Error) {
        // Check if it's an Axios error
        const axiosError = error;
        if (axiosError.response) {
            const { status, data } = axiosError.response;
            const message = data?.message || axiosError.message;
            switch (status) {
                case 401:
                    return new N8nAuthenticationError(message);
                case 404:
                    return new N8nNotFoundError('Resource', message);
                case 400:
                    return new N8nValidationError(message, data);
                case 429:
                    const retryAfter = axiosError.response.headers['retry-after'];
                    return new N8nRateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
                default:
                    if (status >= 500) {
                        return new N8nServerError(message, status);
                    }
                    return new N8nApiError(message, status, 'API_ERROR', data);
            }
        }
        else if (axiosError.request) {
            // Request was made but no response received
            return new N8nApiError('No response from n8n server', undefined, 'NO_RESPONSE');
        }
        else {
            // Something happened in setting up the request
            return new N8nApiError(axiosError.message, undefined, 'REQUEST_ERROR');
        }
    }
    // Unknown error type
    return new N8nApiError('Unknown error occurred', undefined, 'UNKNOWN_ERROR', error);
}
// Utility to extract user-friendly error messages
function getUserFriendlyErrorMessage(error) {
    switch (error.code) {
        case 'AUTHENTICATION_ERROR':
            return 'Failed to authenticate with n8n. Please check your API key.';
        case 'NOT_FOUND':
            return error.message;
        case 'VALIDATION_ERROR':
            return `Invalid request: ${error.message}`;
        case 'RATE_LIMIT_ERROR':
            return 'Too many requests. Please wait a moment and try again.';
        case 'NO_RESPONSE':
            return 'Unable to connect to n8n. Please check the server URL and ensure n8n is running.';
        case 'SERVER_ERROR':
            return 'n8n server error. Please try again later or contact support.';
        default:
            return error.message || 'An unexpected error occurred';
    }
}
// Log error with appropriate level
function logN8nError(error, context) {
    const errorInfo = {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        context,
    };
    if (error.statusCode && error.statusCode >= 500) {
        logger_1.logger.error('n8n API server error', errorInfo);
    }
    else if (error.statusCode && error.statusCode >= 400) {
        logger_1.logger.warn('n8n API client error', errorInfo);
    }
    else {
        logger_1.logger.error('n8n API error', errorInfo);
    }
}
//# sourceMappingURL=n8n-errors.js.map