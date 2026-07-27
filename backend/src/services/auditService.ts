import prisma from '../config/prisma';
import { AuditAction } from '@prisma/client';
import { AuthRequest } from '../types';

export const createAuditLog = async (
  req: AuthRequest,
  action: AuditAction,
  entity: string,
  entityId?: string,
  details?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action,
        entity,
        entityId,
        details,
        ipAddress: req.ip || req.socket.remoteAddress,
      },
    });
  } catch {
    // Non-blocking audit logging
  }
};
