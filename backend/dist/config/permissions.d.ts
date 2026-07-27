import { UserRole } from '@prisma/client';
export declare const ROLE_PERMISSIONS: Record<UserRole, string[]>;
export declare const hasPermission: (role: UserRole, resource: string) => boolean;
export declare const ROUTE_PERMISSIONS: Record<string, string>;
//# sourceMappingURL=permissions.d.ts.map