"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subMonths = exports.endOfMonth = exports.startOfMonth = exports.endOfDay = exports.startOfDay = void 0;
const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.startOfDay = startOfDay;
const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.endOfDay = endOfDay;
const startOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};
exports.startOfMonth = startOfMonth;
const endOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};
exports.endOfMonth = endOfMonth;
const subMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return d;
};
exports.subMonths = subMonths;
//# sourceMappingURL=date.js.map