"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTicketNumber = exports.getPagination = exports.sendError = exports.sendPaginated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    const response = { success: true, message, data };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendPaginated = (res, data, pagination, message = 'Success') => {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            ...pagination,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
    };
    return res.status(200).json(response);
};
exports.sendPaginated = sendPaginated;
const sendError = (res, message, statusCode = 400, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
exports.sendError = sendError;
const getPagination = (query) => {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'), 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPagination = getPagination;
const generateTicketNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WCZ-${timestamp}-${random}`;
};
exports.generateTicketNumber = generateTicketNumber;
//# sourceMappingURL=response.js.map