# ABAC (Attribute-Based Access Control) Guide

## Overview

This project implements **ABAC (Attribute-Based Access Control)** - a flexible access control model that evaluates attributes of subjects, resources, actions, and environments to make authorization decisions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ABAC Flow                                │
│                                                                 │
│  Request → Collect Attributes → PolicyEngine → Allow/Deny       │
│                                                                 │
│  Subject Attributes:    role, department, clearanceLevel        │
│  Resource Attributes:   ownerId, type, sensitivity              │
│  Action Attributes:     create, read, update, delete, execute   │
│  Environment Attributes: time, ipAddress, isBusinessHours       │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `permissions` | List of available permissions (device:read, device:create, etc.) |
| `role_permissions` | Maps roles to permissions (RBAC backward compatibility) |
| `policies` | ABAC policies with effect (permit/deny) and priority |
| `policy_conditions` | Conditions for each policy (attribute + operator + value) |

### ER Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   policies   │──1:N──│ policy_conditions│       │   permissions    │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id           │       │ id               │       │ id               │
│ name         │       │ policy_id (FK)   │       │ name             │
│ description  │       │ subject_attr     │       │ resource         │
│ effect       │       │ resource_attr    │       │ action           │
│ priority     │       │ action_attr      │       └──────────────────┘
│ is_active    │       │ environment_attr │              │
└──────────────┘       │ operator         │       ┌──────┴───────────┐
                       │ value            │       │ role_permissions │
                       └──────────────────┘       ├──────────────────┤
                                                  │ role             │
                                                  │ permission_id(FK)│
                                                  └──────────────────┘
```

## Policies

### Default Policies

| Policy | Effect | Priority | Description |
|--------|--------|----------|-------------|
| Admin Full Access | permit | 100 | Admin users have full access |
| Deny After Hours | deny | 95 | Deny writes outside business hours |
| Owner Access | permit | 90 | Users can manage own resources |
| Manager Department | permit | 80 | Managers can manage department resources |
| Operator Business Hours | permit | 70 | Operators can only execute during business hours |

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `"admin"` |
| `neq` | Not equals | `"user"` |
| `in` | Value in array | `["admin","manager"]` |
| `not_in` | Value not in array | `["viewer"]` |
| `gt` | Greater than | `1` |
| `gte` | Greater or equal | `1` |
| `lt` | Less than | `10` |
| `lte` | Less or equal | `10` |
| `contains` | String contains | `"192.168"` |

### Conditions

Each policy has one or more conditions. ALL conditions must match (AND logic).

Example: Admin Full Access policy has one condition:
```json
{
  "subjectAttr": "role",
  "operator": "eq",
  "value": "\"admin\""
}
```

## API Endpoints

### Policies

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/policies` | ✅ | List all policies |
| GET | `/api/policies/:id` | ✅ | Get policy by ID |
| POST | `/api/policies` | ✅ admin | Create policy |
| PUT | `/api/policies/:id` | ✅ admin | Update policy |
| DELETE | `/api/policies/:id` | ✅ admin | Delete policy |
| PATCH | `/api/policies/:id/toggle` | ✅ admin | Toggle active status |

### Create Policy Example

```json
POST /api/policies
{
  "name": "Engineering Department Access",
  "description": "Engineers can manage devices in their department",
  "effect": "permit",
  "priority": 85,
  "conditions": [
    {
      "subjectAttr": "role",
      "operator": "eq",
      "value": "\"manager\""
    },
    {
      "subjectAttr": "department",
      "operator": "eq",
      "value": "\"engineering\""
    }
  ]
}
```

## Usage in Routes

### Using ABAC Middleware

```typescript
import { abac } from '../middleware/abac';

// Replace authorize('admin') with abac
router.post('/', abac('device', 'create'), createDevice);
router.put('/:id', abac('device', 'update'), updateDevice);
router.delete('/:id', abac('device', 'delete'), deleteDevice);
router.post('/:id/command', abac('device', 'execute'), sendCommand);
```

### Backward Compatibility

Admin users bypass ABAC evaluation for backward compatibility:

```typescript
import { abacOrRbac } from '../middleware/abac';

// Admin always passes, others go through ABAC
router.post('/', abacOrRbac('device', 'create'), createDevice);
```

## Frontend Integration

### Using Permissions Hook

```typescript
import { usePermissions } from '../hooks/usePermissions';

function DeviceList() {
  const { hasPermission } = usePermissions();
  
  const canCreate = hasPermission('device:create');
  const canUpdate = hasPermission('device:update');
  const canDelete = hasPermission('device:delete');
  
  return (
    <>
      {canCreate && <Button>Add Device</Button>}
      {canUpdate && <Button>Edit</Button>}
      {canDelete && <Button>Delete</Button>}
    </>
  );
}
```

### Roles and Permissions

| Role | Permissions |
|------|-------------|
| admin | All permissions |
| manager | device:read/create/update/execute, group:read/create/update, schedule:* |
| operator | device:read/execute, group:read, schedule:read/execute |
| viewer | device:read, group:read, schedule:read |

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run PolicyEngine tests only
npx jest PolicyEngine

# Run policy service tests
npx jest policy.service
```

### Test Coverage

- PolicyEngine: 13 tests (operators, conditions, priorities, edge cases)
- Policy Service: 12 tests (CRUD operations, validation)

## Migration

The ABAC tables are created automatically when the server starts via the migration runner:

```typescript
// server/src/database/migrations/run.ts
await runMigrations();
```

### Manual Migration

```bash
psql -U postgres -d iot_management -f server/src/database/migrations/003_add_abac_tables.sql
```

## Troubleshooting

### Common Issues

1. **Policy not evaluating**: Check if `isActive` is true
2. **Wrong decision**: Verify priority ordering (higher = evaluated first)
3. **Attribute not found**: Ensure attribute name matches exactly (case-sensitive)
4. **Migration not running**: Check `migrations` table for executed migrations
