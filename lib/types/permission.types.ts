export type FieldVisibility = 'visible' | 'editable' | 'read_only' | 'hidden' | 'masked';

export interface UserPermission {
  module_key: string;
  resource_key: string;
  action_key: string;
  scope_key: string;
  field_rules: Record<string, FieldVisibility> | null;
  conditions: Record<string, unknown> | null;
}
