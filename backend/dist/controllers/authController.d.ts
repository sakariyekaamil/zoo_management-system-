import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const login: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const refresh: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const logout: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const forgotPassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const resetPassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map