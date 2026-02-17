"use client";

import { format } from "date-fns";

interface WelcomeBannerProps {
  firstName: string;
  subtitle: string;
}

export function WelcomeBanner({ firstName, subtitle }: WelcomeBannerProps) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
      <div className="relative z-10">
        <p className="text-teal-100 text-sm">{today}</p>
        <h1 className="text-2xl font-semibold mt-1 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-teal-100/80 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
