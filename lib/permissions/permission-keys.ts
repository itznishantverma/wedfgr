import {
  GraduationCap, Users, FileText, CalendarCheck, CreditCard,
  Clock, BarChart3, MessageSquare, BookOpen, Bus, Building,
  Settings, Shield, FileCheck, Calendar, Scale,
  type LucideIcon,
} from "lucide-react";

export const MODULE_KEYS = {
  ACADEMICS: "academics",
  USERS: "users",
  EXAMS: "exams",
  ATTENDANCE: "attendance",
  FEES: "fees",
  TIMETABLE: "timetable",
  REPORTS: "reports",
  COMMUNICATIONS: "communications",
  LIBRARY: "library",
  TRANSPORT: "transport",
  HOSTEL: "hostel",
  SETTINGS: "settings",
  PERMISSIONS: "permissions",
  DOCUMENTS: "documents",
  EVENTS: "events",
  DISCIPLINE: "discipline",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

export const ACTION_KEYS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  EXPORT: "export",
  IMPORT: "import",
  PUBLISH: "publish",
  APPROVE: "approve",
  REJECT: "reject",
  SUBMIT: "submit",
  MANAGE: "manage",
  CONFIGURE: "configure",
  AUDIT: "audit",
} as const;

export type ActionKey = (typeof ACTION_KEYS)[keyof typeof ACTION_KEYS];

export const SCOPE_KEYS = {
  SELF: "self",
  LINKED: "linked",
  ASSIGNED: "assigned",
  CLASS: "class",
  SECTION: "section",
  BATCH: "batch",
  GRADE_LEVEL: "grade_level",
  DEPARTMENT: "department",
  BRANCH: "branch",
  INSTITUTE: "institute",
} as const;

export type ScopeKey = (typeof SCOPE_KEYS)[keyof typeof SCOPE_KEYS];

export interface ModuleMeta {
  key: ModuleKey;
  displayName: string;
  icon: LucideIcon;
  description: string;
  resourceCount: number;
}

export const MODULE_REGISTRY: ModuleMeta[] = [
  { key: "academics", displayName: "Academics", icon: GraduationCap, description: "Classes, subjects, and curriculum", resourceCount: 10 },
  { key: "users", displayName: "Users", icon: Users, description: "User and profile management", resourceCount: 8 },
  { key: "exams", displayName: "Examinations", icon: FileText, description: "Exams, results, and grading", resourceCount: 13 },
  { key: "attendance", displayName: "Attendance", icon: CalendarCheck, description: "Daily and period attendance", resourceCount: 7 },
  { key: "fees", displayName: "Fees", icon: CreditCard, description: "Fee collection and payments", resourceCount: 11 },
  { key: "timetable", displayName: "Timetable", icon: Clock, description: "Schedules and periods", resourceCount: 6 },
  { key: "reports", displayName: "Reports", icon: BarChart3, description: "Analytics and reporting", resourceCount: 6 },
  { key: "communications", displayName: "Communications", icon: MessageSquare, description: "Announcements and messages", resourceCount: 9 },
  { key: "library", displayName: "Library", icon: BookOpen, description: "Books and catalog management", resourceCount: 11 },
  { key: "transport", displayName: "Transport", icon: Bus, description: "Routes and vehicle tracking", resourceCount: 8 },
  { key: "hostel", displayName: "Hostel", icon: Building, description: "Room and hostel management", resourceCount: 9 },
  { key: "settings", displayName: "Settings", icon: Settings, description: "System configuration", resourceCount: 9 },
  { key: "permissions", displayName: "Permissions", icon: Shield, description: "Roles and access control", resourceCount: 8 },
  { key: "documents", displayName: "Documents", icon: FileCheck, description: "Certificates and documents", resourceCount: 7 },
  { key: "events", displayName: "Events", icon: Calendar, description: "Events and calendar", resourceCount: 6 },
  { key: "discipline", displayName: "Discipline", icon: Scale, description: "Incidents and behavior", resourceCount: 6 },
];

export const PRIMARY_MODULES: ModuleKey[] = [
  "academics", "users", "exams", "attendance", "fees",
  "timetable", "reports", "communications", "settings",
];

export const SECONDARY_MODULES: ModuleKey[] = [
  "library", "transport", "hostel", "permissions",
  "documents", "events", "discipline",
];

export function getModuleMeta(key: string): ModuleMeta | undefined {
  return MODULE_REGISTRY.find((m) => m.key === key);
}
