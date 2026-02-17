export interface Role {
  id: string;
  name: string;
  display_name: string;
  rc: string;
  is_system: boolean;
  created_at: string;
}

export interface User {
  id: string;
  unique_id: string;
  role_id: string;
  is_active: boolean;
  created_by: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Omit<User, "role_id"> {
  role: Role;
  additional_roles?: Role[];
}

export interface UserRoleAssignment {
  id: string;
  role_id: string;
  role_name: string;
  role_rc: string;
  is_active: boolean;
  reason: string | null;
  expires_at: string | null;
  assigned_by_name: string | null;
  created_at: string;
}

export interface AvailableRole {
  id: string;
  name: string;
  display_name: string;
  rc: string;
}
