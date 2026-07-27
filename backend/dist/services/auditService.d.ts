import { AuditAction } from '@prisma/client';
import { AuthRequest } from '../types';
export declare const createAuditLog: (req: AuthRequest, action: AuditAction, entity: string, entityId?: string, details?: string) => Promise<void>;
//# sourceMappingURL=auditService.d.ts.map