"use strict";
// n8n API Types - Ported from n8n-manager-for-ai-agents
// These types define the structure of n8n API requests and responses
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionStatus = void 0;
// Execution Types
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["SUCCESS"] = "success";
    ExecutionStatus["ERROR"] = "error";
    ExecutionStatus["WAITING"] = "waiting";
    // Note: 'running' status is not returned by the API
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
//# sourceMappingURL=n8n-api.js.map