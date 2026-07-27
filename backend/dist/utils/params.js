"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paramId = void 0;
const paramId = (req, name = 'id') => {
    const value = req.params[name];
    if (Array.isArray(value))
        return String(value[0]);
    return String(value);
};
exports.paramId = paramId;
//# sourceMappingURL=params.js.map