"use client";

import {
  Users, GraduationCap, CreditCard, CalendarCheck,
  UserPlus, FileText, MessageSquare, BarChart3,
  Megaphone, BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentAnnouncements: ActivityItem[] = [
  { id: "1", icon: Megaphone, iconColor: "text-blue-600", description: "Annual Day celebration scheduled for March 15", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: "2", icon: BookOpen, iconColor: "text-emerald-600", description: "Mid-term exam schedule published for Grade 10", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: "3", icon: CreditCard, iconColor: "text-amber-600", description: "Fee payment deadline extended to Feb 28", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: "4", icon: CalendarCheck, iconColor: "text-teal-600", description: "Parent-Teacher meeting on Feb 20", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
];

const quickActions: QuickAction[] = [
  { label: "Add Student", icon: UserPlus, href: "/dashboard/users", resource: "student_profile", action: "create", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "Create Exam", icon: FileText, href: "/dashboard/exams", resource: "exam", action: "create", iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { label: "Post Announcement", icon: MessageSquare, href: "/dashboard/communications", resource: "announcement", action: "create", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { label: "View Fee Reports", icon: BarChart3, href: "/dashboard/reports", resource: "fee_report", action: "read", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
];

const classOverview = [
  { class: "Grade 1", sections: 3, students: 90 },
  { class: "Grade 2", sections: 3, students: 87 },
  { class: "Grade 3", sections: 2, students: 62 },
  { class: "Grade 4", sections: 2, students: 58 },
  { class: "Grade 5", sections: 3, students: 85 },
];

export function ADDashboard() {
  const { user, instCode } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl">
      <WelcomeBanner
        firstName={user?.first_name || "Admin"}
        subtitle={`Institute Dashboard -- ${instCode || "Managing your institute"}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={450} icon={Users} trend={{ value: 4.2, label: "vs last year" }} />
        <StatCard label="Total Teachers" value={32} icon={GraduationCap} iconColor="text-blue-600" iconBg="bg-blue-50" trend={{ value: 2, label: "new this year" }} />
        <StatCard label="Fee Collection" value="78%" icon={CreditCard} iconColor="text-amber-600" iconBg="bg-amber-50" trend={{ value: 5.3, label: "vs last month" }} />
        <StatCard label="Today's Attendance" value="94%" icon={CalendarCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: -1.2, label: "vs yesterday" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Academic Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {classOverview.map((row) => (
                <div key={row.class} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{row.class}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{row.sections} sections</span>
                    <span className="font-medium text-foreground">{row.students} students</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ActivityFeed title="Recent Announcements" items={recentAnnouncements} />
      </div>

      <QuickActions actions={quickActions} />
    </div>
  );
}
