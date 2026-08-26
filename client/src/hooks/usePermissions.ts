import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Admin has all permissions
    if (user.role === 'admin') return true;
    // Check permissions array if available
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }
    // Fallback to role-based checks for backward compatibility
    return hasRolePermission(user.role, permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}

// Fallback role-based permission check for backward compatibility
function hasRolePermission(role: string, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    admin: ['*'], // all permissions
    manager: [
      'device:read', 'device:create', 'device:update', 'device:execute',
      'group:read', 'group:create', 'group:update',
      'schedule:read', 'schedule:create', 'schedule:update', 'schedule:execute',
      'policy:read',
    ],
    operator: [
      'device:read', 'device:execute',
      'group:read',
      'schedule:read', 'schedule:execute',
    ],
    viewer: [
      'device:read',
      'group:read',
      'schedule:read',
    ],
  };

  const permissions = rolePermissions[role] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}
