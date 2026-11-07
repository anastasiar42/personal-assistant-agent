"use client";

import DayView from "@/components/DayView";
import { todayPlan } from "@/lib/api";
import { isoDate } from "@/lib/labels";

export default function TodayPage() {
  return <DayView label="Today" date={isoDate(new Date())} load={todayPlan} />;
}
