"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNodeOperation = isNodeOperation;
exports.isConnectionOperation = isConnectionOperation;
exports.isMetadataOperation = isMetadataOperation;
function isNodeOperation(op) {
    return ['addNode', 'removeNode', 'updateNode', 'moveNode', 'enableNode', 'disableNode'].includes(op.type);
}
function isConnectionOperation(op) {
    return ['addConnection', 'removeConnection', 'updateConnection'].includes(op.type);
}
function isMetadataOperation(op) {
    return ['updateSettings', 'updateName', 'addTag', 'removeTag'].includes(op.type);
}
//# sourceMappingURL=workflow-diff.js.map