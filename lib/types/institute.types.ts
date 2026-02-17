export interface Institute {
  id: string;
  inst_code: string;
  name: string;
  logo_url: string | null;
  status: "active" | "inactive" | "suspended";
}

export interface InstitutePublicCredentials extends Institute {
  supabase_url: string;
  supabase_anon_key: string;
}

export interface InstituteFullCredentials extends InstitutePublicCredentials {
  supabase_service_role_key: string;
}
