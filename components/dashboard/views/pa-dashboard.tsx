"use client";

import {
  CalendarCheck, CreditCard, Award, Calendar,
  Megaphone, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const childResults = [
  { exam: "Unit Test 3 - Mathematics", grade: "A+", marks: "47/50", date: "Feb 10" },
  { exam: "Mid-Term - English", grade: "A", marks: "82/100", date: "Feb 5" },
  { exam: "Unit Test 3 - Physics", grade: "B+", marks: "38/50", date: "Feb 3" },
  { exam: "Lab Practical - Chemistry", grade: "A", marks: "28/30", date: "Jan 28" },
];

const feeStatus = [
  { term: "Term 1", amount: "Rs. 25,000", status: "paid", date: "Jul 15" },
  { term: "Term 2", amount: "Rs. 25,000", status: "paid", date: "Nov 10" },
  { term: "Term 3", amount: "Rs. 25,000", status: "pending", date: "Mar 15" },
];

const announcements: ActivityItem[] = [
  { id: "1", icon: Megaphone, iconColor: "text-blue-600", description: "Annual Day celebration on March 15 -- Parents are invited", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: "2", icon: Calendar, iconColor: "text-teal-600", description: "Parent-Teacher meeting scheduled for Feb 20", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: "3", icon: FileText, iconColor: "text-amber-600", description: "Term 3 fee payment deadline: March 15", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  { id: "4", icon: CalendarCheck, iconColor: "text-emerald-600", description: "Sports Day results published", timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000) },
];

export function PADashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl">
      <WelcomeBanner
        firstName={user?.first_name || "Parent"}
        subtitle="Parent Portal -- Monitoring your child's progress"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Child Attendance" value="92%" icon={CalendarCheck} trend={{ value: 1.5, label: "this month" }} />
        <StatCard label="Pending Fees" value="Rs. 25,000" icon={CreditCard} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard label="Latest Grade" value="A+" icon={Award} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Upcoming Events" value={3} icon={Calendar} iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {childResults.map((r) => (
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Fee Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {feeStatus.map((f) => (
                <div key={f.term} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{f.term}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Due: {f.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">{f.amount}</span>
                    <Badge
                      variant={f.status === "paid" ? "default" : "secondary"}
                      className={f.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs"
                        : "text-xs"
                      }
                    >
                      {f.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ActivityFeed title="Announcements" items={announcements} />
    </div>
  );
}
