import Permission from '../models/Permission';

export const seedPermissions = async (): Promise<void> => {
  const permissions = [
    // Device permissions
    { name: 'device:read',    resource: 'device',   action: 'read' },
    { name: 'device:create',  resource: 'device',   action: 'create' },
    { name: 'device:update',  resource: 'device',   action: 'update' },
    { name: 'device:delete',  resource: 'device',   action: 'delete' },
    { name: 'device:execute', resource: 'device',   action: 'execute' },
    // Group permissions
    { name: 'group:read',     resource: 'group',    action: 'read' },
    { name: 'group:create',   resource: 'group',    action: 'create' },
    { name: 'group:update',   resource: 'group',    action: 'update' },
    { name: 'group:delete',   resource: 'group',    action: 'delete' },
    // Schedule permissions
    { name: 'schedule:read',      resource: 'schedule', action: 'read' },
    { name: 'schedule:create',    resource: 'schedule', action: 'create' },
    { name: 'schedule:update',    resource: 'schedule', action: 'update' },
    { name: 'schedule:delete',    resource: 'schedule', action: 'delete' },
    { name: 'schedule:execute',   resource: 'schedule', action: 'execute' },
    // Policy permissions
    { name: 'policy:read',        resource: 'policy',   action: 'read' },
    { name: 'policy:manage',      resource: 'policy',   action: 'manage' },
  ];

  for (const perm of permissions) {
    await Permission.findOrCreate({
      where: { name: perm.name },
      defaults: perm,
    });
  }

  console.log('Permissions seeded successfully');
};
