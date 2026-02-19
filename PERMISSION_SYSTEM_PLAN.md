# Oxedro Hyper-Dynamic Permission System (HDPS) - Implementation Plan

---

## Overview

A fully data-driven, enterprise-grade permission system where **every authorization rule lives in the database**. No hardcoded role checks. No permission logic in code. Adding a new module, role, action, or restriction is always just inserting rows -- zero code changes needed.

```
User -> Role -> Policies -> Decision -> Fields & Actions
```

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Database Schema](#2-database-schema)
3. [Seed Data](#3-seed-data)
4. [Database Functions](#4-database-functions)
5. [RLS Policies](#5-rls-policies)
6. [Edge Function Changes](#6-edge-function-changes)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Migration File Breakdown](#8-migration-file-breakdown)
9. [V1 vs V2 Boundaries](#9-v1-vs-v2-boundaries)

---

## 1. Core Concepts

### Permission Building Blocks

Every authorization decision is composed of these atomic pieces:

```
Module -> Resource -> Action -> Scope -> Condition -> Field Rules
```

| Block | What It Represents | Example |
|---|---|---|
| **Module** | A top-level feature area | `exams`, `attendance`, `fees` |
| **Resource** | An entity within a module | `result`, `leave_request`, `payment` |
| **Action** | What the user wants to do | `create`, `read`, `update`, `publish` |
| **Scope** | Whose data they can access | `self`, `assigned`, `class`, `institute` |
| **Condition** | When access is allowed (runtime check) | `{ "<": ["now", "resource.publish_time"] }` |
| **Field Rules** | Which fields are visible/editable | `{ "marks": "editable", "email": "hidden" }` |

### How a Permission Check Works

```
1. User requests: "I want to UPDATE a RESULT"
2. System finds the user's role
3. System looks up all policies for that role matching resource=result, action=update
4. Also checks user_policy_overrides for personal exceptions
5. DENY policies always win over ALLOW
6. Higher priority wins among same-effect policies
7. Matching policy provides: scope, conditions, field_rules
8. Scope filters which rows the user can see
9. Conditions check runtime context (time, status, etc.)
10. Field rules strip/mask individual fields from the response
```

### Conflict Resolution

When multiple policies match:

1. **DENY always wins** over ALLOW (regardless of priority)
2. **Higher priority number wins** among same-effect policies
3. **Narrower scope wins** as a tiebreaker

---

## 2. Database Schema

### Layer 1: Definition Tables (the vocabulary)

These four tables define the atomic building blocks. They rarely change after initial setup.

#### `modules` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `key` | text, unique | Machine-readable identifier (`exams`, `fees`) |
| `display_name` | text | Human-readable name |
| `description` | text | What this module covers |
| `icon` | text, nullable | Lucide icon name for the frontend |
| `is_active` | boolean, default true | Soft-disable without deleting |
| `sort_order` | int, default 0 | Display ordering |
| `created_at` | timestamptz | Auto-set |

#### `resources` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `module_id` | uuid, FK to modules | Parent module |
| `key` | text | Machine-readable identifier (`result`, `mark`) |
| `display_name` | text | Human-readable name |
| `description` | text | What this resource represents |
| `is_active` | boolean, default true | Soft-disable |
| `sort_order` | int, default 0 | Display ordering |
| `created_at` | timestamptz | Auto-set |

**Unique constraint**: `(module_id, key)` -- a resource key is unique within its module.

#### `actions` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `key` | text, unique | Machine-readable (`create`, `publish`, `export`) |
| `display_name` | text | Human-readable name |
| `description` | text | What this action does |
| `category` | text | One of: `crud`, `data`, `workflow`, `assignment`, `status`, `bulk`, `special` |
| `is_active` | boolean, default true | Soft-disable |
| `sort_order` | int, default 0 | Display ordering |
| `created_at` | timestamptz | Auto-set |

#### `scopes` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `key` | text, unique | Machine-readable (`self`, `class`, `institute`) |
| `display_name` | text | Human-readable name |
| `description` | text | What data boundary this represents |
| `priority` | int | Higher number = broader scope (self=10, institute=100) |
| `is_active` | boolean, default true | Soft-disable |
| `created_at` | timestamptz | Auto-set |

### Layer 2: Composition Tables (the rules)

These four tables wire the vocabulary into real authorization decisions.

#### `permissions` table

Links a resource to an action. This is the catalog of "what can be done to what."

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `resource_id` | uuid, FK to resources | Which resource |
| `action_id` | uuid, FK to actions | Which action |
| `description` | text, nullable | Optional description |
| `is_active` | boolean, default true | Soft-disable |
| `created_at` | timestamptz | Auto-set |

**Unique constraint**: `(resource_id, action_id)` -- each resource+action pair is defined once.

#### `policies` table (the heart of the system)

Each row is a complete authorization rule.

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `name` | text | Descriptive name for the policy |
| `description` | text, nullable | Detailed explanation |
| `permission_id` | uuid, FK to permissions | Which resource+action this covers |
| `scope_id` | uuid, FK to scopes | What data boundary applies |
| `effect` | text, CHECK (`allow` or `deny`) | Allow or deny access |
| `priority` | int, default 0 | Higher wins in conflicts |
| `conditions` | jsonb, nullable | Runtime conditions (v1: simple operators only) |
| `field_rules` | jsonb, nullable | Field-level visibility rules |
| `is_active` | boolean, default true | Soft-disable |
| `created_at` | timestamptz | Auto-set |

#### `role_policies` table

Binds policies to roles. A role's effective permissions = all its active policy bindings.

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `role_id` | uuid, FK to roles | Which role |
| `policy_id` | uuid, FK to policies | Which policy |
| `granted_by` | uuid, FK to users, nullable | Who assigned this |
| `granted_at` | timestamptz | When assigned |
| `expires_at` | timestamptz, nullable | Optional expiry for time-limited grants |
| `is_active` | boolean, default true | Soft-disable |
| `created_at` | timestamptz | Auto-set |

**Unique constraint**: `(role_id, policy_id)`

#### `user_policy_overrides` table

Per-user exceptions that go beyond (or restrict) their role's policies.

| Column | Type | Description |
|---|---|---|
| `id` | uuid, PK | Auto-generated |
| `user_id` | uuid, FK to users | Which user |
| `policy_id` | uuid, FK to policies | Which policy to override |
| `override_effect` | text, CHECK (`allow` or `deny`) | Override the policy's effect |
| `override_priority` | int | Priority of this override |
| `granted_by` | uuid, FK to users, nullable | Who granted the override |
| `granted_at` | timestamptz | When granted |
| `expires_at` | timestamptz, nullable | Optional expiry |
| `reason` | text, nullable | Why this override exists |
| `is_active` | boolean, default true | Soft-disable |
| `created_at` | timestamptz | Auto-set |

**Unique constraint**: `(user_id, policy_id)`

### Entity Relationship Diagram

```
modules
  |
  +--< resources
         |
         +--< permissions >-- actions
                |
                +--< policies >-- scopes
                       |
                       +--< role_policies >-- roles (existing)
                       |
                       +--< user_policy_overrides >-- users (existing)
```

---

## 3. Seed Data

### Modules (16)

| Key | Display Name | Icon |
|---|---|---|
| academics | Academics | GraduationCap |
| users | Users | Users |
| exams | Examinations | FileText |
| attendance | Attendance | CalendarCheck |
| fees | Fees | CreditCard |
| timetable | Timetable | Clock |
| reports | Reports | BarChart3 |
| communications | Communications | MessageSquare |
| library | Library | BookOpen |
| transport | Transport | Bus |
| hostel | Hostel | Building |
| settings | Settings | Settings |
| permissions | Permissions | Shield |
| documents | Documents | FileCheck |
| events | Events | Calendar |
| discipline | Discipline | Scale |

### Resources (143 total)

Organized by module. Each resource is a real entity in the system.

| Module | Resources |
|---|---|
| **academics** (10) | class, section, subject, chapter, topic, syllabus, assignment, homework, lesson_plan, academic_year |
| **users** (7) | user, profile, teacher_profile, student_profile, parent_profile, staff_profile, bulk_import |
| **exams** (13) | exam, exam_type, question_paper, question_bank, question, result, mark, grade, grade_scale, report_card, exam_schedule, hall_ticket, evaluation |
| **attendance** (7) | daily_attendance, period_attendance, leave_request, leave_type, leave_balance, attendance_report, biometric_log |
| **fees** (11) | fee_structure, fee_type, fee_collection, fee_concession, payment, receipt, due, fine, refund, fee_report, scholarship |
| **timetable** (6) | schedule, period, period_config, substitution, break_time, special_class |
| **reports** (6) | academic_report, attendance_report, fee_report, custom_report, analytics, dashboard_widget |
| **communications** (9) | announcement, message, conversation, notification, template, sms, email_template, circular, notice_board |
| **library** (11) | book, category, author, publisher, issue, book_return, reservation, library_fine, catalog, ebook, member |
| **transport** (8) | route, stop, vehicle, driver, trip, transport_assignment, tracking, transport_fee |
| **hostel** (9) | room, block, floor, allocation, mess_menu, complaint, visitor, hostel_fee, warden |
| **settings** (9) | general, academic_year_config, term, grading_system, institute_profile, backup, restore, integration, theme |
| **permissions** (8) | perm_module, perm_resource, perm_action, perm_scope, permission, policy, role_policy, user_policy_override |
| **documents** (7) | certificate, id_card, transfer_certificate, bonafide, character_certificate, doc_template, doc_upload |
| **events** (6) | event, calendar, holiday, celebration, meeting, parent_meeting |
| **discipline** (6) | incident, warning, suspension, behavior_point, counseling, reward |

### Actions (45 across 7 categories)

| Category | Actions |
|---|---|
| **crud** (4) | create, read, update, delete |
| **data** (8) | list, view_detail, export, import, print, download, upload, view_analytics |
| **workflow** (12) | publish, unpublish, submit, approve, reject, review, verify, generate, schedule, close, reopen, escalate |
| **assignment** (4) | assign, unassign, transfer, reassign |
| **status** (6) | activate, deactivate, archive, restore, lock, unlock |
| **bulk** (3) | bulk_create, bulk_update, bulk_delete |
| **special** (8) | configure, manage, share, comment, notify, grade, promote, audit |

### Scopes (10)

| Key | Priority | Description |
|---|---|---|
| self | 10 | Own records only |
| linked | 20 | Linked records (parent to child) |
| assigned | 30 | Explicitly assigned records |
| class | 40 | Same class records |
| section | 50 | Same section records |
| batch | 60 | Same batch/year group |
| grade_level | 70 | Same grade level across sections |
| department | 80 | Same department |
| branch | 90 | Same campus or branch |
| institute | 100 | Full tenant access |

### Permission Seeding Strategy (Hybrid Approach)

Not every resource gets every action. Permissions are seeded based on what makes sense:

- **Standard CRUD resources** (user, class, section, subject, etc.) get: `create, read, update, delete, list`
- **Workflow resources** (exam, result, assignment, leave_request) get: CRUD + `submit, approve, reject, publish`
- **Report resources** get: `read, list, export, print, generate, view_analytics`
- **Config resources** (settings, grade_scale, fee_structure) get: `read, update, list, configure`
- **Import resources** (bulk_import) get: `create, read, list, import`
- **Permission resources** get: `create, read, update, delete, list, manage, audit`

This yields roughly **500-600 permission rows** -- enough to cover real use cases without thousands of unused entries. New permissions are added as features ship.

### Default Role Policies

#### Super Admin (SA) -- Priority 100

- ALLOW on **all** seeded permissions at **institute** scope
- No conditions, no field restrictions
- Generated via SQL: `INSERT...SELECT` from all permissions

#### Admin (AD) -- Priority 80

- ALLOW on **all** permissions EXCEPT the `permissions` module at **institute** scope
- DENY on all `permissions` module actions (only SA manages permissions)
- No conditions in v1
- Field rules: hide sensitive auth fields (password_hash, etc.)

#### Teacher (TE) -- Priority 50

| Area | Permissions | Scope | Field Rules |
|---|---|---|---|
| Own profile | read, update | self | -- |
| Academic resources | read, list | assigned | -- |
| Exam/result/mark | create, read, update, list, grade | assigned | `{ "email": "hidden", "phone": "masked" }` on student data |
| Attendance | create, read, update, list | assigned | -- |
| Timetable | read, list | institute | -- |
| Announcements | read, list, create | institute | -- |
| Leave requests | create, read | self | -- |

#### Student (ST) -- Priority 30

| Area | Permissions | Scope | Field Rules |
|---|---|---|---|
| Own profile | read, update | self | -- |
| Results/marks | read, list | self | `{ "teacher_phone": "hidden" }` |
| Attendance | read | self | -- |
| Timetable | read, list | class | -- |
| Announcements | read, list | class | -- |
| Syllabus/assignments | read, list | class | -- |
| Assignments | submit | self | -- |
| Leave requests | create, read | self | -- |

#### Parent (PA) -- Priority 30

| Area | Permissions | Scope | Field Rules |
|---|---|---|---|
| Child's profile | read | linked | `{ "teacher_phone": "hidden" }` |
| Child's results | read, list | linked | -- |
| Child's attendance | read | linked | -- |
| Fee collection | read, list | linked | -- |
| Announcements | read, list | class | -- |
| Events | read, list | class | -- |
| Leave requests | create, read | linked | -- |

---

## 4. Database Functions

All functions are `SECURITY DEFINER` (execute with the privileges of the function owner, not the caller). This is critical for RLS enforcement.

### `has_permission(p_user_id uuid, p_resource_key text, p_action_key text) RETURNS boolean`

The core permission check. Steps:

1. Find all active policies for the user's role where resource.key matches and action.key matches
2. Also find any active user_policy_overrides for this user+permission
3. Combine results: overrides take precedence over role policies
4. If ANY matching policy has effect = 'deny', return false (deny wins)
5. If at least one matching policy has effect = 'allow', return true
6. Otherwise return false (default deny)

### `get_user_scope(p_user_id uuid, p_resource_key text, p_action_key text) RETURNS text`

Returns the scope key from the highest-priority ALLOW policy matching the user+resource+action. Returns null if no permission exists.

### `get_field_rules(p_user_id uuid, p_resource_key text, p_action_key text) RETURNS jsonb`

Returns merged field_rules from all matching allow policies. Higher-priority policy field rules override lower ones on a per-field basis.

### `evaluate_access(p_user_id uuid, p_resource_key text, p_action_key text) RETURNS TABLE`

The combined entry point returning a full authorization decision in one call:

```sql
RETURNS TABLE(
  allowed    boolean,
  scope_key  text,
  conditions jsonb,
  field_rules jsonb
)
```

This is the function the API layer primarily calls.

### `evaluate_condition_v1(p_conditions jsonb, p_context jsonb) RETURNS boolean`

The v1 condition engine. Deliberately simple.

**Supported in v1:**
- Simple operators: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Top-level `and` for combining multiple conditions
- Dot-path operands: `user.department`, `resource.status`, `now`

**NOT supported in v1 (deferred to v2):**
- Nested `or`
- Nested `and` inside `or`
- Cross-resource conditions
- Relationship checks

**Examples that work in v1:**

```json
{ "==": ["resource.status", "draft"] }
```

```json
{ "<": ["now", "resource.publish_time"] }
```

```json
{
  "and": [
    { "==": ["resource.status", "draft"] },
    { "<": ["now", "resource.publish_time"] }
  ]
}
```

### `scope_allows_row(p_user_id uuid, p_scope_key text, p_record_owner_id uuid) RETURNS boolean`

Implements scope-based row filtering.

**Implemented in v1:**

| Scope | Logic |
|---|---|
| `self` | `p_record_owner_id = p_user_id` |
| `institute` | Always returns true (full tenant access) |
| `assigned` | Returns true (basic; refined when assignment tables exist) |

**All other scopes** (class, section, batch, grade_level, department, branch):
```sql
RAISE EXCEPTION 'Scope resolution for % not yet implemented', p_scope_key;
```

This keeps the model stable. When relationship tables ship, extend this function incrementally.

### `filter_jsonb_fields(p_data jsonb, p_field_rules jsonb) RETURNS jsonb`

Takes a data row (as jsonb) and field rules, returns filtered data:

| Rule | Effect |
|---|---|
| `"visible"` or absent | Field returned as-is |
| `"editable"` | Field returned as-is (editability enforced by UI) |
| `"read_only"` | Field returned as-is (read-only enforced by UI) |
| `"hidden"` | Field completely removed from output |
| `"masked"` | Field value partially redacted (e.g., `j***@mail.com`) |

### RPC Functions (Data Access Layer)

#### `rpc_check_permission(p_resource_key text, p_action_key text) RETURNS boolean`

Lightweight frontend check. Wraps `has_permission(auth.uid(), ...)`. Used for UI rendering decisions only -- never for actual security.

#### `rpc_get_my_permissions() RETURNS jsonb`

Returns the complete permission map for the authenticated user. Called once at login, cached on frontend.

Returns an array of:
```json
[
  {
    "module_key": "exams",
    "resource_key": "result",
    "action_key": "update",
    "scope_key": "assigned",
    "field_rules": { "marks": "editable", "email": "hidden" },
    "conditions": { "<": ["now", "resource.publish_time"] }
  }
]
```

#### `rpc_get_users() RETURNS jsonb` (pattern example)

Demonstrates the field-level filtering pattern:

1. Call `evaluate_access(auth.uid(), 'user', 'read')`
2. Filter rows by scope using `scope_allows_row()` in the WHERE clause
3. Apply `filter_jsonb_fields()` to each row
4. Return only fields the caller is authorized to see

This pattern is replicated for every future resource that needs field-level protection.

---

## 5. RLS Policies

### On Permission System Tables

All 8 tables (modules, resources, actions, scopes, permissions, policies, role_policies, user_policy_overrides) follow this pattern:

- **SELECT**: Allow if `has_permission(auth.uid(), '<resource_key>', 'read')`
- **INSERT**: Allow if `has_permission(auth.uid(), '<resource_key>', 'create')`
- **UPDATE**: Allow if `has_permission(auth.uid(), '<resource_key>', 'update')`
- **DELETE**: Allow if `has_permission(auth.uid(), '<resource_key>', 'delete')`

Effect: Only Super Admin can modify the permission system.

### On Existing Tables (users, roles)

**users table:**
- **SELECT**: `has_permission(auth.uid(), 'user', 'read') AND scope_allows_row(auth.uid(), get_user_scope(auth.uid(), 'user', 'read'), users.id)`
- **INSERT**: `has_permission(auth.uid(), 'user', 'create')`
- **UPDATE**: `has_permission(auth.uid(), 'user', 'update') AND scope_allows_row(...)` on users.id
- **DELETE**: `has_permission(auth.uid(), 'user', 'delete') AND scope_allows_row(...)` on users.id

**roles table:**
- **SELECT**: `has_permission(auth.uid(), 'role', 'read')`
- **INSERT**: `has_permission(auth.uid(), 'role', 'create')`
- **UPDATE**: `has_permission(auth.uid(), 'role', 'update')`
- **DELETE**: `has_permission(auth.uid(), 'role', 'delete')`

### Service Role Bypass

A bypass policy on every table allows the `service_role` to access all data. This ensures edge functions using the service role key work without RLS restrictions.

---

## 6. Edge Function Changes

### Login Function (`supabase/functions/login/index.ts`)

After successful authentication, the function now:

1. Calls `rpc_get_my_permissions()` using the admin client (service role) with the user's ID
2. Adds the permissions array to the response

**New response shape:**
```json
{
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  },
  "user": {
    "id": "...",
    "unique_id": "...",
    "first_name": "...",
    "role": { "id": "...", "name": "...", "rc": "SA" }
  },
  "permissions": [
    {
      "module_key": "exams",
      "resource_key": "result",
      "action_key": "update",
      "scope_key": "assigned",
      "field_rules": null,
      "conditions": null
    }
  ]
}
```

---

## 7. Frontend Architecture

### TypeScript Types (`lib/types/permission.types.ts`)

```typescript
interface UserPermission {
  module_key: string;
  resource_key: string;
  action_key: string;
  scope_key: string;
  field_rules: Record<string, FieldVisibility> | null;
  conditions: Record<string, unknown> | null;
}

type FieldVisibility = 'visible' | 'editable' | 'read_only' | 'hidden' | 'masked';
```

### Auth Types Updates (`lib/types/auth.types.ts`)

- `LoginResponse` gains a `permissions: UserPermission[]` field
- `AuthState` gains a `permissions: UserPermission[] | null` field

### Permission Context (`lib/permissions/permission-context.tsx`)

A React context that receives the permissions array from auth state and provides:

| Method | Signature | Purpose |
|---|---|---|
| `can` | `(resource, action) => boolean` | Check single permission |
| `canAny` | `(resource, actions[]) => boolean` | True if any action allowed |
| `canAll` | `(resource, actions[]) => boolean` | True if all actions allowed |
| `getScope` | `(resource, action) => string \| null` | Get scope for permission |
| `getFieldRules` | `(resource, action) => Record \| null` | Get field visibility rules |

### Hooks

#### `usePermissions()` (`lib/permissions/use-permissions.ts`)

Exposes the permission context. Returns `{ can, canAny, canAll, getScope, getFieldRules }`.

#### `useFieldVisibility(resource, action)` (`lib/permissions/use-field-visibility.ts`)

Returns field-level helpers:

| Helper | Returns | Usage |
|---|---|---|
| `isVisible(field)` | boolean | Show/hide a field |
| `isReadOnly(field)` | boolean | Disable editing |
| `isMasked(field)` | boolean | Show masked value |
| `isHidden(field)` | boolean | Completely remove from DOM |

### Gate Component (`components/permissions/gate.tsx`)

Conditional rendering based on permissions:

```tsx
<Gate resource="exam" action="create">
  <CreateExamButton />
</Gate>

<Gate resource="result" action={["update", "grade"]} any fallback={<ReadOnlyView />}>
  <EditableResultForm />
</Gate>
```

Props:
- `resource` (string, required)
- `action` (string or string[], required)
- `any` (boolean) -- use OR logic for multiple actions
- `fallback` (ReactNode) -- render when unauthorized
- `children` (ReactNode) -- render when authorized

### Provider Wiring

```
<AuthProvider>           // holds session + user + permissions
  <PermissionProvider>   // receives permissions from auth state
    {children}
  </PermissionProvider>
</AuthProvider>
```

The permissions array is:
- Set during login (received from edge function)
- Persisted to localStorage alongside session data
- Restored on page refresh
- Cleared on logout

---

## 8. Migration File Breakdown

### Migration 1: Definition Tables + Seed Data

**Creates:** modules, resources, actions, scopes tables
**Seeds:** 16 modules, 143 resources, 45 actions, 10 scopes
**RLS:** Enabled on all 4 tables

### Migration 2: Composition Tables

**Creates:** permissions, policies, role_policies, user_policy_overrides tables
**RLS:** Enabled on all 4 tables
**Indexes:** Composite indexes for query performance

### Migration 3: Seed Permissions + Role Policies

**Seeds:**
- ~500-600 permission rows (resource+action combos for actively-needed features)
- Policies for each of the 5 roles (SA, AD, TE, ST, PA) with appropriate scopes, conditions, and field rules
- role_policies bindings connecting each role to its policies

**Approach:** Uses `INSERT...SELECT` patterns to generate Super Admin and Admin policies from the full permissions catalog, then hand-crafted policies for Teacher/Student/Parent with specific scopes and field rules.

### Migration 4: Functions + RLS Policies

**Creates:**
- 7 helper functions (has_permission, get_user_scope, get_field_rules, evaluate_access, evaluate_condition_v1, scope_allows_row, filter_jsonb_fields)
- 3 RPC functions (rpc_check_permission, rpc_get_my_permissions, rpc_get_users)
- RLS policies on all 8 permission tables
- Updated RLS policies on existing users and roles tables
- Service role bypass policies on all tables

---

## 9. V1 vs V2 Boundaries

### What Ships in V1 (Now)

| Feature | Status |
|---|---|
| All 8 database tables | Implemented |
| 16 modules, 143 resources, 45 actions, 10 scopes | Seeded |
| Simple conditions (`==`, `!=`, `<`, `>`, `<=`, `>=`, `and`) | Implemented |
| Scopes: self, institute, assigned | Working |
| Other scopes (class, section, etc.) | Designed, raises exception |
| Field-level rules (hidden, masked, editable, read_only) | Implemented |
| has_permission + evaluate_access functions | Implemented |
| RLS on all tables | Implemented |
| Frontend permission context + hooks + Gate component | Implemented |
| Permissions returned at login | Implemented |
| 5 roles with default policies | Seeded |

### What Ships in V2 (Later)

| Feature | Depends On |
|---|---|
| Nested boolean logic (`or` inside `and`, etc.) | Stable v1 condition engine |
| Relationship checks in conditions | Relationship tables |
| Cross-resource conditions | Multiple feature tables existing |
| Scope: class, section, batch, department, etc. | Class/section assignment tables |
| Scope: linked (full implementation) | Parent-child relationship tables |
| Permission management UI | Admin dashboard |
| Audit logging for permission changes | Audit infrastructure |
| Permission caching layer | Performance profiling data |

### Why This Boundary

V1 covers **~80% of real-world use cases** with simple time-based and status-based conditions. The remaining 20% (nested logic, relationship-based scopes) requires relationship tables that don't exist yet. Building the evaluation engine for data that doesn't exist yet would be speculative engineering.

---

## Real-World Policy Examples

### Teacher Updating Marks Before Publication

```json
{
  "name": "TE: exams.mark.update",
  "permission_id": "<mark + update>",
  "scope_id": "<assigned>",
  "effect": "allow",
  "priority": 50,
  "conditions": {
    "<": ["now", "resource.publish_time"]
  },
  "field_rules": {
    "marks": "editable",
    "email": "hidden",
    "phone": "masked"
  }
}
```

### Student Viewing Own Result

```json
{
  "name": "ST: exams.result.read",
  "permission_id": "<result + read>",
  "scope_id": "<self>",
  "effect": "allow",
  "priority": 30,
  "conditions": null,
  "field_rules": null
}
```

### Deny Deletion of Published Results

```json
{
  "name": "DENY: delete published results",
  "permission_id": "<result + delete>",
  "scope_id": "<institute>",
  "effect": "deny",
  "priority": 100,
  "conditions": {
    "==": ["resource.status", "published"]
  },
  "field_rules": null
}
```

### Admin Exporting Fee Reports

```json
{
  "name": "AD: fees.fee_report.export",
  "permission_id": "<fee_report + export>",
  "scope_id": "<institute>",
  "effect": "allow",
  "priority": 80,
  "conditions": null,
  "field_rules": null
}
```

---

## Why This System Never Needs a Rewrite

| Change Needed | Code Change Required? |
|---|---|
| Add a new permission rule | No -- insert a policy row |
| Add a new module | No -- insert a module row + resource rows |
| Add a new role | No -- insert role + role_policies rows |
| Add a new condition type | No -- insert conditions JSON |
| Restrict a field | No -- update field_rules JSON |
| Grant temporary access | No -- insert user_policy_override with expires_at |
| Revoke access | No -- set is_active = false on role_policy |

Everything is **data-driven**. The code is the engine. The database is the configuration.
