"use client";

import {
  BookOpen, FileText, CalendarCheck, Clock,
  ClipboardCheck, Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const todaySchedule = [
  { period: 1, time: "8:00 - 8:45", subject: "Mathematics", class: "Grade 10-A" },
  { period: 2, time: "8:50 - 9:35", subject: "Mathematics", class: "Grade 9-B" },
  { period: 3, time: "9:40 - 10:25", subject: "Physics", class: "Grade 11-A" },
  { period: 4, time: "10:45 - 11:30", subject: "Mathematics", class: "Grade 8-A" },
  { period: 5, time: "11:35 - 12:20", subject: "Free Period", class: "--" },
  { period: 6, time: "1:00 - 1:45", subject: "Physics Lab", class: "Grade 11-B" },
];

const pendingAssignments = [
  { title: "Chapter 5 - Quadratic Equations", class: "Grade 10-A", submissions: 28, total: 35, dueDate: "Feb 18" },
  { title: "Motion Problems Set 3", class: "Grade 11-A", submissions: 22, total: 30, dueDate: "Feb 17" },
  { title: "Algebra Practice Sheet", class: "Grade 9-B", submissions: 8, total: 32, dueDate: "Feb 20" },
];

const attendanceSummary = [
  { class: "Grade 10-A", present: 33, total: 35 },
  { class: "Grade 9-B", present: 30, total: 32 },
  { class: "Grade 11-A", present: 28, total: 30 },
  { class: "Grade 8-A", present: 36, total: 38 },
  { class: "Grade 11-B", present: 29, total: 30 },
];

export function TEDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl">
      <WelcomeBanner
        firstName={user?.first_name || "Teacher"}
        subtitle="Teaching Hub -- Your classes and assignments"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Classes" value={5} icon={Users} />
        <StatCard label="Pending Reviews" value={12} icon={ClipboardCheck} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard label="Attendance Entries" value="3/5" icon={CalendarCheck} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard label="Upcoming Exams" value={2} icon={FileText} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Today&apos;s Schedule</CardTitle>
            <Badge variant="outline" className="text-xs">6 periods</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {todaySchedule.map((slot) => (
              <div
                key={slot.period}
                className="flex items-center gap-4 rounded-lg border px-4 py-3 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold shrink-0">
                  {slot.period}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{slot.subject}</p>
                  <p className="text-xs text-muted-foreground">{slot.class}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {slot.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Assignments Pending Review</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {pendingAssignments.map((a) => (
                <div key={a.title} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.class} -- Due {a.dueDate}
                    </p>
                  </div>
                  <Badge variant={a.submissions === a.total ? "default" : "secondary"} className="text-xs shrink-0">
                    {a.submissions}/{a.total}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Class Attendance Today</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {attendanceSummary.map((row) => {
                const pct = Math.round((row.present / row.total) * 100);
                return (
                  <div key={row.class} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{row.class}</span>
                      <span className="text-muted-foreground">
                        {row.present}/{row.total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
