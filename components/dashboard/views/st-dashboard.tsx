"use client";

import {
  CalendarCheck, FileText, Clock, Award,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const todaySchedule = [
  { period: 1, time: "8:00 - 8:45", subject: "Mathematics", teacher: "Mr. Sharma" },
  { period: 2, time: "8:50 - 9:35", subject: "English", teacher: "Ms. Patel" },
  { period: 3, time: "9:40 - 10:25", subject: "Physics", teacher: "Dr. Reddy" },
  { period: 4, time: "10:45 - 11:30", subject: "Chemistry", teacher: "Ms. Kumar" },
  { period: 5, time: "11:35 - 12:20", subject: "History", teacher: "Mr. Singh" },
  { period: 6, time: "1:00 - 1:45", subject: "Computer Science", teacher: "Ms. Gupta" },
];

const pendingAssignments = [
  { title: "Quadratic Equations - Exercise 5.3", subject: "Mathematics", dueDate: "Feb 18", status: "pending" },
  { title: "Essay: Climate Change Impact", subject: "English", dueDate: "Feb 19", status: "pending" },
  { title: "Lab Report - Newton's Laws", subject: "Physics", dueDate: "Feb 20", status: "draft" },
];

const recentResults = [
  { exam: "Unit Test 3 - Mathematics", grade: "A+", marks: "47/50", date: "Feb 10" },
  { exam: "Mid-Term - English", grade: "A", marks: "82/100", date: "Feb 5" },
  { exam: "Unit Test 3 - Physics", grade: "B+", marks: "38/50", date: "Feb 3" },
  { exam: "Lab Practical - Chemistry", grade: "A", marks: "28/30", date: "Jan 28" },
];

export function STDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl">
      <WelcomeBanner
        firstName={user?.first_name || "Student"}
        subtitle="Student Portal -- Grade 10, Section A"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Attendance" value="92%" icon={CalendarCheck} trend={{ value: 1.5, label: "this month" }} />
        <StatCard label="Assignments Due" value={3} icon={FileText} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard label="Current GPA" value="3.6" icon={Award} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: 0.2, label: "vs last term" }} />
        <StatCard label="Upcoming Exams" value={2} icon={BookOpen} iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Today&apos;s Timetable</CardTitle>
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
                  <p className="text-xs text-muted-foreground">{slot.teacher}</p>
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
            <CardTitle className="text-base font-medium">Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {pendingAssignments.map((a) => (
                <div key={a.title} className="flex items-start justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.subject} -- Due {a.dueDate}
                    </p>
                  </div>
                  <Badge
                    variant={a.status === "draft" ? "outline" : "secondary"}
                    className="text-xs shrink-0 capitalize"
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recentResults.map((r) => (
                <div key={r.exam} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.exam}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{r.marks}</span>
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 text-xs">
                      {r.grade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
