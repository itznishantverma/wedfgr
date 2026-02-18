import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "@/lib/types/user.types";
import {
  Student,
  Teacher,
  Parent,
  Enrollment,
  StudentFilters,
  TeacherFilters,
  ParentFilters,
  EnrollmentFilters,
  UserFilters,
} from "@/lib/types/domain.types";

export type RpcError =
  | { code: "UNAUTHENTICATED" }
  | { code: "PERMISSION_DENIED" }
  | { code: "CONDITION_NOT_MET" }
  | { code: "RATE_LIMITED" }
  | { code: "DB_ERROR"; message: string };

type RpcResult<T> = { data: T; error: null } | { data: null; error: RpcError };

function classifyError(message: string): RpcError {
  if (message.includes("UNAUTHENTICATED")) return { code: "UNAUTHENTICATED" };
  if (message.includes("PERMISSION_DENIED")) return { code: "PERMISSION_DENIED" };
  if (message.includes("CONDITION_NOT_MET")) return { code: "CONDITION_NOT_MET" };
  if (message.includes("RATE_LIMITED")) return { code: "RATE_LIMITED" };
  return { code: "DB_ERROR", message };
}

export async function getUsers(
  client: SupabaseClient,
  filters: UserFilters = {}
): Promise<RpcResult<User[]>> {
  const { data, error } = await client.rpc("rpc_get_users", {
    p_filters: filters,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: (data as User[]) ?? [], error: null };
}

export async function getUserById(
  client: SupabaseClient,
  id: string
): Promise<RpcResult<User | null>> {
  const { data, error } = await client.rpc("rpc_get_user_by_id", { p_id: id });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: data as User | null, error: null };
}

export async function getStudents(
  client: SupabaseClient,
  filters: StudentFilters = {}
): Promise<RpcResult<Student[]>> {
  const { data, error } = await client.rpc("rpc_get_students", {
    p_filters: filters,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: (data as Student[]) ?? [], error: null };
}

export async function getStudentById(
  client: SupabaseClient,
  id: string
): Promise<RpcResult<Student | null>> {
  const { data, error } = await client.rpc("rpc_get_student_by_id", {
    p_id: id,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: data as Student | null, error: null };
}

export async function getTeachers(
  client: SupabaseClient,
  filters: TeacherFilters = {}
): Promise<RpcResult<Teacher[]>> {
  const { data, error } = await client.rpc("rpc_get_teachers", {
    p_filters: filters,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: (data as Teacher[]) ?? [], error: null };
}

export async function getTeacherById(
  client: SupabaseClient,
  id: string
): Promise<RpcResult<Teacher | null>> {
  const { data, error } = await client.rpc("rpc_get_teacher_by_id", {
    p_id: id,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: data as Teacher | null, error: null };
}

export async function getParents(
  client: SupabaseClient,
  filters: ParentFilters = {}
): Promise<RpcResult<Parent[]>> {
  const { data, error } = await client.rpc("rpc_get_parents", {
    p_filters: filters,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: (data as Parent[]) ?? [], error: null };
}

export async function getParentById(
  client: SupabaseClient,
  id: string
): Promise<RpcResult<Parent | null>> {
  const { data, error } = await client.rpc("rpc_get_parent_by_id", {
    p_id: id,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: data as Parent | null, error: null };
}

export async function getEnrollments(
  client: SupabaseClient,
  filters: EnrollmentFilters = {}
): Promise<RpcResult<Enrollment[]>> {
  const { data, error } = await client.rpc("rpc_get_enrollments", {
    p_filters: filters,
  });
  if (error) return { data: null, error: classifyError(error.message) };
  return { data: (data as Enrollment[]) ?? [], error: null };
}
