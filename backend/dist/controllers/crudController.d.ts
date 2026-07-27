import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const createCrudController: <T extends string>(model: T, options?: {
    searchFields?: string[];
    include?: Record<string, boolean | object>;
    sanitize?: (data: Record<string, unknown>) => Record<string, unknown>;
    beforeCreate?: (data: Record<string, unknown>, req: AuthRequest) => Promise<Record<string, unknown>>;
    beforeUpdate?: (data: Record<string, unknown>, req: AuthRequest) => Promise<Record<string, unknown>>;
    afterCreate?: (record: unknown, req: AuthRequest) => Promise<void>;
    afterUpdate?: (record: unknown, req: AuthRequest) => Promise<void>;
    afterDelete?: (id: string, req: AuthRequest) => Promise<void>;
}) => {
    getAll: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    create: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    update: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    remove: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export declare const userController: {
    toggleActive: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    resetUserPassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    getAll: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    create: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    update: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    remove: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=crudController.d.ts.map