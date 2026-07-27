import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendPaginated: <T>(res: Response, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
}, message?: string) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, message: string, statusCode?: number, errors?: unknown) => Response<any, Record<string, any>>;
export declare const getPagination: (query: Record<string, unknown>) => {
    page: number;
    limit: number;
    skip: number;
};
export declare const generateTicketNumber: () => string;
//# sourceMappingURL=response.d.ts.map