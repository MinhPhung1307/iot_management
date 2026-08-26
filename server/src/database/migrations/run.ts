import { QueryInterface } from 'sequelize';
import sequelize from '../../config/database';

// Migration history tracking
const MIGRATION_TABLE = 'migrations';

const migrations = [
  {
    id: 3,
    name: '003_add_abac_tables',
    up: async (queryInterface: QueryInterface) => {
      const transaction = await sequelize.transaction();
      try {
        // Create migrations tracking table
        await queryInterface.createTable(MIGRATION_TABLE, {
          id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
          name: { type: 'VARCHAR(255)', allowNull: false, unique: true },
          executed_at: { type: 'DATE', defaultValue: new Date() },
        }, { transaction });

        // 1. Add ABAC attributes to users table
        await queryInterface.sequelize.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50);
        `, { transaction });
        await queryInterface.sequelize.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100);
        `, { transaction });
        await queryInterface.sequelize.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS clearance_level INTEGER DEFAULT 1;
        `, { transaction });

        // 2. Create permissions table
        await queryInterface.createTable('permissions', {
          id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
          name: { type: 'VARCHAR(100)', allowNull: false, unique: true },
          resource: { type: 'VARCHAR(50)', allowNull: false },
          action: { type: 'VARCHAR(50)', allowNull: false },
          createdAt: { type: 'DATE', allowNull: false, defaultValue: new Date() },
        }, { transaction });

        // 3. Create role_permissions table
        await queryInterface.createTable('role_permissions', {
          role: { type: 'VARCHAR(20)', allowNull: false, primaryKey: true },
          permission_id: {
            type: 'INTEGER',
            allowNull: false,
            references: { model: 'permissions', key: 'id' },
            onDelete: 'CASCADE',
            primaryKey: true,
          },
        }, { transaction });

        // 4. Create policies table
        await queryInterface.createTable('policies', {
          id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
          name: { type: 'VARCHAR(100)', allowNull: false },
          description: { type: 'TEXT', allowNull: true },
          effect: { type: 'VARCHAR(10)', allowNull: false },
          priority: { type: 'INTEGER', defaultValue: 0 },
          isActive: { type: 'BOOLEAN', defaultValue: true },
          createdAt: { type: 'DATE', allowNull: false, defaultValue: new Date() },
          updatedAt: { type: 'DATE', allowNull: false, defaultValue: new Date() },
        }, { transaction });

        // 5. Create policy_conditions table
        await queryInterface.createTable('policy_conditions', {
          id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
          policyId: {
            type: 'INTEGER',
            allowNull: false,
            references: { model: 'policies', key: 'id' },
            onDelete: 'CASCADE',
          },
          subjectAttr: { type: 'VARCHAR(50)', allowNull: true },
          resourceAttr: { type: 'VARCHAR(50)', allowNull: true },
          actionAttr: { type: 'VARCHAR(50)', allowNull: true },
          environmentAttr: { type: 'VARCHAR(50)', allowNull: true },
          operator: { type: 'VARCHAR(20)', allowNull: false },
          value: { type: 'TEXT', allowNull: false },
          createdAt: { type: 'DATE', allowNull: false, defaultValue: new Date() },
        }, { transaction });

        // 6. Seed permissions
        const permissions = [
          { name: 'device:read',    resource: 'device',   action: 'read' },
          { name: 'device:create',  resource: 'device',   action: 'create' },
          { name: 'device:update',  resource: 'device',   action: 'update' },
          { name: 'device:delete',  resource: 'device',   action: 'delete' },
          { name: 'device:execute', resource: 'device',   action: 'execute' },
          { name: 'group:read',     resource: 'group',    action: 'read' },
          { name: 'group:create',   resource: 'group',    action: 'create' },
          { name: 'group:update',   resource: 'group',    action: 'update' },
          { name: 'group:delete',   resource: 'group',    action: 'delete' },
          { name: 'schedule:read',      resource: 'schedule', action: 'read' },
          { name: 'schedule:create',    resource: 'schedule', action: 'create' },
          { name: 'schedule:update',    resource: 'schedule', action: 'update' },
          { name: 'schedule:delete',    resource: 'schedule', action: 'delete' },
          { name: 'schedule:execute',   resource: 'schedule', action: 'execute' },
          { name: 'policy:read',        resource: 'policy',   action: 'read' },
          { name: 'policy:manage',      resource: 'policy',   action: 'manage' },
        ];
        for (const perm of permissions) {
          await queryInterface.sequelize.query(`
            INSERT INTO permissions (name, resource, action, "createdAt") 
            VALUES ('${perm.name}', '${perm.resource}', '${perm.action}', NOW())
            ON CONFLICT (name) DO NOTHING;
          `, { transaction });
        }

        // 7. Seed role_permissions
        await queryInterface.sequelize.query(`
          INSERT INTO role_permissions (role, permission_id)
          SELECT 'admin', id FROM permissions
          ON CONFLICT DO NOTHING;
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO role_permissions (role, permission_id)
          SELECT 'manager', id FROM permissions
          WHERE name IN ('device:read','device:create','device:update','device:execute',
                         'group:read','group:create','group:update',
                         'schedule:read','schedule:create','schedule:update','schedule:execute')
          ON CONFLICT DO NOTHING;
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO role_permissions (role, permission_id)
          SELECT 'operator', id FROM permissions
          WHERE name IN ('device:read','device:execute','group:read',
                         'schedule:read','schedule:execute')
          ON CONFLICT DO NOTHING;
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO role_permissions (role, permission_id)
          SELECT 'viewer', id FROM permissions
          WHERE name IN ('device:read','group:read','schedule:read')
          ON CONFLICT DO NOTHING;
        `, { transaction });

        // 8. Seed policies
        await queryInterface.sequelize.query(`
          INSERT INTO policies (name, description, effect, priority, "createdAt", "updatedAt") VALUES
            ('Admin Full Access', 'Admin users have full access to all resources', 'permit', 100, NOW(), NOW()),
            ('Owner Access', 'Users can manage resources they own', 'permit', 90, NOW(), NOW()),
            ('Manager Department Access', 'Managers can manage resources in their department', 'permit', 80, NOW(), NOW()),
            ('Operator Business Hours', 'Operators can only execute during business hours', 'permit', 70, NOW(), NOW()),
            ('Deny After Hours', 'Deny all write operations after business hours', 'deny', 95, NOW(), NOW())
          ON CONFLICT DO NOTHING;
        `, { transaction });

        // 9. Seed policy_conditions
        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "subjectAttr", operator, value, "createdAt")
          SELECT id, 'role', 'eq', '"admin"', NOW() FROM policies WHERE name = 'Admin Full Access';
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "subjectAttr", operator, value, "createdAt")
          SELECT id, 'userId', 'eq', '\${resource.ownerId}', NOW() FROM policies WHERE name = 'Owner Access';
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "subjectAttr", operator, value, "createdAt")
          SELECT id, 'role', 'eq', '"manager"', NOW() FROM policies WHERE name = 'Manager Department Access';
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "resourceAttr", operator, value, "createdAt")
          SELECT id, 'department', 'eq', '\${subject.department}', NOW() FROM policies WHERE name = 'Manager Department Access';
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "subjectAttr", operator, value, "createdAt")
          SELECT id, 'role', 'eq', '"operator"', NOW() FROM policies WHERE name = 'Operator Business Hours';
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "environmentAttr", operator, value, "createdAt")
          SELECT id, 'isBusinessHours', 'eq', 'true', NOW() FROM policies WHERE name = 'Operator Business Hours';
        `, { transaction });

        await queryInterface.sequelize.query(`
          INSERT INTO policy_conditions ("policyId", "environmentAttr", operator, value, "createdAt")
          SELECT id, 'isBusinessHours', 'eq', 'false', NOW() FROM policies WHERE name = 'Deny After Hours';
        `, { transaction });

        // Record migration
        await queryInterface.sequelize.query(`
          INSERT INTO migrations (name, executed_at) 
          VALUES ('003_add_abac_tables', NOW())
          ON CONFLICT (name) DO NOTHING;
        `, { transaction });

        await transaction.commit();
        console.log('Migration 003_add_abac_tables executed successfully');
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    },
  },
];

export const runMigrations = async (): Promise<void> => {
  try {
    // Temporarily disable logging
    const originalLogging = sequelize.options.logging;
    sequelize.options.logging = false;

    // Ensure migrations table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get executed migrations
    const [rows] = await sequelize.query(`SELECT name FROM migrations`);
    const executedMigrations = (rows as any[]).map((r: any) => r.name);

    // Restore logging
    sequelize.options.logging = originalLogging;

    // Run pending migrations
    const queryInterface = sequelize.getQueryInterface();
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up(queryInterface);
        console.log(`Migration ${migration.name} completed`);
      }
    }

    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Run directly if called
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
