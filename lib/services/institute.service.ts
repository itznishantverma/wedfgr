import { getMasterClient } from "@/lib/supabase/master-client";
import { InstitutePublicCredentials } from "@/lib/types/institute.types";

export async function resolveInstitute(
  instCode: string
): Promise<InstitutePublicCredentials | null> {
  const masterClient = getMasterClient();

  if (!masterClient) {
    const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const fallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!fallbackUrl || !fallbackKey) return null;

    return {
      id: "dev-fallback",
      inst_code: instCode,
      name: `${instCode} (Dev Mode)`,
      logo_url: null,
      status: "active",
      supabase_url: fallbackUrl,
      supabase_anon_key: fallbackKey,
    };
  }

  const { data, error } = await masterClient.rpc("get_institute_public", {
    p_inst_code: instCode.toUpperCase(),
  });

  if (error || !data) return null;

  return data as InstitutePublicCredentials;
}
